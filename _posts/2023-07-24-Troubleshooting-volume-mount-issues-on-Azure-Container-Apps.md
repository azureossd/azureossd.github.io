---
title: "Troubleshooting volume mount issues on Azure Container Apps"
author_name: "Anthony Salemo"
tags:
    - Configuration
    - Troubleshooting
    - Container Apps
categories:
    - Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-07-24 12:00:00
---

This post will cover troubleshooting issues seen when setting up volume mounts on Azure Container Apps

# Overview
Currently, with Container Apps, you can mount two (3) different types of volumes:
- Ephemeral Volume
- Azure Files
- Secrets (preview)

Then there is the option to write to the local container filesystem. This option (container filesystem) and "Ephemeral" volumes are ephemeral overal and not designed to persist for long periods of time, since pods/replicas are ephemeral as well.

This post will cover Azure File mounts - since this option, generally compared to Ephemeral Volumes, introduces a few scenarios that can cause a mount operation to fail.


# What behavior will I see
If a volume set up with Azure Files is unable to be mounted to the pod, you may see a few notable behaviors:
- Zero replicas. Additionally if going to the "Console" tab, it may also show "This revision is scaled to zero". This is because the volume is mounted to a pod early on in the pod lifecycle - when this fails, the pod (or replicas) are never able to be created. Therefor, nothing is ever ran/started - and ultimately pods/replicas will show zero (0).
  - In the **Revisions** blade it may show the Revision as "Scaled to 0"
  - This will even be the case is minimum replica's is set to >= 1. 
  - This concept can potentially be replicated in other environments with containers or Kubernetes - if trying to mount a volume that is invalid or inaccessible, you will likely see the container or pods can never be created to run.
- If browsing the application through its FQDN, a `stream timeout` will occur - due to hitting the 240 second defined request duration ingress limit.
- There may be no `stdout` in `ContainerAppConsoleLogs_CL` - since a pod/replica is never running.
- A Revision may indefinitely show as stuck in a "Provisioning state" or "Failed state"

In a succesful scenario - you could connect to a pod/replica via the **Console** blade and run `df -h` to validate that the mount is seen, like below:

![Volumes on filesystem](/media/2023/07/azure-aca-volume-1.png)

**A note about dedicated environments**:

For dedicated environments (Consumption profile, or, Workload profiles) - the error instead will show the following:

```
Container 'some-container' was terminated with exit code '' and reason 'VolumeMountFailure'
```

The description will not be logged as to why the failed to mount in this case, but, this blog can be used to rule out potential problems.

# Troubleshooting
You can use the `ContainerAppSystemLogs_CL` table to view if failed mount operations are occurring.

An example of this query is:

```
ContainerAppSystemLogs_CL
| where Reason_s == "FailedMount"
| project time_s, Reason_s, Type_s, Log_s
```

If there is explicit failed mount operations, the output would look something like the below - in this case, it's failingd due to firewall restrictions on the storage account side. The message may vary depending on the issue:


![Mount failures](/media/2023/07/azure-aca-volume-2.png)

**NOTE**: There is some scenarios where a volume cannot be mounted, for instance, a misconfigured Service Endpoint on the Storage Account side - where the Storage Account can't be contacted from the Container Apps side - this may _not_ show any logging in the above table - and also have the same behavior as above in the [What behavior will I see](#what-behavior-will-i-see) section.

# Storage Volume troubleshooting scenarios
Documentation for using storage mounts in Azure Container Apps can be found [here](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?pivots=azure-cli).

## Common Errors
The below errors will show in `ContainerAppSystemLogs_CL` - this will depend on the scenario encountered:

- `Output: mount error: could not resolve address for someaddress.file.core.windows.net: Unknown error`

    - The Storage Account FQDN may not be able to be resolved - DNS may be misconfigured or traffic from Azure Container Apps is being blocked.

- `Output: mount error(13): Permission denied`

    - The address is resolvable but traffic may be blocked from accessing storage. Is there a firewall on storage blocking the IPs of the environment? Is storage able to be accessed from a jumpbox in the same VNET?
    - Also ensure that the file share exists.
    - Validate if CMK (customer managed keys) are being used on the Storage Account side - as this may cause this problem as well if Azure Key Vault cannot be accessed from the storage side

- `Output: mount error(2): No such file or directory`
    - Does the File Share exist? Review if this was deleted or the name does not exist

## Deleted File Share or Storage Account
If a File Share that is mapped to the application is deleted while the application is running, you may see some of the following scenarios:

- Read/write operations at runtime may fail, before any of the Pods are even restarted
- If using Console to access the Pod and running container:
    - If volume will be removed shortly after the file share is deleted, you can validate this by running `df -h` after the deletion, you will notice the volume is now removed a few moments later
