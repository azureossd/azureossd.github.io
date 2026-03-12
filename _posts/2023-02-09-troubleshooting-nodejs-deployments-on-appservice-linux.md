---
title: "Troubleshooting Node.js deployments on App Service Linux"
author_name: "Edison Garcia"
tags:
    - Nodejs
    - Deployments
    - Troubleshooting
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Function App
    - Nodejs # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Troubleshooting 
header:
    teaser: /assets/images/nodelinux.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-02-09 12:00:00
---

There are different ways to deploy a Node.js application to Azure App Service Linux. In this post we are covering the most common scenarios when doing deployments.

It is very important to identify if the issue is happening in the deployment process or post deployment (in startup of the application).  

# Identify the build provider 

Before starting you need to identify **where is your source code** and **which is the build provider** that you are using and **where are deployment logs**?

| Where is my source code?                   | Which is the build provider?                                                | 
| ------------------------------------------ | ------------------------------------------------------------------------    |  
| GitHub                                     | GitHub Actions or App Service Build Service (Oryx) or Azure Pipelines       |  
| Bitbucket                                  | App Service Build Service (Oryx)                                            | 
| LocalGit                                   | App Service Build Service (Oryx)                                            |
| Azure Repos                                | Azure Pipelines or App Service Build Service (Oryx)                         |
| External Git                               | App Service Build Service (Oryx) or Azure Pipelines                         |
| Local Computer (Using ZipDeploy)           | App Service Build Service (Oryx) or Building Assets locally (Basic builder) |
| Local Computer (Using RunFromPackage)      | Building Assets locally (Basic builder)                                     |
| Local Computer (Using OneDeploy)           | Building Assets locally (Basic builder)                                     |
| Local Computer (FTP)                       | No builder   

> When using `GitHub Actions`, `Azure Pipelines` or `ZipDeploy`, Oryx is not enabled by default since you are using an `External builder`. If you prefer to enable App Service Build Service (Oryx) then you need to add a new App Setting **`SCM_DO_BUILD_DURING_DEPLOYMENT`= `true`** and redeploy.
>
>When using `Local Git`, `Bitbucket` or `External Git`, Oryx is enabled by default.

## Azure JavaScript and TypeScript Functions

If you are using `Azure Functions for Visual Studio Code` extension, then it will generate a production-ready build and use zipdeploy to deploy your assets.
But you can let App Service Build provider builds the assets for you adding these two app settings:

`ENABLE_ORYX_BUILD=true`

`SCM_DO_BUILD_DURING_DEPLOYMENT=true`

# Using Oryx builder

