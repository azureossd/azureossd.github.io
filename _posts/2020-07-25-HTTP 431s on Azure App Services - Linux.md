---
title: "HTTP 431s on Azure App Services - Linux"
author_name: "Anand Anthony Francis"
tags:
    - HTTP 431
    - App Service Linux
    - Request Header Fields Too large
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Diagnostics # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
---

## About

This blog quickly describes about the status code **HTTP 431** and how we can address it on Azure App Services - Linux

## Why?

For Applications that run on Azure App Services - Linux platform with Authentication (Easy Auth) enabled, an additional container is spawned up. All the requests to the App Service and from the App Service back to the client pass through this middleware container, which basically authenticates the requests and adds certain headers to the request that might cause specific Application Stacks to return a response to the request with the status code - 431 *Request Header Fields Too Large*.

A common example is a Node Application returning this status code for a request when easy auth is enabled for the Azure App Service. The max header size for Node till Nodejs 12 was 8 KB and generally the total header size after enabling auth increases beyond the maximum size.

## Quick Fix

The most quickest way to address this behavior is to add the following App Setting to our concerned App Service

| Key | Value |
|----|----|
|WEBSITE_AUTH_DISABLE_IDENTITY_FLOW|true|

The Application setting basically removes the identity header which is a significantly large header and decrease the overall size of the headers for the requests. More information about this App Setting is mentioned in this [article](https://github.com/cgillum/easyauth/wiki/Advanced-Application-Settings)


Hope this helps to address similar issues.