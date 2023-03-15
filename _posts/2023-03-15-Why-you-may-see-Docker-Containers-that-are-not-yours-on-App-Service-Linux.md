---
title: "Why you may see Docker Containers that are not yours on App Service Linux"
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

This post will explain why you may see other Docker Containers showing up in your logging when using App Service Linux or Linux Web Apps for Containers.

# Overview
When creating an application on either App Service Linux or Linux Web App for Containers, you would expect to see logging from just your container.

Starting off, in a very basic scenario, this is usually the case. But as you enable more Azure services on your application there is a chance you may see up to two (2) more containers found in your logging.

You can view this in various locations:
- Logstream
- Diagnose and Solve Problems -> Application Logs (detector)
- Viewing logs through FTP
- Viewing logs directly on the Kudu site

You may see a mix of logging in either `docker.log` or `default_docker.log` from these containers, as well as in their own respective log files.

Compared to Windows App Service - these services run as Docker Containers along side your application.


# Containers
## Middleware Container
The "middleware" container will activate if any of these services are activated:
- AutoHeal (Linux)
- CORS (Enabled through the portal **only**)
- EasyAuth (Authentication blade)

In your `docker.log`, you'll see this running with the `_middleware` suffix - `myfakesite_2_abc12345_middleware`.
This container will generate its own log with the naming scheme of `YYYY_MM_DD_machinename_easyauth_docker.log`

Most output of this will only be on startup, however, depending on where you're viewing logging - it can interweave with your application stdout (such as streaming logs) - in this case, viewing your applications logs directly can reduce extra noise.

Startup logging from this container looks like the following (and can be found in the above log):

```
2023-03-15T21:46:22.052079080Z Updating certificates in /etc/ssl/certs...
2023-03-15T21:46:25.170991072Z 7 added, 0 removed; done.
2023-03-15T21:46:25.176722062Z Running hooks in /etc/ca-certificates/update.d...
2023-03-15T21:46:25.177469243Z done.
2023-03-15T21:46:25.187385847Z Updated CA certificates
```

**NOTE**: If you enable CORS through application code, this will **not** spin up this middleware container. The CORS option in the Azure Portal will only spin up this container if it is actually enabled through there.

## MSI Container
The "msiProxy" container will activate if Managed Identity (user, or system assigned) is enabled. This can be enabled through the **Identity** blade in the Azure App Service Portal.

In your `docker.log`, you'll see this running with the `_msiProxy` suffix - `myfakesite_2_abc12345_msiProxy`.
As explained in the middleware section, logging here can interweave with your application stdout - review your application logging separate (such as through its own log 
file, if needed). 

Startup and general stdout from this container would look like the following and can be viewed in the `YYYY_MM_DD_machinename_msi_docker.log` that is automatically created when this container is started:

```
2023-03-15T21:46:18.825803194Z Hosting environment: Production
2023-03-15T21:46:18.831961567Z Content root path: /app
2023-03-15T21:46:18.832871878Z Now listening on: http://[::]:8081
2023-03-15T21:46:19.147393005Z ansalemo-wafc-disk-space-test : [87400098-aada-45a1-8eab-42b17d08e7f1] Incoming request on /healthcheck?api-version=2021-08-01
2023-03-15T21:46:19.155189998Z ansalemo-wafc-disk-space-test : [87400098-aada-45a1-8eab-42b17d08e7f1] Request to TokenService: Endpoint 172.16.1.5:8081, Port 8081, Path /healthcheck, Query ?api-version=2021-08-01, Method GET, UserAgent HealthCheck/1.0
2023-03-15T21:46:19.417182701Z ansalemo-wafc-disk-space-test : [87400098-aada-45a1-8eab-42b17d08e7f1] Returning response for Site , Endpoint 172.16.1.5:8081, Port 8081, Path /healthcheck, Method GET, Result = 200
2023-03-15T21:46:22.313836833Z ansalemo-wafc-disk-space-test : [db040408-542a-489f-8db4-1146b1493527] Incoming request on /robots933456.txt
2023-03-15T21:46:22.314948029Z ansalemo-wafc-disk-space-test : [db040408-542a-489f-8db4-1146b1493527] Request to TokenService: Endpoint 172.16.1.5:8081, Port 8081, Path /robots933456.txt, Query , Method GET, UserAgent HealthCheck/1.0
```

# Takeaways
- Enabling the above services can cause the `middleware` container or `msiProxy` container to start.
- Ensure you're actually looking at the correct container name when troubleshooting. If glancing over or moving too fast through logging, you may mistake your application container for the wrong container, which can cause confusion.
- This is especially true if trying to validate `docker run` commands. Make sure you're looking at your own containers logging.
- All services run through the respective container explained above - enabling all 3 services that start up the middleware container, for example, will **not** create 3 middleware containers. There will just be one (1), regardless of just three services you have enabled. 