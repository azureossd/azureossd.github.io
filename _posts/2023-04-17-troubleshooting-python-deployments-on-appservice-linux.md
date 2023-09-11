---
title: "Troubleshooting Python deployments on App Service Linux"
author_name: "Edison Garcia"
tags:
    - Python
    - Deployments
    - Troubleshooting
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Function App
    - Python # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Troubleshooting 
header:
    teaser: /assets/images/pylinux.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-04-17 12:00:00
---

There are different ways to deploy a Python application to Azure App Service Linux. In this post we are covering the most common scenarios when doing deployments.

It is very important to identify if the issue is happening in the **deployment process** or **post deployment** (in startup of the application).  

# Identify the build provider 

Before starting you need to identify **where is your source code** and **which is the build provider** that you are using and **where are deployment logs**?

| Where is my source code?                   | Which is the build provider?                                                | 
| ------------------------------------------ | ------------------------------------------------------------------------    |  
| GitHub                                     | GitHub Actions or App Service Build Service (Oryx) or Azure Pipelines       |  
| Bitbucket                                  | App Service Build Service (Oryx)                                            | 
| LocalGit                                   | App Service Build Service (Oryx)                                            |
| Azure Repos                                | Azure Pipelines or App Service Build Service (Oryx)                         |
| External Git                               | App Service Build Service (Oryx) or Azure Pipelines                         |
| Local Computer (Using ZipDeploy)          | App Service Build Service (Oryx)  or building locally  |

> When using `Azure Pipelines` or `ZipDeploy`, Oryx is not enabled by default since you are using an `External builder`. If you prefer to enable App Service Build Service (Oryx) then you need to add a new App Setting **`SCM_DO_BUILD_DURING_DEPLOYMENT`= `true`** and redeploy.
>
>When using `Local Git`, `Bitbucket`, `External Git`, `GitHub Actions`, Oryx is enabled by default.

