---
title: "Container Apps - Referencing env vars through other environment variables"
author_name: "Anthony Salemo"
tags:
    - Configuration
    - Linux
    - Azure Container Apps
categories:
    - Azure Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-10-03 12:00:00
---

This post will quickly go over how to add environment variables to Azure Container Apps that reference other environment variables

# Overview

With Azure Container Apps, you can add environment variables that reference other environment variables you've created - you can also reference "pre-existing" environment variables (these are generally the Kubernetes-based ones injected into containers within a pod).

The syntax to do this is: `$(MY_REFERENCED_ENV_VAR)`

Casing doesn't matter, by the syntax of `$()` is what ultimately makes this work. Below is an example:

![Environment variables in containers](/media/2024/10/aca-env-var-ref-1.png)

We have the environment variables with their key/value pairs of:
- `ENV_VAR_A`: `firstvalue`
- `ENV_VAR_B`: `secondvalue`
- `ENV_VAR_CONCAT`: `$(ENV_VAR_A)`

If we go into _Console_ and run something like `env`, we can see this value expands appropriately:

![Expanded and concatenated env var](/media/2024/10/aca-env-var-ref-2.png)

You can do this with "pre-existing" environment variables too. This example uses `CONTAINER_APP_REVISION` as the value, which can we can see gets expanded:

![Prepopulated env var](/media/2024/10/aca-env-var-ref-3.png)

![Prepopulated and concatenated env var](/media/2024/10/aca-env-var-ref-4.png)

