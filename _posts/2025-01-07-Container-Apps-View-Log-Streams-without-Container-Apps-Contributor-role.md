---
title: "Container Apps - View Log Streams without Container Apps Contributor role"
author_name: "Hao Guo"
tags:
    - Monitor
    - Diagnostics
    - Configuration
    - Log stream
    - Azure Container Apps
    - Container Apps Contributor role
categories:
    - Azure Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Diagnostics # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2025-01-07 12:00:00S
---


This blog post mainly covers how to check the console and system logs via log stream without a Container Apps Contributor role.


# Overview
While developing and troubleshooting your container app, it's essential to see the logs for your container app in real time. Azure Container Apps allow you to view the system logs and console logs in Log stream via Azure portal or Azure CLI. For more details, please check [here](https://learn.microsoft.com/en-us/azure/container-apps/log-streaming?tabs=bash).

Giving someone "Container Apps Contributor" role rights just to view the log stream can be cumbersome. However, users with RBAC role "ContainerApp Reader" can not view "Log Stream". In some cases, you may want to grant users access to the log stream without a "Container Apps Contributor" role. This post will go over how to do this.

## Use “Container Apps Operator”

While “Container Apps Contributor” allows Full management of Container Apps (including creation, deletion, and updates) and “ContainerApp Reader” only allow the view of all container app resource. Currently you can choose “Container Apps Operator” in Access control (IAM) -> Add role assignment page for your team member to Read, logstream and exec into Container Apps.

![Use “Container Apps Operator”](/media/2025/01/aca-view-logstream-without-contributor-role-1.png)

## Create a custom role

If you only need access to the log stream without a contributor role, you can also create a custom role and assign this role in Access control (IAM) page of Container App resource. Here is a detailed action plan for this, and you can also check the documentation [Create or update Azure custom roles using the Azure portal](https://learn.microsoft.com/en-us/azure/role-based-access-control/custom-roles-portal) for reference.

1. In the Azure portal, open a management group, subscription, or resource group where you want the custom role to be assignable and then open Access control (IAM). The following screenshot shows the Access control (IAM) page opened for a subscription.

   ![Create a custom role - step 1](/media/2025/01/aca-view-logstream-without-contributor-role-2.png)

2. In the "Create a custom role" page, configure the custom role name and baseline permissions.

3. Search for "Log" on the add permissions page, and select "Microsoft Apps".
   
   ![Create a custom role - step 3](/media/2025/01/aca-view-logstream-without-contributor-role-3.png)

4. Select all the permissions for “microsoft.app/containerapps” and “microsoft.app/managedenvironments”, and click “Add”. After adding the permissions, click on "Review + create" to create the custom role.
   
   ![Create a custom role - step 4](/media/2025/01/aca-view-logstream-without-contributor-role-4.png)

5. Please navigate to your Azure Container App resource page in Azure Portal and open Access control (IAM).  Add a role assignment using the custom role you created earlier and test if you can access the console logs in the log stream as expected.  


# More Information

In addition, if you would like to add a role to query console logs using the ContainerAppConsoleLogs_CL table in the Log Analytics workspace, you can try to add a role assignment with “Monitoring Reader” on the Log Analytics Workspace to view the logs.

Here are several documentations and resources for quick reference:

- [View log streams in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/log-streaming?tabs=bash)

- [Monitor logs in Azure Container Apps with Log Analytics](https://learn.microsoft.com/en-us/azure/container-apps/log-monitoring?tabs=bash)

- [Manage access to Log Analytics workspaces - Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/manage-access?tabs=portal)

