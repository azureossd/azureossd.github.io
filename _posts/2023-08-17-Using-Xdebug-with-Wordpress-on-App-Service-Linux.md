---
title: "Using Xdebug with Wordpress on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Configuration
    - Azure App Service on Linux
    - Wordpress
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Wordpress
    - Deployment # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/WordPress.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-08-17 12:00:00
---

This post will cover how to generate Xdebug profiles on a Wordpress - App Service Linux (marketplace) image

# Overview
This post is regarding Wordpress on App Service Linux - which is created through the Azure Portal using the Marketplace. A quickstart on how to create this can be found here - [Quickstarts - Deploy Wordpress](https://learn.microsoft.com/en-us/azure/app-service/quickstart-wordpress)

This covers configuring [Xdebug](https://xdebug.org/) in situations where it's deemed that a profile is needed. Such as possibly a high CPU, high memory or a slowness scenario where a plugin or peice of vendor code is thought to be of issue.

For general PHP performance or profiling, review: [PHP performance: Profilers and debuggers for PHP applications on App Service Linux](https://azureossd.github.io/2023/07/06/PHP-performance-Profilers-and-debuggers-for-PHP-applications-on-App-Service-Linux/index.html)

You can use some tools like the below to isolate or possibly even find the problem before needing to enable a profiler:
- **Diagnose and Solve Problems** - This includes various site detectors for application crashes, logs (if enabled through Appp Service Logs), CPU, Memory, slowness, restarts, and others
- **Metrics** - This blade shows more real-time information as opposed to Diagnose and Solve - but is specific to Metrics, and not other lifecycle events like container crashes or stdout/err
- For WordPress specific cases, disabling plugins and/or reverting to a Wordress-basic theme, in case a custom theme is being used, can also be done - to rule issues out
    - The new Wordpress on App Service Linux experience includes a lot of performance enhancements out of the box, or, is configurable - however, this can be reviewed for a recap - [WordPress Best Practices for Performance](https://azureossd.github.io/2020/08/07/wordpress-best-practices-for-performance/index.html)

> **NOTE**: Although you can run your own custom images with Wordress, or, technically host Wordpress on PHP "Blessed Images" (not recommeded), this post here may not work 1:1 with said hosting set up, due to differences in images.

# Configure Xdebug
By default, Xdebug and it's shared library is already installed in the Wordpress on App Service marketplace image. However, it's associated `xdebug.ini` file under `/usr/local/etc/php/conf.d` is disabled:

```
53d2fc4f13fd:/usr/local/etc/php/conf.d# cat xdebug.ini 
;Default is turn off.
;zend_extension=/usr/local/lib/php/extensions/no-debug-non-zts-20180731/xdebug.so
;xdebug.remote_enable = on
;xdebug.profiler_output_dir = /home/xdebug
;xdebug.remote_autostart = off
```

Which, in production scenarios, you'd typically want profilers disabled.

If we look under the PHP extension directory (which as of writing this points to `/usr/local/lib/php/extensions/no-debug-non-zts-20220829`) we can confirm the shared library location:

```
3fe9bbcd50e6:/home# ls /usr/local/lib/php/extensions/no-debug-non-zts-20220829 | grep "xdebug"
xdebug.so
```

Since the library is there, let's configure it for our use:

1. Create a directory for our custom `.ini` file under something like `/home/ini` - run the command `mkdir /home/ini`
2. In `/home/ini`, create an `xdebug.ini` with the following content:

```
zend_extension=/usr/local/lib/php/extensions/no-debug-non-zts-20220829/xdebug.so
xdebug.remote_autostart=off
xdebug.output_dir=/home/LogFiles
xdebug.mode=profile
```

> **NOTE**: Make sure `zend_extension` points to the correct location. Double check this with `pear config-show` and look at the "PHP extension directory" value

3. Add an App Setting with a key of `PHP_INI_SCAN_DIR` and value of `/usr/local/etc/php/conf.d:/home/ini`

At this point, Xdebug should be set up to generate profiles

# Generate profiles
To generate a profile, navigate to whichever path is needing to be profiled and append `/?XDEBUG_PROFILE=1`. Such as `yoursite.azurewebsites.net/?XDEBUG_PROFILE=1`.

This will now generate a `cachegrind.out.*.gz` file under `/home/LogFiles`. 

```
4c6c9a0fa27f:/home/LogFiles# ls | grep "cachegrind"
cachegrind.out.248.gz
```

You can download these files through an FTP client, Kudu's /newui endpoint, or others. After downloaded, review [PHP performance: Profilers and debuggers for PHP applications on App Service Linux - Reviewing XDebug profiles](https://azureossd.github.io/2023/07/06/PHP-performance-Profilers-and-debuggers-for-PHP-applications-on-App-Service-Linux/index.html#reviewing-xdebug-profiles), ideally using the VSCode option or QcacheGrind.



