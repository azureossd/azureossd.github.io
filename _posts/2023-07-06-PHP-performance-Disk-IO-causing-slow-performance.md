---
title: "PHP performance: Disk I/O causing poor performance"
author_name: "Anthony Salemo"
tags:
    - PHP
    - Troubleshooting
    - Azure App Service on Linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-07-06 12:00:00
---

This post is intended to cover scenarios with PHP applications where disk I/O is shown as contributing to poor performance. This is targeted towards PHP "Blessed Images" or custom Docker Images where /home storage is enabled.

# Why does this happen
Some PHP frameworks need consistent file access - for example, like WordPress. Other PHP frameworks may behave the same. This also will depend furthermore on the application, taking into consideration if it does it's own heavy read/write operations. 

In addition to this, PHP reads the file (to be executed as a script and compiled into opcode) for each request. OpCache is also enabled with PHP "Blessed" images and can be used to help try avoid this behavior and have the opcode kept in memory. Using `phpinfo()`, you can validate that OpCache is enabled by default with PHP Blessed Images. 

Further configuration for OpCache can be found [here](https://www.php.net/manual/en/book.opcache.php). The `.ini` file configured for OpCache is found under `/usr/local/etc/php/conf.d/opcache-recommended.ini`.

When persistent I/O access is needed to be done over the mounted volume (eg., `WEBSITES_ENABLE_APP_SERVICE_STORAGE` to true, which is enabled by default on Blessed Images and for our WordPress marketplace images) - slowness may occur given that these files are read over the network. This may cause other issues, especially under very high load, where I/O wait time and High Load Average (even without high CPU), may happen.

Since App Service persistent storage volumes are mounted from a remote file share - and each request to the file is going through a network mounted volume to the file share - either by explicitly read/write scenarios or implicit I/O through PHP as a language, it can add potential latency here. This can be the case regardless of OpCache usage.

> **NOTE:** A really good and recommended explanation of this behavior, or the concept itself of low CPU but high I/O times/high load average and slow performance when doing I/O operations can be seen here: https://tanelpoder.com/posts/high-system-load-low-cpu-utilization-on-linux/ 

At a minimum, we can confirm through Linux tooling that there is a variable degree of latency between the mounted volume and directly to the local filesystem (disk). Take the below for example testing with [fio](https://github.com/axboe/fio)

When using the test: `fio --randrepeat=1 --ioengine=libaio --direct=1 --gtod_reduce=1 --name=test --filename=random_read_write.fio --bs=4k --iodepth=64 --size=100m --readwrite=randrw --rwmixread=75 --directory=/home` - /home storage can take up to one minute (50+(s)) while comparatively for the same test, writing outside of this mount is done in a few hundred milliseconds

However, this is called out in the following here - [Limitations](https://learn.microsoft.com/en-us/azure/app-service/overview#limitations) - and would be expected in a scenario where file access is done over a network. It's also important to note this is **not** the case for every PHP application hosted on App Service.

> When deployed to built-in images, your code and content are allocated a storage volume for web content, backed by Azure Storage. The disk latency of this volume is higher and more variable than the latency of the container filesystem. Apps that require heavy read-only access to content files may benefit from the custom container option, which places files in the container filesystem instead of on the content volume.

## Performance issues 
The type of performance issues seen in these cases may be:
- General application slowness
- Higher Linux Load Average, even without critically high CPU
- Higher I/O wait percentage
- A possible increase in either `apache2` or `php-fpm` (when using NGINX) child processes, as these child processes exit after the request is completed - slowness induced because of the topic here may keep these child processes around longer, thus accumulating more total child processes under higher load 

## Performance tools for disk I/O
Some additional tooling that can be used to review activity on disk and over the file share is:

[sysstat](https://github.com/sysstat/sysstat) (Ubuntu/Debian)
  - [iostat](https://linux.die.net/man/1/iostat)
  - [cifsiostat](https://linux.die.net/man/1/cifsiostat) (only outputs read or write ops per second - doesn't show kb r/w (s))
  - [top](https://linux.die.net/man/1/top) / htop

> **NOTE**: Some other commands may be blocked due to certain host access

With these tools, you can see the remote file share in use. Below is using `cifsiostat`:

```
rMB/s        wMB/s    rops/s    wops/s         fo/s         fc/s         fd/s Filesystem
        0.0B         0.0B      0.00     42.00         0.00         0.00         0.00 \\10.0.176.10\volume-31-default
```

# Possible mitigations
**NOTE:** In these I/O scenarios and when persistent storage (`/home`) is in use, scaling up will **NOT** help. The only benefit to scaling up will give better I/O performance when reading/writing outside the `/home` mount.

If it is confirmed that this is likely the issue, a few things can be done for a mitigation:

- Use a custom image, if possible. In this case, by default, persistent storage is not enabled. The application would need to be able to handle an environment where a restart causes any additional written or created files to not persist.
    - This is essentially the typical concept of a container, where it is ephemeral and state does not persist
- For Blessed Images, implement a startup behavior where files or application scripts can be read/written to from outside of `/home` instead. This may be more beneficial for explicit read/write scenarios. 
    - Move any files that do not need to be persisted after a restart, such as temporary files, outside of `/home`. This can be done programmatically or through a framework configuration, if it offers such capability.
- Non-App Service products that can be used, if some of these approaches don't work are - AKS, VM's, Azure Container Apps   
    - However, these will still require you to be aware of the non-persisted files on the local container filesystem after operations such as restarts, unless something like a local volume is used.
