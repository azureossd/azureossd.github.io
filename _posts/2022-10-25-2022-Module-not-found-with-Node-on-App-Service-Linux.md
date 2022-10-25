---
title: "Module not found with Node on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - NPM
    - Yarn
    - Nodejs
    - Deploy
    - Azure DevOps
    - GitHub Actions
    - Zip Deploy
categories:
    - Azure App Service on Linux
    - Node
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/nodelinux.png
toc: true
toc_sticky: true
date: 2022-10-25 12:00:00
---

This blog post will cover various reasons why you may see `error: cannot find module` on application startup, and some resolutions to these.

## Overview
At a high level, seeing `error: cannot find module [someModuleName]` means this package required by your application is missing in some form. Either simply by forgetting to add it your `package.json` or not properly building the application during deployment scenarios.

Ultimately, this will always cause the application/container to crash. To validate if you're encountering this scenario, you can check with any of the below methods:

> **IMPORTANT**: Make sure [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) are enabled first

- LogStream
- Retrieving logs directly from the [Kudu site](https://github.com/Azure/app-service-linux-docs/blob/master/Things_You_Should_Know/things_you_should_know.md#you-can-discover-and-download-the-latest-docker-logs-using-kudu), or directly view/download via an FTP client
- Diagnose and Solve Problems -> **Application Logs** detector, **Container Crash** detector, or **Container Issues** detector

## Scenarios for this to occur
When this happens, you'll see a stack trace like this:

```javascript
error: cannot find module 'express'
require stack:
- /home/site/wwwroot/index.js
    at function.module._resolvefilename (internal/modules/cjs/loader.js:815:15)
    at module.hook._require.module.require (/usr/local/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:61:29)
    at require (internal/modules/cjs/helpers.js:74:18)
    at object.<anonymous> (/home/site/wwwroot/index.js:1:17)
    at module._compile (internal/modules/cjs/loader.js:999:30)
    at object.module._extensions..js (internal/modules/cjs/loader.js:1027:10)
    at module.load (internal/modules/cjs/loader.js:863:32)
    at function.module._load (internal/modules/cjs/loader.js:708:14)
    at object.<anonymous> (/usr/local/lib/node_modules/pm2/lib/processcontainerfork.js:33:23)
    at module._compile (internal/modules/cjs/loader.js:999:30) {
        code: 'module_not_found'
        requirestack: [ '/home/site/wwwroot/index.js' ]
    }
```
In this case, `express` is the missing module - but this could happen for any module installed via package manager.

## Package is missing in package.json
The more obvious reason for this to occur is the package is missing in your `package.json`.
If you attempt to import a package that 1) doesn't exist in your `package.json` and 2) does not exist in `node_modules`, you'll receive this error. 

For example, this `package.json` doesn't have `express` and `express` is also not in `node_modules`:


```json
  "dependencies": {
    "axios": "^0.27.2",
    "concurrently": "^7.5.0"
  },
```

But we attempt to import it in our `.js` entrypoint (`server.js`):

```javascript
const express = require("express");
const port = process.env.PORT || 3000;
const app = express();
```

When we try to run this, we will get the below error:

```javascript
Error: Cannot find module 'express'
Require stack:
- /home/site/wwwroot/server.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:939:15)
    at Module._load (node:internal/modules/cjs/loader:780:27)
    at Module.require (node:internal/modules/cjs/loader:1005:19)
    at require (node:internal/modules/cjs/helpers:102:18)
    at Object. (/home/site/wwwroot/server.js:1:17)
    at Module._compile (node:internal/modules/cjs/loader:1105:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1159:10)
    at Module.load (node:internal/modules/cjs/loader:981:32)
    at Module._load (node:internal/modules/cjs/loader:827:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:77:12) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [ '/home/site/wwwroot/server.js' ]
}
```

Make sure this is included in your `package.json` - either by manually adding the missing package, or by installing it via `npm` or `yarn`.

## Deployments
### Zip Deploy (with Oryx Builder)
If you are doing a **Zip Deploy**, and need your packages to be installed by the remote builder, which is Oryx, the App Setting `SCM_DO_BUILD_DURING_DEPLOYMENT` set to `true` must be added.