[Oryx](https://github.com/microsoft/Oryx) is a build system which automatically compiles your source code into runnable artifacts. It is used by [App Service Linux](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md) and it is integrated as part of [Kudu](https://github.com/Azure-App-Service/KuduLite). It supports multiple runtimes, one of those is Node.js. Here is a list of the most common scenarios that can happen when building with Oryx. 

##  Issues detecting the platform or version

**Errors**

- `Could not detect any platform in the source directory.`
- `Error: Couldn't detect a version for the platform 'nodejs' in the repo.`

**Reason**

The Node.js toolset is run when the following conditions are met:

One of these files is found in the root of the repo:
- package.json
- package-lock.json
- yarn.lock

One of these files is found in the root of the repo:
- server.js
- app.js

If Oryx is not finding any condition met then it will not detect any platform or nodejs version, check [reference](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/nodejs.md#detect) for more information.

**Actions**
- Review if your files are in root folder when doing git commits and if there is any `package.json/yarn.lock` and you have any application files like `app.js, server.js` to detect a valid Node.js application.
- When doing `ZipDeploy` and using `Oryx build` check if file directories are correct inside the zip file and not having a subdirectory.

## Platform is unsupported

**Errors**

- `Platform 'nodejs' version 'xx' is unsupported.`

**Actions**
- Using a particular node.js framework defined in package.json? If yes, try the default node.js version assigned by the runtime and redeploy.
- Validate if the Node.js framework is a supported stack runtime from [Support Timeline](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/node_support.md). If this is valid then create a support case to report the issue.

## Kudu Parent process crashed

**Errors**
- `GetParentProcessLinux (id) failed.: Could not find a part of the path '/proc/id/stat'`

**Actions**
- Redeploy, if the issue continues, then stop the site and redeploy, then start site.
- If issue continues, scale up and down to replace the instance. 

##  Connection or socket time issues


**Errors**

- `npm ERR! code ERR_SOCKET_TIMEOUT`
- `info There appears to be trouble with your network connection. Retrying… ESOCKETTIMEDOUT`
- `npm ERR! syscall getaddrinfo`
- `npm ERR! network This is a problem related to network connectivity.`
- `npm ERR! errno ECONNREFUSED`

**Reasons/Actions**

| Error | Reason | Actions |
| -------- | -------- | -------- |
| - `info There appears to be trouble with your network connection. Retrying…` <br/> - `error An unexpected error occurred: 'https://registry.yarnpkg.com/<package name>.tgz: ESOCKETTIMEDOUT'.`    | If using Yarn install, there are some libraries that can take more time and can timeout after the [default value](https://yarnpkg.com/configuration/yarnrc#httpTimeout)= `60000`     |  - Detect which library is timing out <br/> - [Increase yarn timeout](https://azureossd.github.io/2023/03/24/yarn-install-timeouts-and-private-packages/index.html) <br/> - Redeploy <br/> - Build `node_modules` not using Oryx (last option)  |
| - `ERR_SOCKET_TIMEOUT` <br/> - `npm ERR! network Socket timeout` | Network connectivity issues | - VNET integrated? Allow outbound access from the webapp to [`oryx-cdn.microsoft.io`](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md#network-dependencies) on port `443` or access to npm registry <br/> - Private module? Test connectivity to that npm registry or validate location. Cant pull from private registry: `npm ERR! 404 Not Found - GET https://<url>/npm/...` <br/> --- Validate connectivity to private registry <br/> --- Check if `.npmrc` contains correct credentials <br/> --- You can define `NPM_REGISTRY_URL` appsettings to private registry or use any `Prebuild/custom build` commands  and update the token or credentials. Example: `'echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc'`  <br/> --- For Yarn, you need .yarnrc check [reference](https://joegornick.com/2019/04/15/yarn-with-private-npm-registries-and-authentication/)   <br/> - ASE? Check for internet outbound connectivity and Oryx cdn endpoint 


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



##  Angular CLI requires a minimum Nodejs version

**Error**
- `The Angular CLI requires a minimum Node.js version`

**Reason**
- Incorrect angular version for nodejs version selected

**Actions**
- Upgrade Angular dependencies to desired Node.js version
- Downgrade Node.js version if available


##  Cannot find modules or executables or commands

**Errors**
- `sh: 1: <script>: not found`
- `Error: Cannot find module`
- `command not found`
- `npm ERR!   code: 'MODULE_NOT_FOUND'`

**Reasons**
- Npm executables not generated or located in ./node_modules
- Command Permissions are missing or trying to install libraries at Kudu container level

**Actions**
- Validate your package.json and modify script location to `./node_modules/<library>/bin/<npm_executable>`, check this [reference](https://azureossd.github.io/2022/10/24/NPM-Executables-not-being-found-at-startup-on-App-Service-Linux/index.html) for more information.
- If you are using pre-post scripts from `package.json` or using `Oryx (PRE_BUILD_) and/or (POST_BUILD_) commands` or `Custom Command (CUSTOM_BUILD_COMMAND)` and installing libraries that requires `sudo permission` or elevated permissions at Kudu container level. It tends to fail since Kudu has limited permissions and not be able to install sudo or any library at the container level.
- Validate which command is failing and if this is called from `package.json`, review if this npm executable is generated in bin folder
- Is this running locally? Validate with your dev local environment


## TypeScript cannot find module name

**Errors**:
-  `Error: TS2304 cannot find name ' require'`
- `sh: 1: tsc: not found`

**Actions**:
-  Review how the library is imported, review for models or classes that are properly exported for other file. 
- It can be related to Common js interop with ES modules. 
- Review for tsconfig.json types.
- Review package.json to include typescript

##  Error installing dependencies that requires C/C++ compilation 

**Errors**
- Any error after running `node-pre-gyp install --fallback-to-build`

**Reasons**
- Dependency needs specific compiler libraries not installed in Kudu image.

**Actions**
- Identify the library that is requiring compilation, most of the times there is a missing module first.
- Can you reproduce the issue locally with same environment? If you do, please open a Suppor ticket.
- As a workaround build your app without Oryx and then ZipDeploy or try with another build agent for the moment.

## Can't find Python

**Errors**:
- `npm ERR! command sh -c node-gyp rebuild`
- `npm ERR! gyp ERR! find Python`
- `npm ERR! gyp ERR! stack Error: Could not find any Python installation to use`

**Reasons**
- Oryx will pull the runtime version based on the stack runtime preselected. If there is a particular module that requires building for a C++ binding with node-gyp, this will call Python for building and will not be available. The quick way to resolve this scenario is to build your assets locally and then do a zipdeploy.


## Failed to compile when using JavaScript frameworks

**Error**
- `Failed to compile.` after running `npm run build` using React, Angular, Vue, Nextjs, etc

**Reason**
* Mostly seen in Reactjs applications with TypeScript

**Actions**
- Identify the page or library that is failing to compile.
- Is this reproducible locally? 
- Test with other library version, reactjs version
- Review Compiler specific configuration `tsconfig.json`
- Build for production without Oryx build and just serve with PM2, check references [production build](https://azureossd.github.io/2020/04/30/run-production-build-on-app-service-linux/index.html), [PM2 serve](https://azureossd.github.io/2022/02/22/Using-PM2-on-App-Service-Linux/index.html#javascript-frameworks).

## JavaScript heap out of memory

**Error**
- `JavaScript heap out of memory`

**Reason**
* Mostly when using webpack or build assets for production

**Actions**
- Identify the library that is causing OOM when doing npm install/build
- Increase memory limit with `max_old_space_size` when building.
- Scale up if necessary and redeploy.
- Build app not using Oryx build.

## Module not compatible with nodejs version

**Errors**
- `The engine "node" is incompatible with this module`
- `error Found incompatible module`

**Reason**
* `package-lock.json` has dependencies that are not compatible with current nodejs version

**Actions**
- Identify which dependency needs upgrade to current nodejs version
- Downgrade nodejs version if possible
- Remove package.json, pull new modules and test

## Oryx build was aborted after 60 seconds

**Error**
- `oryx build ...' was aborted due to no output nor CPU activity for 60 seconds`

**Reason**
* Timeout building waiting on previous command to get a response

**Actions**
* VNET? Review connectivity to [Oryx CDN](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md#network-dependencies). Allow outbound access from the webapp to `oryx-cdn.microsoft.io` on port `443`
* Private packages? Cant pull from private registry: `npm ERR! 404 Not Found - GET https://<url>/npm/...` 
    - Validate connectivity to private registry
    - Check if `.npmrc` contains correct credentials
    - You can define `NPM_REGISTRY_URL` appsettings to private registry or use any `Prebuild/custom build` commands  and update the token or credentials. Example: `'echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc'` 
    - For Yarn, you need .yarnrc check [reference](https://joegornick.com/2019/04/15/yarn-with-private-npm-registries-and-authentication/)

## No space left on device issues

**Error**
- `Error: ENOSPC: no space left on device close`

**Reason**
* No temporary space left on the App Service Plan, this is different from what you pay for storage, this is a temporary disk space limited to containers size/files created inside a container, not persistance storage. Review [Troubleshooting No space left on device](https://azureossd.github.io/2023/04/11/troubleshooting-no-space-left-on-device/index.html).


**Actions**
* Use `App Service Diagnostics` blade in Azure Portal and review for `Linux - Host Disk Space Usage` section.  
* Scale up to get more space

## Cant resolve dependency or 404 not found

**Errors**

*  `npm ERR! code ERESOLVE`
*  `npm ERR! ERESOLVE could not resolve` 
*  `npm ERR! 404 Not Found - GET https://registry.npmjs.org/<library> - Not found`

**Reason**
* Incorrect and potentially broken dependency, likely the library doesn't exit in npm registry or has incompatibility

**Actions**
* Validate if issue is reproducible in local env
* Update dependencies with newer versions
* Try removing `package-lock.json` to install new versions (last option)
* Private packages? Cant pull from private registry: `npm ERR! 404 Not Found - GET https://<url>/npm/...` 
    - Validate connectivity to private registry
    - Check if `.npmrc` contains correct credentials
    - You can define `NPM_REGISTRY_URL` appsettings to private registry or use any `Prebuild/custom build` commands  and update the token or credentials. Example: `'echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc'` 
    - For Yarn, you need .yarnrc check [reference](https://joegornick.com/2019/04/15/yarn-with-private-npm-registries-and-authentication/)


## Git index lock file exists
**Error**

* `Unable to create '/home/site/repository/.git/index.lock': File exists.`

**Reason**

Whenever you run a git process, git creates an `index.lock` file within the .git directory. if you run the command `git add .` to stage all local changes within your current repository, git will create this index.lock file while the git add command is running. Upon successful completion of the git add process, the index.lock file is removed. What this does is ensure that simultaneous changes to your local git repo do not occur, as this would cause your git repo to be in an indeterminate state. The index.lock file prevents changes to your local repository from happening from outside of the currently running git process so as to ensure multiple git processes are not altering or changing the same repository internals at the same time.

**Actions**

* Remove file.lock from remote repository and also from `/home/site/repository/.git/index.lock` and redeploy

## Rsync issues
**Error 1** 

* `rsync: [sender] write error: Broken pipe (32` 

**Reason:** 

* If you see Broken pipes, this is related to dropping network connection or full disk space.

**Actions**

- Check network connectivity and redeploy
- Use `App Service Diagnostics` blade in Azure Portal and review for `Linux - Host Disk Space Usage` section, if disk is full then scale up to the next tier.

**Error 2** 
* `rsync: rename "/home/site/wwwroot/.main.js.YiuWwc" -> "main.js": No such file or directory (2)`

**Reason**
* Rsync issues with file system

**Actions**
- Is the application running in multiple instances? This is usually most common in this scenario when all instances are using the remote home storage and you are doing a deployment. You can stop the site and redeploy or implement best practices as [deployment slots](https://learn.microsoft.com/en-us/azure/app-service/deploy-best-practices#use-deployment-slots).


# Using External builder

When using `GitHub Actions`, `Azure DevOps`, `ZipDeploy`, `OneDeploy` is likely that you are not using `Kudu service Build (Oryx)`, instead you are building remotely. Kudu container will consider this deployment as `External build` and extract the built assets into the home storage `/home/site/wwwroot` of you app container without building it again. 

Here are the most common things to review when dealing with deployment issues:

- Validate how modules were built (check for `npm/yarn install` and/or `npm run build` commands and validate if `Node.js` version is the same as the Azure Web App)
- In case of `Azure DevOps` (Validate all stages inside Pipeline .yaml or classic editor tasks configuration)
- If `GitHub Actions` (Validate all jobs inside workflow yml file)
- Isolate if the issue is ocurring in a specific `job or stage phases`. 
- Is the issue ocurring before deploying to Azure App Service? If yes, enable logging in `Azure DevOps/GitHub Actions`, if not, then check for `deployment logs` using `http://<sitename>.scm.azurewebsites.net/api/dump` and review most common scenarios below and actions.
- If `ZipDeploy`, validate if the zip file contains the correct application files and `node_modules`
- Review most common scenarios below and actions.


| Error | Reason | Actions |
| -------- | -------- | -------- |
| `Offset to Central Directory cannot be held in an Int64.`     | The zip file received by deployment engine was corrupt because of the stream timed out. This happened as Kudu site took some time to spin up and enough time was not left to download the complete zip     |  Validate files are located in zip file and redeploy. Validate also zip file size, limit is `2048 MB`   |
| `Error: ENOENT: no such file or directory  scandir `| Possible locking issue | Stop and Redeploy or try `RunFromPackage` [RunFromPackage](https://learn.microsoft.com/en-us/azure/app-service/deploy-run-package#run-the-package) if app does not require to write to disk  |
| `Error occurred type=error text=Object reference not set to an instance of an object. stackTrace=   at Kudu.Contracts.Infrastructure.LockExtensions.LockOperation` | Another operation is in progress, causing lock issues | Stop site and redeploy or use deployment slot |
| `KuduScript 'Unable to locate node.js installation directory at ' + nodejsDi` | Kudu Nodejs Script was generated but it is not finding node executable | - Validate if basic builder is picked from azure script command <br> - Custom deployment script (Legacy)? Validate if which node.js executable is inside script <br> - Use Oryx build instead |
| `Error: ENOSPC: no space left on device  close` | No space left on device on the App Service Plan | - Use `App Service Diagnostics` blade in Azure Portal and review for `Linux - Host Disk Space Usage` section <br> - Scale up to get more space |
| `Error: EINVAL: invalid argument  open` | Possible locking issue |  Stop and Redeploy or try `RunFromPackage` [RunFromPackage](https://learn.microsoft.com/en-us/azure/app-service/deploy-run-package#run-the-package) if app does not require to write to disk  |
| `Error: ENOENT: no such file or directory` |Possible locking issue| Stop and Redeploy or try `RunFromPackage` [RunFromPackage](https://learn.microsoft.com/en-us/azure/app-service/deploy-run-package#run-the-package) if app does not require to write to disk |

# Using RunFromPackage builder


- Is appsetting `SCM_DURING_DEPLOYMENT = TRUE`? If yes, you can't enable `Oryx build` and runfrompackage at the same time, you will need to build assets first and then do a ZipDeploy with RunFromPackage.
- Issues with read-only, multiple deployments at the same time.
- `Could not find a part of the path '/home/site/deployments/<id>/log.log'`, probably multiple deployments at the same time, stop/redeploy or use deployment slot to avoid lock issues.
- Is [AppCache](https://github.com/Azure-App-Service/KuduLite/wiki/App-Cache) enabled `WEBSITES_ENABLE_APP_CACHE=TRUE`?  If yes, you can't enable appcache and runfrompackage at the same time.

# Using Custom builder (Legacy)

- When using a [custom deployment script](https://github.com/projectkudu/kudu/wiki/Customizing-deployments), you need to validate all the commands included in `deploy.sh`, check for `npm install` and `npm run build` lines. 
- Bash scripts must have Unix-style (LF) line endings! If you are developing on Windows, make sure to configure your editor properly.
- If possible use Oryx build instead and remove the files `.deployment` and `deploy.sh`

# Deploying Frameworks

You can find recommendations in how to deploy several node.js/javascript frameworks using Azure DevOps, GitHub Actions or with Oryx Build, covering most common troubleshooting scenarios:
- [ReactJS](https://azureossd.github.io/2022/02/07/React-Deployment-on-App-Service-Linux/index.html)
- [Angular](https://azureossd.github.io/2022/01/29/Angular-Deployment-on-App-Service-Linux/index.html)
- [NextJS](https://azureossd.github.io/2022/10/18/NextJS-deployment-on-App-Service-Linux/index.html)
- [NestJS](https://azureossd.github.io/2022/02/11/Nest-Deployment-on-App-Service-Linux/index.html)
- [NuxtJS](https://azureossd.github.io/2022/01/28/Nuxtjs-Deployment-with-Azure-DevOps-Pipelines/index.html)
- [Vue](https://azureossd.github.io/2022/02/11/Vue-Deployment-on-App-Service-Linux/index.html)
- [RectJS DevOps Classic Editor](https://azureossd.github.io/2021/09/21/Deploying-React.js-application-to-Azure-App-Service-with-Azure-DevOps-rule/index.html)

# Post Deployment scenarios

You can find a compilation of the most common issues after deployment was successful but it is not starting up your application:

- [Best practices for not using Development Servers on Nodejs applications and App Service Linux](https://azureossd.github.io/2022/10/26/Best-practices-for-not-using-Development-Servers-on-Nodejs-applications-and-App-Service-Linux/index.html)
- [Missing or undefined environment variables with Node on App Service Linux](https://azureossd.github.io/2022/11/14/Missing-or-undefined-environment-variables-with-Node-on-App-Service-Linux/index.html)
- [Module not found with Node on App Service Linux](https://azureossd.github.io/2022/10/25/Module-not-found-with-Node-on-App-Service-Linux/index.html)
- [NPM executables not being found on App Service Linux](https://azureossd.github.io/2022/10/24/NPM-Executables-not-being-found-at-startup-on-App-Service-Linux/index.html)
- [Nodejs on App Service Linux and why to avoid installing packages in startup scripts](https://azureossd.github.io/2022/10/14/Nodejs-on-App-Service-Linux-and-why-to-avoiding-installing-packages-in-startup-scripts/index.html)
- [Node applications on App Service Linux and getaddrinfo ENOTFOUND](https://azureossd.github.io/2022/09/30/Node-applications-on-App-Service-Linux-and-getaddrinfo-ENOTFOUND/index.html)
- [Error: ENOSPC: System limit for number of file watchers reached on Azure App Service Linux](https://azureossd.github.io/2022/09/28/ENOSPC-System-limit-for-number-of-file-watchers-reached/index.html)
- [Node.js 12 applications failing by Optional chaining](https://azureossd.github.io/2022/09/06/Nodejs-12-failing-by-Optional-Chaining/index.html)
- [Configure PM2 to start your application with a production load balancer](https://azureossd.github.io/2022/02/22/Using-PM2-on-App-Service-Linux/index.html)


# Additional References

- [Most common scenarios when using Git to publish to App Service app](https://learn.microsoft.com/en-us/azure/app-service/deploy-local-git?tabs=cli#troubleshoot-deployment)