---
title: "PHP performance: AH00161: server reached MaxRequestWorkers setting"
author_name: "Anthony Salemo"
tags:
    - PHP
    - Troubleshooting
    - Azure App Service on Linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Performance # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-06-19 12:00:00
---

This post will cover scenarios where "AH00161: server reached MaxRequestWorkers setting" is seen in application logs, typically under higher load.

# Prerequisites
**IMPORTANT:** Make sure App Service Logs are enabled first. You can then view logging in a few different ways:

- LogStream
- Retrieving logs directly from the Kudu site, or directly view/download via an FTP client
- Diagnose and Solve Problems -> Application Logs detector, Container Crash detector, or Container Issues 

If App Service Logs are not enabled, only `docker.log` files will be generated, which will not show application related stdout / stderr and will make troubleshooting issues more complicated. `default_docker.log` files are the files that show application stdout/err.

# Overview
This will appear for PHP 7.x Blessed images, PHP 8.x Blessed images with the `WEBSITES_DISABLE_FPM` App Setting, or custom Docker Images with Apache/HTTPD. Although this is fundamentally an Apache-related issue, this will most likely be seen alongside PHP applications.

The full message that would be seen is:

```
2023-06-19T20:53:21.550957282Z [Mon Jun 19 20:53:21.550799 2023] [mpm_prefork:error] [pid 48] AH00161: server reached MaxRequestWorkers setting, consider raising the MaxRequestWorkers setting
```

