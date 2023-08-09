---
title: "Troubleshooting OCI runtime create errors"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Troubleshooting
    - Web Apps for Containers
categories:
    - Web Apps for Containers # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Troubleshooting
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-07-17 12:00:00
---

This post will cover scenarios where an application is unable to run due to "OCI runtime create failed: runc create failed".

# Overview
**Note**: This post can also potentially apply to any environment a container (linux-based) can run. Not just on App Service. In the context of Azure App Service, the below content is intended for discussion revolving around Web Apps for Containers. However, some of these can also apply to "Blessed" images.

# OCI runtime create failed: runc create failed
**Preface:** Some of these errors can and will happen if attempting to run locally. It is always a good practice to make sure you can actually run your image as a container on your local computer or development environment first. Some of these issues covered below will require the image to be rebuilt and/or code to be properly changed.


In short, seeing this error means that container creation failed. There is typically more information in this message, which we'll cover some scenarios below. Some of the messages may be cryptic while others more straight forward. This error can happen for a myriad of reasons.

- What is OCI?
  - This stands for [Open Container Initiative](https://opencontainers.org/) - a container standards
 - What is `runc`? - [runc](https://github.com/opencontainers/runc) is a CLI tool for spawning and running containers on Linux according to the OCI specification

The `runc create failed` is returned here - [create.go](https://github.com/opencontainers/runc/blob/caa6e523f24b255fa6deb42412b5ddbb317cd8bd/create.go#L64), when trying to create the container. 

On App Service (or in any other environment that can run a linux-based container), this means we have either successfully pulled the image, or have it locally - and either trying to do `docker run` (which implicitly runs `docker create`), or, where Docker CLI access is granted, explicitly running `docker create` - which is ultimately where this fails, and the error is thrown. 

Essentially, the error is happening on the "create" process of the container, when trying to create one to _run_. Hitting this means we never successfully get to attempt a `docker start` on a container.

The full error message may look like this:

```
Docker Run failed with exception: One or more errors occurred. (Docker API responded with status code=BadRequest, response={"message":"OCI runtime create failed: runc create failed: unable to start container process: [some lifecycle call]: [some reason]"}
)
```

> **Note**: The message above may vary slightly depending on the reason of failure

Some of these errors can also be reproduced in local environments - some other errors may be due to additional configuration or other environment factors.

## Where to view these errors
You can view these errors from a few different places:

- Log Files - `docker.log` will contain this error message
- Log Stream
- Diagnose and Solve Problems:
    - Application Logs Detector (under the Platform Logs tab)
    - Container Issues 

# Common errors
Below are a few common errors - this is a non-exhaustive list

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
  - When the container is trying to be created to be ran on App Service - you may see this - `OCI runtime create failed: container_linux.go:380starting container process caused: exec: "/some/entrypoint.sh" permission denied: unknown.`
  - When building locally, the image may work fine - however, when building in another environment, like a CI/CD agent - and pulling the same image to your local machine, you may get this same issue.
  - This depends on the `Dockerfile` and instructions - but this can be most likely attributed to your container entrypoint not having executable permissions.
  - To resolve this, add a `RUN chmod +x /some/entrypoint.sh` instruction, and rebuild the image.

## no space left on device: unknown
 `OCI runtime create failed: runc create failed: unable to start container process: error during container init: error mounting \"/some/path" to rootfs at \"/appsvctmp\": mkdir /mnt/docker/somepath: no space left on device: unknown"}`
  - This is normally due to host disk space exhaustion. 

More on this can be read here - [Troubleshooting No space left on device](https://azureossd.github.io/2023/04/11/troubleshooting-no-space-left-on-device/index.html)

## cannot set uid to unmapped user in user namespace: unknown
- `OCI runtime create failed: container_linux.go:380: starting container process caused: setup user: cannot set uid to unmapped user in user namespace: unknown`
  - This error is related to `uid` being set for a file or user that is outside the allowed range of the host.

More on this can be read here - [Docker User Namespace remapping issues](https://azureossd.github.io/2022/06/30/Docker-User-Namespace-remapping-issues/index.html)

## error mounting "/some/path" to "/some/path", flags: 0x5000: not a directory
- `OCI runtime create failed: runc create failed: unable to start container process: error during container init: error mounting \"/some/path\" to rootfs at \"/some/file\": mount /proc/self/fd/7:/some/file (via /proc/self/fd/15), flags: 0x5000: not a directory: unknown: Are you trying to mount a directory onto a file (or vice-versa)? Check if the specified host path exists and is the expected type`
  - This will happen if you are trying to mount a volume to an existing file. On App Service, this could occur if you're using [Bring Your Own Storage](https://learn.microsoft.com/en-us/azure/app-service/configure-connect-to-azure-storage) and add this as a path mapping.
  - You should instead mount the volume to a directory (preferably one that will not have content overriding by the mount)

## OCI runtime create failed: runc create failed: read-only file system: unknown
- `OCI runtime create failed: runc create failed: unable to start container process: error during container init: error mounting \"/some/path\" to rootfs at \"/some/path\": mkdir /some/path/to/dir: read-only file system: unknown"}`
  - Depending on what the application is doing and expecting at the specified mount location, ensure a non-readonly volume is being mounted to a directory that may require both read-write access (including any subdirectories)
  - For App Service, this would mean Azure Blob storage, since this is read-only.

## Other errors
Errors that can cause container create failures, but not appear as `OCI runtime create failed`, would be to mount volumes with Bring Your Own Storage, to a volume that already exists at the path specific. For instead, with "Blessed Images", this may occur if you mount to `/var/ssl` with BYOS. There is an already defined mapping to this location, as well as some others. This can be checked with `df -h`.

There are other errors or reasons for container creation to fail that may not be covered here. To resolve or mitigate, some of these may require access to the Docker daemon and/or Docker specific filesystem locations for storage. On App Service Linux, this access is not possible. In certain edge-cases where this may be an issue, and is causing `OCI runtime create failed:` where it has been completely ruled out to be a user-induced problem, scaling up (or down), or using the [Reboot Worker API](https://learn.microsoft.com/en-us/rest/api/appservice/app-service-plans/reboot-worker), can be done.

Attempting to restart the application (start, stop, restart, or advanced application restart), such as in these edge-case scenarios (and above) will have typically zero affect - as these are intended to operate on a container that is able to run. 
