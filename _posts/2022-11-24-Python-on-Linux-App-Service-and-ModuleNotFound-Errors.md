---
title: "Python on Linux App Service and ModuleNotFoundError"
author_name: "Anthony Salemo"
tags:
    - Python
    - Deploy
    - Linux
categories:
    - Azure App Service on Linux
    - Python
    - Deployment 
    - Configuration
    - Troubleshooting
    - Linux
header:
    teaser: /assets/images/pylinux.png
toc: true
toc_sticky: true
date: 2022-11-24 12:00:00
---

In this post we'll cover some common scenarios on why you may see **ModuleNotFoundError** when deploying your Python based applications to Python on Azure App Service Linux.

## Overview
`ModuleNotFoundError` will usually present itself where the module/package you're importing is missing. Either it was never defined in `requirements.txt`, deployment was done but package installation was never done to produce `site-packages`, or the library is there and the package installation was done - but it's dependent on a native library (`.so` files) that is not available in the container.

Ultimately, this will always cause the application/container to crash. To validate if you're encountering this scenario, you can check with any of the below methods:

> **IMPORTANT**: Make sure [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) are enabled first

- Log Stream
- Retrieving logs directly from the [Kudu site](https://github.com/Azure/app-service-linux-docs/blob/master/Things_You_Should_Know/things_you_should_know.md#you-can-discover-and-download-the-latest-docker-logs-using-kudu), or directly view/download via an FTP client
- Diagnose and Solve Problems -> **Application Logs** detector, **Container Crash** detector, or **Container Issues** detector

An example of this will look like the following:

```python
....
...
..
File "/opt/python/3.9.7/lib/python3.9/site-packages/gunicorn/util.py", line 359, in import_app
    mod = importlib.import_module(module)
File "/opt/python/3.9.7/lib/python3.9/importlib/__init__.py", line 127, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
File "<frozen importlib._bootstrap>", line 1030, in _gcd_import
File "<frozen importlib._bootstrap>", line 1007, in _find_and_load
File "<frozen importlib._bootstrap>", line 986, in _find_and_load_unlocked
File "<frozen importlib._bootstrap>", line 680, in _load_unlocked
File "<frozen importlib._bootstrap_external>", line 850, in exec_module
File "<frozen importlib._bootstrap>", line 228, in _call_with_frames_removed
File "/tmp/8dac8b8e875e905/app.py", line 2, in <module>
    from dotenv import load_dotenv
ModuleNotFoundError: No module named 'dotenv'
```

## Scenarios for this to occur
Below are some examples of how this can happen.

### Missing package in requirements.txt
[Python on App Service Linux](https://learn.microsoft.com/en-us/azure/app-service/configure-language-python) uses [Oryx's build logic](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md) to look for a `requirements.txt` in the codebase being deployed. One of the more simple scenarios for this to happen is forgetting to include a package that's actually being referenced in code within the `requirements.txt` file.

Take the below requirements.txt  and app.py for example, which is for a very basic Flask application - this is just using `dotenv` as an example, but this can happen with any package:

(requirements.txt)
```
Flask
```

(app.py)
```python
from flask import Flask
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
```

We're trying to import, but also use, `dotenv`. This is not in our `requirements.txt`. So when we try to run this application and this logic gets invoked, it will fail due to this package never being installed into `site-packages` (this will exist in your Virtual Environment folder).

Which is ultimately what causes this to be shown:

```python
File "/tmp/8dac8b8e875e905/app.py", line 2, in <module>
    from dotenv import load_dotenv
ModuleNotFoundError: No module named 'dotenv'
```

Changing your requirements.txt to include the missing package reference and redeploying will be the solution to this problem:

(requirements.txt)
```
Flask
python-dotenv
```

### Deployments
#### Zip Deploy (with Oryx Builder)
If you are doing a **Zip Deploy**, your packages should be installed by the remote builder, which is Oryx, the App Setting `SCM_DO_BUILD_DURING_DEPLOYMENT` set to `true` must be added.

![Oryx Buidler App Setting](/media/2022/10/azure-oss-blog-node-module-1.png)

As called out in the documentation [here](https://learn.microsoft.com/en-us/azure/app-service/deploy-zip?tabs=cli#enable-build-automation-for-zip-deploy) - the Zip package is assumed to be ready to run as-is. However, in Python's case on App Service Linux - it is **not** recommended to do a Zip Deploy (via az cli, for example) without ensuring the App Setting `SCM_DO_BUILD_DURING_DEPLOYMENT` is set to true.

Initiating a Zip Deploy **without** this App Setting will cause a **ModuleNotFoundError** error - unless additional configuration is added. This is because no type of build process (eg., pip install) is ever ran.

More information on this Zip Deployment process can be found [here on the GitHub projectkudu repository](https://github.com/projectkudu/kudu/wiki/Deploying-from-a-zip-file-or-url).

#### Zip Deploy, FTP (without Oryx Builder)
If you are attempting a Zip Deploy (without Oryx building your application - which means `SCM_DO_BUILD_DURING_DEPLOYMENT` is not set or set to false) or using FTP, and are encountering `ModuleNotFoundError` errors, then ensure that **all** of your site content, including the **Virtual Environment**, required by your packages, is included in the zip file being deployed.

This is in conjunction with ensuring the dependency exists in your `requirements.txt`.

This is again due to the fact that no type of build automation is happening, which means packages are never installed.

However, it is still possible to use this approach successfully to target your `site-packages` in your Virtual Environment. Below is an example file structure:

```
| - app.py
| - .venv
| - requirements.txt
```

> **NOTE**: .venv is just an arbitrary Virtual Environment name. This is where your `site-packages` folder lives. Your packages are installed under this directory, assuming the Virtual Environment was activated locally prior to installation.

**Ensure your Virtual Environment is included.** After this, add a [Startup File](https://learn.microsoft.com/en-us/azure/developer/python/configure-python-web-app-on-app-service#create-a-startup-file) under `/home/startup.sh` with the below contents:

```bash
#!/bin/sh

export PYTHONPATH=$PYTHONPATH:"/home/site/wwwroot/.venv/lib/site-packages"
GUNICORN_CMD_ARGS="--timeout 600 --access-logfile '-' --error-logfile '-' --chdir=/home/site/wwwroot" gunicorn app:app
```
Replace the Virtual Environment name in `PYTHONPATH` with the name of the one in the zip file being deployed. This will update `PYTHONPATH` to use your Virtual Environment being brought. 


#### Local Git, VSCode Extension
If deploying via Local Git or the VSCode extension (which also builds with Oryx) - and you are noticing that packages are missing at runtime. Ensure the following:

- That you are deploying from the root of your project **relative** to your `requirements.txt` and Python entrypoint. If you are deploying from **outside** your main project folder (such as a parent folder on accident), then [Oryx will not know how to build your application](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md) and you'll likely encounter `ModuleNotFoundError` at runtime.

```
 |--- (C:\Documents) parent folder
    |--- (C:\Documents\azure-webapp-site) project folder 
        |-- app.py
        |-- requirements.txt
        |-- models
           | -- models.py
```

- Validate that packages are actually being installed via the stdout from your terminal (or in VSCode in the **Output** tab)

  ![Terminal tab](/media/2022/10/azure-oss-blog-node-module-2.png)

  You should see something like the below output in your terminal when deploying from either of these methods. Seeing that **Oryx Build** is being ran and that a Virtual Environment (antenv) is automatically being activated, with packages being installed - can ensure you avoid packages missing at runtime:

```
Running oryx build...
Command: oryx build /tmp/zipdeploy/extracted -o /home/site/wwwroot --platform python --platform-version 3.9 -p virtualenv_name=antenv --log-file /tmp/build-debug.log  -i /tmp/8dace3ae6b1e73e --compress-destination-dir | tee /tmp/oryx-build.log
Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
You can report issues at https://github.com/Microsoft/Oryx/issues
Oryx Version: 0.2.20220812.1, Commit: cdf6b1bef165d05b94830e963646495967d938f4, ReleaseTagName: 20220812.1
Build Operation ID: |zrNQI6T8H8g=.f55ad91c_
Repository Commit : 3727288e-ecde-44f3-8e12-d223126290fc
Detecting platforms...
Detected following platforms:
   python: 3.9.7
Version '3.9.7' of platform 'python' is not installed. Generating script to install it...
Using intermediate directory '/tmp/8dace3ae6b1e73e'.
Copying files to the intermediate directory...
Done in 6 sec(s).
Source directory     : /tmp/8dace3ae6b1e73e
Destination directory: /home/site/wwwroot
Downloading and extracting 'python' version '3.9.7' to '/tmp/oryx/platforms/python/3.9.7'...
Downloaded in 6 sec(s).
Verifying checksum...
Extracting contents...
performing sha512 checksum for: python...
Done in 50 sec(s).
Python Version: /tmp/oryx/platforms/python/3.9.7/bin/python3.9
Creating directory for command manifest file if it does not exist
Removing existing manifest file
Python Virtual Environment: antenv
Creating virtual environment...
Activating virtual environment...
Running pip install...
[16:44:20+0000] Collecting Flask
[16:44:20+0000]   Downloading Flask-2.2.2-py3-none-any.whl (101 kB)
[16:44:20+0000] Collecting python-dotenv
[16:44:21+0000]   Downloading python_dotenv-0.21.0-py3-none-any.whl (18 kB)
[16:44:22+0000] Collecting importlib-metadata>=3.6.0
[16:44:22+0000]   Downloading importlib_metadata-5.1.0-py3-none-any.whl (21 kB)
[16:44:22+0000] Collecting itsdangerous>=2.0
[16:44:22+0000]   Downloading itsdangerous-2.1.2-py3-none-any.whl (15 kB)
[16:44:22+0000] Collecting click>=8.0
[16:44:22+0000]   Downloading click-8.1.3-py3-none-any.whl (96 kB)
[16:44:23+0000] Collecting Jinja2>=3.0
[16:44:23+0000]   Downloading Jinja2-3.1.2-py3-none-any.whl (133 kB)
[16:44:23+0000] Collecting Werkzeug>=2.2.2
[16:44:23+0000]   Downloading Werkzeug-2.2.2-py3-none-any.whl (232 kB)
[16:44:24+0000] Collecting zipp>=0.5
[16:44:24+0000]   Downloading zipp-3.10.0-py3-none-any.whl (6.2 kB)
[16:44:25+0000] Collecting MarkupSafe>=2.0
[16:44:25+0000]   Downloading MarkupSafe-2.1.1-cp39-cp39-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (25 kB)
[16:44:26+0000] Installing collected packages: zipp, MarkupSafe, Werkzeug, Jinja2, itsdangerous, importlib-metadata, click, python-dotenv, Flask
[16:44:31+0000] Successfully installed Flask-2.2.2 Jinja2-3.1.2 MarkupSafe-2.1.1 Werkzeug-2.2.2 click-8.1.3 importlib-metadata-5.1.0 itsdangerous-2.1.2 python-dotenv-0.21.0 zipp-3.10.0
WARNING: You are using pip version 21.2.3; however, version 22.3.1 is available.
You should consider upgrading via the '/tmp/8dace3ae6b1e73e/antenv/bin/python -m pip install --upgrade pip' command.
Not a vso image, so not writing build commands
Preparing output...
Copying files to destination directory '/tmp/_preCompressedDestinationDir'...
Done in 9 sec(s).
Compressing content of directory '/tmp/_preCompressedDestinationDir'...
Copied the compressed output to '/home/site/wwwroot'
Removing existing manifest file
Creating a manifest file...
Manifest file created.
Copying .ostype to manifest output directory.
Done in 121 sec(s).
Running post deployment command(s)...
Generating summary of Oryx build
Parsing the build logs
Found 0 issue(s)
Build Summary :
===============
Errors (0)
Warnings (0)
Triggering recycle (preview mode disabled).
Deployment successful. deployer = Push-Deployer deploymentPath = ZipDeploy. Extract zip.
```

> **NOTE**: antenv is an automatically created and activated Virtual Environment when using Oryx as the builder.

#### GitHub Actions (GitHub Builder)
When using pipeline based approaches, it is generally assuming that any package installations will be done on the pipeline itself.

Therefor it is important you check these following points:

- `pip install` (or your package manager equivalent) is ran in the Actions workflow
- If using multi-stage workflows (build, deploy stages), make sure that the artifact being uploaded between stages (to the deploy stage) actually contains the the source code required by your application
- The artifact being deployed to the Kudu site (which uses Zip Deploy by default) needs to have your fully built application within it (all required application code). This was also explained above in the Zip Deploy (without Oryx Builder) section.
- The OS type of the pipeline should match the OS type of the application (eg., GitHub Actions using `runs-on: ubuntu-latest` - when deploying to a Linux App Service). This is to avoid any edge-case errors where packages are installed/ran on varying operating systems which may fail to load them. 
- Ensure no parts of the pipeline are failing which may cause the application to be partially built out.

The default template used for Python App Service applications includes this approach by design. The below is a simplified example of making sure all of the above points are met:

```yaml
name: Build and deploy Python app to Azure Web App - yoursitenamehere

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Set up Python version
        uses: actions/setup-python@v1
        with:
          python-version: '3.9'

      - name: Create and start virtual environment
        run: |
          python -m venv venv
          source venv/bin/activate
      
      - name: Install dependencies
        run: pip install -r requirements.txt
        
      # Optional: Add step to run tests here (PyTest, Django test suites, etc.)
      
      - name: Upload artifact for deployment jobs
        uses: actions/upload-artifact@v2
        with:
          name: python-app
          path: |
            . 
            !venv/

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: $

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v2
        with:
          name: python-app
          path: .
          
      - name: 'Deploy to Azure Web App'
        uses: azure/webapps-deploy@v2
        id: deploy-to-webapp
        with:
          app-name: 'yoursitenamehere'
          slot-name: 'Production'
          publish-profile: $
```

A likely issue here, if encountering `ModuleNotFoundError` errors is the fact that a `pip install` was never ran on the GitHub Actions workflow.

To validate if this is occurring, you must go to the GitHub Actions workflow itself and view the logging there on the GitHub side.

You can correlate the logging from the App Service side to see what package(s) may have been missing.

For more examples of GitHub Action workflows that ensure packages are installed and deployed, see these posts:

- [Flask Deployment on App Service Linux](https://azureossd.github.io/2022/02/17/Flask-Deployment-on-App-Service-Linux/index.html)
- [Django Deployment on App Service Linux](https://azureossd.github.io/2022/02/20/Django-Deployment-on-App-Service-Linux/index.html)

Most wSGI based Python applications will follow this same approach. This is again in conjunction with ensuring the package exists in `requirements.txt`. 

#### DevOps pipelines
**This largely follows the GitHub Actions approach to troubleshooting `ModuleNotFoundErrors`.**

When using pipeline based approaches, it is generally assuming that any package installations will be done on the pipeline itself.

Therefor it is important you check these following points:

- `pip install` (or your package manager equivalent) is ran in the Azure DevOps pipeline
- If using multi-stage workflows (build, deploy stages), make sure that the artifact being uploaded between stages (to the deploy stage) actually contains the the source code required by your application
- The artifact being deployed to the Kudu site (which uses Zip Deploy by default) needs to have your fully built application within it (all required application code). This was also explained above in the Zip Deploy (without Oryx Builder) section.
- The OS type of the pipeline should match the OS type of the application (eg., DevOps pipelines using `pool: ubuntu-latest` - when deploying to a Linux App Service). This is to avoid any edge-case errors where packages are installed/ran on varying operating systems which may fail to load them. 
- Ensure no parts of the pipeline are failing which may cause the application to be partially built out.

The default template used for Python App Service applications includes this approach by design. The below is a simplified example of making sure all of the above points are met:

```yaml
trigger:
- main

variables:
  # Azure Resource Manager connection created during pipeline creation
  azureServiceConnectionId: '0000000-0000-0000-0000-00000000'

  # Web app name
  webAppName: 'yourwebappname'

  # Agent VM image name
  vmImageName: 'ubuntu-latest'

  # Environment name
  environmentName: 'yourwebappname'

  # Project root folder. Point to the folder containing manage.py file.
  projectRoot: $(System.DefaultWorkingDirectory)

  # Python version: 3.9
  pythonVersion: '3.9'

stages:
- stage: Build
  displayName: Build stage
  jobs:
  - job: BuildJob
    pool:
      vmImage: $(vmImageName)
    steps:
    - task: UsePythonVersion@0
      inputs:
        versionSpec: '$(pythonVersion)'
      displayName: 'Use Python $(pythonVersion)'

    - script: |
        python -m venv antenv
        source antenv/bin/activate
        python -m pip install --upgrade pip
        pip install setup
        pip install -r requirements.txt
      workingDirectory: $(projectRoot)
      displayName: "Install requirements"

    - task: ArchiveFiles@2
      displayName: 'Archive files'
      inputs:
        rootFolderOrFile: '$(projectRoot)'
        includeRootFolder: false
        archiveType: zip
        archiveFile: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
        replaceExistingArchive: true

    - upload: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
      displayName: 'Upload package'
      artifact: drop

- stage: Deploy
  displayName: 'Deploy Web App'
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: DeploymentJob
    pool:
      vmImage: $(vmImageName)
    environment: $(environmentName)
    strategy:
      runOnce:
        deploy:
          steps:

          - task: UsePythonVersion@0
            inputs:
              versionSpec: '$(pythonVersion)'
            displayName: 'Use Python version'

          - task: AzureWebApp@1
            displayName: 'Deploy Azure Web App : yourwebappname'
            inputs:
              azureSubscription: $(azureServiceConnectionId)
              appName: $(webAppName)
              appType: webAppLinux
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
              # startUpCommand: 'gunicorn --bind 0.0.0.0:8000 --timeout 600 app:app' // This is optional unless needing to be added for any specific reason
```
- [Flask Deployment on App Service Linux](https://azureossd.github.io/2022/02/17/Flask-Deployment-on-App-Service-Linux/index.html)
- [Django Deployment on App Service Linux](https://azureossd.github.io/2022/02/20/Django-Deployment-on-App-Service-Linux/index.html)

Most wSGI based Python applications will follow this same approach. This is again in conjunction with ensuring the package exists in `requirements.txt`. 

### Missing shared libraries (cannot open shared object file: no such file or directory)
There are times your Python packages may rely on Shared Libraries (.so files) that are expected to exist on the current distribution. In this case, since App Service Linux runs in Docker Containers, the distribution and the OS this is built off of would be expected to have these `.so` files (if needed)

You may see these present themselves at runtime, like the following (these are just examples):

- ` importerror: libgthread-2.0.so.0: cannot open shared object file: no such file or directory`
- `python: error while loading shared libraries: libpython3.9.so.1.0: cannot open shared object file: no such file or directory`
- ` importerror: libtk8.6.so: cannot open shared object file: no such file or directory`

etc. 

This would mean that there is a Python package in your application which has a dependency on a Linux Shared Library which is missing in the Docker Image.

**IMPORTANT**: This in itself may not show up as a typical `ModuleNotFoundError`, but rather an `import error` (or related). Both scenarios are ultimately due to dependency issues.

If you encounter this, there can be two general paths to resolution:

- **Custom Startup Script**
  - You can follow this blog post - [Azure App Service Linux - Custom Startup Script for Nodejs & Python](https://azureossd.github.io/2020/01/23/custom-startup-for-nodejs-python/index.html) - on how to implement this. **It's important to note that each `.so` may require various Linux-based dependencies to be fully installed.** Check the `.so` file in question to see what other Linux dependencies may be required for it.

  This blog post - [Azure App Service Linux - Python - XGBoost Library (libxgboost.so) Could Not Be Loaded](https://azureossd.github.io/2020/01/23/xgboost-library-could-not-be-loaded/index.html) can be referenced as a real-world example of this.

- **Custom Docker Image**
  - If the dependency in question causes issues with installing (eg., too many dependencies needed, too long of install time) it may then make more sense to package your application into a custom Docker Image where these depedencies can be included through various means (specific base images, or in the Dockerfile through installation, for example). Which would resolve the issue with the missing `.so` your Python package is dependent on.


### Other various reasons
#### Incorrect module name
Sometimes, if needing to quickly develop an application, a mistake may be made. In this case, you may have imported a module with incorrect spelling:

Take the below example, which is importing **Flask**. 

```python
from Flask import Flask
...other code...
...
```

```python
ModuleNotFoundError: No module named 'Flask'
```

Here, case sensitivity matters. The **actual** package needs to be imported as lowercase. Eg., `flask`:

```python
from flask import Flask
```

This same concept can apply to other packages as well.

#### Importing from an incorrect path
Using a basic example, incorrectly specifying the path sytnax for another file or module can have this issue occur as well.

Use the below folder structure as an example:

```
|-- app.py
|-- requirements.txt
|-- helpers.py
```

We then try to import `helpers.py` with the below:

```python
from flask import Flask
from dotenv import load_dotenv

import helpers.py
```

We then deploy this to Azure (although, this would happen if executing locally also), we will see this at runtime:

```
ModuleNotFoundError: No module named 'helpers.py'; 'helpers' is not a package
```

To resolve this, we'd need to change the import path to target the file with the file extension:

```python
from flask import Flask
from dotenv import load_dotenv

import helpers
```


