---
title: "Container Apps - Binding to ports under 1024"
author_name: "Anthony Salemo"
tags:
    - Linux
    - Configuration
    - Container Apps
    - Troubleshooting
categories:
    - Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azure-containerapps-logo-1.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-06-10 12:00:00
---

This post will discuss binding to ports under 1024 for your application to listen on

# Overview
This post will discuss binding to ports under 1024 for your application to listen on.

There is a fairly well known notion on Linux that binding to ports under `1024` require root access, certain "capabilities" (`eg., CAP_NET_BIND_SERVICE`), or something like setting `net.ipv4.ip_unprivileged_port_start = 0` on a host machine. Since Container Apps inheritly only supports Linux-based containers, this same concept applies here.

However, the above **cannot** be done since Container Apps being a PaaS - does not grant that kind of priviledged access. If you encounter this issue with port binding, it's typically because of a mix of the following:

- Running as a non-root `USER` in your container. Which is set in your `Dockerfile` or container image.
- Attempting to bind to a port under 1024 while running as this non-root user.

If this happens, the application will exit - since it can't listen on the specified address:port. This will also manifest as an HTTP 502 or 503 to clients as the container in the pod will fail to start. 

In application logs, you can see the full error. If you're using Log Analytics, use the `ContainerAppConsoleLogs_CL` table - for Azure Monitor, use `ContainerAppConsoleLogs`, you can use Log Stream or the Azure CLI as well.

Using the above tables or log viewing measures, you'd see an error like the below, which depends on your application stack:
- `error: listen EACCES: permission denied 0.0.0.0:80` (Node.js-based)
- `nginx: [emerg] bind() to 0.0.0.0:80 failed (13: permission denied)` (from NGINX)
- `Caused by: java.lang.Exception: Socket bind failed: [13] [Permission denied]` (Java)
- `failed to listen: listen tcp4 :80: bind: permission denied` (Go)
- `[ERROR] Can't connect to ('0.0.0.0', 80)` (Gunicorn)
- etc.

The common theme being `permission denied` when trying to listen on the specified port.

> **NOTE**: Another port binding failure is `address in use`, which is for a different reason. See [Address or port in use](https://azureossd.github.io/2024/03/06/Container-Apps-Using-multi-containers-in-a-pod/index.html#address-or-port-in-use)

# Resolution
To resolve this, you can do either of the two options:

1. If wanting to still use a non-root `USER`  - simply listen to a port higher than `1024`. Ensure to update your application listening port _and_ the **Ingress** option on Container Apps for your application (if using Ingress)
2. Or, if wanting to bind to a port under `1024` - change the user to `root` - . In most cases, not having a `USER` instruction would implicitly set this to `root`. However, this depends on the image used - you may need to explicitly set and/or add a `root` `USER`

As a best practice, ensure to test these user changes locally.




