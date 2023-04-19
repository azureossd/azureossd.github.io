---
title: "Troubleshooting 'Container didnt respond to HTTP pings on port, failing site start'"
author_name: "Anthony Salemo"
tags:
    - Azure App Service Linux
    - Compression
    - Configuration
    - Deployment
=categories:
    - Deployment    
    - How-To
    - Configuration
    - Docker
header:
    teaser: "/assets/images/azurelinux.png" 
toc: true
toc_sticky: true
date: 2023-04-18 12:00:00
---

This post will cover what it means when you see "Container didn't respond to HTTP pings on port, failing site start" and what may cause this.

# Overview
When troubleshooting an application that is failing to start - and combing through App Service logging, this is one of the first and maybe more common messages you may see. App Service on Linux (for both Blessed and Custom Docker Images) requires that the application container send back an HTTP response to the internal platform ping that is sent - which dictates that the container is started and in general, able to return a response. This platform ping is sent over HTTP to the root of the site.

This message indicates that the application container did not send back an HTTP response to the platform ping in the predetermined time. By default, this time is 230 seconds before it times out - in which case, the message `Container didnt respond to HTTP pings on port, failing site start` will be returned and the site will attempt to start the container again after some time.

## Prerequisites
By default, App Service Logs (which creates `default_docker.log` files) is not enabled. This `default_docker.log` contains application `stdout/stderr`. 

Only "Platform" logging is enabled by default, which is logged out to `docker.log`. The message in this post is only sent to `docker.log`. However, for most scenarios here, you **should** enable App Service Logs, as otherwise troubleshooting will be much more difficult or possibly impossible to determine the root cause.

