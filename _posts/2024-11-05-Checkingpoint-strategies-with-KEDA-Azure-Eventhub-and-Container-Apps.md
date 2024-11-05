---
title: "Checkpoint strategies with Dapr, KEDA, Azure EventHub and Container Apps"
author_name: "Anthony Salemo"
tags:
    - Configuration
    - KEDA
    - Dapr
    - Azure Container Apps
categories:
    - Azure Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-11-05 12:00:00
---

This post will cover using Dapr and KEDA's Azure EventHub scaler with Container Apps and how the 'checkpoint strategy' can affect this

# Overview
You can use KEDA's [Azure EventHub scaler](https://keda.sh/docs/2.15/scalers/azure-event-hub/) to scale based off of criteria set in your scalers metadata for Event Hub - and you can use Dapr enabled with your application to be able to send these messages to trigger this criteria. All of which can be done on Container Apps. But to make this properly work, you need to set the proper `checkpointStrategy` with KEDA.

As described here in "[Checkpointing](https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-features#checkpointing)", _Checkpointing is a process by which readers mark or commit their position within a partition event sequence._ Essentially, this helps set a location for clients to resume from - as an example, to prevent rereading from parts of the stream that may have already been read if there was an application restart.

Checkpoints require Azure Blob Storage to store a file - this files directory structure may be different depending on the client that created it, which is where checkpoint strategies come into play. Given that there are a lot of moving parts here, it can be broken down like this:
- Application (in this case, with Dapr's Azure EventHub`pubsub` component) - creates the checkpoint
- Azure Blob Storage - The checkpoint is stored here as a file. Directory structure may change depending on the client
- KEDA (with Azure EventHub scaler) - Needs to read from Azure Blob Storage for the checkpoint path for scaling criteria
- Azure EventHub - Ingests messages from the application/client and is used by KEDA for other scale criteria

This post won't go into setting up a client or application with Dapr for Azure Event Hub, but you can essentially follow [Pub/sub brokers - Azure Event Hubs - Dapr](https://docs.dapr.io/reference/components-reference/supported-pubsub/setup-azure-eventhubs/) and the [Getting started with Dapr on Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/dapr-component-connection)

**NOTE**: In terms of troubleshooting, you can [install Dapr locally](https://docs.dapr.io/getting-started/) and as long as [Kubernetes is enabled in Docker Desktop](https://docs.docker.com/desktop/kubernetes/) (or whichever type of local Kubernetes you have), you can also install [KEDA into your local cluster with Helm](https://keda.sh/docs/2.15/deploy/). You can effectively set up a local example of scaing with Dapr, KEDA and Azure Event Hub on Kubernetes
- This can potentially make troubleshooting certain issues easier prior to deploying or testing on Container Apps

# Application - Checkpoint creation
This blog is about using Dapr with Azure Event Hub and a pubsub component. This is agnostic of the fact the Dapr SDK is used, or, by calling the `daprd` sidecar over HTTP directly, as either scenario will create the same path across different languages.

When publishing a message to eventhub and with a brand new blob container in your Azure Storage account, you'll notice the following directory structure appear:

![Checkpoint ownership in blob storage](/media/2024/11/keda-eventhub-1.png)

```
| - yourblob (this is the root)
    | - youreventhub.servicebus.windows.net
        | - yourentitypath
            | - consumergroup ($default is the eventhub default)
                | - ownership
                    | - 0
```

Flattened out this will look like `orders/youreventhub.servicebus.windows.net/orders/$default/ownership/0`.

If you have not yet published a message to eventhub, then the `checkpoint` directory will **not yet** be created. This may show as a `BlobNotFound` error from storage, through KEDA logs, until it's created. This specific situation is not an issue if the checkpoint strategy has been correctly configured and messages have not yet been sent to EventHub. This is important for later on regarding troubleshooting.

After you create your first message, the structure will change to have the following **added**, which is the `checkpoint` directory under your consumer group:

![Checkpoint ownership in blob storage](/media/2024/11/keda-eventhub-2.png)

```
| - yourblob (this is the root)
    | - youreventhub.servicebus.windows.net
        | - yourentitypath
            | - consumergroup ($default is the eventhub default)
                | - ownership
                    | - 0
                | - checkpoint
                    | - 0
```

Flattened out and looking at just the checkpoint, this will look like `orders/youreventhub.servicebus.windows.net/orders/$default/checkpoint/0`.

The "checkpoint" that has been referenced in this post so far is now created. This is incredibly important to be aware of for strategies and potentially for troubleshooting purposes.

> **NOTE**: `youreventhub.servicebus.windows.net` corresponds to the eventhub namespace in this particular example of how a checkpoint path is created

# KEDA - Utilizing checkpoint strategies
Now we have a client that can create a checkpoint in blob storage. If you want to use KEDA to scale with event hub, you need to set the correct `checkpointStrategy` in your scaler metadata. KEDA's information on strategies for this scaler is found [here](https://keda.sh/docs/2.15/scalers/azure-event-hub/#checkpointing-behaviour).

An example of this property:

```yaml
  triggers:
    - type: azure-eventhub
      metadata:
        blobContainer: "orders"
        unprocessedEventThreshold: "1"
        # This is important
        checkpointStrategy: "blobMetaData"
        .... other properties
```

The reason this is so important is because certain strategies use certain blob paths. if the strategy used uses a different blob path lookup than what your current structure is, you're going see a `404` returned from Azure Storage through KEDA that it can't find the blob location. Thus, scaling through KEDA won't happen (although it won't technically cause any downtime from an availability/performance scenario on Container Apps).

How the scaler determines checkpoints can be found in KEDA's `azure_eventhub_checkpoint.go` file [here](https://github.com/kedacore/keda/blob/main/pkg/scalers/azure/azure_eventhub_checkpoint.go#L122). This is generally the following logic and how it makes a call to your blob for checkpoint lookups:

**`azureFunction`**:
- `azure-webjobs-eventhub/[eventhub_namespace]/[eventhub_name]/[consumer_group]/[checkpointid]`
  - Example: `azure-webjobs-eventhub/youreventhub.servicebus.windows.net/orders/$Default/0`
  - Note, this strategy implicitly expects to have your blob container be named `azure-webjobs-eventhub`

**`dapr`**
- `[blobcontainer]/dapr-[eventhub_name]-[consumer_group]-[checkpointid]`
- Example: `orders/dapr-myeventhub-$default-0`

**`goSdk`**:
- `[blobcontainer]/[checkpointid]`
- Example: `orders/0`

**`blobMetadata`**:
- `[blobcontainer]/[eventhub_namespace]/[eventhub_name]/[consumer_group]/checkpoint/[checkpointid]`
- Example: `yourblobcontainer/youreventhub.servicebus.windows.net/orders/$default/checkpoint/0`

**Non-matching**:
- `[blob_container]/[consumer_group]/[checkpoint_id]`
- example: `orders/$default/0`

**Case sensitivity matters**. If you input a value to `checkpointStrategy` that is different from the casing expected, it'll default to the default checkpoint strategy.

If you don't already know specifics on the directory structure created for a strategy on the client side - navigate to your storage account as seen earlier and compare it with the available strategies paths here. 

In this blog's case, with using Dapr and the pubsub component for Eventhub - using the `blobMetadata` strategy matches our need to scale with KEDA.

# Troubleshooting
## Container Apps
On Container Apps, you can use the `ContainerAppSystemLogs_CL` table if using Log Analytics, or `ContainerAppSystemLogs`, if using Azure Monitor, to review KEDA scaling errors. Generally, what would be seen in a normal instance of the KEDA operator pod would surface here. 

If we have a mismatch in checkpoint strategies versus the structure in storage, a message like this would show below (assuming the blob container actually exists):

```
error": "-> github.com/Azure/azure-storage-blob-go/azblob.newStorageError, /workspace/vendor/github.com/Azure/azure-storage-blob-go/azblob/zc_storage_error.go:42\n===== RESPONSE ERROR (ServiceCode=BlobNotFound) =====\nDescription=The specified blob does not exist.\nRequestId:00000000-0000-0000-0000-000000000000\nTime:2024-11-05T15:02:36.3397719Z, Details: \n   Code: BlobNotFound\n   GET https://mystorage.blob.core.windows.net/orders/$Default/0?timeout=61\n   Authorization: REDACTED\n   User-Agent: [Azure-Storage/0.15 (go1.21.9; linux)]
```

**IMPORTANT**: Currently with KEDA 2.15.1, this error will not be correctly shown due to the bug in this GitHub issue - [Keda operator fails with "unable to get unprocessedEventCount for metrics: unable to get checkpoint from storage: %!w(<nil>)" in v.2.15.1 using Azure event Hub trigger #6084](https://github.com/kedacore/keda/issues/6084) - it'll instead surface as `unable to get unprocessedEventCount for metrics: unable to get checkpoint from storage: %!w(<nil>)`

This in itself is not related to Container Apps, but rather purely KEDA. If setting up and troubleshooting this integration for the first time and this error is seen on 2.15.1, it may be best to install a local version of KEDA with Kubernetes and Dapr and use a different version, like 2.14.1 or 2.16.

## Azure Storage
Instead of just only relying on KEDA logs to figure out what blob path is being used for strategies, you can see what path is requested with Log Analytics on your Storage Account.

To see this, you need to first set **Diagnostic Settings** up. For "blob", add a category for `allLogs`. After 5 - 10 minutes, storage logs should start populating in Log Analytics.

1. Go to the **Diagnostic Settings** on your storage account
2. Select "blob":

   ![Blob diagnostic settings](/media/2024/11/keda-eventhub-3.png)

3. Add a category setting for `allLogs` and send it to a Log Analytics workspace.

   ![Blob diagnostic settings categories](/media/2024/11/keda-eventhub-4.png)

4. You can then query the `StorageBlobLogs` table to see what kind of requests are being made

   ![Storage Logs](/media/2024/11/keda-eventhub-5.png)

   `UserAgentHeader` can be used to tell who is making the request. In this case, `azsdk-go` is from KEDA. Ones starting with `dapr` are from `daprd`.

## Other considerations
Users who try to alter the checkpoint path (eg. going in and deleting directories) may cause application and/or KEDA scaler failures, especially if the path is not able to be recreated.

Breaking changes from a client perspective that may create a different path than what is currently set for KEDA's `checkpointStrategy` could cause KEDA scaler failures as well.