## Azure Python Functions
> You can find more information in [Publishing to Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-python?tabs=asgi%2Capplication-level&pivots=python-mode-decorators#publishing-to-azure).

### Functions Core Tools
For Azure Python Functions there are three build actions supported using `Azure Functions Core Tools`:

- **Remote build** -  Oryx build is enabled to install dependences on the server. This helps to have smaller packages to deploy, but it is not recommended when you are developing Python apps on Windows, since the packages can be built differently for Windows architectures. This option will use `zipdeploy` and will enable `runfrompackage` by default.

    You can find more information in [Remote build](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-python?tabs=asgi%2Capplication-level&pivots=python-mode-decorators#remote-build).
    
- **Local build** - Project dependencies are installed locally under `.python_packages` folder, and this might increase the deployment size. Validate also which libraries are [not Windows OS dependent](https://pypi.org/search/?q=&o=&c=Operating+System+%3A%3A+Microsoft+%3A%3A+Windows) since you are deploying into a Linux env. This option will use `zipdeploy` and will enable `runfrompackage` by default. 

    You can find more information in [Local build](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-python?tabs=asgi%2Capplication-level&pivots=python-mode-decorators#local-build).
- **Custom dependencies** - If you are using a custom package index you can use this app setting `PIP_EXTRA_INDEX_URL`, this option will enable Oryx and will run `pip install --extra-index-url <CUSTOM_INDEX_URL>`, you can use basic authentication in the same URL `https://username:password@custom_url`, or build the packages locally into `.python_packages` folder with `pip install  --target="<PROJECT_DIR>/.python_packages/lib/site-packages"  -r requirements.txt` and disable Remote build with `--no-build`.  

    You can find more information in [Custom dependencies](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-python?tabs=asgi%2Capplication-level&pivots=python-mode-decorators#custom-dependencies).

### Visual Code
If you are using Visual Code, it will use `Remote build`  adding `ENABLE_ORYX_BUILD=true` and `SCM_DO_BUILD_DURING_DEPLOYMENT=1` and enabling Oryx for building assets.

# Using Oryx builder

[Oryx](https://github.com/microsoft/Oryx) is a build system which automatically compiles your source code into runnable artifacts. It is used by [App Service Linux](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md) and it is integrated as part of [Kudu](https://github.com/Azure-App-Service/KuduLite). It supports multiple runtimes, one of those is Python. Here is a list of the most common scenarios that can happen when building with Oryx. 

##  Unexpected Error

**Error**
- `Error: Oops... An unexpected error has occurred.`

**Reason**
- Unhandled exception when running Oryx build

**Actions**
- SSH into Kudu using `https://<your_sitename>.scm.azurewebsites.net/newui/kududebug` and review  `/tmp/build-debug.log` for insights. 

  > **Note**: For Azure Functions, you need to review stack trace.

    ![Oxy debug log](/media/2023/02/nodejs-deployment-01.png)
- Also review if you have any of the [App Settings](https://github.com/microsoft/Oryx/blob/main/doc/configuration.md) that Oryx uses and validate if the settings are correct.
- If you are using VNET integration and getting the following errors:
    - `Http request to retrieve the SDKs available to download from 'https://oryx-cdn.microsoft.io' failed. Please ensure that your network configuration allows traffic to required Oryx dependencies  as documented in 'https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md#network-dependencies'`
    - `Error: System.AggregateException: One or more errors occurred. (A task was canceled.)
 ---> System.Threading.Tasks.TaskCanceledException: A task was canceled.
   --- End of inner exception stack trace ---
   at System.Threading.Tasks.Task`1.GetResultCore(Boolean waitCompletionNotification)
   at System.Threading.Tasks.Task`1.get_Result()
   at Microsoft.Oryx.BuildScriptGenerator.SdkStorageVersionProviderBase.GetAvailableVersionsFromStorage(String platformName)`

        Review if the [Oryx CDN endpoint](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md#network-dependencies) is whitelisted in VNET.


##  Issues detecting the platform or version

**Errors**

- `Could not detect any platform in the source directory.`
- `Couldn't detect a version for the platform 'python' in the repo.`

**Reasons**

The Python toolset is run when any of the following conditions are met:

* `requirements.txt` in root of repo
* `runtime.txt` in root of repo
* Files with `.py` extension in root of repo or in sub-directories if set `DISABLE_RECURSIVE_LOOKUP=false`.
* `requirements.txt` at specific path within the repo if set `CUSTOM_REQUIREMENTSTXT_PATH`.

If Oryx is not finding any condition met then it will not detect any platform or Python version, check [reference](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#detect) for more information.

**Actions**
- Review if your files are in root folder when doing git commits and if there is any `requirements.txt` and you have any application files like `app.py, application.py, index.py, server.py` to detect a valid Python application.
- When doing `ZipDeploy` and using `Oryx build` check if file directories are correct inside the zip file and not having a subdirectory.

## Issues with package versions and distributions, building wheels, conflicting dependencies and deprecated packages

**Errors**

- `ERROR: Could not find a version that satisfies the requirement <package-name>==<version> (from -r requirements.txt (line 1)) (from versions: none)`
- `ERROR: No matching distribution found for <package-name>==<version> (from -r requirements.txt (line 25))`
- `FileNotFoundError: [Errno 2] No such file or directory: '<directory>'`
- `ERROR: Could not install packages due to an OSError: [Errno 2] No such file or directory`
- `Failed to build <module>`
- `ERROR: Could not build wheels for <module>`
- `Building wheel for <module> (setup.py): finished with status 'error' error: subprocess-exited-with-error`
- `ERROR: Cannot install -r requirements.txt (line 2) and <package-name>==<version> because these package versions have conflicting dependencies`
- `The '<module>' PyPI package is deprecated  use '<module>'`

**Reasons**
- Misspelling name of the module
- Trying to install a built-in module which is already available in the Python installation.
- Or the package that is not supported for the Python version
- Mismatch between the module version and Python version

**Actions**
- Review if the python version is supported by the package, you can browse to [pypi.org](https://pypi.org/) and search for the package and validate `OS architecture` and `Requires Python version` from the information available.
- Check if package version is available, packages can be outdated, try with a new version instead.
- If you have firewall, sometimes pip can't reach to PyPI server, validate if you need to whitelist your ip address.
- If you have custom DNS Server also make sure your DNS resolves correctly the PyPI servers.
- Downgrade or upgrade module versions when having conflicting dependencies, check [Dependency Resolution blog](https://pip.pypa.io/en/stable/topics/dependency-resolution/).

## Kudu Parent process crashed

**Errors**
- `GetParentProcessLinux (id) failed.: Could not find a part of the path '/proc/id/stat'`

**Actions**
- Redeploy, if the issue continues, then stop the site and redeploy, then start site.
- If issue continues, scale up and down to replace the instance. 

## Module not found

> This error can occur when [deploying Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/recover-python-functions?tabs=vscode%2Cbash&pivots=python-mode-decorators#troubleshoot-modulenotfounderror) or [starting up your Python app on App Service Linux](https://azureossd.github.io/2022/11/24/Python-on-Linux-App-Service-and-ModuleNotFound-Errors/)

**Errors**
- `ModuleNotFoundError: No module named '<module-name>'`

**Reasons**
 - [The package can't be found](https://learn.microsoft.com/en-us/azure/azure-functions/recover-python-functions?tabs=vscode%2Cbash&pivots=python-mode-decorators#the-package-cant-be-found)
 - [The package isn't resolved with the proper Linux wheel](https://learn.microsoft.com/en-us/azure/azure-functions/recover-python-functions?tabs=vscode%2Cbash&pivots=python-mode-decorators#the-package-isnt-resolved-with-the-proper-linux-wheel)
 - [The package is incompatible with the Python interpreter version](https://learn.microsoft.com/en-us/azure/azure-functions/recover-python-functions?tabs=vscode%2Cbash&pivots=python-mode-decorators#the-package-is-incompatible-with-the-python-interpreter-version)
 - [The package conflicts with other packages](https://learn.microsoft.com/en-us/azure/azure-functions/recover-python-functions?tabs=vscode%2Cbash&pivots=python-mode-decorators#the-package-conflicts-with-other-packages)
 - [The package supports only Windows and macOS platforms](https://learn.microsoft.com/en-us/azure/azure-functions/recover-python-functions?tabs=vscode%2Cbash&pivots=python-mode-decorators#the-package-supports-only-windows-and-macos-platforms)

**Actions** 
- (*Applicable for Azure Functions*) - [Enable remote build](https://learn.microsoft.com/en-us/azure/azure-functions/recover-python-functions?tabs=vscode%2Cbash&pivots=python-mode-decorators#enable-remote-build)
- (*Applicable for Azure Functions*) - [Build native dependencies](https://learn.microsoft.com/en-us/azure/azure-functions/recover-python-functions?tabs=vscode%2Cbash&pivots=python-mode-decorators#build-native-dependencies)
- (*Applicable for Azure Functions*) - [Update your package to the latest version](https://learn.microsoft.com/en-us/azure/azure-functions/recover-python-functions?tabs=vscode%2Cbash&pivots=python-mode-decorators#update-your-package-to-the-latest-version)
- (*Applicable for Azure Functions*) - [Pip freeze your requirements.txt](https://learn.microsoft.com/en-us/azure/azure-functions/recover-python-functions?tabs=vscode%2Cbash&pivots=python-mode-decorators#handcraft-requirementstxt)
- (*Applicable for Azure Functions*) - [Replace the package with equivalents](https://learn.microsoft.com/en-us/azure/azure-functions/recover-python-functions?tabs=vscode%2Cbash&pivots=python-mode-decorators#replace-the-package-with-equivalents)


##  Read or Connection timeouts


**Errors**

- `ReadTimeoutError: HTTPSConnectionPool(host='files.pythonhosted.org'  port=443): Read timed out.`
- `TimeoutError: The read operation timed out`
- `Retrying (Retry(total=4  connect=None  read=None  redirect=None  status=None)) after connection broken by 'ReadTimeoutError("HTTPSConnectionPool(host='pypi.org'  port=443): Read timed out. (read timeout=15)")': <module>`
- `'Connection to <package-index-url> timed out. (connect timeout=15)')'`
- `Failed to establish a new connection: [Errno -2] Name or service not known'`

**Reasons**
- pip can't reach Python Package Index site

**Actions**
- Using VNET/ASE? Whitelist urls `pypi.org` and `files.pythonhosted.org`
- DNS resolution issues, validate using Kudu Bash `https://<site-name>.scm.azurewebsites.net/DebugConsole` and `dig`. 

  E.g.
    ```bash
    dig files.pythonhosted.org
    dig pypi.org
    ```
- SSL issues, validate using Kudu Bash `https://<site-name>.scm.azurewebsites.net/DebugConsole` and `openssl`. 

  E.g.
  
  ```bash
  openssl s_client -connect pypi.org:443
  openssl s_client -connect files.pythonhosted.org:443
  ```
- Connectivity issues, validate using Kudu Bash `https://<site-name>.scm.azurewebsites.net/DebugConsole` and `curl`.


  E.g.
  
    ```bash
    curl -vvv --ipv4 https://files.pythonhosted.org/
    ```


## Oryx build was aborted after 60 seconds

**Error**
- `oryx build ...' was aborted due to no output nor CPU activity for 60 seconds`

**Reason**
* Timeout building waiting on previous command to get a response

**Actions**
* VNET? Review connectivity to [Oryx CDN](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md#network-dependencies). Allow outbound access from the webapp to `oryx-cdn.microsoft.io` on port `443`
* Private packages? Cant pull from private registry:
    - (*Applicable for Azure Functions*) - Use appsetting `PIP_EXTRA_INDEX_URL` to define custom package index, check for [documentation details](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-python?tabs=asgi%2Capplication-level&pivots=python-mode-decorators#remote-build-with-extra-index-url) and check if `PIP_EXTRA_INDEX_URL` contains correct credentials in case of basic auth.
    - Validate connectivity to private registry
    - (*Applicable for Azure Functions*) - Last option install local packages and publish with `--no-build`, [check for documentation details](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-python?tabs=asgi%2Capplication-level&pivots=python-mode-decorators#install-local-packages).

## No space left on device issues

**Error**
- `Error: ENOSPC: no space left on device close`
- `zip I/O error: No space left on device`
- `zip error: Output file write failure (write error on zip file)`

**Reason**
* No temporary space left on the App Service Plan, this is different from what you pay for storage, this is a temporary disk space limited to containers size/files created inside a container, not persistance storage. Review [Troubleshooting No space left on device](https://azureossd.github.io/2023/04/11/troubleshooting-no-space-left-on-device/index.html).

**Actions**
* Use `App Service Diagnostics` blade in Azure Portal and review for `Linux - Host Disk Space Usage` section.  
* Scale up to get more space


## Exit code 137

**Errors**
- `Downloading <module>.whl (<size> MB) | Exit code: 137 | Please review your requirements.txt | More information: https://aka.ms/troubleshoot-python`
- `Collecting <module> | Exit code: 137 | Please review your requirements.txt | More information: https://aka.ms/troubleshoot-python`
- `"Microsoft.Azure.WebJobs.Script.Workers.WorkerProcessExitException : python exited with code 137"`

**Reasons**
- Out of memory, this applies for deployment (downloading/collecting) or post deployments (starting up application)

**Actions**
- Validate your current available memory
- If you have too many applications hosted in the same App Service Plan, isolate those into different ASPs or stop the ones not using to release memory. 
- Scale up to a higher SKU with more memory.
- Redeploy
- For post-deployment scenarios profiling is a good option.

## Exit code 128

**Errors**
*  `ERROR: Command errored out with exit status 128`

**Reason**
* Git can't clone repository defined in requirements.txt for private packages. E.g. `<package-name> @ git+https://github.com/<username>/<repository>@releases/tag/<version>`

**Actions**
* Validate if package defined in `requirements.txt` is reacheable from Kudu. 
* If you are using GitHub Actions you can set private url with access token in a step of your yaml like this:
  >Note: secrets.ACCESS_TOKEN should be inside double curly braces.
    ```yaml
        - name: Install private dependencies
        run: |
            python -m pip install --upgrade pip
            git config --global url."https://${secrets.ACCESS_TOKEN}@github".insteadOf https://github
            pip install -r requirements.txt
    ```

  and disable Orxy build removing `SCM_DO_BUILD_DURING_DEPLOYMENT` appsetting. 


## Git index lock file exists
**Error**

* `Unable to create '/home/site/repository/.git/index.lock': File exists.`

**Reason**

Whenever you run a git process, git creates an `index.lock` file within the .git directory. if you run the command `git add .` to stage all local changes within your current repository, git will create this index.lock file while the git add command is running. Upon successful completion of the git add process, the index.lock file is removed. What this does is ensure that simultaneous changes to your local git repo do not occur, as this would cause your git repo to be in an indeterminate state. The index.lock file prevents changes to your local repository from happening from outside of the currently running git process so as to ensure multiple git processes are not altering or changing the same repository internals at the same time.

**Actions**

* Remove file.lock from remote repository and also from `/home/site/repository/.git/index.lock` and redeploy

## Rsync issues
**Error** 

* `rsync: connection unexpectedly closed` 

**Reason:** 

* Rsync issues with file system or lock issues

**Actions**
- Is the application running in multiple instances? This is usually most common in this scenario when all instances are using the remote home storage and you are doing a deployment. You can stop the site and redeploy or implement best practices as [deployment slots](https://learn.microsoft.com/en-us/azure/app-service/deploy-best-practices#use-deployment-slots).


# Using External builder

When using `GitHub Actions`, `Azure DevOps`, `ZipDeploy`, `OneDeploy` is likely that you are not using `Kudu service Build (Oryx)`, instead you are building with an external service. Kudu container will consider this deployment as `External build` and extract the built assets into the home storage `/home/site/wwwroot` of you app container without building it again. 

Here are the most common things to review when dealing with deployment issues:


## Azure DevOps
- Validate how modules were built, check for `pip install` task and correlate that Azure DevOps Agent and Azure app service app has the same version.

    ```yaml
    - task: UsePythonVersion@0
      inputs:
        versionSpec: '3.11'
      displayName: 'Use Python 3.11'
    ```
- Do not include the root folder in your ArchiveFiles task

    ```yaml
    - task: ArchiveFiles@2
      displayName: 'Archive files'
      inputs:
        rootFolderOrFile: '$(projectRoot)'
        includeRootFolder: false
        archiveType: zip
        archiveFile: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
        replaceExistingArchive: true
    ```
- Review all stages inside Pipeline .yaml or classic editor tasks configuration, is the issue ocurring before deploying to Azure App Service? If yes, [enable diagnostics in Azure DevOps](https://learn.microsoft.com/en-us/azure/devops/pipelines/troubleshooting/review-logs?view=azure-devops), if not, then check for `deployment logs` using `http://<sitename>.scm.azurewebsites.net/api/dump` and review most common scenarios below and actions.

- (*Post-deployment*)  - If you selected a predefined Python template, it will create a virtual environment ` python -m venv antenv`, you will need a **custom startup script** to update `PYTHONPATH` pointing to the virtual environment site packages and start your application. 

    E.g.

    ```bash
    export PYTHONPATH=$PYTHONPATH:"/home/site/wwwroot/antenv/lib/<python-version>/site-packages" && gunicorn app:app
    ```

## GitHub Actions
> For more details information check [Deploying Python Applications using GitHub Actions](https://azureossd.github.io//2023/08/09/Deploying-Python-Applications-using-Github-Actions/index.html).

- Validate all jobs inside workflow yml file, by default Oryx is enabled with GitHub Actions with this appsetting `SCM_DO_BUILD_DURING_DEPLOYMENT = 1` to ensure same Python version dependencies, but if you decide to build in GitHub Actions you need to create a virtual environment and upload it with the zip file. Then after deployment you will need a **custom startup script** to update `PYTHONPATH` pointing to the virtual environment site packages and start your application. 

    e.g.

    ```bash
    export PYTHONPATH=$PYTHONPATH:"/home/site/wwwroot/<virtual-env-name>/lib/<python-version>/site-packages" && gunicorn app:app
    ```
- Isolate if the issue is ocurring in a specific `job or stage phases`. Is the issue ocurring before deploying to Azure App Service? 
  - If yes, download logs and enable debug logging in `GitHub Actions`
    - [Downloading logs](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/using-workflow-run-logs#downloading-logs)
    - [Enabling debug logging](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging)  
  - If not, then check for `deployment logs` using `http://<sitename>.scm.azurewebsites.net/api/dump` and review most common scenarios below and actions.


## ZipDeploy
- Validate if the zip file contains the correct application files.
- It is recommended to enable Oryx to build your dependencies, add appsetting `SCM_DO_BUILD_DURING_DEPLOYMENT = 1` and deploy.
- Review most common scenarios below and actions.

## Kudu deployment scenarios 

| Error | Reason | Actions |
| -------- | -------- | -------- |
| `Offset to Central Directory cannot be held in an Int64.`     | The zip file received by deployment engine was corrupt because of the stream timed out. This happened as Kudu site took some time to spin up and enough time was not left to download the complete zip     |  Validate files are located in zip file and redeploy. Validate also zip file size, limit is `2048 MB`   |
| `Error: ENOENT: no such file or directory  scandir `| Possible locking issue | Stop and Redeploy or try `RunFromPackage` [RunFromPackage](https://learn.microsoft.com/en-us/azure/app-service/deploy-run-package#run-the-package) if app does not require to write to disk  |
| `Error occurred type=error text=Object reference not set to an instance of an object. stackTrace=   at Kudu.Contracts.Infrastructure.LockExtensions.LockOperation` | Another operation is in progress, causing lock issues | Stop site and redeploy or use deployment slot |
| `Error: ENOSPC: no space left on device  close` | No space left on device on the App Service Plan | - Use `App Service Diagnostics` blade in Azure Portal and review for `Linux - Host Disk Space Usage` section <br> - Scale up to get more space |
| `Error: EINVAL: invalid argument  open` | Possible locking issue |  Stop and Redeploy or try `RunFromPackage` [RunFromPackage](https://learn.microsoft.com/en-us/azure/app-service/deploy-run-package#run-the-package) if app does not require to write to disk  |
| `Error: ENOENT: no such file or directory` |Possible locking issue| Stop and Redeploy or try `RunFromPackage` [RunFromPackage](https://learn.microsoft.com/en-us/azure/app-service/deploy-run-package#run-the-package) if app does not require to write to disk |

# Using RunFromPackage builder

- Is appsetting `SCM_DURING_DEPLOYMENT = TRUE`? If yes, you can't enable `Oryx build` and runfrompackage at the same time, you will need to build assets first and then do a ZipDeploy with RunFromPackage.
- Issues with read-only, multiple deployments at the same time.
- `Could not find a part of the path '/home/site/deployments/<id>/log.log'`, probably multiple deployments at the same time, stop/redeploy or use deployment slot to avoid lock issues.
- Is [AppCache](https://github.com/Azure-App-Service/KuduLite/wiki/App-Cache) enabled `WEBSITES_ENABLE_APP_CACHE=TRUE`?  If yes, you can't enable appcache and runfrompackage at the same time.

# Using Custom builder (Legacy)

- When using a [custom deployment script](https://github.com/projectkudu/kudu/wiki/Customizing-deployments), you need to validate all the commands included in `deploy.sh`, check for `pip install` and `setup virtual environment` lines. 
- Bash scripts must have Unix-style (LF) line endings! If you are developing on Windows, make sure to configure your editor properly.
- If possible use Oryx build instead and remove the files `.deployment` and `deploy.sh`

# Deploying Frameworks

You can find recommendations in how to deploy several Python frameworks using Azure DevOps, GitHub Actions or with Oryx Build, covering most common troubleshooting scenarios:
- [Django](https://azureossd.github.io/2022/02/20/Django-Deployment-on-App-Service-Linux/index.html)
- [Flask](https://azureossd.github.io/2022/02/17/Flask-Deployment-on-App-Service-Linux/index.html)


# Post Deployment scenarios

You can find a compilation of the most common issues after deployment was successful but it is not starting up your application:

- [Could not find output.tar.gz](https://azureossd.github.io/2023/03/28/Python-Depolyment-Could-Not-Find-output.tar.gz/index.html)
- [Could not open shared object file: no such file or directory](https://azureossd.github.io/2023/04/17/Python-Deployment-could-not-open-shared-object-file/index.html)
- [Failed to find attribute errors](https://azureossd.github.io/2023/01/30/Troubleshooting-'failed-to-find-attribute'-errors-on-Python-Linux-App-Services/index.html)
- [Best practices for Gunicorn configuration for different frameworks](https://azureossd.github.io/2023/01/27/Configuring-Gunicorn-worker-classes-and-other-general-settings/index.html)
- [Module not found errors](https://azureossd.github.io/2022/11/24/Python-on-Linux-App-Service-and-ModuleNotFound-Errors/index.html)
- [Cannot open shared object files](https://azureossd.github.io/2020/01/23/xgboost-library-could-not-be-loaded/index.html)


# Additional References

- [Most common scenarios when using Git to publish to App Service app](https://learn.microsoft.com/en-us/azure/app-service/deploy-local-git?tabs=cli#troubleshoot-deployment)