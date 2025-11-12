---
title: "Azure Files security compatability on Container Apps and Web App for Containers"
author_name: "Anthony Salemo"
tags:
    - Configuration
    - Linux
    - Storage
    - Azure Container Apps
    - Web Apps for Containers
    - Security
categories:
    - Azure Container Apps, Web App for Containers # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2025-02-10 12:00:00
---

This post will go over compatable security settings when using Azure Storage and Container Apps and Web Apps for Containers.

# Overview
In terms of storage, Container Apps allows [Azure Files to be mounted](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts-azure-files?tabs=bash) from an Azure Storage Account, as well as Web Apps for Containers - [Mount Azure Storage as a local share in App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-connect-to-azure-storage?tabs=basic%2Cportal&pivots=container-linux). This post refers to the security settings that can be chosen on an Azure Files Share under **Security** -> Protocol settings. 

# Behavior
This will show up as volume mount failure with `mount error(13): Permission denied`
- One thing to note with Web App for Containers is that logging may not be available whene a volume mount is failing. See [What kind of issues will I see?](https://azureossd.github.io/2023/04/20/How-to-troubleshoot-Bring-Your-Own-Storage-(BYOS)-Issues-on-App-Service-Linux/index.html#observability)
- This does **NOT** apply to Azure Container Apps. You _will_ be able to see volume mount failures in **Diagnose and Solve Problem** or by viewing _system logs_ in the log destination you have set

# Compatability

These are two different container services offered on Azure, but share the same concept surrounding mounting volumes and what security side settings are set on an Azure File share when mounting volumes.

![Azure Files security tab](/media/2025/02/aca-storage-security-1.png)

When creating a Storage Account through typical means (eg. portal, or others - with default settings), the Security -> Protocol Settings default to Maximum Compatibility - which is the below, where all options are checked. This means any that fail will fallback to others that may work:

![Azure Files security protocol settings](/media/2025/02/aca-storage-security-2.png)

If a configuration is chosen that is not one that is applicable with ACA, this will manifest as Storage Volume errors on the Container App side with `mount error(13): Permission denied`. You can find more information on troubleshooting mount issues [here](https://azureossd.github.io/2023/07/24/Troubleshooting-volume-mount-issues-on-Azure-Container-Apps/index.html). The `Permission denied` error will show in your Container App's system logs.

Aside from using **Maximum Capability** (which just checks every box), the "highest" realistic settings a user can do when setting **Profile** -> _Custom_ is the following:
- **SMB protocol versions**: SMB 3.1.1, **SMB channel encryption**: AES-128-GCM, (**Optional**: Authentication mechanisms -> _NTLM V2_)

Explicitly using _only_ Kerboros authentication will fail. This cannot  be used. Additionally, using SMB 3.1.1 with _only_ AES-256-GCM will also fail. Using any lower versions of SMB under 3.1.1 will fail.

Using the **Maximum Security** profile will also fail, since this uses the following - SMB 3.1.1, AES-256-GCM, Kerberos (with Kerberos ticket encryption -> AES-256)

In short, sticking with _Maximum Capatability_ or setting a custom profile to **SMB protocol versions**: SMB 3.1.1, **SMB channel encryption**: AES-128-GCM, (**Optional**: Authentication mechanisms -> _NTLM V2_) are the two general options that can be done.

For other storage troubleshooting articles, see:
**Container Apps**:
- [Troubleshooting volume mount issues on Azure Container Apps](https://azureossd.github.io/2023/07/24/Troubleshooting-volume-mount-issues-on-Azure-Container-Apps/index.html)
- [Container Apps - Setting storage directory permissions](https://azureossd.github.io/2024/12/30/Container-Apps-Setting-storage-directory-permissions/index.html)

**Web Apps for Containers**:
- [How to troubleshooting Bring Your Own Storage (BYOS) issues on App Service Linux](https://azureossd.github.io/2023/04/20/How-to-troubleshoot-Bring-Your-Own-Storage-(BYOS)-Issues-on-App-Service-Linux/index.html)