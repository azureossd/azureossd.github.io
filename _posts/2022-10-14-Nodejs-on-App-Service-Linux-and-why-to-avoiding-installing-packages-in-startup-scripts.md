---
title: "Nodejs on App Service Linux and why to avoid installing packages in startup scripts"
author_name: "Anthony Salemo"
tags:
    - Node
    - Linux
    - App Service
    - Configuration
    - Startup script
    - Startup command
categories:
    - Node
    - Deployment
    - Configuration
    - Development 
header:
    teaser: /assets/images/nodejslogo.png
toc: true
toc_sticky: true
date: 2022-10-14 12:00:00
---

This post is about why to avoid using a [custom startup script](https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs?pivots=platform-linux#run-custom-command) on App Service Linux with Node.js to install your npm or yarn packages and dependencies at runtime. This post will be focused on Node Blessed Images.

## Why should you avoid it?
Applications with a lot of logic being executed in initialization on restarts, or during "cold start" events, such as if being moved across instances can already introduce long start or restart times.

Adding a startup script into the equation - one that reinstalls packages, rebuilds, compiles, or others - **at runtime**, which gets executed on **each** container start - adds even more time. Regardless though, even for small applications, this can cause increased startup times.

**If possible**, the solution would be to move the logic contained in this, to more appropriate parts of development. Such as into the build itself, or into a [post or pre deployment script](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/nodejs.md#build).

### Exceptions
However, there may be times that a specific shared library (.so files) are missing, for example:
```
error while loading shared libraries: libatomic.so.1: cannot open shared object file: No such file or directory
```

In these scenarios, if not wanting to - or not able to use a custom Docker Image, using a custom startup script in these scenarios will be appropriate, since you may not be able to install these Linux based packages during build time - **when build against Oryx directly**.

However, if installing numerous Linux Based packages for missing .so files, one may still encounter longer start up times for the same reason as explained above.

## Issues
### Long start times using npm (or yarn) install, build, etc. in startup scripts
This may consume the most time on startup. Take the below example. This is a Nuxt.js application which has the following startup script:

![Node Startup Script](/media/2022/10/azure-oss-blog-node-startup-script-1.png)

`npm i && npm run start`

```
2022-10-14T18:36:48.351733102Z PATH="$PATH:/home/site/wwwroot" npm i && npm start
2022-10-14T18:36:48.390043448Z Found tar.gz based node_modules.
2022-10-14T18:36:48.390381662Z Removing existing modules directory from root...
2022-10-14T18:36:48.486176677Z Extracting modules...
2022-10-14T18:37:20.693090060Z Done.
2022-10-14T18:37:26.721965911Z npm info it worked if it ends with ok
2022-10-14T18:37:26.722261524Z npm info using npm@6.14.15
2022-10-14T18:37:26.722274824Z npm info using node@v16.14.2
2022-10-14T18:37:33.238288716Z npm info lifecycle azure-webapps-linux-node-nuxt-basic@1.0.0~preinstall: azure-webapps-linux-node-nuxt-basic@1.0.0
2022-10-14T18:37:55.606857813Z npm timing stage:loadCurrentTree Completed in 22337ms
2022-10-14T18:37:55.789792493Z npm timing stage:loadIdealTree:cloneCurrentTree Completed in 158ms
2022-10-14T18:37:55.891106936Z npm WARN read-shrinkwrap This version of npm is compatible with lockfileVersion@1, but package-lock.json was generated for lockfileVersion@2. I'll try to do my best with it!
2022-10-14T18:38:00.581919680Z npm timing stage:loadIdealTree:loadShrinkwrap Completed in 4793ms
2022-10-14T18:38:07.395425690Z npm http fetch GET 200 https://registry.npmjs.org/nan 457ms
2022-10-14T18:38:07.403550534Z npm http fetch GET 200 https://registry.npmjs.org/bindings 469ms
2022-10-14T18:38:07.613075315Z npm http fetch GET 200 https://registry.npmjs.org/nan/-/nan-2.17.0.tgz 196ms
2022-10-14T18:38:07.629404508Z npm http fetch GET 200 https://registry.npmjs.org/bindings/-/bindings-1.5.0.tgz 178ms
2022-10-14T18:38:07.805022351Z npm http fetch GET 200 https://registry.npmjs.org/file-uri-to-path 143ms
2022-10-14T18:38:07.906724162Z npm http fetch GET 200 https://registry.npmjs.org/file-uri-to-path/-/file-uri-to-path-1.0.0.tgz 82ms
.....removed lines for readability
...
..
2022-10-14T18:40:35.836717604Z npm http fetch GET 200 https://registry.npmjs.org/source-map/-/source-map-0.7.4.tgz 7322ms
2022-10-14T18:40:38.636325042Z npm http fetch GET 200 https://registry.npmjs.org/@nodelib/fs.stat/-/fs.stat-2.0.5.tgz 2840ms
.....removed lines for readability
...
.. 
```

When we look at Log Stream or Application Logs in Diagnose and Solve, we see that it's reinstalling **all** of our packages on startup, before running the site. This doesn't include typical application builds (ex., generating bundles). We can see in this example this ultimately took almost **4 minutes** just to install node_modules. 

**This is actually completely redundant**, because as through essentially any depoyment method (Local Git, ZipDeploy with Oryx as the builder, ZipDeploy without Oryx (we expect everything to be pre-built prior to deploying), DevOps pipelines, GitHub Actions, etc.) we're either:
- Building with Oryx against the Kudu site, which will contain all installed packages since it uses [this approach](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/nodejs.md#build) for build and run logic
- Pushing an artifact from a pipeline (DevOps, GitHub Actions with GitHub as the builder) as a zip which is extracted and contains all needed depedencies (since any installs and builds should have been done on the pipeline already)
- Manually pushing files (which we expected all expected dependencies are pushed as well)

So when we introduce a startup command like this - using the above deployment methods. We're essentially **unnecessarily duplicating our deployment efforts.**

#### Solution
Ensure that any typical Node.js package install or build is done during **build** time and not at **runtime**.

Below are some examples which include Local Git, Github Actions and DevOps pipelines

- [Nest Deployment on App Service Linux](https://azureossd.github.io/2022/02/11/Nest-Deployment-on-App-Service-Linux/index.html)
- [React Deployment on App Service Linux](https://azureossd.github.io/2022/02/07/React-Deployment-on-App-Service-Linux/index.html)
- [Vue Deployment on App Service Linux](https://azureossd.github.io/2022/02/11/Vue-Deployment-on-App-Service-Linux/index.html)
- [Angular Deployment on App Service Linux](https://azureossd.github.io/2022/01/29/Angular-Deployment-on-App-Service-Linux/index.html)
- [Nuxtjs Deployment with Azure DevOps Pipelines](https://azureossd.github.io/2022/01/28/Nuxtjs-Deployment-with-Azure-DevOps-Pipelines/index.html)

For certain situations when using Oryx and the [expected build files](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/nodejs.md#build) in the project root are in a different folder, you can use [KuduScript](https://github.com/projectkudu/KuduScript) to generate a quickstart custom deployment script to customize the behavior of the install or build.

> **NOTE**: This will much likely require customizing what is generated by default and is up to the developer to do this to fit their needs

For other situations where the entrypoint .js file may be in a non-typical location expected by Oryx, a custom startup command can still be used as this ideally is just to run the application.

### Permissions issues, OOM kills (JavaScript Heap OOM), Maximum call stack size exceeded and others
Trying to reinstall packages or compile the application at runtime (for example, TypeScript to JavaScript) can also present other issues. We'll list some common scenarios that may be seen:

- `npm ERR! Maximum call stack size exceeded`
- `Allocation failed - JavaScript heap out of memory`
- `eperm: operation not permitted lchown '/home/site/wwwroot/node_modules/<somePackage`

Make sure that [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) are enabled to view these failures.

For the `eperm: operation not permitted lchown:`, this is due to trying to install packages under `/home` in the **application container**, which on Blessed Images have a volume mounted to it when `WEBSITES_APP_SERVICE_ENABLE_STORAGE` is set to true ([the default for Blessed Images](https://github.com/Azure/app-service-linux-docs/blob/master/Things_You_Should_Know/things_you_should_know.md#you-can-enable-and-disable-storage-persistence-with-an-app-setting)).

Some packages may attempt to change permissions - permissions on this directory cannot be changed, which is why this happens. 

#### Solution
The solution for any of these, if installing node packages (or rebuilding) at **runtime** via custom startup script/command is the same as previously explained above.

### Missing shared libraries: xxx.so.1: and other Linux specific dependencies
Some Node packages may require C library based Linux packages being available on the filesystem. These libraries are normally `.so` files, shared libaries, that can be installed via Linux distribution based package managers (eg., `apt-get`, `apk`).

There are times these may be missing, and may present itself in various forms at **runtime** like the below:

```
node: /lib/x86_64-linux-gnu/xxx.so.6: version `xxx′ not found
```

#### Solution
The solution for these specific missing packages can go two general ways:

- Add a custom startup script and install the needed packages via package manager (`apt`, `apt-get`, or `apk`, depending on the distribution). Note that if needing to install numerous Linux packages or the packages are large, you'll end up running into the same issue described in this blog pog.
- Use a **Custom Docker Image**. Sometimes, it makes more sense to use a custom Image that you can build yourself to what your project needs. If the Linux package sizes that you're installing at runtime is adding a large amount of container startup time - then it may make more sense to include these in the custom Docker Image itself.