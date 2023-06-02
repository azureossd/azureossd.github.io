---
title: "Container App 'Console' tab shows 'ClusterExecEndpointWebSocketConnectionError'"
author_name: "Anthony Salemo"
tags:
    - Node
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
date: 2023-06-02 12:00:00
---

This post will cover what it means to see 'ClusterExecEndpointWebSocketConnectionError' when trying to use the Console blade for Container Apps to connect to a replica or pod.

# Overview
This error can surface when using **Console** blade under "Monitoring".

![Console blade](/media/2023/06/azure-blog-aca-console-1.png)

And will look like this when trying to connect to a pod or replica:

![Console error](/media/2023/06/azure-blog-aca-console-2.png)

```
INFO: Connecting to the container 'some-container'...
ERROR: {"Error":{"Code":"ClusterExecEndpointWebSocketConnectionError","Message":"Failed to establish WebSocket connection with the container, error is Failed to establish WebSocket connection with Kubsernetes cluster exec endpoint, error: The server returned status code \u0027500\u0027 when status code \u0027101\u0027 was expected..","Details":null,"Target":null,"AdditionalInfo":null}}
```

# Reason
Although this may seem like a vague or cryptic error, it is more simply due to the fact the pod is exiting. For example:

- The pod is crashing due to an application misconfiguration
- The pod is crashing due to an application error
- Other crashes, startup failures or image pull failures where the pod is failing to be created or started

Just like on a local k8s cluster or other clusters, if the pod is not running, you will not be able to open a shell into it - which is what the Console blade essentially does.

If this is being encountered, review application or system logging with [Monitor logs in Azure Container Apps with Log Analytics](https://learn.microsoft.com/en-us/azure/container-apps/log-monitoring?tabs=bash).

**NOTE:** You may also see the below error if a shell is opened to the pod. This can happen if there is an event, such as updating a revision in single revision mode, or other events that cause a new pod to be created - the exit code 137 is due to k8s shutting down the pod to create a new one.

```
ERROR: {"Error":{"Code":"ClusterExecFailure","Message":"Cluster exec API returns error: command terminated with non-zero exit code: error executing command [/bin/sh], exit code 137, code: 0.","Details":null,"Target":null,"AdditionalInfo":null}}
```

**For the above message regarding 'exit code 137' specifically** - refresh the Console session to reconnect to the new pod/replica. This does not apply to the main error in this post.