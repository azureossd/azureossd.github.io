---
title: "Gunicorn - '[CRITICAL] Worker Timeout' on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Linux
    - Configuration
    - Python
    - Troubleshooting
categories:
    - Python # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/assets/images/pylinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-07-01 12:00:00
---

This blog post will quickly cover a few scenarios where '[CRITICAL] WORKER TIMEOUT' may be encountered and why.

# Overview
This post applies to both App Service Linux using Python - since these images use [Gunicorn](https://docs.gunicorn.org/en/stable/), and, any custom image used on Web Apps for Containers that utilize Gunicorn for running the application.

The message seen is typically something like:

```
[74] [CRITICAL] WORKER TIMEOUT (pid:91)
```

This will typically be associated with a HTTP 500 response returned from Gunicorn. To a user, this may look like this:

![HTTP 500 from Gunicorn](/media/2024/07/gunicorn-crit-1.png)

In this case, [79] refers to the PID of the parent Gunicorn process. Gunicorn uses a master/child process model - where child processes handle incoming requests. Depending on the error, you can potentially determine the PID of the worker process that was terminated:

```
[2024-06-28 20:44:32 +0000] [74] [CRITICAL] WORKER TIMEOUT (pid:91)
2024-06-28T20:44:32.8354846Z [2024-06-28 20:44:32 +0000] [91] [ERROR] Error handling request /api/sleep
```

In this case, [91] refers to one of the child processes for Gunicorn. 74 is still the master process. These timeouts can come from any of the worker processes that are handling that failing request, at that time.

# Prerequisites
To see these errors, you need to have **App Service Logging** enabled. See [Enable application logging (Linux/Container)](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer)

After enabling this, application `stdout` / `stderr` will be written to `/home/LogFiles/xxxxx_default_docker.log`

If you're using a custom startup command with Gunicorn, you **need** to set `--access-logfile '-' --error-logfile '-'` in your Gunicorn startup command. This will write to `stdout/err` and be picked up by App Service - which subsequentially is written into `default_docker.log`

You can review the [Configuring Gunicorn worker classes and other general settings](https://azureossd.github.io/2023/01/27/Configuring-Gunicorn-worker-classes-and-other-general-settings/index.html#why-am-i-not-seeing-logging-with-custom-startup-commmands) for more information.

These logs can then be viewed in various ways:
- **Diagnose and Solve Problems** -> **Application Logs**
- **Logstream**
- **Kudu** -> `/home/LogFiles/`
- **FTP** -> `/home/LogFiles/`
- Azure CLI - [az webapp log tail](https://learn.microsoft.com/en-us/cli/azure/webapp/log?view=azure-cli-latest#az-webapp-log-tail)

# Potential reasons
Although this is covered in various other places in the Gunicorn and Python community, below are a few common reasons why this may happen.

## Missing or inappropriate --timeout
If you're using App Service Linux with Python - and **not** altering the startup command - then you'll be using a predefined (but overridable) startup command through Gunicorn that's called out [here](https://azureossd.github.io/2023/01/27/Configuring-Gunicorn-worker-classes-and-other-general-settings/index.html#sync), which is essentially `--timeout 600 --access-logfile '-' --error-logfile '-' -c /opt/startup/gunicorn.conf.py --chdir=/tmp/<RANDOM_GUID>" gunicorn <wsgi_file_location>:<wsgi_callable>`

Here, `--timeout` is already defined. What `timeout` does is explained in the [Gunicorn docs](https://docs.gunicorn.org/en/stable/settings.html#timeout), which is:

_Default: 30_

_Workers silent for more than this many seconds are killed and restarted._

_Value is a positive number or 0. Setting it to 0 has the effect of infinite timeouts by disabling timeouts for all workers entirely._

If you end up overriding this default command, and omit `timeout`, then you're now implicitly defaulting this back to 30 seconds. This is important to understand, since given that App Service is an HTTP PaaS based platform - if a request does not complete within the allocated `timeout` period (which is now 30 seconds if ommited), then the Gunicorn worker will be killed by the Gunicorn parent process. 

In this context, "workers silent" would equate to a long-running HTTP request (or longer running than what `timeout` is set to). This could be a slow response from something further upstream, slow logic execution, or resource contention.

Therefor, always ensure `--timeout` is set to an appropriate value. Additionally, regardless of the `timeout` value - App Service has an idle connection limit of 240 seconds - so, if a request does not complete by that time, the connection (and requests) will be terminated and cancelled irregardless of this setting.

**Troubleshooting**:
- If you still notice `[CRITICAL] WORKER TIMEOUT` even after extending `timeout`, review the below scenarios for other possible reasons
- If none of the below applies - then application logic needs to be reviewed - especially if there are any external dependencies that are involved with the request flow, as this may play into long running requests
- Testing this behavior locally, in a container (or locally in a Linux-based environment) with Gunicorn while pointing to any external dependencies that your application relies on to mimic the environment on App Service should also be done, when possible.

## Resource contention
**High CPU**:

High CPU, in itself, wouldn't cause workers to be killed due to `[CRITICAL] WORKER TIMEOUT` - but it can cause requests and application logic to execute slowly.

If a very high amount of CPU is seen, or, even what seems to be an increase in CPU due to intensive tasks like computation - this probably needs to be the main focus.

If `timeout` (explained above) is set to an appropriate value - a focus on application profiling while reproducing the issue should be done. This can be used as a reference: [Python Performance High CPU Using CProfile](https://azureossd.github.io/2023/05/15/Python-Preformance-High-CPU-CProfile/index.html)

> **NOTE**: A lot of what's described in [Container Apps: Profiling Python applications for performance issues](https://azureossd.github.io/2023/10/02/Container-Apps-Profiling-Python-applications-for-performance-issues/index.html) can also be used in terms of tooling

**High memory**:

High memory, compared to CPU, _can_ cause `[CRITICAL] WORKER TIMEOUT`. Assuming our application (eg. one or multiple gunicorn processes) is consuming high enough memory - `OOMKiller` (a Linux kernel concept) would kill these processes. 

Tooling, such as the **Diagnose and Solve Problems** -> **Memory Usage** blade - or APMs, like App Insights, New Relic, Dynatrace, or others - can help determine of an application process is consuming high memory.

This may surface like this:

```
[2024-06-28 20:45:22 +0000] [74] [CRITICAL] WORKER TIMEOUT (pid:92)
2024-06-28T20:445:22.8354846Z [2024-06-28 20:45:22 +0000] [92] [ERROR] Worker (pid:92) was sent SIGKILL! Perhaps out of memory?
```

However, there are times this is extremely misleading and not actually the cause. A good step is always to investigate this from a memory perspective - at least to see if there is high memory (a leak, or consistent, or a large enough spike) - but this can also simply occur due to what's described in the **Missing or inappropriate --timeout** section above.

If high memory isn't seen, investigate this from a `--timeout` usage and long running request perspective.

> **NOTE**: A lot of what's described in [Container Apps: Profiling Python applications for performance issues](https://azureossd.github.io/2023/10/02/Container-Apps-Profiling-Python-applications-for-performance-issues/index.html) can also be used in terms of tooling

## Long running requests
This is pretty much in the same vein as the **_Missing or inappropriate --timeout_** section above. 

Long running requests that a Gunicorn worker process is handling, which exceeds `timeout`, will cause this. This could be for almost an infinite number of reasons, but some examples may be:
- ML/AI-based applications - eg. computation on large sets that take minutes at a time (and may be CPU intensive too)
- Long running database queries
- Too much load on the application - SNAT port exhaustion, slow logic execution, higher resource consumption, etc.

Utilizing any of the profilers or APMs within [Container Apps: Profiling Python applications for performance issues](https://azureossd.github.io/2023/10/02/Container-Apps-Profiling-Python-applications-for-performance-issues/index.html) should be done to try and further pin point the issue. You can use the various metrics in the **Metrics** blade on App Service to use as a starting point for data such as incoming requests, duration, resource usage, and m ore.