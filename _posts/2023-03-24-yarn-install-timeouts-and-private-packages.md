---
title: "Yarn install timeouts and private packages on App Service Linux"
author_name: "Edison Garcia"
tags:
    - Yarn
    - Nodejs
    - Deployment
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Nodejs # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Troubleshooting # Django, Spring Boot, CodeIgnitor, ExpressJS
header:
    teaser: "/assets/images/nodelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-03-24 12:00:00
---

If you decide to use `App Service Build` named [Oryx](https://github.com/microsoft/Oryx) to build your source code into runnable artifacts and you have a `package.json` and `yarn.lock` in your application files, then Oryx will run `yarn install` as part of the `Detection` phase described [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/nodejs.md#detect).

# ESOCKETTIMEDOUT
When running `yarn install`, there are some large libraries that can take more time and can hit the default timeout limit after `60000` miliseconds, causing a similar error like this:


```bash
    remote: yarn install v1.22.15
    remote: [1/4] Resolving packages...
    remote: [2/4] Fetching packages...
    remote: ..........................
    remote: info There appears to be trouble with your network connection. Retrying...
    remote: .............................
    remote: info There appears to be trouble with your network connection. Retrying...
    remote: .............................
    remote: info There appears to be trouble with your network connection. Retrying...
    remote: ........................
    remote: info There appears to be trouble with your network connection. Retrying...
    remote: info There appears to be trouble with your network connection. Retrying...
    remote: ..........................................
    remote: info If you think this is a bug, please open a bug report with the information provided in "/tmp/8db2c7a3fb356c7/yarn-error.log".
    remote: error An unexpected error occurred: "https://registry.yarnpkg.com/<package>/<package-name>/-/<package-name>-6.3.0.tgz: ESOCKETTIMEDOUT".
    remote: info Visit https://yarnpkg.com/en/docs/cli/install for documentation about this command.
    remote: info There appears to be trouble with your network connection. Retrying...
    remote: .....................................................................................................................................................................................................................................................................................................................................
    remote: info There appears to be trouble with your network connection. Retrying...
    remote: ..................................
    remote:
    remote: Generating summary of Oryx build
    remote: Parsing the build logs
    remote: Found 0 issue(s)
    remote:
    remote: Build Summary :
    remote: ===============
    remote: Errors (0)
    remote: Warnings (0)
    remote:
    remote: Deployment Failed. deployer =  deploymentPath =
```

There are two different ways to troubleshoot this error:

1. Add an App Setting **`YARN_TIMEOUT_CONFIG=<miliseconds>`**, (E.g. YARN_TIMEOUT_CONFIG=100000) and redeploy.
2. Add a `.yarnrc` or `yarnrc.yml` file, check [Fix Yarn ESOCKETTIMEDOUT with .yarnrc Configuration File](https://azureossd.github.io/2022/09/10/fix-yarn-ESOCKETTIMEDOUT-with-.yarnrc-configuration-file/index.html) for steps between different yarn versions and redeploy.

# Private packages

By default yarn will pull from `registry.yarnpkg.com` to install the packages defined in `package.json` or `package-lock.json`, if there are private packages, yarn won't to be able to connect to the private registry if you don't have the correct credentials and likely will throw the following error:

**`error An unexpected error occurred: "https://<private-url>/npm/registry/<package>/<package-name>.x.x.tgz: Request failed \"401 Unauthorized\"".`**

Here are some steps you can try:

- Validate connectivity to private registry.
- Check if `.npmrc` contains correct credentials 
- If using npm install, you can define `NPM_REGISTRY_URL` appsetting to set the private registry and use `.npmrc` for token credentials. 
- If you are using GitHub to store your private package, you will need to set your username and personal auth token inside a `.npmrc` file:

```bash
registry=https://registry.yarnpkg.com/

@GITHUB_USERNAME:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=AUTH_TOKEN
always-auth=true
```
- For Yarn, you also need to define the registry in a `.yarnrc` file, check [reference](https://joegornick.com/2019/04/15/yarn-with-private-npm-registries-and-authentication/).

# Additional References

- [Using modern Yarn for deployments on App Service Linux](https://azureossd.github.io/2022/08/10/Using-modern-Yarn-for-deployment-with-Node.js-on-Azure-App-Service/index.html)