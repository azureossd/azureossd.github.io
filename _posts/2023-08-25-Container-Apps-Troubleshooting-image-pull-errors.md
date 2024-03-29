---
title: "Container Apps: Troubleshooting image pull errors"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Troubleshooting
    - Container Apps
categories:
    - Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Troubleshooting
header:
    teaser: "/assets/images/azure-containerapps-logo-1.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-08-25 12:00:00
---

This post will cover image pull errors and what they may mean on Azure Container Apps.

# Overview
Image pull errors can happen for numerous reasons - these reasons may also depend on certain scenarios. These errors can also show or manifest in different places, depending on where you're trying to deploy or change the image and/or tag.


# General reasons that cause image pulls
General reasons that will cause an image pull is the creation of new pods/replicas. Such as, explicitly creating new revisions, scaling - or editing existing containers in a way that it is a part of [Revision-scope changes](https://learn.microsoft.com/en-us/azure/container-apps/revisions#revision-scope-changes).

This is important to understand - because in scenarios where registry credentials or networking changes where made and _not_ correctly updated/validated to work on the Container App - it would cause the new revision (or existing ones) to be marked as failed since the image is now failing to pull.


# Troubleshooting
## Difference between message format in certain failures
When deploying or doing an update that would cause an image to be pulled (explained above) - depending on where and _how_ this happens, the format for the error may be a bit different.


In GUI options, like making changes directly from the Azure Portal, it may open a popout message/toast that looks the below - however, this same style of message may appear in BICEP/ARM/other IaaC deployment methods, and others - just instead written out to the terminal/console:

![Portal Image Pull error](/media/2023/08/aca-image-pull-1.png)

When this fails, such as when doing changes through the portal (above), and you view your Log workspace, you'll see this message:

```
Persistent Image Pull Errors for image "someregistry.com/image:atest". Please check https://aka.ms/cappsimagepullerrors.
```

The **main** reason for failure would be in the above popout message, or, in the other cases above with IaaC or CLI methods - written to the terminal.

**For dedicated environments (Consumption profile, or, Workload profiles)** - the error instead will show the following:

```
Container 'some-container' was terminated with exit code '' and reason 'ImagePullFailure'
```

The description will not be logged as to why the image pull failed in this case, but, this blog can be used to rule out potential problems.

--------

In other scenarios where pod movement happens more organically - eg., scaling rules being triggered, or other reasons for pod movement that is not _directly_ user initiated - this may manifest in the format below in the **Logs** / Log Analytic Workspace - notice the difference between the above and the below

```
Failed to pull image "someacr.azurecr.io/someimage:sometag": rpc error: code = Unknown desc = failed to pull and unpack image "someacr.azurecr.io/someimage:sometag": failed to resolve reference "someacr.azurecr.io/someimage:sometag": ...
```

Even though the formatting style may be different - you can still use the below common scenarios for troubleshooting.

## Viewing logs
**Log Analyics / Log Blade**:

You can go to the **Logs** blade on your Container App and run the following query to look for all occurrences of image pulls.

```
ContainerAppSystemLogs_CL
| where RevisionName_s == "somerevision--f0wyhu0"
| where Log_s startswith "Pulling image" 
    or Log_s startswith "Successfully pulled image" 
    or Log_s startswith "Failed to pull image"
    or Log_s == "Error: ImagePullBackOff"
    or Log_s startswith "Persistent Image Pull Errors"
| project TimeGenerated, Log_s, RevisionName_s, ReplicaName_s
```

Take note of the ` ReplicaName_s` column - as changes in replicas would indicate new pod/replicas being created. This can potentially also be correlated to events where `ContainerAppSystemLogs_CL` shows `Created container [containername]` - indicating the container was created in the new pod/replica.

**Log Stream**:

You can use the Log Stream blade and switch it to "System" to view system logs there as well.

## Common errors
### Authentication or Authorization related
A common error will be a 401 returned when trying to pull an image:

This can occur in some of the following scenarios:
- If you're using Admin Credential (username/password) based authentication with your Azure Container Registry
    - For Admin Credential scenarios - the Azure Container Registry key is stored as a Secret in the "Secrets" blade on the Container App - normally in the form of `acrnameazurecrio-acrname`
    - If a key was rotated, or was changed to be incorrect, this can cause the 401 above
- If you're using Managed Identity Authentication for the image pull and the identity does not have the `AcrPull` role assigned.

```
Failed to pull image "someacr.azurecr.io/image:tag": [rpc error: code = Unknown desc = failed to pull and unpack image "someacr.azurecr.io/image:tag": failed to resolve reference "someacr.azurecr.io/image:tag": failed to authorize: failed to fetch oauth token: unexpected status from GET request to https://someacr.azurecr.io/oauth2/token?scope=repository%3repo%image%3Apull&service=someacr.azurecr.io: 401 Unauthorized, rpc error: code = Unknown desc = failed to pull and unpack image "someacr.azurecr.io/iamge:tag": failed to resolve reference "someacr.azurecr.io/iamge:tag": failed to authorize: failed to fetch anonymous token: unexpected status from GET request to https://someacr.azurecr.io/oauth2/token?scope=repository%3repo%2Fimage%3Apull&service=someacr.azurecr.io: 401 Unauthorized]
```

A HTTP 403 could appear if a registry has a firewall enabled or a Private Endpoint set (this can potentially bleed into the "Network blocks or access issues" below)

```
Failed to pull image "someacr.azurecr.io/image:tag": rpc error: code = Unknown desc = failed to pull and unpack image "someacr.azurecr.io/image:tag": failed to resolve reference "someacr.azurecr.io/image:tag": unexpected status from HEAD request to https://someacr.azurecr.io/image:tag/v2/image/manifests/tag: 403 Forbidden
```

Other errors:

```
Failed to pull image "someacr.azurecr.io/someimage:sometag": rpc error: code = Unknown desc = failed to pull and unpack image "someacr.azurecr.io/someimage:sometag": failed to resolve reference "someacr.azurecr.io/someimage:sometag": pull access denied, repository does not exist or may require authorization: server message: insufficient_scope: authorization failed
```

### Network blocks or access issues
In a networked environment, for example, using custom DNS, NSG rules and UDR's, amongst others - this may cause pulls to fail if traffic is not properly resolving or routed to the registry, being blocked by another appliance or service along the way, or being blocked by the registry itself.

In these cases, it is good to review if:
- You can resolve the hostname of the container registry you're trying to pull from. This is to validate if DNS can properly be looked up. Ensure if you need to use a jumpbox to validate this, that resolution is done from there.
    - You can also try to test this within the Container App, as long as there is a running revision, by going to the Console tab which opens a `bash` / `sh` terminal
- Review the kind of access on the registry side - is there a Firewall enabled or Private Endpoint set?
- In some cases, it is a good idea to validate the image pull is successful through public network access - which can scope this down to the networked environment.
- Take into consideration any routing (UDRs), VNETs (peered or not) - which both of those are only valid to be used on a **Dedicated + Consumption** SKU, and restrictions like ["select networks"/Firewalls](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-firewall-access-rules)  and [Private Endpoints on the Azure Container Registry side](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-private-link)
  - For NSG's, review [Securing a custom VNET in Azure Container Apps with Network Security Groups](https://learn.microsoft.com/en-us/azure/container-apps/firewall-integration)
  - For UDR's and NAT gateway integrations - see [Azure Container Apps - Networking - Routes](https://learn.microsoft.com/en-us/azure/container-apps/networking?tabs=azure-cli#routes)

Common networking related errors are:

```
Failed to pull image "someacr.azurecr.io/someimage:sometag": rpc error: code = Unknown desc = failed to pull and unpack image "someacr.azurecr.io/someimage:sometag": failed to resolve reference "someacr.azurecr.io/someimage:sometag": failed to do request: Head "https://someacr.azurecr.io/someimage:sometag/v2/someimage/manifests/sometag": dial tcp: lookup someacr.azurecr.io on 168.63.129.16:53: no such host
```

```
Failed to pull image "someacr.azurecr.io/someimage:sometag": rpc error: code = Unknown desc = failed to pull and unpack image "someacr.azurecr.io/someimage:sometag": failed to resolve reference "someacr.azurecr.io/someimage:sometag": failed to do request: Head "https://someacr.azurecr.io/someimage:sometag/v2/image/manifests/tag": dial tcp: lookup someacr.azurecr.io: i/o timeout
```

```
Failed to pull image "someacr.azurecr.io/someimage:sometag": rpc error: code = Unknown desc = failed to pull and unpack image "someacr.azurecr.io/someimage:sometag": failed to copy: read tcp xx.x.x.xxx:xxxxx->xx.xxx.xx.xxx:xxx: read: connection reset by peer
```

```
Failed to pull image "someacr.azurecr.io/someimage:sometag": rpc error: code = Unknown desc = failed to pull and unpack image "someacr.azurecr.io/someimage:sometag": failed to copy: httpReadSeeker: failed open: failed to do request: Get "httpsomeacr.azurecr.io/someimage:sometag": net/http: TLS handshake timeout
```

```
Failed to pull image "someacr.azurecr.io/someimage:sometag": rpc error: code = Unknown desc = failed to pull and unpack image "msomeacr.azurecr.io/someimage:sometag": failed to resolve reference "someacr.azurecr.io/someimage:sometag": unexpected status from HEAD request to https://someacr.azurecr.io/v2/someimage/manifests/sometag: 503 Service Unavailable
```

```
Failed to pull image "someacr.azurecr.io/someimage:sometag": rpc error: code = Canceled desc = failed to pull and unpack image "someacr.azurecr.io/someimage:sometag": failed to resolve reference "someacr.azurecr.io/someimage:sometag": failed to do request: Head "someacr.azurecr.io/someimage:sometag": context canceled
```

```
DENIED: client with IP 'xx.xx.xxx1.xx' is not allowed access, refer https://aka.ms/acr/firewall to grant access'
```

### Missing, incorrect tag/image name
If the image and/or tag that you're targeting does not exist in the registry you're trying to pull from, then they may manifest as the below errors.

If this is the case ensure that the:
- Image exists and is correctly spelled
- Tag exists and is correctly spelled

Sometimes it may be good to test if these images are able to be pulled to your local machine.

Some errors you may see are below:

```
Failed to pull image "someacr.azurecr.io/someimage:sometag": [rpc error: code = NotFound desc = failed to pull and unpack image "someacr.azurecr.io/someimage:sometag": failed to resolve reference "someacr.azurecr.io/someimage:sometag": someacr.azurecr.io/someimage:sometag: not found, rpc error: code = Unknown desc = failed to pull and unpack image "someacr.azurecr.io/someimage:sometag": failed to resolve reference "someacr.azurecr.io/someimage:sometag": failed to authorize: failed to fetch anonymous token: unexpected status from GET request to https://someacr.azurecr.io/oauth2/token?scope=repository%3Asomeimage%3Apull&service=someacr.azurecr.io: 401 Unauthorized]
```

```
Failed to pull image "someacr.azurecr.io/someimage:sometag": rpc error: code = Unknown desc = failed to pull and unpack image "someacr.azurecr.io/someimage:sometag": failed to resolve reference "someacr.azurecr.io/someimage:sometag": pull access denied, repository does not exist or may require authorization: server message: insufficient_scope: authorization failed
```

```
'Invalid value: "somehost.com/someimage:tag": GET https:: unexpected status code 404 Not Found:
 ```

## Common scenarios
### ACR Access Keys rotated but not updated on the Container App
If Azure Container Registry Access Keys are rotated, but not updated on the Container App, this can cause failures to pull images when doing operations that initiate a pull - such as creating a new revision or scaling out. In the portal, you would see this (in other tools, like cli based deployment tools - it would be propagated via stdout):

> **NOTE**: You can still restart and existing running revision

![Image pull failure](/media/2023/08/aca-image-pull-2.png)

If these keys are rotated, the client(s) (ex., Azure Container Apps) have no awareness this was changed on the ACR side - up until point of failure.

To change/validate the keys:
1. Go to the **Secrets blade** and click edit (or click the eye icon to view the current value)
2. If the key does **not** match what is showing as either the primary or secondary key in Azure Container Registry, then the key on the Container App side needs to be updated.
3. Copy a key from ACR and edit -> save in the Azure Container Apps portal
4. Reattempt whatever operation was tried before that failed.

**NOTE**: Given the above, if there was replica/pod movement (such as due to a revision creation), and the ACR secrets were rotated at some point previously - this would fail to pull the image when trying to create the new pod/replicas