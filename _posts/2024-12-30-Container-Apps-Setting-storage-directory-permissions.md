---
title: "Container Apps - Setting storage directory permissions"
author_name: "Anthony Salemo"
tags:
    - Configuration
    - Linux
    - Storage
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
date: 2024-12-30 12:00:00
---

This blog post will quicky cover how to set storage mount permissions for directories between SMB and NFS on Azure Container Apps.

# Overview
Azure Container Apps _Storage Mounts_ support the use of [Azure Files](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?tabs=smb&pivots=azure-portal#azure-files) - where both SMB and NFS volumes can be used

> **NOTE**: NFS volumes are currently in preview as of writing this blog post on 12/30/2024.

In some cases, you may want to set directory-level Linux permissions on the mount. This post will go over how to do this.

# SMB
SMB volumes can be created by following [Container Apps - Azure Files volume - SMB](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?tabs=smb&pivots=azure-portal#azure-files)

**A very important callout** - You cannot change permissions for a mount directory with something like `chmod` at runtime from within a container when using SMB mounts with Azure Files. 

You can however utilize the _Mount options_ available when creating a volume, you can pass [cifs mount options](https://linux.die.net/man/8/mount.cifs) to change aspects of permissions for the mount (at mount time).

For instance, the default permissions for a Storage resource upon creation is `777` when using Read/write and Read only (although Read only has a read-only filesystem mounted) - but if you wanted to change this, you can pass in the `dir_mode` and `file_mode` arguments.

![CIFS mount options to change permissions](/media/2024/12/aca-storage-permissions-1.png)

Prior to passing in something like `dir_mode=0666,file_mode=0666` and assuming our SMB mount is at `/data/tmp`, mount permissions would look like the following:

```
sh-5.1# ls -lrtah /data
total 8.0K
drwxrwxrwx 2 root root    0 Aug 30 13:15 tmp
```

Afterwards, you can see the change reflected - this change would also be recursive and affect the contents of the file share:

```
sh-5.1# ls -lrtah /data                                                         
total 8.0K
drw-rw-rw- 2 root root    0 Aug 30 13:15 tmp
```

# NFS
NFS volumes can be created by following [Container Apps - Azure Files volume - NFS](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?tabs=nfs&pivots=azure-portal#azure-files)

NFS shares allow users to change directory/file permissions at runtime - for example, from within the shell of a container, or at application startup/runtime, as opposed to SMB/CIFS, where you need to instead use _Mount options_.  NFS shares do not require _Mount options_ to change these permissions.

By default, an NFS resource is mounted as `777`. You can use something like `chmod` to change directory permissions. Below is prior to changing permissions of an NFS share mounted to the container:

![NFS file share output through console](/media/2024/12/aca-storage-permissions-2.png)

```
sh-5.1# ls -lrtah /data                                                                                                                                                                                                                  
total 8.5K
drwxrwxrwx 2 root root   64 Dec 27 19:40 nfs
drwxr-xr-x 1 root root 4.0K Dec 27 19:40 ..
drwxr-xr-x 3 root root 4.0K Dec 27 19:40 .
```

Below is after:

```
sh-5.1# chmod 666 /data/nfs
sh-5.1# ls -lrtah /data    
total 8.5K
drw-rw-rw- 2 root root   64 Dec 27 19:40 nfs
drwxr-xr-x 1 root root 4.0K Dec 27 19:40 ..
drwxr-xr-x 3 root root 4.0K Dec 27 19:40 .
```

**These changes in permissions will persist independently of the Container App lifecycle**. For example, if one app changes the permissions of  the NFS volume from `777` to `666`, and another app mounts it - the new Container App will have the NFS volume mounted with the most recently changed permissions which was set to `666`. 