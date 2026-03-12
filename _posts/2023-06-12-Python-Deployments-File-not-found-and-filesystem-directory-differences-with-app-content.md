---
title: "Python Deployments: 'File not found' and filesystem directory differences with app content"
author_name: "Anthony Salemo"
tags:
    - Python
    - Troubleshooting
    - Azure App Service on Linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/pylinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-06-12 12:00:00
---

This post will cover 'File not found' errors and why this may appear depending on the deployment type for applications at runtime.

# Overview
'File not found' errors, in themselves, are usually pretty obvious. The errors in this post will be discussing scenarios where it is truly due to incorrect path locations - rather than something like file locking or filesystem permission related issues. 

In the case of Python on App Service Linux - this _may_ present itself depending on the deployment builder being used. There is two builders in this scenario:
- OryxBuilder
- BasicBuilder

> **NOTE**: You can technically use FTP as well, which would fall under the concept of BasicBuilder described in this post

On 03/01/2021, a change was introduced when OryxBuilder is being used that deploys application content to a directory under a location called `$APP_PATH` ([Documentation](https://github.com/Azure-App-Service/KuduLite/wiki/Python-Build-Changes)) - which has a value of `/tmp/[some_uid]/`.

Ultimately, this creates the potential for application content to be deployed to one of two locations, depending on the deployment type - `/tmp/[uid]` or `/home/site/wwwroot`. 

When OryxBuilder is used, the file system location where application content resides may look like this. Note that `antenv`, the virtual environment, is automatically activated and contents is now under `/tmp/8db6b7ca3d750ef`:

```
Documentation: http://aka.ms/webapp-linux
Python 3.10.11
Note: Any data outside '/home' is not persisted
(antenv) root@18ac05f9b85f:/tmp/8db6b7ca3d750ef# ls
antenv  app.py  __pycache__  requirements.txt
(antenv) root@18ac05f9b85f:/tmp/8db6b7ca3d750ef#
```

When BasicBuilder is used, the file system location where application content resides may look like this. We see application content is now under `/home/site/wwwroot`:

```
(antenv) root@f4908b31f58b:/home/site/wwwroot# ls
antenv  app.py  azure-pipelines.yml  __pycache__  requirements.txt
```

Other examples that may not be obvious:
- Azure DevOps deployments (where a virtual environment is activated, packages installed within, and deployed with the name of `antenv`) - with Python will use BasicBuilder and also activate the virtual environment - contents will end up under `/home/site/wwwroot` - assuming that `SCM_DO_BUILD_DURING_DEPLOYMENT` is false or not set
    - Azure DevOps deployments where a virtual environment deployed with the pipeline is **not** named `antenv` - and **not** using Oryx, will likely cause the application to fail due to unable to find `site-packages`. 
    - An example of what is meant by deploying a virtual environment folder can be found in the pipeline `.yaml` [here](https://azureossd.github.io/2022/02/17/Flask-Deployment-on-App-Service-Linux/index.html#azure-devops) 
- Azure DevOps deployments where `SCM_DO_BUILD_DURING_DEPLOYMENT` is true will use Oryx and deploy application content to `/tmp/[uid]`
- GitHub Actions where Oryx is used (`SCM_DO_BUILD_DURING_DEPLOYMENT` is `true`) will deploy to `/tmp/[uid]` - this is regardless of what is done on the pipeline with a virtual environment, like explained with ADO above.

In short, if BasicBuilder is used (ZipDeploy without Oryx, any non-Oryx Deployment, or, something like FTP which is the equivalent of no builder) content will be deployed to `/home/site/wwwroot`

If Oryx is used as the builder, it will be deployed to `$APP_PATH` - which is `/tmp/[uid]`

# Examples
Knowing that file locations may differ depending on what is being attempted, here are some scenarios that can cause file not found errors:
- If using Oryx as the builder and attempting to reference application files under `/home/site/wwwroot`, since Oryx will place extracted application content under `$APP_ATH` (`/tmp/[uid]`)
    - A more detailed example is creating a test file under `wwwroot` and trying to reference that relatively - this would fail since `open()` is trying to open this out of `/tmp/[uid]`:

        ```python
        filenotfounderror: [errno 2] no such file or directory: './test.txt'
        ```
- Using a Startup Command/Startup File that has references to content under `/home/site/wwwroot` - if using Oryx and expecting deployed content to be there
    - An example here is using a startup script or file to reference something like Django's `manage.py` - however, with Oryx, the content will be under `/tmp[uid]`

    ```python
    python: can't open file '/home/site/wwwroot/manage.py': [errno 2] no such file or directory
    ```

- If using BasicBuilder as the builder but attempting to reference application files or content under `$APP_PATH` - this will fail as this location (`/tmp/[uid]`) will not exist.
- Using BasicBuilder as the builder but attempting to reference `$APP_PATH` in a startup command, file, or script

In these cases, you can also:
- Use FTP, Bash (Kudu Shell) or Kudu's /newui endpoint to validate current filesystem contents
- Use relative paths (in some circumstances, depending on what's being done)
- For certain contents or directories that can be decoupled from application deployment - place this somewhere under `/home` and reference this as an absolute path
