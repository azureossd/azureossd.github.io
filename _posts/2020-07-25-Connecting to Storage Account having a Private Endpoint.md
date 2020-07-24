---
title: "Access an Azure Storage Account having a Private endpoint via an App Service"
author_name: "Anand Anthony Francis"
tags:
    - App Service - Linux
    - Storage Account 
    - Private Endpoint
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Python # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
---

## About

This blob would be of help in case we are trying to access and write to blobs in an Azure Storage account from a Python Application on App Service on Linux, specifically when the Storage Account is configured with a Private Endpoint. The respective App Service leverages Swift Integration to connect with the same VNET as the Storage Account. 

## Steps

1. Enable Private endpoint for the respective Azure Storage account, details for which are mentioned in [this](https://docs.microsoft.com/en-us/azure/storage/common/storage-private-endpoints) article.
2. A [sample Python](https://github.com/Azure/azure-sdk-for-python/tree/master/sdk/storage/azure-storage-blob/samples) application using Azure Storage SDK can be deployed to an App Service.
3. Integrate the App Service to subnet within the same VNET that the Storage Account would be using for it's private endpoint (private IP). Steps for configuring VNET are mentioned [here](https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet).
4. Now, once the App Service and the Storage account are configured to the same VNET, we have to do an additional step of Adding the following App Settings to the App Service.

| Key | Value |
|----|----|
|WEBSITE_DNS_SERVER|168.63.129.16|
|WEBSITE_VNET_ROUTE_ALL|1|

If the above settings are not added for the App Service, we can see the following error - **This request is not authorized to perform this operation.**

![Request not authorized](/media/2020/07/anfranci-requestnotauth.jpg)

```Note
Please take into consideration that the way an App Service would communicate with a Storage Account configured with Service Endpoint is different than how it would work with Private Endpoints. The difference between Service and Private endpoints is given in this [article](https://docs.microsoft.com/en-us/azure/private-link/private-link-faq#what-is-the-difference-between-a-service-endpoints-and-a-private-endpoints)
```

Hope the above information helps in connecting an App Service to an Azure Storage account configured with a Private Endpoint.
