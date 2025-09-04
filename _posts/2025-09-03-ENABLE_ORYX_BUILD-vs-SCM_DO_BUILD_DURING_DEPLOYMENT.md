---
title: "ENABLE_ORYX_BUILD vs. SCM_DO_BUILD_DURING_DEPLOYMENT"
author_name: "Anthony Salemo"
tags:
    - App Service Linux
    - Oryx
    - Configuration
    - Deployment
categories:
    - Azure Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2025-09-03 12:00:00
---

This blog will talk about the environment variables ENABLE_ORYX_BUILD vs. SCM_DO_BUILD_DURING_DEPLOYMENT on App Service Linux and deployments.

# Overview
These environment variables can be added to App Service Linux "Blessed Images" with the Node, Python, PHP and Dotnet options - this does **not** apply to Java "Blessed" images. [Oryx](https://github.com/microsoft/Oryx) is the builder used to do logical building of application content and dependencies (think builders and buildpacks), which deploys the source code and its dependencies onto `/home/site/wwwroot`. Information on specific builder logic per language can be found at [Oryx - runtimes](https://github.com/microsoft/Oryx/tree/main/doc/runtimes)

> **NOTE**: Ruby doesn't apply since this has been long deprecated as an offering on App Service Linux

As shown [here](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md), the description is to avoid using the "legacy" builder system. However by this point in time, build systems should not be using any "legacy" builders when `SCM_DO_BUILD_DURING_DEPLOYMENT` is `true` aside from Oryx itself.

At times, users may use _both_ environment variables. **The TLDR is the following**:
- Only worry about using `SCM_DO_BUILD_DURING_DEPLOYMENT` if you want build automation. If this is `true`, it'll use Oryx to build your applications source and dependencies as explained above. Do _not_ worry about adding `ENABLE_ORYX_BUILD = true`
- If `SCM_DO_BUILD_DURING_DEPLOYMENT` is `false`, Oryx will _not_ be used. Therefor no build automation will be done - and if so, you need to deploy _all_ your site contents (including all required application dependencies/packages/etc.) since no build automation is done



# Matrix

| SCM_DO_BUILD_DURING_DEPLOYMENT | ENABLE_ORYX_BUILD | Language | Will Oryx run? |
| ------------------------------ | ----------------- | -------- | -------------- |
| true | true | Node | Yes |
| true | false | Node | No (through testing this is the one difference spotted between languages) |
| false | true | Node | No |
| false | false | Node | No |

| SCM_DO_BUILD_DURING_DEPLOYMENT | ENABLE_ORYX_BUILD | Language | Will Oryx run? |
| ------------------------------ | ----------------- | -------- | -------------- |
| true | true | Python | Yes |
| true | false | Python | Yes |
| false | true | Python | No |
| false | false | Python | No |

| SCM_DO_BUILD_DURING_DEPLOYMENT | ENABLE_ORYX_BUILD | Language | Will Oryx run? |
| ------------------------------ | ----------------- | -------- | -------------- |
| true | true | PHP | Yes |
| true | false | PHP | Yes |
| false | true | PHP | No |
| false | false | PHP | No |

| SCM_DO_BUILD_DURING_DEPLOYMENT | ENABLE_ORYX_BUILD | Language | Will Oryx run? |
| ------------------------------ | ----------------- | -------- | -------------- |
| true | true | Dotnet | Yes |
| true | false | Dotnet | Yes |
| false | true | Dotnet | No |
| false | false | Dotnet | No |
