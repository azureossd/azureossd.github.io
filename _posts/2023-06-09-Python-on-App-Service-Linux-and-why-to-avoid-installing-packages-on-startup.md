---
title: "Python on App Service Linux and why to avoid installing packages on startup"
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
date: 2023-06-09 12:00:00
---

This post is about why to avoid using a [custom startup script](https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs?pivots=platform-linux#run-custom-command) on App Service Linux with Python to install your pip packages at runtime. This post will be focused on Python Blessed Images.

# Overview
With PaaS - and Azure App Service - instance movement happens. This means that there is a chance of the application container needing to be started up on a new underlying instance (VM).

Because of that, we'd want to try and start our application as soon as we can - which means reducing startup time where possible. This is no different across any of the "Blessed Images" being used - and same goes for our Python Blessed Images.

An anti-pattern in this case, would be to include `pip install [-r requirements.txt or package name] ...` in the [Startup Command](https://learn.microsoft.com/en-us/azure/app-service/configure-language-python#customize-startup-command) option. This would be invoked on each restart or startup event.


## Exceptions
However, there may be times that a specific shared library (`.so` files) are missing, for example:

```
libgomp.so.1: cannot open shared object file: No such file or directory
```

In these scenarios, if not wanting to - or not able to use a custom Docker Image, using a custom startup script in these scenarios will be appropriate, since you may not be able to install these Linux based packages during build time - and additionally so since the build happens on a separate container - when build against Oryx directly.

However, if installing numerous Linux Based packages for missing `.so` files, one may still encounter longer start up times for the same reason as explained above.

> **NOTE**: Current "system packages" can be found [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#system-packages)

# Why is it a bad practice?
Using `pip install..` in the Custom Startup Command option is a bad practice, because, aside from what will be explained here - `pip` package installation or package building is (and should be) typically delegated to **build** or **deployment** time rather than runtime. Consider the below:

- When using Azure DevOps pipelines - explicit package installation is typically done in and on the pipeline. This is then zipped up and deployed as a zip file that will be extracted and ready to run when deployed
    - Here, package installation is on the pipeline side, at build/deploy time
- When using GitHub Actions - explicit package installation is typically done in and on the pipeline. This is then zipped up and deployed as a zip file that will be extracted and ready to run when deployed
    - Here, package installation is on the pipeline side, at build/deploy time
- When using [Oryx with Python](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md) (Local Git, ZipDeploy with Oryx Builder, VSCode with Azure Extension, etc.) - package installation and/or package building is done on the Kudu container, at build time - after this completes, the contents is _then_ copied to be ran from either `wwwroot` or [`$APP_PATH`](https://github.com/Azure-App-Service/KuduLite/wiki/Python-Build-Changes)
- When using ZipDeploy (without Oryx) or FTP, it's expected that `site-packages` already exists with all needed packages to be deployed.
    - In this case, packages are prebuild on a local machine and ready to run


In essentially all cases, this will now duplicate reinstalling our packages if setting this at startup, when our packages installed via `pip` were already created in the first place.

# Issues
## Long start times using pip install causing container timeouts

Use the below an example:

![Python Startup Script](/media/2023/06/azure-oss-blog-python-startup-1.png)

This is a basic Dash application. Anytime we start the container, we'll be reinstalling all packages, which would look like the below in `default_docker.log` (if App Service Logs are enabled)

```
Collecting dash
    Downloading dash-2.10.2-py3-none-any.whl (10.3 MB)
        10.3/10.3 MB 27.8 MB/s eta 0:00:00
Collecting pandas
    Downloading pandas-2.0.2-cp38-cp38-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (12.3 MB)
        12.3/12.3 MB 25.0 MB/s eta 0:00:00
Requirement already satisfied: gunicorn in /opt/python/3.8.16/lib/python3.8/site-packages (from -r requirements.txt (line 3)) (20.1.0)
Collecting dash-table==5.0.0
    Downloading dash_table-5.0.0-py3-none-any.whl (3.9 kB)
Collecting dash-core-components==2.0.0
    Downloading dash_core_components-2.0.0-py3-none-any.whl (3.8 kB)
Collecting plotly>=5.0.0
    Downloading plotly-5.15.0-py2.py3-none-any.whl (15.5 MB)
        15.5/15.5 MB 23.3 MB/s eta 0:00:00
Requirement already satisfied: Werkzeug<2.3.0 in /opt/python/3.8.16/lib/python3.8/site-packages (from dash->-r requirements.txt (line 1)) (2.2.2)
Collecting dash-html-components==2.0.0
    Downloading dash_html_components-2.0.0-py3-none-any.whl (4.1 kB)
Requirement already satisfied: Flask<2.3.0,>=1.0.4 in /opt/python/3.8.16/lib/python3.8/site-packages (from dash->-r requirements.txt (line 1)) (2.2.2)
Collecting numpy>=1.20.3
    Downloading numpy-1.24.3-cp38-cp38-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (17.3 MB)
        17.3/17.3 MB 23.1 MB/s eta 0:00:00
Collecting tzdata>=2022.1
Downloading tzdata-2023.3-py2.py3-none-any.whl (341 kB)
        341.8/341.8 kB 27.5 MB/s eta 0:00:00
Collecting pytz>=2020.1
Downloading pytz-2023.3-py2.py3-none-any.whl (502 kB)
        502.3/502.3 kB 24.7 MB/s eta 0:00:00
Collecting python-dateutil>=2.8.2
Downloading python_dateutil-2.8.2-py2.py3-none-any.whl (247 kB)
        247.7/247.7 kB 20.6 MB/s eta 0:00:00
Requirement already satisfied: setuptools>=3.0 in /opt/python/3.8.16/lib/python3.8/site-packages (from gunicorn->-r requirements.txt (line 3)) (65.6.3)
Requirement already satisfied: click>=8.0 in /opt/python/3.8.16/lib/python3.8/site-packages (from Flask<2.3.0,>=1.0.4->dash->-r requirements.txt (line 1)) (8.1.3)
Requirement already satisfied: itsdangerous>=2.0 in /opt/python/3.8.16/lib/python3.8/site-packages (from Flask<2.3.0,>=1.0.4->dash->-r requirements.txt (line 1)) (2.1.2)
Requirement already satisfied: Jinja2>=3.0 in /opt/python/3.8.16/lib/python3.8/site-packages (from Flask<2.3.0,>=1.0.4->dash->-r requirements.txt (line 1)) (3.1.2)
Requirement already satisfied: importlib-metadata>=3.6.0 in /opt/python/3.8.16/lib/python3.8/site-packages (from Flask<2.3.0,>=1.0.4->dash->-r requirements.txt (line 1)) (6.0.0)
Collecting packaging
    Downloading packaging-23.1-py3-none-any.whl (48 kB)
        48.9/48.9 kB 5.7 MB/s eta 0:00:00
Collecting tenacity>=6.2.0
        Downloading tenacity-8.2.2-py3-none-any.whl (24 kB)
Collecting six>=1.5
Downloading six-1.16.0-py2.py3-none-any.whl (11 kB)
....more packages....
```

Just these packages alone took about a minute of time that could have been saved by delegating this to build-time, or, if that is already being done in the deployment process - to then completely remove the extra `pip install` at runtime as it is now redundant.

In cases where there is a `requirements.txt` containing a large number of dependencies and/or a mix of needing to download linux-based packages, these can then take minutes, which would eventually time out showing **[Container didnt respond to HTTP pings on port, failing site start](https://azureossd.github.io/2023/04/18/Troubleshooting-Container-didnt-respond-to-HTTP-pings-failing-to-start-site/index.html)**.

The default timeout for the platform to recieve a response from the application container to it's health ping on start is 230 seconds. This can be extended up to 1800 with the `WEBSITES_CONTAINER_START_TIME_LIMIT` App Setting, however, this is more of a workaround than resolution.

### Solution
Ensure that any typical Python package install or build is done during **build time** and not at **runtime**.

Below are some examples which include Local Git, Github Actions and DevOps pipelines:
- [Python - Deployment](https://azureossd.github.io/python/#deployment)
- [Python - Availability and Post Deployment issues](https://azureossd.github.io/python/#availability-and-post-deployment-issues)

## Container crashing at runtime due to various package errors
When attempting to run `pip install` at startup, there is a chance this fails due to various reasons - this can potentially cause side effects where `modulenotfound` errors occur since packages couldn't be installed again (depending on the method of deployment).

Or, due to the fact the original deployment environment (ex., a CI/CD pipeline) differs from the typical Debian-based environment that Python Blessed Images are running in. For instance, you may encounter something like the below, which can cascade into further failures:

```
running setup.py install for pyodbc: started
2023-06-09t23:35:36.936177142z     running setup.py install for pyodbc: finished with status 'error'
2023-06-09t23:35:36.939032160z     error: command errored out with exit status 1:
2023-06-09t23:35:36.939062760z      command: /opt/python/3.6.15/bin/python3.6 -u -c 'import io os sys setuptools tokenize; sys.argv[0]

.... other truncated output ....
...
unable to execute 'gcc': no such file or directory
error: command 'gcc' failed with exit status 1
```

## Missing shared libraries: xxx.so.1: and other Linux specific dependencies
The solution for these specific missing packages can go two general ways:

- Add a custom startup script and install the needed packages via package manager (apt, apt-get, or apk, depending on the distribution). Note that if needing to install numerous Linux packages or the packages are large, you’ll end up running into the same issue described in this blog post.
- Use a **Custom Docker Image**. Sometimes, it makes more sense to use a custom Image that you can build yourself to what your project needs. If the Linux package sizes that you’re installing at runtime is adding a large amount of container startup time - then it may make more sense to include these in the custom Docker Image itself.