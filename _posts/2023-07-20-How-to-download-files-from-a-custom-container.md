---
title: "How to download files from a custom container"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Troubleshooting
    - Web Apps for Containers
categories:
    - Web Apps for Containers # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Configuration
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-07-20 12:00:00
---

This post will cover how to download files from a custom container on Azure App Service - Web App for Containers.

# Overview
Sometimes, during troubleshooting, you'll need to access files from a container, such as log files in certain directories, or, if taking a network trace and needing to download these files. With "Blessed Images", you can easily do this due to the persistent storage mounted to `/home` that's enabled by default.

With custom containers (using Web App for Containers), this is set to false by default - meaning there is no persistent storage, unless explicitly enabled. Therefor making access to said files and downloading them not able to be done without the below methods.

## Prerequisites
A general prerequisite is to have SSH enabled. You can follow this post to enable it on your custom image if not already done so - [Enabling SSH on Linux Web App for Containers](https://azureossd.github.io/2022/04/27/2022-Enabling-SSH-on-Linux-Web-App-for-Containers/index.html)

## A note about restarts
The **Download files by enabling persistent storage** and **Download files by mounting custom storage (BYOS)** will both cause the container to restart when enabled.

Therefor, if you generated certain files required for troubleshooting, and _then_ enabled the above methods, this will cause the container to restart - causing these files to be lost. This should be taken into consideration during troubleshooting. If possible, enable these methods first.

# Download files by enabling persistent storage
One method of being able to download files is to enable [WEBSITES_ENABLE_APP_SERVICE_STORAGE](https://learn.microsoft.com/en-us/azure/app-service/reference-app-settings?tabs=kudu%2Cdotnet#custom-containers) to `true`.

This will now mount a volume to `/home` - ensure that there is no content in this directory in your custom container, to avoid any existing files being overwritten.

With `/home` being mounted, and with [SSH enabled](https://azureossd.github.io/2022/04/27/2022-Enabling-SSH-on-Linux-Web-App-for-Containers/index.html) - you can move files over to `/home` with something like `mv` or `cp` while on the container filesystem - and then download them through an FTP client or Kudu's /newui endpoint. 

You can confirm that a volume is mounted to `/home` with the `df -h` command.

**Note**: Even with `WEBSITES_ENABLE_APP_SERVICE_STORAGE` to `false`, you can still connect through an FTP client. When using FTP, it will only connect to `/home` (and show all content below this). If this setting is `false`, even though you can connect still, it will **not** show any files since storage is _not_ mounted - nor can it/will it show any content on the container filesystem outside of `/home` (eg., `/`, `/etc`, etc.)

# Download files by mounting custom storage (BYOS)
Like the method above, you can instead also use [Bring Your Own Storage](https://learn.microsoft.com/en-us/azure/app-service/configure-connect-to-azure-storage?tabs=portal&pivots=container-linux) to mount a volume to a path that doesn't have to be `/home` - but rather mostly any other directory. For this method, it is advised to use Azure Files.

You can now move over needed files to the specified mount path location - using the same `mv` or `cp` commands. 
To access these files, go to the Azure File Share on your Azure Storage Account.

You can confirm a volume is mounted by using `df -h` as well.

# Use cURL to send files to a Storage Account
If you don't want to cause a restart to the container, it may be possible to use cURL to PUT a logfile or contents as a blob to a Storage Account.

In this case, you'd have to authorize the call - as an example, a [SAS Token](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview) could be used with the [Azure Storage REST API - PUT Blob](https://learn.microsoft.com/en-us/rest/api/storageservices/put-blob?tabs=azure-ad) call.

Below is an example call, this could be ran inside the container. The below assumes this is relative to a log file. Additionally, if cURL is not installed in the container it can be with the below:

- **Alpine**: `apk add curl`
- **Debian or Ubuntu based containers**: `apt install curl`

```
curl --location --request PUT 'https://somestorageaccount.blob.core.windows.net/yourcontainer/yourblobname?[YOUR_SAS_TOKEN]' \
--header 'x-ms-date: Fri, 21 Jul 2023 18:16:00 GMT' \
--header 'x-ms-version: 2022-11-02' \
--header 'x-ms-blob-type: BlockBlob' \
--upload-file logfile.log
```

**NOTE**: Make sure your SAS token is scoped appropriate with correct permissions and with blob access. A 403 may be returned for incorrect access - or, if you choose to fill in the "IP address" field but with an IP that is not listed. Not entering required headers in the REST specification may cause the call to fail - or - if generating a SAS on the wrong resource.

