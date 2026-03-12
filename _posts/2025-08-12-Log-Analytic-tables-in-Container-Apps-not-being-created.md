---
title: "Log Analytic tables in Container Apps not being created"
author_name: "Anthony Salemo"
tags:
    - Container Apps
    - Availability
    - Configuration
categories:
    - Azure Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2025-08-12 12:00:00
---
This post will cover why you may see the message of "The name 'ContainerAppConsoleLogs_CL' does not refer to any known table, tabular variable or function."

# Overview
This post is specific to using **Log Analytics** as the environments [logging option](https://learn.microsoft.com/en-us/azure/container-apps/log-options?pivots=azure-portal#configure-logging-options).

When going to the **Logs** blade on Azure Container Apps to run queries against the tables for `ContainerAppConsoleLogs_CL` and/or `ContainerAppSystemLogs_CL`, you may see a message stating:
- `"The name 'ContainerAppConsoleLogs_CL' does not refer to any known table, tabular variable or function."`
- Or, `'table' operator: Failed to resolve table expression named 'ContainerAppConsoleLogs_CL'`


![Log Analytic tables missing with error](/media/2025/08/law-no-tables-1.png)

This is inferring these tables have not been created or don't exist. 

**Important**: This is distinctly different than if you queried this table and it simply returned no results - but with the main fact that it _is_ able to be seen as a created table. This should also appear on the left side under _Custom Tables_.
- A common reason is that there simply is no logs during the query execution timeframe
- Or, you're querying the wrong table - eg. `ContainerAppSystemLogs` (for Azure Monitor) when you should instead be using `ContainerAppSystemLogs_CL` (for Log Analytics)
- Or, your query has a clause that is not capturing the data you need. Amongst other reasons

The above errors may be commonly caused by the three following reasons below

# Limitations and reasons
## Private Link on Log Analytics
As called out in [Limitations](https://learn.microsoft.com/en-us/azure/container-apps/log-options?pivots=azure-portal#limitations), a Private Link is not supported on Log Analytics

_**Private link**: Sending logs directly to a Log Analytics Workspace through Private Link isn't supported. However, you can use Azure Monitor and send your logs to the same Log Analytics Workspace. This indirection is required to prevent system log data loss._

You can quickly check your workspace to see if a Private Link is enabled. Go to **Network isolation** > _Private access_. If a Private Link exists and this cannot be removed the only resolution is to use Azure Monitor as a Logging Option on the environment.

![Network isolation blade on Log Analytics](/media/2025/08/law-no-tables-2.png)

## "localAuth" disabled on Log Analytics
If `disableLocalAuth` is `true` for the workspace - logs will not be sent. A bit more information on this in Azure Monitor documentation can be found [here](https://learn.microsoft.com/en-us/previous-versions/azure/azure-monitor/logs/azure-ad-authentication-logs?tabs=azure-cli#disable-local-authentication-for-log-analytics-workspaces)


You can run the following command to see if this is disabled. If the property `disableLocalAuth` is appearing with `true`, then this needs to be set to false:

```
az monitor log-analytics workspace show --resource-group "some-rg" --workspace-name "someworkspace"
```

In short, "localAuth" needs to be enabled to sent logs to the Log Analytics Workspace.

## Workspace was deleted
If the Log Analytics workspace was accidentially deleted at some point after it was set as a Logging Option on the environment - an error can occur about missing tables.