![Oryx Buidler App Setting](/media/2022/10/azure-oss-blog-node-module-1.png)

As called out in the documentation [here](https://learn.microsoft.com/en-us/azure/app-service/deploy-zip?tabs=cli#enable-build-automation-for-zip-deploy) - the Zip package is assumed to be ready to run as-is. Otherwise, if you are **not** including your `node_modules` in the Zip - and do **not** have SCM_DO_BUILD_DURING_DEPLOYMENT set to true, you will run into `module not found` errors.

The resolution in these scenarios with Zip Deploy is to add the App Setting **SCM_DO_BUILD_DURING_DEPLOYMENT** to **true** and attempt a redeployment

More information on this Zip Deployment process can be found [here on the GitHub projectkudu repository](https://github.com/projectkudu/kudu/wiki/Deploying-from-a-zip-file-or-url).


### Zip Deploy, FTP (without Oryx Builder)
If you are attempting a Zip Deploy (without Oryx building your application - which means SCM_DO_BUILD_DURING_DEPLOYMENT is not set or set to false) or using FTP, and are encountering `error: module not found [somepackage]` errors, then ensure that **all** of your `node_modules` required by your package are included in the zip file being deployed.

This is in conjunction with ensuring the dependency exists in your `package.json`

In these scenarios, where Zip Deploy (without Oryx Builder) is being attempted - you **must** include your applications `node_modules` in the zip file being deployed. As well as ensuring required dependencies exist in your `package.json`.

### Local Git, VSCode Extension
If deploying via Local Git or the VSCode extension (which also builds with Oryx) - and you are noticing that modules are missing at runtime. Ensure the following:

- That you are deploying from the root of your project **relative** to your `package.json`. If you are deploying from **outside** your main project folder (such as a parent folder on accident), then [Oryx will not know how to build your application](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/nodejs.md#build) and you'll likely encounter `module not found` and an error stating `nodejs not found in the repo`.

```
 |--- (C:\Documents) parent folder
    |--- (C:\Documents\azure-webapp-site) project folder 
        |-- package.json
        |-- package-lock.json
        |-- server.js
```

- Validate that packages are actually being installed via the stdout from your terminal (or in VSCode in the **Output** tab)

  ![Terminal tab](/media/2022/10/azure-oss-blog-node-module-2.png)

  You should see the below output in your terminal when deploying from either of these methods. Seeing that **Oryx Build** is being ran and that npm (or yarn, if a `yarn.lock` is detected in your repo) install is shown in this stdout can ensure that these modules are properly being installed:

  ```
  Compressing objects: 100% (86/86), done.
  Writing objects: 100% (99/99), 31.19 KiB | 1.48 MiB/s, done.
  Total 99 (delta 44), reused 0 (delta 0), pack-reused 0
  remote: Deploy Async
  remote: Updating branch 'master'.
  remote: Updating submodules.
  remote: Preparing deployment for commit id '2c515ba797'.
  remote: PreDeployment: context.CleanOutputPath False
  remote: PreDeployment: context.OutputPath /home/site/wwwroot
  remote: Repository path is /home/site/repository
  remote: Running oryx build...
  remote: .
  remote: Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
  remote: You can report issues at https://github.com/Microsoft/Oryx/issues
  remote: 
  remote: Oryx Version: 0.2.20220825.1, Commit: 24032445dbf7bf6ef068688f1b123a7144453b7f, ReleaseTagName: 20220825.1
  remote: 
  remote: Build Operation ID: |WFys0bgBs/w=.bdb0fc33_
  remote: Repository Commit : 2c515ba797aa044999694ca1a534c2631b006f17
  remote: 
  remote: Detecting platforms...
  remote: ...
  remote: Detected following platforms:
  remote:   nodejs: 18.2.0
  remote: Version '18.2.0' of platform 'nodejs' is not installed. Generating script to install it...
  remote: 
  remote: Using intermediate directory '/tmp/8dab6cf7cb8e5bd'.
  remote:
  remote: Copying files to the intermediate directory...
  remote: Done in 0 sec(s).
  remote:
  remote: Source directory     : /tmp/8dab6cf7cb8e5bd
  remote: Destination directory: /home/site/wwwroot
  remote:
  remote:
  remote: Downloading and extracting 'nodejs' version '18.2.0' to '/tmp/oryx/platforms/nodejs/18.2.0'...
  remote: Detected image debian flavor: bullseye.
  remote: Downloaded in 2 sec(s).
  remote: Verifying checksum...
  remote: Extracting contents...
  remote: ..............
  remote: performing sha512 checksum for: nodejs...
  remote: .
  remote: Done in 26 sec(s).
  remote: 
  remote: Removing existing manifest file
  remote: Creating directory for command manifest file if it does not exist
  remote: Creating a manifest file...
  remote: Node Build Command Manifest file created.
  remote: 
  remote: Using Node version:
  remote: v18.2.0
  remote: 
  remote: Using Npm version:
  remote: 8.9.0
  remote: 
  remote: npm notice
  remote: added 36 packages, and audited 37 packages in 1m
  remote: npm notice New minor version of npm available! 8.9.0 -> 8.19.2
  remote: npm notice Changelog: <https://github.com/npm/cli/releases/tag/v8.19.2>
  remote: npm notice Run `npm install -g npm@8.19.2` to update!
  remote: 
  remote: npm notice
  remote: 8 packages are looking for funding
  remote:   run `npm fund` for details
  remote: 
  remote: found 0 vulnerabilities
  remote: 
  remote: Zipping existing node_modules folder...
  remote: ......
  remote: Done in 10 sec(s).
  ```

  And as mentioned before, check to ensure that all required dependencies are also in your `package.json`.

The App Setting **SCM_DO_BUILD_DURING_DEPLOYMENT** for remote builds is inferred to be **true**, which is why in these scenarios it does not need to be explicitly set. However, check that this is not set to **false** when doing remote builds, otherwise you will encounter `module not found` errors since packages will never be installed.

If you are noticing that Oryx Build is not being ran and packages are not being installed, while yet deploying from a place relative to your `package.json` (and all above points are valid) - try setting **SCM_DO_BUILD_DURING_DEPLOYMENT** to **true**.

## GitHub Actions (GitHub Builder)
When using pipeline based approaches, it is generally assuming that any package installations and application compiling/transpiling, etc. will be done on the pipeline itself.

Therefor it is important you check these following points:

- `npm install` or `yarn install` (or your package manager equivalent) is ran in the Actions workflow
- If using multi-stage workflows (build, deploy stages), make sure that the artifact being uploaded between stages (to the deploy stage) actually contains the `node_modules` required by your application
- The artifact being deployed to the Kudu site (which uses Zip Deploy by default) needs to have your fully built application within it (all `node_modules` and application code). This was also explained above in the Zip Deploy (without Oryx Builder) section.
- The OS type of the pipeline should match the OS type of the application (eg., GitHub Actions using `runs-on: ubuntu-latest` - when deploying to a Linux App Service). This is to avoid any edge-case errors where packages are installed/ran on varying operating systems which may fail to load them. 
- Ensure no parts of the pipeline are failing which may cause the application to be partially built out.

The default template used for Node App Service applications includes this approach by design. The below is a simplified example of making sure all of the above points are met:

```yaml
steps:
- uses: actions/checkout@v2

- name: Set up Node.js version
    uses: actions/setup-node@v1
    with:
    node-version: '18.x'

- name: npm install and build
    run: |
    npm install
    npm run build --if-present

- name: Zip all files for upload between jobs
    # IMPORTANT: .next is a hidden folder and will NOT be included in the zip unless we specify it
    run: zip next.zip ./* .next -qr
        
- name: Upload artifact for deployment job
    uses: actions/upload-artifact@v2
    with:
    name: node-app
    path: next.zip

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
        name: node-app

    - name: 'Deploy to Azure Web App'
        id: deploy-to-webapp
        uses: azure/webapps-deploy@v2
        with:
        app-name: 'sampleapp'
        slot-name: 'Production'
        publish-profile: $
        package: next.zip
```

A likely issue here, if encountering `module not found` errors is the fact that a `npm` or `yarn` install was never ran on the GitHub Actions workflow - or - it was never included in the zip being published to the Kudu site.

To validate if this is occurring, you must go to the GitHub Actions workflow itself and view the logging there on the GitHub side.

You can correlate the logging from the App Service side to see what package(s) may have been missing.

For more examples of GitHub Action workflows that ensure packages are installed and deployed, see these posts:

- [NextJS Deployment on App Service Linux - GitHub Actions](https://azureossd.github.io/2022/10/18/NextJS-deployment-on-App-Service-Linux/index.html#github-actions)
- [Vue Deployment on App Service Linux - GitHub Actions](https://azureossd.github.io/2022/02/11/Vue-Deployment-on-App-Service-Linux/index.html#github-actions)
- [Nest Deployment on App Service Linux - GitHub Actions](https://azureossd.github.io/2022/02/11/Nest-Deployment-on-App-Service-Linux/index.html#github-actions)
- [React Deployment on App Service Linux - GitHub Actions](https://azureossd.github.io/2022/02/07/React-Deployment-on-App-Service-Linux/index.html#github-actions)
- [Angular Deployment on App Service Linux - GitHub Actions](https://azureossd.github.io/2022/01/29/Angular-Deployment-on-App-Service-Linux/index.html)

If you are choosing to publish the zip to the Kudu side via a deployment task without wanting to build the application on the pipeline - then follow the steps in the **Zip Deploy (with Oryx Builder)** section.

## DevOps pipelines
**This largely follows the GitHub Actions approach to troubleshooting `module not found errors`.**

When using pipeline based approaches, it is generally assuming that any package installations and application compiling/transpiling, etc. will be done on the pipeline itself.

Therefor it is important you check these following points:

- `npm install` or `yarn install` (or your package manager equivalent) is ran in the DevOps pipeline
- If using multi-stage pipelines (build, deploy stages), make sure that the artifact being uploaded between stages (to the deploy stage) actually contains the `node_modules` required by your application
- The artifact being deployed to the Kudu site (which uses Zip Deploy by default) needs to have your fully built application within it (all `node_modules` and application code). This was also explained above in the Zip Deploy (without Oryx Builder) section.
- The OS type of the pipeline should match the OS type of the application (eg., DevOps pipelines using `pool: ubuntu-latest` - when deploying to a Linux App Service). This is to avoid any edge-case errors where packages are installed/ran on varying operating systems which may fail to load them. 
- Ensure no parts of the pipeline are failing which may cause the application to be partially built out.

The default template used for Node App Service applications includes this approach by design. The below is a simplified example of making sure all of the above points are met:

```yaml
# Agent VM image name
    vmImageName: 'ubuntu-latest'

    stages:
    - stage: Build
    displayName: Build stage
    jobs:
    - job: Build
        displayName: Build
        pool:
        vmImage: $(vmImageName)

        steps:
        - task: NodeTool@0
        inputs:
            versionSpec: '18.x'
        displayName: 'Install Node.js'

        - script: |
            npm install
            npm run build --if-present
        displayName: 'npm install and build'

        - task: ArchiveFiles@2
        displayName: 'Archive files'
        inputs:
            rootFolderOrFile: '$(System.DefaultWorkingDirectory)'
            includeRootFolder: false
            archiveType: zip
            archiveFile: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
            replaceExistingArchive: true

        - upload: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
        artifact: drop

    - stage: Deploy
    displayName: Deploy stage
    dependsOn: Build
    condition: succeeded()
    jobs:
    - deployment: Deploy
        displayName: Deploy
        environment: $(environmentName)
        pool:
        vmImage: $(vmImageName)
        strategy:
        runOnce:
            deploy:
            steps:
            - task: AzureWebApp@1
                displayName: 'Azure Web App Deploy: sitename'
                inputs:
                azureSubscription: $(azureSubscription)
                appType: webAppLinux
                appName: $(webAppName)
                package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
```

A likely issue here, if encountering `module not found` errors is the fact that a `npm` or `yarn` install was never ran on the DevOps pipeline - or - it was never included in the zip being published to the Kudu site.

To validate if this is occurring, you must go to the DevOps pipeline itself and view the logging there on the pipeline side.

You can correlate the logging from the App Service side to see what package(s) may have been missing.

For more examples of DevOps pipelines that ensure packages are installed and deployed, see these posts:

- [NextJS Deployment on App Service Linux - Azure DevOps](https://azureossd.github.io/2022/10/18/NextJS-deployment-on-App-Service-Linux/index.html#azure-devops)
- [Vue Deployment on App Service Linux - Azure DevOps](https://azureossd.github.io/2022/02/11/Vue-Deployment-on-App-Service-Linux/index.html#azure-devops)
- [Nest Deployment on App Service Linux - Azure DevOps](https://azureossd.github.io/2022/02/11/Nest-Deployment-on-App-Service-Linux/index.html#azure-devops)
- [React Deployment on App Service Linux - Azure DevOps](https://azureossd.github.io/2022/02/07/React-Deployment-on-App-Service-Linux/index.html#azure-devops)
- [Angular Deployment on App Service Linux - Azure DevOps](https://azureossd.github.io/2022/01/29/Angular-Deployment-on-App-Service-Linux/index.html#azure-devops)
- [Nuxtjs Deployment with Azure DevOps Pipelines](https://azureossd.github.io/2022/01/28/Nuxtjs-Deployment-with-Azure-DevOps-Pipelines/index.html)

If you are choosing to publish the zip to the Kudu side via a deployment task without wanting to build the application on the pipeline - then follow the steps in the **Zip Deploy (with Oryx Builder)** section.

## Missing shared libraries (cannot open shared object file: no such file or directory)
There are times your Node packages may rely on Shared Libraries (.so files) that are expected to exist on the current distribution. In this case, since App Service Linux runs in Docker Containers, the distribution and the OS this is built off of would be expected to have these `.so` files (if needed)

You may see these present themselves at runtime, like the following (these are just examples):

- `error: libpng12.so.0: cannot open shared object file: no such file or directory`
- `error while loading shared libraries: libatomic.so.1: cannot open shared object file: No such file or directory`
- `libnnz21.so: cannot open shared object file: no such file or directory`

etc. 

This would mean that there is a Node package in your application which has a dependency on a Linux Shared Library which is missing in the Docker Image.

If you encounter this, there can be two general paths to resolution:

- **Custom Startup Script**
  - You can follow this blog post - [Azure App Service Linux - Custom Startup Script for Nodejs & Python](https://azureossd.github.io/2020/01/23/custom-startup-for-nodejs-python/index.html) - on how to implement this. **It's important to note that each `.so` may require various Linux-based dependencies to be fully installed.** Check the `.so` file in question to see what other Linux dependencies may be required for it.

- **Custom Docker Image**
  - If the dependency in question causes issues with installing (eg., too many dependencies needed, too long of install time - as seen in this post [Nodejs on App Service Linux and why to avoid installing packages in startup scripts](https://azureossd.github.io/2022/10/14/Nodejs-on-App-Service-Linux-and-why-to-avoiding-installing-packages-in-startup-scripts/index.html)) it may then make more sense to package your application into a custom Docker Image where these depedencies can be included through various means (specific base images, or in the Dockerfile through installation, for example). Which would resolve the issue with the missing `.so` your Node package is dependent on.

## Module Not Found due to missing symlinks
This error may also appear - which will have the `requireStack` pointing to `node_module/.bin` - such as this:

```
requireStack: [ '/home/site/wwwroot/node_modules/.bin/<somepackage>
```

Which closely looks like the one talked about in this blog post. **However, this is fundamentally different.** Read this blog post [here](https://azureossd.github.io/2022/10/24/NPM-Executables-not-being-found-at-startup-on-App-Service-Linux/index.html) for further details.
