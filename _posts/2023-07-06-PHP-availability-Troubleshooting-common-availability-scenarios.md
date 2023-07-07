---
title: "PHP availability: Troubleshooting PHP availability scenarios"
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

This post will cover some common scenarios that may affect availability with your PHP applications. This post is intended for PHP App Service on Linux. This can apply to both PHP "Blessed" images and also custom Docker images using PHP.

# Prerequisites
**IMPORTANT:** Make sure App Service Logs are enabled first. You can then view logging in a few different ways:

- LogStream
- Retrieving logs directly from the Kudu site, or directly view/download via an FTP client
- Diagnose and Solve Problems -> Application Logs detector, Container Crash detector, or Container Issues 

If App Service Logs are not enabled, only `docker.log` files will be generated, which will not show application related stdout / stderr and will make troubleshooting issues more complicated. `default_docker.log` files are the files that show application stdout/err.

# Scenarios

## Maximum execution time
**Issue**:

`PHP Fatal error: Maximum execution time of 30 seconds exceeded in /<folder>/<file.php> on line <number>`

**Resolution**:

> **NOTE**: The default timeout for `max_execution_time` in PHP Blessed Images is 30 seconds

If this issue is seen, it can happen due to High CPU or reaching the limit of concurrent requests or long running scripts. You can increase `max_exection_time`, which is where this timeout is enforced from by overriding the default `php.ini`, however, it is heavily recommended to profile or understand the logic on why the application is taking longer than usual to return from script execution.

