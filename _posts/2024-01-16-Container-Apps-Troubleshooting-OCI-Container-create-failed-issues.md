---
title: "Container Apps - Troubleshooting "ContainerCreateFailure" and "OCI runtime create failed" issues
author_name: "Anthony Salemo"
tags:
    - Linux
    - Configuration
    - Container Apps
    - Troubleshooting
categories:
    - Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Configuration
header:
    teaser: "/assets/images/azure-containerapps-logo-1.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-01-16 12:00:00
---

This post will discuss when a Container App is marked as failed while showing "ContainerCreateFailure" or "OCI runtime create failed" in the ContainerAppSystemLogs table or Log Stream.

# Overview

This post will cover mostly what is in [Troubleshooting OCI runtime create errors](https://azureossd.github.io/2023/07/17/Troubleshooting-OCI-Runtime-Create-errors/index.html), however, this will be more Container App specific

----------------

**Note**: This post can also potentially apply to any environment a container (linux-based) can run. Not just on Container Apps. 

# OCI runtime create failed: runc create failed
**Preface:** Some of these errors can and will happen if attempting to run locally. It is always a good practice to make sure you can actually run your image as a container on your local computer or development environment first. Some of these issues covered below will require the image to be rebuilt and/or code to be properly changed.


In short, seeing this error means that container creation failed. There is typically more information in this message, which we'll cover some scenarios below. Some of the messages may be cryptic while others more straight forward. This error can happen for a myriad of reasons.

- What is OCI?
  - This stands for [Open Container Initiative](https://opencontainers.org/) - a container standards
 - What is `runc`? - [runc](https://github.com/opencontainers/runc) is a CLI tool for spawning and running containers on Linux according to the OCI specification

The `runc create failed` is returned here - [create.go](https://github.com/opencontainers/runc/blob/caa6e523f24b255fa6deb42412b5ddbb317cd8bd/create.go#L64), when trying to create the container. 

On Container Apps (or in any other environment that can run a linux-based container), this means we have successfully created a pod or replica, succesfully pulled an image, but have failed on the `container create` part of a pod/replica lifecycle. 

Essentially, the error is happening on the "create" process of the container, when trying to create one to _run_. Hitting this means we never successfully get to attempt to start a container within a pod or replica.

The full error message may look like this (on consumption-only environments):

```
Error: failed to create containerd task: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: exec: "/usr/local/bin/appp": stat /usr/local/bin/appp: no such file or directory: unknown
```

> **Note**: The message above may vary slightly depending on the reason of failure

Some of these errors can also be reproduced in local environments - some other errors may be due to additional configuration or other environment factors.

# Log difference between environments
When running applications on consumption-only environments vs. dedicated environments, you may notice that the error signature varies between environments when reviewing logging in `ContainerAppSystemLogs`/`ContainerAppSystemLogs_CL` tables:

- (consumption-only): `Error: failed to create containerd task: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: exec: ... [rest or message]`

- (dedicated): `Container 'oci-runtime-test' was terminated with exit code '' and reason 'ContainerCreateFailure'`

As seen above, dedicated environments will show a "reason" of `ContainerCreateFailure` in the `Log_s` column. 

Consumption-only environments will output the full message that you would typically see in `stderr`.

In short, it's good to note that `ContainerCreateFailure` on dedicated environments is referring to `OCI runtime create failed` issues.

# Common errors
## no such file or directory: unknown
- `OCI runtime create failed: runc create failed: unable to start container process: exec: "/path/to/somefile.sh": stat /path/to/somefile.sh: no such file or directory: unknown`
  - This typically means the file referenced in the `Dockerfile`'s `ENTRYPOINT` instruction does not exist at the path specified, either is the wrong name/typo, or does not exist in the image.
  - For example, consider the following file - which has it's working directory set to `/app`. We're copying over our `init_container.sh` file as well:

   ```Dockerfile
   WORKDIR /app
   .. other logic
    COPY . ./

   RUN chmod +x /app/init_container.sh

    .. other logic

    EXPOSE 8080

    ENTRYPOINT [ "/app/1/init_container.sh" ]
   ```
   - As we can see the, the location `ENTRYPOINT` is referencing for `init_container.sh` does not exist.

## executable file not found in $PATH: unknown
- `OCI runtime create failed: runc create failed: unable to start container process: exec: "[some exectuable]": executable file not found in $PATH: unknown.`:
  - This means an executable being called in `CMD` is not available to be invoked. The executable (if called by name) may also not be on `$PATH`. Review if the executable exists in the image or at the proper filesystem path specified. 
  - Certain images may handle issues like this in other ways. For example, the Node Docker Images may attempt to the run the container, but fail post container start. Python, on the other hand, may fail on container create.

## exec: "/some/entrypoint.sh" permission denied: unknown
- `OCI runtime create failed: container_linux.go:380starting container process caused: exec: "/some/entrypoint.sh" permission denied: unknown`
  - When the container is trying to be created to be ran on Container Apps - you may see this - `OCI runtime create failed: container_linux.go:380starting container process caused: exec: "/some/entrypoint.sh" permission denied: unknown.`
  - When building locally, the image may work fine - however, when building in another environment, like a CI/CD agent - and pulling the same image to your local machine, you may get this same issue.
  - This depends on the `Dockerfile` and instructions - but this can be most likely attributed to your container entrypoint not having executable permissions.
  - To resolve this, add a `RUN chmod +x /some/entrypoint.sh` instruction, and rebuild the image.

## no space left on device: unknown
 `OCI runtime create failed: runc create failed: unable to start container process: error during container init: error mounting \"/some/path" to rootfs at \"/somepath\": mkdir /mnt/to/somepath: no space left on device: unknown"}`
  - This is normally due to host disk space exhaustion. See [Image size limit](https://learn.microsoft.com/en-us/azure/container-apps/hardware)
  - `no space left on device` could potentially occur if a volume to a file share is mounted in which its quota has been hit

## cannot set uid to unmapped user in user namespace: unknown
- `OCI runtime create failed: container_linux.go:380: starting container process caused: setup user: cannot set uid to unmapped user in user namespace: unknown`
  - This error is related to `uid` being set for a file or user that is outside the allowed range of the host.

More on this can be read here - [Docker User Namespace remapping issues](https://azureossd.github.io/2022/06/30/Docker-User-Namespace-remapping-issues/index.html)

## error mounting "/some/path" to "/some/path", flags: 0x5000: not a directory
- `Error: failed to create containerd task: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: error during container init: error mounting "/var/lib/kubelet/pods/35ed546a-ff19-40ce-be79-76c8fe61d0a9/volumes/kubernetes.io~csi/azurefiless/mount" to rootfs at "/some/path/to/file.js": mount /var/lib/kubelet/pods/35ed546a-ff19-40ce-be79-76c8fe61d0a9/volumes/kubernetes.io~csi/azurefiless/mount:/some/path/to/file.js (via /proc/self/fd/6), flags: 0x5000: not a directory: unknown`
  - This will happen if you are trying to mount a volume to an existing file. On Container Apps, this could occur if you're using [Storage Mounts](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?pivots=azure-portal) and add this as a volume.
  - You should instead mount the volume to a directory (preferably one that will not have content overriding by the mount)


## Other errors
Other errors may also be related to specific directories with the container, like `/proc`, for instance - which should be avoided when using volumes - avoid doing this as this can affect the integrity of the container:

```
OCI runtime create failed: runc create failed: unable to start container process: error during container init: error mounting ...." cannot be mounted because it is not of type proc: unknown"
```

# Command override
"Command override" refers to what is seen in the portal (below), or for example, what the `--command` parameter in the [az containerapp update](https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest#az-containerapp-update) command

![Command override](/media/2024/01/command-override.png)

Using "command override" is the same concept of overriding a containers `ENTRYPOINT` or `CMD` with a custom command - which can be done in most environments that can run a container. For Kubernetes specific documentation, refer to [Kubernetes - Containers - Define command arguments for a container](https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/)

When using this option, it is possible to cause the above issues regarding failed container creation because of invalid input, ensure that:
- The command needs to be targeting the correct path
- The command used would need to be on `$PATH`
- Use commas to separate commands 