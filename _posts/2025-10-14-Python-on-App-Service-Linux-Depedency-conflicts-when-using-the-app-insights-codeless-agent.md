---
title: "Python on App Service Linux: Dependency conflicts when using the app insights codeless agent"
author_name: "Anthony Salemo"
tags:
    - Python
    - Troubleshooting
    - Configuration
categories:
    - Azure App Service on Linux
    - Python
    - Troubleshooting
    - Configuration 
header:
    teaser: /assets/images/pylinux.png
toc: true
toc_sticky: true
date: 2025-10-14 12:00:00
---

This post covers why very rarely a dependency conflict may arise when using the "codeless" Application Insights agent on a Python Blessed Image with Azure App Service Linux

# Overview
"codeless" refers to [auto instrumentation](https://learn.microsoft.com/en-us/azure/azure-monitor/app/codeless-overview) enablement of Azure Application Insights (eg. click to enable). This will automatically add environment variables, restart the container, and "instrument" the application to start sending telemetry to the chosen Azure Application Insights resource from your Python application.
- This does **not** refer to "manual" instrumentation (eg. through the SDK)

"dependency conflict" is not specific to Python, or this post, but can happen in any language that uses packages/modules, mostly from external vendor sources. This essentially means two (or more) packages/dependencies loaded at runtime in a codebase encounter some type of issue that causes a runtime failure, in this case. Some examples are if the application is directly importing package imports in `.py` files and using these explicitly - or - the presense of two depenencies (such as one being a peer to another) causes issues. 

_Specific_ to this post, is how this would manifest with Python - usually as `ModuleNotFoundError: No module named 'somepackage'` or something along the lines of `ImportError: cannot import name 'someimport' from 'somepackage' (/agents/python/somefile.py)`, where the notable import path is from `/agents`.

_Sometimes_ there may be "no code changes" done (although this is not always the case). The bare minimum to have this start appearing is some form of restart - eg. instance movement, restart, platform upgrade, etc.

> **NOTE**: This post primary refers to using the "code" option with Python on Azure App Service Linux (eg. "Blessed Images") but this may also be able to apply to some degree when using custom containers (eg. Web Apps for Containers)

## Prerequisites
To see these errors, you need to have **App Service Logging** enabled. See [Enable application logging (Linux/Container)](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer)

After enabling this, application `stdout` / `stderr` will be written to `/home/LogFiles/xxxxx_default_docker.log`

If you’re using a custom startup command with Gunicorn, you need to set `--access-logfile '-' --error-logfile '-'` in your Gunicorn startup command. This will write to `stdout/err` and be picked up by App Service - which subsequentially is written into default_docker.log

You can review the [Configuring Gunicorn worker classes and other general settings](https://azureossd.github.io/2023/01/27/Configuring-Gunicorn-worker-classes-and-other-general-settings/index.html#why-am-i-not-seeing-logging-with-custom-startup-commmands) for more information.

These logs can then be viewed in various ways:

- **Diagnose and Solve Problems** -> **Application Logs**
- **Logstream**
- **Kudu** -> `/home/LogFiles/`
- **FTP** -> `/home/LogFiles/`
- Azure CLI - [az webapp log tail](https://learn.microsoft.com/en-us/cli/azure/webapp/log?view=azure-cli-latest#az-webapp-log-tail)

# Investigation
**A very key and important aspect when troubleshooting these issues is to look at the exception stack and file import path**. If this is a Blessed Image (and could also apply to custom images), where the import of the file/package in the exception stack trace is starting from `/agents`, this already likely points to an issue with dependency conflicts when the codeless App Insights agent is enabled
- This is a **very important distinction**, since the same `ModuleNotFound` errors (or other ones like `Import error:` can happen, but from a more organic issue related to deployment problems which also have nothing to do with App Insights - see [Python on Linux App Service and ModuleNotFoundError](https://azureossd.github.io/2022/11/24/Python-on-Linux-App-Service-and-ModuleNotFound-Errors/index.html) for more information on troubleshooting `ModuleNotFound` outside of the context of this blog about "codeless" App Insights.
  - In these cases, the codeless App Insights agent is typically not enabled. Or, if enabled, the import path in the error is pointing to a location at `/home/site/wwwroot` or `/tmp/<uid>/some.py` (for [APP_PATH](https://github.com/Azure-App-Service/KuduLite/wiki/Python-Build-Changes)) and there is zero references to `/agents` in the error and exception stack

1. Confirm that the codeless agent is enabled
    - This can easily by done by navigating to your application and clicking on the **Application Insights** blade. If it's _enabled_, then the codeless agent is enabled.

    ![Enabled application insights](/media/2025/10/python-app-insights-1.png)

2. **Look through the full error and exception stack.** Below is an example. Note, you'll still see file import paths for where source code is hosted (eg. /`tmp/<id>/some.py`), but you may also see `/agents` related to the package or import failing. Take note of this - as the import path likely is pointing to one of the files in which the error is occurring. If App Service Logs aren't enabled, then enable this and reproduce the issue, followed by reviewing _full_ logging within `default_docker.log`

   ```
   Traceback (most recent call last):
    File "runserve* line 6, in <module>
    from eTask_Man* import app
    File "/tmp/8da* line 8, in <module>
    from eTask_Man* import projectCo*
    File "/tmp/8da* line 11, in <module>
    import requests
    File "/agents/* line 43, in <module>
    import urllib3
    File "/agents/* line 5
    from __future_* import annotatio*
    ^
    SyntaxErr* future feature annotatio* is not defined 
    ```

**TLDR**:
- Make sure that you see `/agents` in the exception stack with semi-consistent references. **This is incredibly important** and that the codeless application insights agent _is_ actually enabled. Otherwise, this is likely just a "typical" `ModuleNotFound` or other dependency conflict error **not** related to the codeless application insights agent - again, see [Python on Linux App Service and ModuleNotFoundError](https://azureossd.github.io/2022/11/24/Python-on-Linux-App-Service-and-ModuleNotFound-Errors/index.html)
- This will further prove the point of a dependency conflict if this starts to occur after some form of a restart where **no dependencies were changed in the application** nor **any** recent deployments
  - There is the smaller change this happens fresh from the start, albiet more rare

**NOTE**: Do not use both the Python Application Insights SDK and the "codeless" Application Insight agent together. Use only one or the other.

## Why does this happen?
> **NOTE**: This scenario is rather rare. The point of this blog post is to explain the _why_

With Python blessed images, a set of "default" packages are installed already in a blessed image (for both when the virtual env is activated, and globally). This can be seen with `pip list` (the below is subject to change and was done on a Python 3.13 Blessed Image)

```
Package              Version
-------------------- -------
appsvc-code-profiler 1.0.0
blinker              1.9.0
click                8.2.1
debugpy              1.8.14
distlib              0.4.0
filelock             3.18.0
Flask                3.1.1
gunicorn             23.0.0
itsdangerous         2.2.0
Jinja2               3.1.6
markdown-it-py       3.0.0
MarkupSafe           3.0.2
mdurl                0.1.2
objprint             0.3.0
orjson               3.10.7
packaging            25.0
pip                  25.1.1
platformdirs         4.3.8
psutil               7.0.0
Pygments             2.19.2
rich                 14.0.0
subprocess32         3.5.4
virtualenv           20.32.0
vizplugins           0.1.3
viztracer            0.15.6
Werkzeug             3.1.3
```

When codeless application insights is enabled for Python, this will mount a volume to `/agents` in the container. This now will include various directories for Python major.minor versions, including additional Python packages under `/agents/python/common`. Application Insights relies upon `opentelemetry`, so you'll see these packages plus various others added in.

![/agents/python volume mount](/media/2025/10/python-app-insights-2.png)

**NOTE:** If codeless app insights is not enabled then nothing will be mounted to `/agents`. The directly will not exist by default

![/agents/python volume mount](/media/2025/10/python-app-insights-3.png)

When the virtual environment is activated, this will include these "default" packages, plus packages from the codeless agent found under `/agents/python/common`, plus all of the packages used apart of the `requirements.txt` of the application. These will all be included in the activated virtual environment and can be seen with `pip list`

> **NOTE**: The below pip list includes dependencies from a FastAPI application (apart of the requirements.txt used during deployment), as well as all the package sources explained above

![pip list of all packages in the virtual env](/media/2025/10/python-app-insights-4.png)

## The "why"
With the above context, sometimes there are changes to the packages apart of the codeless application insights python library that may conflict with specific versions of another package may be used in your application. Therefor essentially, this just ends up manifesting itself as a classic dependency conflict issue that you'd see in any other case, for example, with a bunch of packages in `requiremments.txt` may not play well with each other in certain cases. This is the same concept here.

# Resolution paths
The normal resolution paths are:
1. Identify the package(s) in the error
2. If you feel confident this was related to an application insights codeless agent change, then simply just disable the codeless agent via the portal
3. Or, Pin back the package that may be conflicting with the package from the codeless agent to a prior known working version. This will likely need to be researched online for related threads/forums in additional to understanding the full error from 1). You should have access to the applications `requirements.txt` for a better understanding.

For applications using very specific versioning, ontop of very large `requirements.txt` with numerous dependencies or project dependencies that are known to have issues with versioning - it is **heavily recommended** to instead use the SDK ([Azure Monitor Opentelemetry client](https://learn.microsoft.com/en-us/python/api/overview/azure/monitor-opentelemetry-readme?view=azure-python&source=recommendations))
- You have more control over the packages used here since these will be added to your `requirements.txt`
- **This can also be tested locally first when enabling** which can be a significant help for confirmining comptability before deployments. You do not have this same granular control in regards to packages with the codeless agent, which is why the SDK can sometimes be a better choice for certain applications.