---
title: "Why you may see 'Failed to forward request' messages for your application on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Middleware
    - Proxy
    - Configuration
categories:
    - App Service Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Linux # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Configuration # Django, Spring Boot, CodeIgnitor, ExpressJS
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-04-05 12:00:00
---

This post will talk about the "Fail to forward request" messages for your application on App Service Linux - what it means, and why you may see it.

# Overview
The full message being discussed here is this one (the below is an example):

```
Failed to forward request to http://172.16.7.3:8080. Encountered a System.Threading.Tasks.TaskCanceledException exception after 300067.221ms with message: The operation was canceled.. Check application logs to verify the application is properly handling HTTP traffic.
```

> **NOTE**: The IP and port in your message may differ

This can be seen in a number of places, notably Log Stream, Application Logs (Diagnose and Solve detector), and in the log file with the syntax of `YYYY_MM_DD_machinename_easyauth_docker.log`.
This message will appear **only** when the `middleware` container is running. You can read more about the other types of platform containers [here - Why you may see Docker Containers that are not yours on App Service Linux](https://azureossd.github.io/2023/03/15/Why-you-may-see-Docker-Containers-that-are-not-yours-on-App-Service-Linux/index.html).

The "middleware" container will activate if any of these services are activated - all three of these services are ran through here:

- AutoHeal (Linux)
- CORS (Enabled through the portal **only**)
- EasyAuth (Authentication blade)

In your `docker.log`, you’ll see this running with the `_middleware` suffix - `myfakesite_2_abc12345_middleware`. This container will generate its own log with the naming scheme of `YYYY_MM_DD_machinename_easyauth_docker.log`

# Why does this appear?
As the message states, the `middleware` container was not able to forward the request to the application container successfully. This is usually the case due to an application issue/error. When the request is forwarded, if an error is encountered, the middleware logic will return this message indicating an issue has occurred to the client. 

In a typical flow when this middleware container is involved, it forwards the request much like a proxy to the application.

Most times, but not always - an error (in the form of stderr from the application) should be logged out to `default_docker.log` in addition to this.

An example of trying to reproduce this can be done like this - say we implement a `setTimeout()` to only return a response after 240 seconds. On Azure, idle HTTP requests time out at this mark - so this is mimicking an upstream response on this route for the application taking an extended amount of time to respond, or, never returning a response - which will give us a HTTP 504.

```javascript
setTimeout(() => console.log("Waiting for 240 seconds"), 240000);
```

We'll ultimate see the below, this example was viewing logs through Diagnose and Solve Problems -> Application Logs

![Middleware failure](/media/2023/04/azure-blog-middleware-1.png)

**A note about the IP and Port in the message**:

This IP and Port should be the IP and Port combination of the application container. A quick way to validate this is to SSH into the container, which will have the Container IP in the bottom left.

![Application Container IP ](/media/2023/04/azure-blog-middleware-2.png)

The port will be the port of the exposed port of the Docker Container. For Blessed Images, you can refer to this - [Default exposed ports of Azure App Service Linux Blessed Images](https://azureossd.github.io/2023/03/24/Default-exposed-ports-of-Azure-App-Service-Linux-Blessed-Images/index.html) - and correlate this with the stack that is being used.

For custom Docker Images, you would have to review which port is being exposed by your custom container.

> **NOTE**: For applications listening on port 80 - there will be no port in the URL. This is normal and expected

# Troubleshooting
If this occurs, review these points to narrow down the application error:

- Ensure application logging is enabled and reviewed. 
- Review for any dependencies on the route(s) being invoked as well as what logic is on these routes.
- Review the status code associated with errors around this time.
- Sometimes it's warranted to instrument better logging through code - or - through testing, to see if a better error surfaces by disabling the services being used (Autoheal, CORS, or EasyAuth) 

You can view logging in a few different ways:
- Diagnose and Solve Problems -> Application Logs (detector), and others
- Logstream
- Directly via the Kudu site and browsing Log Files (/home/LogFiles) - these can be downloaded as well
- Through an FTP client to view Log Files (/home/LogFiles)
- Application Insights or Log Analytic workspaces

Since this generally occurs due to an application-layer issue, some scenarios may be:
- Routes that invoke dependencies (external API's, databases, etc.) are timing out (like in our above example) and not returning a response within the 240 second limit
- There is a runtime error - such as bad syntax/bad request, invalid request for the application, or other general HTTP 500-related errors.
- The application is running high on memory or CPU - if this is affecting the host, this can have a variety of issues, one being where requests do not successfully complete, especially if expensive application logic is being invoked.

Given that two of these 3 services that make the middleware container run require configuration for your application - i.e, CORS (portal) and/or EasyAuth - it would be good to review settings. 

The built-in Authentication and Authorization documentation can be found [here](https://learn.microsoft.com/en-us/azure/app-service/overview-authentication-authorization.)