- If inside the mapped volume directory, trying to do any kind of operations on/in the volume that previously existed on the container file system may show the following:
    - `ls: cannot open directory '.': No such file or directory`
    - `ls: .: No error information`
    - `No such file or directory`

Trying to run `df -h` may also show `df: /some/dir: No such file or directory` where `/some/dir` is the location that the volume was previously mounted

## Storage Firewall
If a firewall or a Private Endpoint is enabled on the Storage Account, and not properly set up for traffic, this can manifest in the following ways adversely on the application side:

- If enabling a Storage Firewall and the Container App has no access, and a restart or stop operation is attempted - it may show as **indefinitely "Provisioning"**, or in a **failed provisioning state**. 
    - Deployments may subsequently fail as the replica relies on this volume to be mounted.
- If connected to a replica using the Console option, the storage volume may disappear:
    - If you were in the mounted directory at the time (assuming the same directory name did not exist otherwise), and try to do an operation on the file system - it may show `ls: cannot open directory '.': Host is down`
    - If you try to run `df -h` _after_ enabling a firewall where the application has no access - you may see `df: /some/path: Resource temporarily unavailable`
- If a firewall was enabled, and the application does not have proper access, it may show as failed read/write operations to that mount at runtime.
- Operations such as restarts, updates, or deployments may fail if the application is dependent on a storage mount.

Consider the following during troubleshooting from with the Container App console:
- Ensure the account can be pinged with `tcpping` - eg., `tcpping somestorageaccount.file.core.windows.net`
- Ensure the address is resolvable - you can use either `dig` or `nslookup` - eg., `nslookup somestorageaccount.file.core.windows.net`
- If the address can be resolved and be pinged, then this is likely not a DNS issue as it's resolvable but rather this may indicate the client is blocked from access.
- If the address is _not_ resolvable - this may be an issue with the DNS configured - you may also see `could not resolve address for someaddress.file.core.windows.net`

Additionally, review [Securing a custom VNET in Azure Container Apps with Network Security Groups](https://learn.microsoft.com/en-us/azure/container-apps/firewall-integration.)

## Incorrect or rotated Access Keys
Keys that are rotated/refreshed:

If you rotate an Access Key on the Storage Account side - the Azure Container App Storage resource will not automatically refresh this key for you. If a Container App is restarted after the key has been refreshed (but not yet updated) - operations such as restarts or deployments may fail and you will likely see a indefinite **provisioning** status for revision(s) reliant upon said Storage resource.

Update the Storage Resource mapped to the Azure Container Apps instance if keys are refreshed.

## Permission denied due to volume privileges
Some technologies may require root privileges with `sudo` - or being able to manipulate the command and mount permissions used when mounting the volume with the client or driver being used.

On Container Apps - this cannot be done. Since this is a PaaS, lower level implementations like being able to manipulate the way volumes are mounted can not be done.

Part of this also can happen due to Container Apps not letting applications run as priviledges containers - [docs](https://learn.microsoft.com/en-us/azure/container-apps/containers#limitations)

Another scenario related to this is if the user in the container is different from the user (or privileges) set when the volume is actually mounted. 

At this time, a potential way to get around this (this also depends on the technology used) is to set the `USER` instruction to `root` in the `Dockerfile` used (if the `USER` is not root already). 
- If this is not able to be done, or does not work, then there is the potential that the application functionality requiring priviledged mount options will need to be reworked to avoid use this in a priviledged manner

For the future, there is a roadmap item for [supporting mount options for storage mounts with Container Apps](https://github.com/microsoft/azure-container-apps/issues/765).

## Pod or container exceeded local ephemeral storage limit
You may see messages like the below when a pod is exceeding the allowed storage quota limit, which may cause application unavailability.

```
Container somecontainer exceeded its local ephemeral storage limit "1Gi". 
```
```
Pod ephemeral local storage usage exceeds the total limit of containers 1Gi. 
```
> **NOTE**: The limit message may differ depending on the allowed quota

Ephemeral volume quota limits are publicly defined [here](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?pivots=azure-cli#temporary-storage).

For **container** storage - take note of what is publicly called out in documentation: _There are no capacity guarantees. The available storage depends on the amount of disk space available in the container._

For **epehemeral** (pod) storage - review the containers' CPU defined - since ephemeral storage scales with the amount of CPU set for a container.

If an application is consistently hitting quota limits, you can:
- Increase CPU size to be aligned with [here](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?pivots=azure-cli#temporary-storage), which would increase ephemeral storage.
- Or, use **[Azure Files](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?pivots=azure-cli#azure-files)** which would offer increased storage size. However, if there are alot of temporary files or files that don't need to be persisted - then this option shouldn't be used as eventually you'd be at risk of filling up this Azure Files quota as well - unless these files are periodically/systematically deleted
