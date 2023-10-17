---
title: "Container Apps: Profiling Node applications for performance issues"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Troubleshooting
    - Configuration
    - Container Apps
    - Node
categories:
    - Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Troubleshooting
    - Node
header:
    teaser: "/assets/images/azure-containerapps-logo-1.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-10-16 12:00:00
---

This post will cover using troubleshooting tools to help profile performance issues on Container Apps with Node applications.

# Overview
Sometimes, applications may encounter issues due to poor performance - either high CPU usage, high memory (or out of memory), generally slow performance due to code execution logic, or others.

In these scenarios, if it's been determined this _is_ likely an application problem, you can use troubleshooting tooling to profile or take dumps of the application.

This post will explain how to view or download profile/dump files - and show a few libraries that can be used to help with CPU and/or memory profiling/dumps.

Note, that this post does not cover any specific web framework or web library in terms of Node Web-based applications. The packages discussed in this post are in terms of generalized usage.

# Important Prerequisites
Some **important** prerequisites is to be able to:
- Being able to connect to the container through the **Console** blade or use the [`az containerapp exec`](https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest#az-containerapp-exec) command. See console documentation [here](https://learn.microsoft.com/en-us/azure/container-apps/container-console?tabs=bash)
- Able to download files from the container

There is no out-of-the-box method to profile/generate a dump for an application container on Container Apps. To understand if there is application slowness, either due to high CPU, high memory, dependency problems, or other reasons - a profiler typically specific to the language/runtime you're using should be used.

In the case of Node - most profilers are installed as packages and used through code. This should be validated and tested locally to ensure this works before testing on Container Apps.

## Console access
You can use either the Azure CLI or the portal for console access. Below is what portal access would look like:

![Console access from portal](/media/2023/08/aca-java-ts-1.png)

These commands for capturing profiles and dumps require access to a terminal - so console access is required.

## Download files from the container
You'll need a way to download files from the container. By default, there is no way to get files generated at runtime by a container in Container Apps without some additional configuration.

The most simplistic way is to mount a volume from an Azure File Share with an Azure Storage Account.

For a quickstart on how to add a volume, follow [Use storage mounts in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?pivots=azure-portal)

**NOTE**: It is advised to add this mount _before_ testing or generating files. If you do this _after_ testing (and in single revision mode, for instance) then a new pod will be created and previous files would be lost.

You can validate that the volume is mounted with the `df -h` command:

![Storage volume check](/media/2023/08/aca-java-ts-2.png)

# Determining high CPU or memory
## Diagnose and Solve problems
You can use the following detectors in the **Diagnose and Solve Problems** blade to diagnose these issues:
- **Container App Memory Usage**
- **Container App CPU usage**

## Metrics blade
You can use the following metric breakdowns in the **Metrics** blade to diagnose these issues:
- **CPU usage**
- **Memory Working Set Bytes**
- **Reserved Cores**
- **Total Reserved Cores**

## cgroupv2 change
See this GitHub issue - [Mitigate Potential Memory Pressure Effects With cgroup v2](https://github.com/microsoft/azure-container-apps/issues/724) - With the change for cgroupv2 from cgroupv1 can introduce unexpected memory management issues for applications. From what is mentioned on this post - Node v20.3.0 contains a [PR](https://github.com/nodejs/node/pull/48078) to address [cgroupv2 support](https://github.com/nodejs/node/issues/47259).

# Generating dumps or profiling
## Best practices
When taking a heap dump, thread dump, or profiling - it is recommended to take a few of these while reproducing the issue for consistent data.

Taking only (1) may show data that is ultimately not relevant - taking multiple of these will show a more consistent theme in terms of what the problem may be - and would be easier to troubleshoot.

There are times when taking multiple dumps/profiles, you may notice one has a variation of data - if this happened to be the one dump/profile you took (if only taking one total), this can cause the investigation to go down the wrong path.

> **NOTE**: When profiling an application, there is the chance this creates further negative performance impact (while profiling is occurring). This should be noted, especially for production environments. 

## High CPU
### node --cpu-prof
