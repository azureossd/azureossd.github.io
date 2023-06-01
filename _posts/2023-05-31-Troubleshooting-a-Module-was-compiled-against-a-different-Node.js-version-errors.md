---
title: "Troubleshooting a 'Module was compiled against a different Nodejs version' errors"
author_name: "Keegan D'Souza"
tags:
    - Node
    - Troubleshooting
    - Linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Node # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/nodelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-05-31 12:00:00
---

This post will cover post-deployment and runtime errors where you may encounter a "Module was compiled against a different Node.js version" message.

# Prerequisites
**IMPORTANT**: Make sure App Service Logs are enabled first

- LogStream
- Retrieving logs directly from the [Kudu](https://github.com/Azure/app-service-linux-docs/blob/master/Things_You_Should_Know/things_you_should_know.md#you-can-discover-and-download-the-latest-docker-logs-using-kudu) site, or directly view/download via an FTP client
- Diagnose and Solve Problems -> Application Logs detector, Container Crash detector, or Container Issues detector

If App Service Logs are not enabled, only `docker.log` files will be generated, which will not show application related `stdout` / `stderr` and will make troubleshooting issues more complicated.

# Overview

**IMPORTANT**: This post is ideally focused on Azure App Service Linux "Blessed" images running Node.js - however, this issue can happen in **any environment** and is not limited to Azure.

--------------

Depending on the package you're installing and using in your project - and the differences of the Node.js version at "build" versus "runtime" - you may see an error like this - which can happen in any environment - such as locally, or on some other machine like a Virtual Machine, or on Azure App Service's instances. 

```
Error: The module '[some-project]\node_modules\[some-module]\bin\binding\bin\[some-module].node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 83. This version of Node.js requires
NODE_MODULE_VERSION 108. Please try re-compiling or re-installing
the module (for instance, using `npm rebuild` or `npm install`).
    at Object.Module._extensions..node (node:internal/modules/cjs/loader:1310:18)
    at Module.load (node:internal/modules/cjs/loader:1089:32)
    at Function.Module._load (node:internal/modules/cjs/loader:930:12)
    at Module.require (node:internal/modules/cjs/loader:1113:19)
    at require (node:internal/modules/cjs/helpers:103:18)
    at Object.<anonymous> (C:\Users\[User]\node_modules\[some-module]\dist\binding\index.js:6:17)
    at Module._compile (node:internal/modules/cjs/loader:1226:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1280:10)
    at Module.load (node:internal/modules/cjs/loader:1089:32)
    at Function.Module._load (node:internal/modules/cjs/loader:930:12)
```

This may happen more often with packages that rely on `node-gyp` to install or compile native C/C++ code that these packages rely on, through Node.js add-ons. For example, with packages like [bcrypt](https://www.npmjs.com/package/bcrypt) or [sharp](https://www.npmjs.com/package/sharp). 

## Why does this happen?
The main reason this happens is because the differences between the Node.js version at "build" time versus the difference of Node.js version at "runtime" when doing `npm install` (or the equivalent install command using your recommended package manager)

Ideally, both build-time and runtime versions should have the same major and minor Node.js version.

This usually ends up pointing to a `.node` file that was created under a path like `[some-project]\node_modules\[some-module]\bin\binding\bin\[some-module].node` where it was created with a different Node.js version than what it's currently being ran against.

**NOTE**: This can happen where the build version is lower than the runtime version, or vice-versa.

## What is the NODE_MODULE_VERSION
In the stack trace, you'll notice this message towards the beginning:

```
The module '[some-module]'
was compiled against a different Node.js version using
NODE_MODULE_VERSION [VERSION]. This version of Node.js requires
NODE_MODULE_VERSION [VERSION]
```

Where [VERSION] is an integer. This version number typically would point to the version it was built against versus the version it's ran against.

We can use the original message at the top of this post as an example. Here we have the following build and runtime versions in the error message:

```
The module '[some-module]'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 83. This version of Node.js requires
NODE_MODULE_VERSION 108
```

You can crosscheck the version number from the [Node.js download and releases page here](https://nodejs.org/en/download/releases). Using this page, we can see that:

- NODE_MODULE_VERSION 83 is **Node 14.x**
- NODE_MODULE_VERSION 108 is **Node 18.x**

Given this, we can tell that the error message is saying the package and other possible addons were installed and compiled against **Node 14.x** while we're actually trying to run it against **Node 18.x**. It is telling us that we need to run against the same general Node.js major version.

The download and release page gives some additional information on what `NODE_MODULE_VERSION` is used for as well:

> _NODE_MODULE_VERSION refers to the ABI (application binary interface) version number of Node.js, used to determine which versions of Node.js compiled C++ add-on binaries can be loaded in to without needing to be re-compiled. It used to be stored as hex value in earlier versions, but is now represented as an integer._

More about Node.js addons can be found [here](https://nodejs.dev/en/api/v18/addons/).

More about Application Binary Interface (ABI) can be found [here](https://nodejs.org/en/docs/guides/abi-stability) - and in this doc, we can see it calls out the intention that major versions remain the same between environments and packages that use possible addons:

_In contrast, if an application depends on a package that contains a native addon, the application has to be recompiled, reinstalled, and redeployed whenever a new major version of Node.js is introduced into the production environment._

# Resolution
In the context of deployment and runtime on Azure App Service Linux, we'll cover some possible resolutions.

## Changing the Node.js runtime version - Oryx
If you are deploying with Oryx - for example, Local Git, ZipDeploy (with Oryx Builder), or other methods that rely on Oryx to build the application - the build environment, which is done against the "Kudu" container. The Node.js version in the Kudu container should match the Node.js in the application container.

Therefor, as an example, we'll set our application to use Node 16:

![Node 16 version](/media/2023/05/azure-blog-node-modules-1.png)

We'll deploy a Nest.js application that relies on the [symbology](https://www.npmjs.com/package/symbology). This uses `node-gyp` for additional C/C++ code compilation.

We'll change the application to use Node 18 now. Note, that this does **not** reinstall any packages but in this case, simply changes the runtime version.

![Node 18 version](/media/2023/05/azure-blog-node-modules-2.png)


We'll now encounter the error described in this post:

```
PATH="$PATH:/home/site/wwwroot" node dist/main.js
Found tar.gz based node_modules.
Removing existing modules directory from root...
Extracting modules...
Done.
node:internal/modules/cjs/loader:1338
    return process.dlopen(module, path.toNamespacedPath(filename));
Error: The module '/node_modules/symbology/bin/binding/bin/symbology.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 93. This version of Node.js requires
NODE_MODULE_VERSION 108. Please try re-compiling or re-installing
the module (for instance, using `npm rebuild` or `npm install`).
        at Module._extensions..node (node:internal/modules/cjs/loader:1338:18)
        at Module.load (node:internal/modules/cjs/loader:1117:32)
        at Module._load (node:internal/modules/cjs/loader:958:12)
        at Module.require (node:internal/modules/cjs/loader:1141:19)
        at require (node:internal/modules/cjs/helpers:110:18)
        at Object.<anonymous> (/node_modules/symbology/dist/binding/index.js:6:17)
        at Module._compile (node:internal/modules/cjs/loader:1254:14)
        at Module._extensions..js (node:internal/modules/cjs/loader:1308:10)
        at Module.load (node:internal/modules/cjs/loader:1117:32)
        at Module._load (node:internal/modules/cjs/loader:958:12) {
    code: 'ERR_DLOPEN_FAILED'
}
```

In this case, `NODE_MODULE_VERSION` 93 corresponds to Node 16.x, while `NODE_MODULE_VERSION` 108 corresponds to Node 18.x. Indicating we build the application on Node 16, but trying to run this on Node 18.

**Resolution**:
- If needing to change the runtime version, redeploy the application _after_ changing to the updated Node.js version to properly rebuild any packages reliant on C/C++ code and/or addons.

## Changing the Node.js runtime and build version - Azure DevOps
In your Azure DevOps pipeline, you can use the `NodeTool` task to specify the Node.js version used for `npm install` (or `yarn`).

```yaml
- task: NodeTool@0
    inputs:
    versionSpec: '16.x'
    displayName: 'Install Node.js'

- script: |
    npm install
    npm run build --if-present
  displayName: 'npm install, build and test'
```

In the same vein as the above, if this is different than what is specified at **runtime**, you'll still encounter this `NODE_MODULE_VERSION` mismatch error.

There is the potential to specify the `linuxFxVersion` which sets the runtime of the application. For example, in the `AzureWebApp` deploy task, we want to ensure this matches what's specified as the Node.js in the pipeline, or vice-versa.

```yaml
- task: AzureWebApp@1
  displayName: 'Azure Web App Deploy: some-app'
  inputs:
    azureSubscription: $(azureSubscription)
    appType: webAppLinux
    appName: $(webAppName)
    runtimeStack: 'NODE|16-lts'
    package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
```

## Changing the Node.js runtime and build version - GitHub Actions
The same concept applies to GitHub Actions. The below task is a common way to set the Node.js version in the GitHub Actions workflow that is currently being ran:

```yaml
- name: Set up Node.js version
  uses: actions/setup-node@v1
  with:
    node-version: '18.x'

- name: npm install, build
  run: |
    npm install
    npm run build --if-present
```

We again need to ensure **this matches the running application's Node.js version**.

## ZipDeploy and FTP (without Oryx builder)
If using ZipDeploy (without Oryx) or FTP to deploy the application, this would typically mean that package installation (`npm install` or `yarn install/add`) was done locally first, and that the entirety of `node_modules` should be getting deployed along with the rest of application contents.

In this case, you would need to ensure that your **local** environment Node.js version matches what you set at **runtime** on Azure App Service.

A great tool to ensure parity between **major** versions on your local machine and App Service is to use Node Version Manager, otherwise known as `nvm`.

You can download nvm [here](https://github.com/nvm-sh/nvm) and review the documentation on how to change Node.js versions locally.

## Non-App Service environments
If this is occurring on other environments outside of Azure's App Service Linux build and runtime system, you can use one or more of the following approaches to resolve this issue:

- Ensure that there is no Node version switching when you're doing `npm install` (or relevant package manager installation)
    - Such as using two different terminals where this may be accidentally targetting two different environments
- Delete `node_modules` and `package-lock.json` (or `yarn.lock`) and attempt package installation again.
- You can attempt to rebuild the package using `npm rebuild [package] --update-binary` or just `npm rebuild [package]`

If you installed the package globally, uninstall the package with `npm uninstall -g [package]`. Otherwise, if focusing on a specific non-globally installed package, just use `npm uninstall` (or current in-use package manager equivalent).