You can enable [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) by following this. A few ways these can be viewed are listed below:
- Log Stream
- Retrieving logs directly from the [Kudu](https://github.com/Azure/app-service-linux-docs/blob/master/Things_You_Should_Know/things_you_should_know.md#you-can-discover-and-download-the-latest-docker-logs-using-kudu) site, or directly view/download via an FTP client
- Diagnose and Solve Problems -> **Application Logs** detector, **Container Crash** detector, or **Container Issues** detector
- Using an FTP client to browse logs under `/home/LogFiles`

# Scenarios
Note, the below scenarios are not particularly language or stack specific, as a lot of these scenarios can happen on any language or stack. This will cover some of the more common ones - and not intended to cover ever exact use case.

## Incorrect port values
This applies to both Blessed Images and Web Apps for Containers. 

**Blessed Images**:
- For Blessed Images, the Docker container used for the application stack you're deploying to has a certain default exposed port. This can be viewed [here - Default exposed ports of Azure App Service Linux Blessed Images](https://azureossd.github.io/2023/03/24/Default-exposed-ports-of-Azure-App-Service-Linux-Blessed-Images/index.html). If you're listening on a different port on your application server versus what's actually exposed when the container is ran, then the container will time out, as the request is not being forwarded to the application port as it's not properly listening on the exposed port. You can change this with the `PORT` App Setting, which is discussed in the linked post.

**Web Apps for Containers**:
- The port exposed by the Docker container when using WaFC is generally up to the user. This is either through the `WEBSITES_PORT` App Setting and/or the `EXPOSE` instruction in the Dockerfile. In most cases, the application _should_ be listening on the same port that's exposed by the container. If there is a mismatch here, the container will time out on startup.

For Blessed Images, you may also need to update the application code to listen on the `PORT` environment variable for easier usage in addition to the above.

For more information on these settings, read this - [Whats the different between PORT and WEBSITES_PORT](https://azureossd.github.io/2023/02/15/Whats-the-difference-between-PORT-and-WEBSITES_PORT/index.html)

## Binding to localhost
Applications deployed to App Service Linux should not be attempting to bind to `localhost` or `127.0.0.1`. This listening address is normally passed to what the Web/Application server should be listening on.

Any external requests trying to be made to the container will never get a response in this case - and in this case, platform pings will also not get a response, timing out the container. Applications should be listening on `0.0.0.0` instead.

## Long application startup routines and logic
Applications that have a very long startup time before an HTTP response is sent back may encounter this error described here. Some scenarios here are:
- Data transformation 
- Calling to external dependencies to grab data needed at startup
- Installation of packages or other runtime configuration
- etc.

If any of this causes the container to **not** start by 230 seconds, the container will time out. This can be extended with the App Setting `WEBSITES_CONTAINER_START_TIME_LIMIT` to a maximum of 1800 seconds. Most times, container timeouts are a sympton of issues **not** related to long startup times. However, if the application in question genuinely has longer startups, this setting can be a benefit.

## Development Servers
Certain frameworks or libraries allow the usage of locally running development servers. At times, these are deployed to applications on App Service Linux and WaFC. It is **not recommeded** to use these in production, and rather use the appropriate production server equivalent.

When using development servers for deployed applications, unsuprisingly, general slowness and slow startup times can be seen. Development servers are generally slow in these deployed environments, given the hot-reloading that usually comes with them, and recompiling on essentially any file system change, can introduced further latency. This can cause container timeouts by slow startup exceeding 230 seconds.

Furthermore, unless actually configured to do so - development servers bind to `localhost` / `127.0.0.1` addresses by default typically. Which will time the container out like in the [Binding to localhost](#binding-to-localhost) seciton.

In this case, it is best to **completely** avoid the use of trying to deploy an application with its development server. It is recommended to run these _only_ in your local environment. 

## Key Vault dependencies
Some applications call to Key Vault to retrieve secrets on startup. If this call fails (eg., application is an unauthorized caller on Key Vault) - then the value, such as a secret or connection string will not be retrieved.

Depending on the application logic, this may cause the container to time out on start up. 

Aside from reviewing application logs to check if the Key Vault call is logging out anything to stderr - review Access Restrictions and/or permissions for this application on the Key Vault, as well as any potential networking changes - if this scenario is encountered.

## Root route is not configured to return an HTTP response
In some scenarios, an application may actually not be developed to return an HTTP response on the root (`/`) path. Although rare, it is best to ensure an actual HTTP status code is returned. In some cases, fallback/catch-all logic is introduced for non-matching routes, on applications like API's - ensure that these catch-alls actually have logic to return some type of HTTP response.

## Missing Environment Variables
Some applications depend on environment variables for certain environments. On App Service, these are added via the **App Settings** functionality, which is essentially environment variables.

If the application requires these, but is not added - depending on the application logic, it can cause the container to time out.

## Incorrect startup commands
Applications that use certain startup commands depending on their environment may encounter this behavior. For instance, depending on the environment, a command meant to run against development resources rather than production-based ones may be used - which may bind to `localhost`, a different port, or local databases, instead - as explained above. 

Ensure the startup commands being used (if applicable) is correct.

## Installing packages on startup
This cause is slightly different than the [Long application startup routines and logic](#long-application-startup-routines-and-logic) section - as this is more specifically talking about the "[Startup Command](https://learn.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal#configure-general-settings)" option for **Blessed Images**.

This applies to installing either language/stack specific packages or Linux specific ones. Depending on the package size - and number of packages - this may introduce extended startup time in these scenarios, as downloading these packages will need to go out over the internet.

A more detailed example of this, which can also apply to all stacks on App Service Linux, can be found [here - Nodejs on App Service Linux and why to avoid installing packages in startup scripts](https://azureossd.github.io/2022/10/14/Nodejs-on-App-Service-Linux-and-why-to-avoiding-installing-packages-in-startup-scripts/index.html).

## High CPU or Memory
High CPU and/or Memory on the instances that these containers run on can contribute to container time outs on startup.

A common scenario for this is:
- After restarts, such as a manual restart, deployment, swaps, or others.
- After instance movement - which will start up all/any sites on this App Service Plan on the new instances

If for some reason process(es) started to consume a large amount of memory, and/or, spend a lot of time with CPU cycles, this can cause resource contention on the host. In this case, if this happened to coincide with an application restart or startup - the application may ultimately fail to site due to lack of memory or extreme CPU usage.

As this could either OOM kill the container, cause the container to be able to respond to HTTP requests, or cause Docker on these hosts to fail to start the container under this stress.

Some ways to validate if this is the case is to use:
- **Diagnose and Solve Problems** - and viewing some of the memory and/or CPU based detectors
- **Metrics blade** - which can break down resource usage per instance by using the "Splitting" option, if needed
- **Application Insights**

A possible mitigation or resolution would be to scale up the App Service Plan, if applicable - or, if this is a density issue - to split the App Service Plan. If it's determined that a specific application process is the offender, profiling and/or memory dumps may be worth while.

## Other scenarios
There may be other scenarios not covered here which can cause the container to time out - if that is the case, it's always key to have App Service Logs enabled and to review these appropriately. 