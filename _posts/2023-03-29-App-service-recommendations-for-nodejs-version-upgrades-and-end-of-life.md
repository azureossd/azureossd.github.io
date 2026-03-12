---
title: "App Service recommendations for Node.js version upgrades and end of life"
author_name: "Edison Garcia"
tags:
    - EOF
    - Nodejs
    - Migration
categories:
    - Azure App Service on Linux, Azure App Service on Windows #, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Nodejs # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Configuration # Django, Spring Boot, CodeIgnitor, ExpressJS
header:
    teaser: "/assets/images/nodelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-03-29 12:00:00
---

It is really important to keep Node.js version up to date. Newer versions will contain new features, bug fixes and security updates. There are three phases that a Node.js release can be in: **Current**, **Active Long Term Support (LTS)**, and **Maintenance** and you can check the **End Of Life (EOL)** dates of each version in the [Node.js Release schedule](https://github.com/nodejs/release#release-schedule). 

## App Service recommendations

In App Service, Node.js patch updates are installed side by side with the existing versions. You can check the [Support Timeline](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/node_support.md#support-timeline) and the OS Support for existing versions. 

Once a version of Node.js has reached it's end of life (EOL) it will no longer be available from Runtime Stack selection dropdown.

**Existing applications configured to target a runtime version that has reached EOL should not be affected**, although it is recommended to review the differences between node.js versions and migrate your application to the next supported LTS version available.

Here are some recommendatios to take in consideration:

1. Select the Node.js LTS version you want to update from [Release schedule](https://github.com/nodejs/release#release-schedule).
2. If you have a local environment you can use any node version manager and switch to that version. e.g. (using nvm) 
    
    `nvm install <version>`

    `nvm use <version>`

3. Run `npm install` or `npm ci` to check for any incompatiblity issues when installing modules. If you get any of the following errors:
    - `The engine "node" is incompatible with this module`
    - `error Found incompatible module`

    That means that your `package-lock.json` has dependencies that are not compatible with current Node.js version.

    **Actions**:
        
    - Identify which dependency needs upgrade to current node.js version, usually it will appear on the error log.
    - Once you detected the module that is failing, you can search that module in the [npm registry](https://www.npmjs.com/) to find the current tags, version history and Github repository. Usually the owners of these modules write down the compatibility information in docs. 
    - Most of the npm modules are following the **Semantic Versioning**, you can select the new module version based in `MAJOR.MINOR.PATCH` increment the:
        - `MAJOR version` when you make incompatible API changes,
        - `MINOR version` when you add functionality in a backwards compatible manner
        - `PATCH version` when you make backwards compatible bug fixes.
    - Test your application with the new module version.
4. Sometimes when you are using existing `node_modules` folder and just change `Node.js versions` without reinstalling modules or rebuilding assets, you can get the following errors:

    ```bash
    Error: The module <module> was compiled against a different Node.js version using 
    NODE_MODULE_VERSION <version>. This version of Node.js requires
    NODE_MODULE_VERSION <version>. Please try re-compiling or re-installing
    the module (for instance, using `npm rebuild` or `npm install`).
    ```

    **`NODE_MODULE_VERSION`** refers to the ABI (application binary interface) version number of Node.js, used to determine which versions of Node.js compiled C++ add-on binaries can be loaded in to without needing to be re-compiled. It used to be stored as hex value in earlier versions, but is now represented as an integer. 
    
    **Actions**:
    - Get familiar with the current node module version and npm version in this [reference](https://nodejs.org/en/download/releases#looking-for-latest-release-of-a-version-branch).
    - Run `npm install` or `npm ci` to reinstall modules and/or `npm run build` to build your assets. 
    - Follow step 3 if you find any incompatiblity issues.
5. Test your application and validate if your application is not throwing any error at startup or runtime phases. For JavaScript frameworks you can use the `Web Developer tools - Console` from your browser to validate exceptions or deprecation warnings.
6. It is recommended to follow the **[App Service deployment best practices](https://learn.microsoft.com/en-us/azure/app-service/deploy-best-practices)** to have an efficient deployment and migration update, as using deployment/stating slots for testing before switching to production. To update your app to target a different version of Node in App Service (Windows and Linux), you can follow this [article](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/node_support.md#how-to-update-your-app-to-target-a-different-version-of-node).
    - If you are using **App Service Windows** review [Avoiding hardcoding Node versions on App Service Windows](https://azureossd.github.io/2022/06/24/Avoiding-hardcoding-Node-versions-on-App-Service-Windows/index.html).
7. If you are using Azure DevOps, GitHub Actions or any other automation provider, make sure to change the node.js version in the pipelines to match the runtime version. 
8. Redeploy your application and validate.
9. Always check for updates in [Node.js - Vulnerability blog](https://nodejs.org/en/blog/vulnerability) to keep your applications secured.

## Additional References
- [OS and runtime patching in Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/overview-patch-os-runtime)
- [Node.js support on App Service](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/node_support.md#nodejs-on-app-service)
- [How do I change the version of the Node.js application that is hosted in App Service Windows?](https://learn.microsoft.com/en-us/troubleshoot/azure/app-service/web-apps-open-source-technologies-faqs#how-do-i-change-the-version-of-the-nodejs-application-that-is-hosted-in-app-service)
- [Avoiding hardcoding Node versions on App Service Windows](https://-azureossd.github.io/2022/06/24/Avoiding-hardcoding-Node-versions-on-App-Service-Windows/index.html)
