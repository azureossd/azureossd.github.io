---
title: "Troubleshooting failed slot swaps on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Docker
    - Configuration
    - Troubleshooting
categories:
    - Docker
    - Troubleshooting 
header:
    teaser: /assets/images/azurelinux.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-03-15 12:00:00
---

This post will cover troubleshooting scenarios for failed slot swapping on App Service Linux. This normally surfaces as 'Cannot swap site slots for site 'somesite' because the 'staging' slot did not respond to http ping.'. This post applies to both Web Apps on Linux and Web Apps for Containers (Linux).

# Overview
Making use of staging slots is a good best practice - this avoids directly deploying to production. You can additionally validate these changes pushed to your staging slot prior to initiating the swap - further information on setting up staging slots can be found [here](https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots).

However, when a swap fails - it may appear as `Cannot swap site slots for site 'somesite' because the 'staging' slot did not respond to http ping.` - which may be a bit cryptic.

The UI in which it can be seen will vary on deployment method, but will generally look like the below - which is from GitHub Actions

![GitHub Actions failure](/media/2023/03/azure-blog-oss-swap-slots-1.png)

## Prerequisites
**IMPORTANT**: Ensure that App Service Logs are enabled. Click [here](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) on how to enble this. Otherwise, you'll only be seeing one of two error messages generally:
- `cannot swap slots for site because the slot did not respond to http ping`
- `container couldn't be started`

If this is an application issue, you won't be able to see further information without enabling this.

After enabling application logging, you can view this output in a few places:
- Diagnose and Solve Problems -> Application Logs (detector)
- Logstream
- Directly via the Kudu site and browsing Log Files (/home/LogFiles) - these can be downloaded as well
- Through an FTP client to view Log Files (/home/LogFiles)
- etc.

## What's needed for a swap to succeed?
To understand what it takes to succeed a swap, we need to understand how a container is determined as healthy and started.

- A container needs to respond to an HTTP request on root. There is a warm-up ping done by the platform on startup to determine if it's successfully able to respond to a request. The root path ping is done by the platform - this is a sort of "health check".
    - A container that exits/crashes, times out or just never responds to an HTTP request on startup is not deemed successful

> **NOTE**: This is not the same health check as described [here](https://learn.microsoft.com/en-us/azure/app-service/monitor-instances-health-check?tabs=dotnet).


Given this general criteria is met, the container would be able to be ran by the platform. 

This approach on checking the container health is done when swapping slots - the slots and their containers must be in a healthy state and able to return a HTTP response to the platform pings during this operation. Otherwise, it will be deemed a failure

## Common scenarios
Any of the below scenarios can cause a swap to fail and return `cannot swap slots for site because the slot did not respond to http ping`.

### Appliation code issues
Application code issues can be a top reason of swap failures. It is important that **App Service Logs** are enabled to the reason for failure. View these logs on the slot that is failing to respond to HTTP pings.

- Navigate by going to the slot through the **Deployment slots blade**

    ![Deployment Slots](/media/2023/03/azure-blog-oss-swap-slots-2.png)

- And then select the slot in question. Use any of the above methods for viewing logs in the [prerequisites](#prerequisites) section.

    ![Deployment Slots UI](/media/2023/03/azure-blog-oss-swap-slots-3.png)


Reasons for code issues can be unlimited, but a few top scenarios are:
- Unhandled/Uncaught exceptions
- Calls to external dependencies failing
- Missing files
- Missing dependencies or dependency issues
- Syntax errors
- Binding to localhost instead of 0.0.0.0, or listening on an incorrect port
- etc.

If any of these errors or exceptions occur on the slot(s) being deployed to, which cause the application to exit (eg., exit code 1 for instance) and thus the container to exit, the swap will fail.

### Resource contention
A swap may fail due to extreme resource usage on the App Service Plan. This may manifest in the form of either high CPU or memory, or both. Under high load, applications may not be able to respond to HTTP requests - which in turn can cause the swap to fail.

In normal situations, there may be a slight increase in CPU or memory usage when a swap occurs. Due to the fact that both containers will need to be restarted, along with the various lifecycle events that an application may have on startup. 

However, if applications have intense CPU bound tasks on startup and/or memory intensive tasks, this can compound this affect. This can ultimately cause the container to crash or the swap to fail due to this. 

If this is the case, a few points can be validated for troubleshooting:
- Is this a high-density App Service Plan? Are multiple sites being ran on it?
    - If this is an highly dense App Service Plan with many sites on it, it may be good to split this up, especially if each application on it consumes a decent percentage of overall CPU or Memory usage. Since an App Service Plan is the equivalent of a Virtual Machine, each app's resource usage running on said plan would be added up towards part of the overall usage.
- If this is not a high-density application, does this application have lifecycle events on startup that is invoked?
    - Examples of, calling to dependencies, processing data, file transformations, etc.

In the Azure Portal under the **Diagnose and Solve Problems** blade, there are a few detectors that exist for troubleshooting CPU and Memory:
- **CPU**:
    - CPU Drill Down
    - Linux CPU Drill Down

- **Memory**:
    - Memory Usage
    - Linux Memory Drill Down

In the **Metrics** blade, there are additional Metrics that may help towards this. You can additionally instrument your application with APM's for better observability towards this as well.

If it's ultimately deduced that the application in question is consuming high CPU or memory on startup - a profiler or memory dump while reproducing may help drill down to the problem.

### Misconfiguration
Another potential reason for failure is general misconfiguration. A scenario for this could be if an App Setting is accidentally made a Deployment Slot Setting (or not made one), which can cause the application to have unexpected behavior if your code doesn't expect the value in that variable.

Or, relying on a setting that isn't allowed to be swapped.

To review which settings are and aren't swapped - view the [Set up staging environments - Which Settings are swapped](https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots#which-settings-are-swapped) documentation.

**NOTE**: For Web App for Containers, ensure your port settings are correct between slots - as this can potentially cause container timeouts if this is mismatched between what port you're exposing and what the application is actually listening on - review [Whats the difference between PORT and WEBSITES_PORT](https://azureossd.github.io/2023/02/15/Whats-the-difference-between-PORT-and-WEBSITES_PORT/index.html) for more information