- You can review how to configure custom `.ini` files here - [Customize PHP .ini settings](https://learn.microsoft.com/en-us/azure/app-service/configure-language-php?pivots=platform-linux#customize-phpini-settings)
- For NGINX customization, which can potentially benefit request performance - see this post -[Modifying PHP-FPM settings](https://azureossd.github.io/2023/01/06/Modifiying-PHP-FPM-settings/index.html)
- For Apache customization, see this post - [PHP performance: AH00161: server reached MaxRequestWorkers setting](https://azureossd.github.io/2023/06/19/PHP-performance-AH00161-server-reached-MaxRequestWorker-setting/index.html)

**Custom Images**:
If a custom image is being used, you'd need to load in the relevant `.ini` files by copying them over in your `Dockerfile` or setting a `PHP_INI_SCAN_DIR` environment variable/App Setting and loading the relevant `.ini` files.

## Memory limits
**Issue**:

`PHP Fatal error: Allowed memory size of <number> bytes exhausted (tried to allocate <number> bytes) in /<folder>/<file.php> on line <number>`

**Resolution**:

> **NOTE**: The memory limit for `max_memory` in PHP Blessed Images is 128MB. 

If you are getting this error, you can increase this limit in code as followed: `ini_set('memory_limit', '1024M');` or overwriting `php.ini` with **`memory_limit=<number>M`**.

To disable the memory limit you can use `memory_limit=-1`. It is recommended to profile the application in order to detect and fix the memory leak.

- You can review how to profile with Xdebug from here - [Debugging PHP Applications on Azure App Services Linux/Containers using XDEBUG](https://azureossd.github.io/2020/05/05/debugging-php-application-on-azure-app-service-linux/index.html)
- You can navigate to the **Diagnose and Solve Problems** and view the following detectors to validate memory usage as well as runtime crashes in related to memory exhaustion:
  - Application Logs
  - Container Crash
  - Container Issues
  - Memory Usage
  - Linux Memory Drill Down

**Custom Images**:
If a custom image is being used, you'd need to load in the relevant `.ini` files by copying them over in your `Dockerfile` or setting a `PHP_INI_SCAN_DIR` environment variable/App Setting and loading the relevant `.ini` files.

## Too many connections to [database provider]
> **NOTE**: This concept may also apply to other database types such as PostgreSQL or SQL server

**Issue**:

`PHP Fatal error: Uncaught PDOException: SQLSTATE[HY000] [1040] Too many connections in`

Or

`PDOException: SQLSTATE[HY000] [2002] Only one usage of each socket address (protocol/network address/port) is normally permitted.`

**Resolution**:

- There is no real database connection pooling in PHP due to the nature of PHP. The best way to use database connections in php is to make a singleton instance of a database object so that the connection is reused within the context of your script execution.
  - Testing to make sure your application is actually using a singleton object should be done. This also can be implemented locally or on Azure while connecting to the remote database. Load testing should be done to validate connection usage.
  - Depending on the complexity of the application, it may be easy to accidentially create more than one connection per query. 
- On the database side, for example using managed Azure Databases (eg., MySQL, MariaDB, PostgreSQL, etc.) it is possible to view connection counts through the **Metrics** blade - as well as other performance statistics. Including the troubleshooters in **Diagnose and Solve Problems**
    - As a mitigation, it may be possible to scale up your database to handle more connections
- If there is a potential that a script is creating an excessive number of connections (due to a non-singleton client), review if **SNAT Port Exhaustion** is occurring. Although sometimes scaling out can help - in this case, scaling out may make the issue worse as it will multiply the number of connections to the database.
    - If the issue is not due to an improper database client instantiation - and rather due to organic request load. Do attempt scaling out to mitigate the issue. Or, scaling out and scaling up (if applicable).


Below is some additional public documentation on Azure managed database offering connection limits:
- [MySQL - Flexible Server - Service tiers, size, and server types](https://learn.microsoft.com/en-us/azure/mysql/flexible-server/concepts-service-tiers-storage#service-tiers-size-and-server-types)
- [Azure Database for PostreSQL - Flexible Server - Maximum Connections](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-limits#maximum-connections) 
- [Resource limits for single databases using the DTU purchasing model - Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/resource-limits-dtu-single-databases?view=azuresql)

Profiling the application with [Xdebug](https://azureossd.github.io/2020/05/05/debugging-php-application-on-azure-app-service-linux/index.html) while reproducing the issue can potentially tell if an object is being constantly recreated in script execution.

## White Page
**Issue**:

A white page is displayed when viewing a page on a PHP application.

**Resolution**:

This can occurs on PHP if code is crashing mid-execution. Review PHP error logs for any insights. Ensure [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) are enabled while reproducing the issue.

## Processes in D state
**Issue**:

Application processes are showing that they're n a `D` state.

**Resolution**:

- State "D" (uninterruptible sleep) means that the process is in kernel space (in a system call), attempting to perform IO. When `D` state occurs then the process is in uninterruptible sleep. This state is bad, because you can't do anything with the process while in `D` state.
- These processes will not respond to signals (or SIGKILL). When I/O completes the process will change state, you can check these processes using `ps axl | awk '$10 ~ /D/'` or with `top` command filtered by status.
- For these scenarios, review if the application is writing/reading many files to `/home` storage, CDN for static files or any cache implementation to reduce I/O operations can be attempted as a resolution.
  - If I/O is the main issue here with many file access attempts, or read/write scenarios, considering doing this outside of `/home` to avoid potential issues with waiting on I/O due to having to make calls through the mounted `/home` volume which is backed by a networked File Share.

If it is determined the I/O is the most likely contributor to this state - read this blog post which explains this scenario more in detail - [PHP performance: Disk I/O causing slow performance](https://azureossd.github.io/2023/07/06/PHP-performance-Disk-IO-causing-slow-performance/index.html)

> **NOTE**: "Blessed" images enable `/home` storage by default. Custom Images do _not_ enable `/home` storage by default, unless you explicitly enable `WEBSITES_ENABLE_APP_SERVICE_STORAGE` to `true`

## Container Doesn't Start
**Issue**:

A container (application) may not be able to start for a variety of reasons. Some of the most common ones, which are essentially language agnostic - can be found here:

- [Troubleshooting ‘Container didnt respond to HTTP pings on port, failing site start’](https://azureossd.github.io/2023/04/18/Troubleshooting-Container-didnt-respond-to-HTTP-pings-failing-to-start-site/index.html)

**Resolution**:
- Review Docker logs and PHP error logs to see if there are any exceptions. Review what is "noise" and what is actually relevant to a startup failure.
- If the container failed due to a startup timeout, and there is no obvious immediate indicator of an application issue - you can increase startup time by adding `WEBSITES_CONTAINER_START_TIME_LIMIT` with a higher value (max of `1800`). If this does not work, then this is likely due to other factors causing the container to start. Reviewing application logging, or, add **better** logging on startup and what is being invoked is key.
- Some PHP specific scenarios could be:
    - Pointing to a `localhost` database rather than a remote one.
    - Unable to connect to a remote database. Or, unable to connect to external dependencies
    - Application code errors, such as syntax errors
    - Missing packages after deployment - see [this](https://azureossd.github.io/2023/06/27/PHP-deployments-Troubleshooting-PHP-deployments-on-App-Service-Linux-with-Oryx/index.html) - or, missing shared libraries, such as what's described [here](https://azureossd.github.io/2023/06/14/PHP-Deployments-could-not-open-object-file-no-such-file-or-directory/index.html).
    - Trying to override Apache or NGINX (if using a Blessed Image), but the startup script/file process fails. See here.
etc.

For custom PHP Docker Images:
- Review if `WEBSITES_PORT` or `PORT` is being used and if it's the same port that the application (typically Apache or NGINX in a custom image) is configured to listen for connections on.
- For custom Docker images, validating if the application works locally can be a valid approach to rule out certain application issues.

**Diagnose and Solve Problems** can be used to help troubleshoot these issues, further - an example are some of the following detectors:
- Container Crash
- Container Issues
- Application Logs
- Web App Down
- Web App Restarted

The above is a mix of containers timing out on startup, exiting at startup, or exiting eventually at runtime. These three scenarios can be mostly troubleshot in the same way.

## Slow database connection setup or query execution
**Issue**:

Site performance is slower for database-centric applications, which may affect site availability

**Resolution**:

This can be one of the more immediate problems when migrating from an on-premise application, or, an application running on a PaaS Virtual Machine that is able to be managed.

Typically, the database the application is connecting to would be on the same machine as the application. Therefor, calls to the database are going to the other side of the machine.

On PaaS - this is not the case. Each call needs to go out and over the network to the database, to be returned to the application. At a minimum, there will be an increase in latency to some small degree typically.

If this issue is noticed, consider the following to rule out:
- Have the database and application reside in the same Azure region
- Use production SKU's for both the application (PHP - App Service on Linux, or, Web Apps for Containers)
- Review if these queries being executed are expensive or excessive, and/or can be optimized. **Diagnose and Solve Problems** can be used on the database side if using Azure managed databases for query troubleshooting.
- Consider enabling caching for database calls where possible - this can save time on expensive queries, and, in general, reduce the amount of over-the-network database calls that now need to be made:
    - Redis can be used for caches - [Redis documentation](https://developer.redis.com/develop/php/)
    - `Memcached` - [PHP documentation](https://www.php.net/manual/en/book.memcached.php)
    - phpfastcache - [Documentation](https://www.phpfastcache.com/) - This library can plug into many other cache drivers such as zend disk and memory cache, memcache, mongodb, and others

Other scenarios:
- There are certain drivers that may be known to have generally longer connection set up time, outside of the discussion points above.
- For example, the PDO driver and MySQL has had many community threads about connection times being slower due to DNS lookups when using FQDN's for the database, as opposed to just using the database IP
- In these cases, it may not be an issue so much with PaaS, as it is with the driver. Testing by connection over IP instead of FQDN can be done, if applicable.
    - Profilers or APM's, such as Blackfire, may help deduce this down to the driver implementation


## Internal Server Error (HTTP 500)
**Issue**:
Internal Server Error or HTTP 500's are seen

**Resolution**:

HTTP 500's are most commonly due to application-level exceptions or errors. These can occur due to any number of reasons. In these scenarios, it is imperative that App Service Logs were enabled - or - enabled while reproducing the issue. Sometimes, having to enable an equivalent debug mode for the application (or turning this on), is needed for additional information.  

The way to enable debug mode varies per framework:
- [Laravel - Configuration](https://laravel.com/docs/10.x/configuration#debug-mode)
- [Yii - Tool debugger](https://yii2-framework.readthedocs.io/en/stable/guide/tool-debugger/)
- [CakePHP - Debugging](https://book.cakephp.org/4/en/development/debugging.html)

Unless APM's are set up to help catch application exceptions - only the status code will show through telemetry, which is not helpful for understanding the issue further.

- In these scenarios, review [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) and check the `default_docker.log` file that's generated under `/home/LogFiles`
- Depending on the framework, and depending on if debug mode (if applicable) is turned off - the error may not appear in App Service Logs, even if enabled - but rather the framework specific logging location
    - This location may vary on the framework. For example, if using Laravel and debug mode is `false` - HTTP 500 related output may only show under the `storage/logs` directory
    - For example:
    ```
    [2023-07-06 22:56:58] local.ERROR: No application encryption key has been specified. {"exception":"[object] (Illuminate\\Encryption\\MissingAppKeyException(code: 0)
    ```


**Custom Images**:

In custom PHP Docker Image applications - if application `stdout`/`stderr` is _not_ appearing in `default_docker.log`, for example, due to debug mode disabled and logs being written to framework specific locations - you would need to either enable `/home` storage (`WEBSITES_ENABLE_APP_SERVICE_STORAGE` = `true`) as well as having [SSH enabled](https://azureossd.github.io/2022/04/27/2022-Enabling-SSH-on-Linux-Web-App-for-Containers/index.html) to move these files to `/home` to be able to download them. Or, use a method such as pushing these to an external storage account through [Bring Your Own Storage](https://learn.microsoft.com/en-us/azure/app-service/configure-connect-to-azure-storage?tabs=portal&pivots=container-linux).

**NOTE**: Both of those options will cause the container to restart, losing the framework log files previously.

## HTTP 502
Although this is not PHP specific, your PHP application may return HTTP 502's in some scenarios. Below are some more common reasons:
- Application logic is not executing within a predetermined amount of time. If the 502 is occurring before 240 seconds (which is Azure's HTTP request timeout limit), then this is likely being set in the application.
    - Review if this timeout is consistently showing numbers like 60 seconds, 120 seconds, 130 seconds, etc.
    - This can potentially be set by an SDK in use by the application, or a framework specific timeout
- Logic that invokes external dependencies can also be the case.
    - If an external dependency (such as a database or API) is slow, or, not returning a response in the predetermined amount of time set within the application - a HTTP 502 may show
    - This can be reviewed if the external dependency is an issue by profiling or debugging the logic within that execution context. Running `tcpping` to check response times to the dependency can be done. As well as running this locally (while pointing to the remote dependency) to check if this happens both locally and on Azure.
    - Review if this happens on specific routes, or pieces of logic being invoked
- Other scenarios, like high CPU, high memory, high I/O wait time, high load average, or others - can contribute to HTTP 502's.
    - You can use **Diagnose and Solve Problems** to rule this out, such as the following detectors:
        - Linux CPU Drill Down
        - Linux Memory Dill Down
        - HTTP Server Errors
        - Linux - Host I/O Wait %
        - Linux Load Average
        - Process Full List

**HTTP 504's**:

Troubleshooting HTTP 504's mostly follow this same logic. A major difference is that the upstream dependency may not have sent back a response by the time the 240 second request timeout limit was hit on Azure.

**HTTP 503's**:

HTTP 503's typically indicate the container/application has exited.

### APM (Application Performance Monitoring) tools
In these scenarios, using APM tools could be beneficial to trace these requests to external dependencies, below are some examples:

- **New Relic**: [https://newrelic.com/php](https://newrelic.com/php)
- **Retrace**: [https://stackify.com/retrace-apm-php/](https://stackify.com/retrace-apm-php/)
- **AppDynamics**: [https://docs.appdynamics.com/display/PRO45/PHP+Agent](https://docs.appdynamics.com/display/PRO45/PHP+Agent)
- **Dynatrace**: [https://www.dynatrace.com/technologies/php-monitoring/](https://www.dynatrace.com/technologies/php-monitoring/)
- **Instrumental**: [https://instrumentalapp.com/docs/php](https://instrumentalapp.com/docs/php)
- **BlackFire**: [https://www.blackfire.io/](https://www.blackfire.io/)
- **Tideways**: [https://tideways.com/](https://tideways.com/)

## Static content failing to download when using PHP and Apache
A user may normally see a HTTP 502 immediately, or, potentially a HTTP 400 (Bad Request) if a some other endpoint is infront of App Service.

See the blog post here - [Unable to download static content when using php images on Azure App Service - Linux](https://azureossd.github.io/2020/09/15/unable-to-download-static-content-php-on-azure-app-service-linux/index.html).

At this point in time, PHP "Blessed" images have the fix disabling `EnableMMap` and `EnableSendFile` usage - where this problem was closely associated with.
However, custom images with Apache installations typically do not seem to have either of these disabled. If you are running an application that uses a CIFS volume (which both [App Service BYOS](https://learn.microsoft.com/en-us/azure/app-service/configure-connect-to-azure-storage?tabs=portal&pivots=container-linux) and App Service persistent storage on Linux use), while also using a custom image with Apache (and typically PHP) in which content is served over those paths mounted with CIFS, and noticing this behavior - then follow the above blog post to disable `EnableMMap` and `EnableSendFile` in your custom image.

This problem does not seem to occur when using NGINX.

**Further reading**:

Further reading on this behavior and bug can be found in these threads:
- [Serverfault thread](https://serverfault.com/questions/1044724/apache2-sends-corrupt-responses-when-using-a-cifs-share#:~:text=The%20cifs-share%20is%20working%20normally%2C%20files%20are%20correct,file%20is%20downloaded%20and%20saved%20to%20the%20client.)
- [Tracked Ubuntu bug - Ubuntu bug reports](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=900821)
- [GitHub issue where it’s repro'd on Apache and NGINX - common theme is mmap()](https://github.com/nextcloud/server/issues/31361)
- [Apache EnableMMap - Directive](https://httpd.apache.org/docs/current/mod/core.html#enablemmap)

