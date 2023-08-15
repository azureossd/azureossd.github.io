---
title: "Deploying Go applications to App Service Linux with Azure DevOps pipelines"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Configuration
    - Azure App Service on Linux
    - Azure App Service on Windows
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Deployment # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/App-Services.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-08-14 12:00:00
---

This post will cover troubleshooting HTTP 409 issues when doing to Azure App Service.

# Overview
HTTP 409's may occur from various deployment methods when deploying code to Azure App Service.

Typically, these messages may look like this (depending on your deployment method, the output may vary):

```
error: RPC failed; HTTP 409 curl 22 The requested URL returned error: 409
send-pack: unexpected disconnect while reading sideband packet
fatal: the remote end hung up unexpectedly
```

This will cause a deployment failure.

# Why does it happen
HTTP 409's (Conflict) during deployments can happen for a few reasons. Some reasons. are below

## Cancelling deployments
Initiating a deployment, cancelling it, and then trying to redeploy very shortly after (such as, a seconds or so)
    - This will likely cause a 409 as when deployment is started - locks are generated to avoid concurrent access on source files being updated/pushed. 
    - A deployment still may be finishing up after being cancelled during this period

### Resolution
To avoid this problem - wait a longer time in between deployments, especially if cancelling them. A minute (to a few minutes) can potentially help avoid this.


## Parallel deployments
This is a lot more common in CI/CD scenarios, such as Azure DevOps, GitHub Actions, or other CI/CD tooling that lets you have multiple runs at once.

If you are kicking off two different pipelines to the same resource at the same time - where both are deploying to Kudu (.scm. hostname), typically only one will succeed while the other will return a HTTP 409

### Resolution
Ensure the CI/CD set up is not kicking off multiple releases/deployments at one to one application. Use only one release at a time.

This can be determined through the CI/CD provider UI (if it's offerred) to review if multiple runs are occurring at once.

For example, in Azure DevOps - we can see two pipelines running only a few seconds apart. Both of these are deploying to the same application.

![Pipeline runs](/media/2023/08/deploy-409-1.png)

Eventually, one will fail, while the other continues:

![Pipeline runs](/media/2023/08/deploy-409-2.png)

Ultimately failing with an HTTP 409:

![Pipeline runs](/media/2023/08/deploy-409-3.png)

## Pending deployment
Although rare, there may be a scenario where a deployment is cancelled, or, unexpectedly, all deployments start returning HTTP 409s.

If multiple deployment methods were attempted, and all return a 409 - then this is likely a sign of a deployment that is remaining in a "pending state". This may cause locks to still exit to prevent concurrent access to files. 

### Resolution
Two quick potential mitigations can be tried first:
- Restart the application
- Scale (up or down) the App Service Plan to allocate the site(s) to a new instance
    - > NOTE: This will cause all sites to restart, so be aware if you have a dense App Service Plan

If the above doesn't work. You can do the following:
- On App Service Linux use the SSH or the "Bash" option, as in this case, we just need to access `/home` (or on Windows, through the Kudu Console)
- Navigate to `/home/site/locks`, delete `status.lock` and `info.lock`
- Navigate to `/home/site/deployments`. There may be folders named `pending`, `temp` and `active`. You can `cat` the `pending` file and `ls` `temp-*` and `active`, which should have a `log.log` and `status.xml` in these directories. Try deleting the `temp-*` folder and `pending`. Afterwards, restart the site.
- If the above does not work, instead, delete the entire contents within `/home/site/deployments` and again delete `status.lock` and `info.lock`. Restart the site.
    - **NOTE**: Deleting the UIDs under `/home/site/deployments` will also delete the Deployment Center **Logs** - this should have no actual affect on the application. Kudu specific deployment logging will still exist under `/home/LogFiles/kudu/trace`