Apache (HTTPD server), by default, uses a "mpm prefork" method - which has a master and child processes, where child processes handle incoming requests. Each child process handles a request at a time. Further reading on prefork usage can be found [here](https://httpd.apache.org/docs/2.4/mod/prefork.html).

This file is located in `/etc/apache2/mods-enabled/mpm_prefork.conf `and looks like this:

```c
<IfModule mpm_prefork_module>
        StartServers                     5
        MinSpareServers           5
        MaxSpareServers          10
        MaxRequestWorkers         256
        MaxConnectionsPerChild   0
        ServerLimit   1000
</IfModule>
```

`MaxSpareServers` ([doc](https://httpd.apache.org/docs/2.4/mod/prefork.html#maxspareservers)) can be validated by running top on a site with no requests coming in.

```
48 root      30  10  247984  47936  36528 S   0.0   0.6   0:00.85 apache2                                                                                                                            
400 www-data  30  10  249892  42900  31184 S   0.0   0.5   0:00.01 apache2                                                                                                                            
401 www-data  30  10  249892  43296  31572 S   0.0   0.5   0:00.20 apache2                                                                                                                            
404 www-data  30  10  249892  43176  31460 S   0.0   0.5   0:00.01 apache2                                                                                                                            
405 www-data  30  10  249892  42456  30740 S   0.0   0.5   0:00.01 apache2                                                                                                                            
406 www-data  30  10  251988  43704  31856 S   0.0   0.5   0:00.07 apache2                                                                                                                            
407 www-data  30  10  249892  43248  31532 S   0.0   0.5   0:00.01 apache2                                                                                                                            
408 www-data  30  10  249892  42752  31036 S   0.0   0.5   0:00.01 apache2                                                                                                                            
409 www-data  30  10  251980  43764  31720 S   0.0   0.5   0:00.07 apache2                                                                                                                            
410 www-data  30  10  249892  42344  30628 S   0.0   0.5   0:00.01 apache2                                                                                                                            
412 www-data  30  10  249892  43272  31556 S   0.0   0.5   0:00.01 apache2
```

When a site now has a high volume of requests coming in, while running `top`, you can see a large amount of `www-data` user `apache2` processes created, in addition to the 10 "idle" processes. This is now related to `MaxRequestWorkers` - since "prefork" mode is used, this translates to `apache2` child processes being created to handle each request.

# Issue
When this is seen, there is a potential (but not always) for slowness. This means that there is the max of 256 child `apache2` processes spawned - and requests are currently queued for one of those processes to be freed from prior work.

In some scenarios, where requests themselves are slow - which can potentially keep an active usage of 256 `apache2` processes alive - there may be a [back-queue](https://httpd.apache.org/docs/2.4/mod/mpm_common.html#listenbacklog) of waiting requests. During this time, there may be an increase in Linux Load Average, with processes waiting on CPU time - CPU usage may ultimately increase as well.

## Scoping

You can use some of the following tools to correlate request load or resource contention:

- **Diagnose and Solve Problems**:
    - In detectors like **Linux CPU Drill Down** or **Linux Memory Drill Down**, there will typically always be a large number of processes as they're created to handle an incoming request. This detector can still be beneficial for investigation regardless.
    - Use the **Web App Slow** detector to correlate latency to request load.
        - You can use the **Metrics** blade and use the **Requests** metric breakdown to correlate request rate for a given time.
    - Review if there is any SNAT port exhaustion during this time - this can be viewed with the **SNAT Port Exhaustion** detector.
        - If external dependencies are responding slow, these may keep `apache2` child processes alive longer until the request is completed.
- **Instance count and contention**:
    - Review if your instance count is appropriate for the current traffic load
        - Additionally, depending on the logic being executed, review if the SKU size is appropriate as well
- Does this message occur during peak load times? Or does this occur with variable request spikes?

## Resolutions and mitigations:
If this occurs due to a spike in requests or organic traffic load, consider:

- Scaling out to handle the load. If request load is consistent at certain times, consider auto-scaling profiles.
    - Scaling up in addition to handle resource intensive tasks can possibly help as well
- Validate if there are external dependencies involved, if time is spent waiting on dependency work, or, there is an excess amount of open connections to these dependenies, this can keep child processes alive and causing a request queue
    - This is the same for application logic that takes an extended amount of time and does _not_ reach out to an external resource
- If both scaling out (and up) do not help, the `MaxRequestWorkers` directive can easily be changed via the **`APACHE_MAX_REQ_WORKERS`** App Setting.
    - Be aware of this change. Scaling out may initially make more sense as requests can more easily be distributed amongst instances. It is suggested to test after implementing as increasing this to a large value (1000) means there is the chance of hundreds more `apache2` child processes being spawned, which can utilize more memory and cpu on the machine. A secondary problem of more consistently higher memory/CPU usage may occur.
    - The `ServerLimit` directive is 1000 (by default), therefor, you can change `MaxRequestWorkers` up to 1000 without changing `ServerLimit`. If `MaxRequestWorkers` was to be changed over 1000, `ServerLimit` will need to be equal to it or greater. This can also be done via App Setting with **`APACHE_SERVER_LIMIT`**

> **NOTE**: An idea on how the `APACHE_MAX_REQ_WORKERS` and `APACHE_SERVER_LIMIT` App Settings work can be seen [here](https://github.com/Azure-App-Service/ImageBuilder/blob/85feaea25d6856d61db2b6f10fc6348dd6dee523/GenerateDockerFiles/php/apache/init_container.sh#L47)

If this issue is still prevalent after the above - and is occurring with a lower request rate, this may be an application performance issue. In that case, understanding the work being done per request, dependencies, framework(s) is required. Profiling the application while reproducing the issue would be a next step.

This post can be used to help enable Xdebug and profile the application while reproducing performance issues - [Debugging PHP Applications on Azure App Services Linux/Containers using XDEBUG](https://azureossd.github.io/2020/05/05/debugging-php-application-on-azure-app-service-linux/index.html)

# Custom Image
If a custom Docker Image is being used with Apache - the below could be used to override `mpm_prefork.conf`, as an example. Note that the location of the `mpm_prefork.conf` file may differ, such as under `/etc/apache2/mods-available/mpm_prefork.conf`, `/etc/httpd/mods-available/mpm_prefork.conf`, or others.

In our `mpm_prefork.conf` file, we're increasing `MaxRequestWorkers` to 3000 and adding a `ServerLimit` of 300.

```conf
# cat mpm_prefork.conf
# prefork MPM
# StartServers: number of server processes to start
# MinSpareServers: minimum number of server processes which are kept spare
# MaxSpareServers: maximum number of server processes which are kept spare
# MaxRequestWorkers: maximum number of server processes allowed to start
# MaxConnectionsPerChild: maximum number of requests a server process serves

<IfModule mpm_prefork_module>
        StartServers                     5
        MinSpareServers           5
        MaxSpareServers          10
        MaxRequestWorkers         300
        MaxConnectionsPerChild   0
        ServerLimit 1000
</IfModule>
```

Assuming our `mpm_prefork.conf` is under a directory named `apache` in our project, we copy it over to override the default `.conf` as seen below:

```Dockerfile
.. other instructions ..
COPY apache/mpm_prefork.conf /etc/apache2/mods-available/mpm_prefork.conf
.. other instructions ..
```

You can confirm this is copied and set by running `cat /path/to/apache/mods-enabled/mpm_prefork.conf` in the container. This should reflect what's in `mods-available` since `mods-enabled` is symlinked to `mods-available`.

```
# ls -lrta | grep "mpm_prefork.conf"
lrwxrwxrwx 1 root root   34 Jul  4 13:43 mpm_prefork.conf -> ../mods-available/mpm_prefork.conf
```