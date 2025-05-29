---
title: "Troubleshooting Azure AI Foundry deployments on Azure App Service"
author_name: "Christopher Maldonado"
tags:
    - azure ai foundry
    - azure app service
    - chat bot
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Azure AI Foundry
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/ai-foundry.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2025-05-29 12:00:00 # Ensure date and filename date match (ie. date: 2025-05-01 12:00:00 and filename: 2025-05-01-your-article-title.md)
---

## Troubleshooting Azure AI Foundry deployments on Azure App Service

This article will help you troubleshoot the deployment of Azure AI Foundry on Azure App Service. The following steps will help you identify and resolve common issues that may arise during the deployment process.

The following will be prerequisites for this article:
- [Quickstart: Get started with Azure AI Foundry](https://learn.microsoft.com/en-us/azure/ai-foundry/quickstarts/get-started-code?tabs=azure-ai-foundry&pivots=fdp-project)
- [Tutorial: Deploy an enterprise chat web app](https://learn.microsoft.com/en-us/azure/ai-foundry/tutorials/deploy-chat-web-app)

## Common Issues

The most common solution for most issues has been to deploy the application in a different region. If you are deploying in the East US region, try deploying in West US or East US 2.

### Deployment Failure - Azure App Service

```
Repository 'UpdateSiteSourceControl' operation failed with System.TimeoutException: Operation POST https://waws-prod-sn1-203.api.azurewebsites.windows.net/api/settings exceeded 100000ms timeout!
```

This error indicates that the deployment of the Azure App Service failed due to a timeout. To resolve this issue, you can try the following steps:

1. **Check the Azure Status Page**: Visit the [Azure Status Page](https://status.azure.com/en-us/status) to check if there are any ongoing issues in the region where you are deploying the app service.
2. **Change the Region**: If you are deploying in the East US region, try deploying in West US or East US 2. This can help avoid issues related to high demand or outages in specific regions.
3. **Retry the Deployment**: After changing the region, retry the deployment process to see if the issue is resolved.
4. **Check Resource Quotas**: Ensure that you have not exceeded your resource quotas in the selected region. You can check your quotas in the Azure portal under "Subscriptions" > "Usage + quotas".
5. **Check App Service Plan**: Ensure that the App Service Plan you are using is not in a stopped state. If it is, start the App Service Plan and retry the deployment.

### Deployment Failure - Azure Cosmos DB

```
Database account creation failed.
Error : Message: {
    "code":"ServiceUnavailable",
    "message": "Sorry, we are currently experiencing high demand in South Central US region, and cannot fulfill your request at this time Wed, 21 May 2025 00:00:00 GMT. To request region access for your subscription, please follow this link https://aka.ms/cosmosdbquota for more details on how to create a region access request. ActivityId: 00000000-0000-0000-0000-000000000000, Microsoft.Azure.Documents.Common/2.14.0"
    },
...
```

This error indicates that the Azure Cosmos DB account creation failed due to high demand in the South Central US region. To resolve this issue, you can try the following steps:
1. **Change the Region**: If you are deploying in the South Central US region, try deploying in a different region such as East US or West US. This can help avoid high demand issues in specific regions.
2. **Request Region Access**: If you need to deploy in the South Central US region, you can request region access for your subscription by following the link provided in the error message: [Request Region Access](https://aka.ms/cosmosdbquota).
3. **Retry the Deployment**: After changing the region or requesting access, retry the deployment process to see if the issue is resolved.


### Permission Issues

When deploying from Azure AI Foundry, you may encounter permission issues if the managed identites are not configured correctly. You may see an error like the following:

```
'There was an error generating a response. Chat history can't be saved at this time. Error code: 400 - {'error': {'requestid': '00000000-0000-0000-0000-000000000000', 'code': 400, 'message': 'Failed to get managed identity token. Response: {'error':{'code':'ManagedIdentityIsNotEnabled','message':'Managed Identity (MI) is not set for this account while the encryption key source is \\'Microsoft.KeyVault\\', customer managed storage or Network Security Perimeter is used.'}}'}}'
```

It is important to follow the steps in the [Tutorial: Deploy an enterprise chat web app](https://learn.microsoft.com/en-us/azure/ai-foundry/tutorials/deploy-chat-web-app#configure-resources) to ensure that the managed identities are configured correctly.