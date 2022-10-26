---
title: "Best practices for not using Development Servers on Nodejs applications and App Service Linux"
author_name: "Anthony Salemo"
tags:
    - NPM
    - Yarn
    - Nodejs
    - Deploy
    - Development Servers
    - Production
    - SPAs
categories:
    - Azure App Service on Linux
    - Node
    - Deployment 
    - Configuration
    - Troubleshooting
header:
    teaser: /assets/images/nodelinux.png
toc: true
toc_sticky: true
date: 2022-10-26 12:00:00
---

This post will cover running Development Servers with Nodejs frameworks on App Service Linux, and some best practices for these scenarios - and how to instead properly serve applications for production without a dev server, as well as some pitfalls you may see if you try to run applications this way.

## Overview
Development Servers are great for local development - since nowadays these come with Hot Reloading/Live Reloading that do re-compilation on the fly (for any type of change, eg., CSS, .js file changes) and are almost immediately reflected in the browser - this streamlines the development process. With a lot of these servers using Webpack and Webpack Dev Server to assist in this.

However, as the name implies - these are ideally to be used **just** in development. When attempting to deploy an application that uses this into a production environment, you may see some unintended and unexpected side effects.

Development Servers are included with SPAs, such as React, Angular and Vue - and other frameworks like Gatsby, Nuxt, Nest, and others.

You can tell when a Development Server is generally being used with the output below:

```
Compiled successfully!

You can now view yourapp in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.86.49:3000

Note that the development build is not optimized.
To create a production build, use yarn build.

webpack compiled successfully
```

Using Angular as an example

```
 ****************************************************************************************
this is a simple server for use in testing or debugging angular applications locally.
it hasn't been reviewed for security issues.

don't use it for production!
 ****************************************************************************************
** angular live development server is listening on localhost:4200 open your browser on http://localhost:4200/ **
browserslist: caniuse-lite is outdated. please run next command `npm update caniuse-lite browserslist`
date: 2022-10-26t19:00:54.605z
hash: 97b00beb0edef804959d
time: 20998ms
chunk {main} main.js main.js.map (main) 23.3 kb [initial] [rendered]
chunk {polyfills} polyfills.js polyfills.js.map (polyfills) 225 kb [initial] [rendered]
chunk {runtime} runtime.js runtime.js.map (runtime) 6.08 kb [entry] [rendered]
chunk {styles} styles.js styles.js.map (styles) 1.09 mb [initial] [rendered]
chunk {vendor} vendor.js vendor.js.map (vendor) 3.75 mb [initial] [rendered]
```

Which clearly says to **not** run this in production. Other various Development Servers, not just for Node based applications - but for instance, Python and wSGI based applications, make it a point to mention to **only** run these locally.

Below we'll cover more specific issues you may see if doing this.

## Issues with running on a Development Server
Before troubleshooting - **always make sure to enable [App Service Logging](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer)**. Or else you will not be able to see your applications logging.

You can then use some of these methods for viewing logging:

- LogStream
- Retrieving logs directly from the [Kudu site](https://github.com/Azure/app-service-linux-docs/blob/master/Things_You_Should_Know/things_you_should_know.md#you-can-discover-and-download-the-latest-docker-logs-using-kudu), or directly view/download via an FTP client
- Diagnose and Solve Problems -> **Application Logs** detector, **Container Crash** detector, or **Container Issues** detector

### Container times out after deployment
One thing that can happen when trying to deploy with a development server is that it will listen on `localhost`. When deploying this to a remote server (App Service Linux), it would need to listen on all interfaces (0.0.0.0).

For example, using the Angular example above - we see this: `angular live development server is listening on localhost:4200 open your browser on http://localhost:4200/`. This would obviously fail since it wouldn't be accepting external connections. 

Depending on the development serer, you may be able to set HOST (as an environment variable (App Setting)) to 0.0.0.0. Which may resolve this, but would lead to the problems below.

### Slow performance
The Development Server for any of the above frameworks will always be slower than serving a production build. 

When running these locally, the initial page load and set up time may take a few seconds. In a remote evironment, this may be exacerbated. If this is a large project, this in itself may contribute to container timeouts on initial start up - with it ultimately report `Container failed to respond to pings on port <port>`.

A lot of this is due to the initial compiliation needing to be done. But also, if there is **any** change for these files or within the project itself that is being watched by the development server - it will reload the server, and recompile, further adding to slow performance. This is not ideal.

Using Nuxt.js Development Server as an example, we can see time was spent waiting for everything to be compiled on the Development Server reload:

```
 ╭───────────────────────────────────────────╮
   │                                           │
   │   Nuxt @ v2.15.8                          │
   │                                           │
   │   ▸ Environment: development              │
   │   ▸ Rendering:   server-side              │
   │   ▸ Target:      server                   │
   │                                           │
   │   Listening: http://192.168.86.49:8080/   │
   │                                           │
   ╰───────────────────────────────────────────╯

i Preparing project for development                                                                                                                                                       17:54:29
i Initial build may take a while                                                                                                                                                          17:54:29
i Discovered Components: .nuxt/components/readme.md                                                                                                                                       17:54:29
√ Builder initialized                                                                                                                                                                     17:54:29
√ Nuxt files generated                                                                                                                                                                    17:54:30

* Client █████████████████████████ building (44%) 284/292 modules 8 active
* Client █████████████████████████ building (44%) 288/297 modules 9 active
 babel-loader » vue-loader » vue-loader » components\NuxtLogo.vue
* Server █████████████████████████ building (16%) 55/57 modules 2 active
* Client █████████████████████████ building (44%) 288/297 modules 9 active
 babel-loader » vue-loader » vue-loader » components\NuxtLogo.vue
* Server █████████████████████████ building (17%) 60/62 modules 2 active
* Client █████████████████████████ building (44%) 289/299 modules 10 active
 vue-loader » babel-loader » vue-loader » vue-loader » components\Tutorial.vue
* Server █████████████████████████ building (17%) 61/64 modules 3 active
* Client █████████████████████████ building (44%) 290/301 modules 11 active
 node_modules\core-js\internals\ordinary-to-primitive.js
* Server █████████████████████████ building (17%) 61/64 modules 3 active
* Client █████████████████████████ building (45%) 293/302 modules 9 active
 node_modules\core-js\internals\array-slice-simple.js
* Server █████████████████████████ building (17%) 62/64 modules 2 active
* Client █████████████████████████ building (45%) 296/302 modules 6 active
 node_modules\core-js\internals\array-slice-simple.js
* Server █████████████████████████ building (17%) 62/64 modules 2 active
* Client █████████████████████████ building (46%) 301/309 modules 8 active
 node_modules\vue-style-loader\lib\listToStyles.js
* Server █████████████████████████ building (17%) 62/64 modules 2 active
* Client █████████████████████████ building (46%) 301/309 modules 8 active
 node_modules\vue-style-loader\lib\listToStyles.js
* Server █████████████████████████ after chunk graph (71%)
* Client █████████████████████████ building (46%) 301/309 modules 8 active
 node_modules\vue-style-loader\lib\listToStyles.js
* Server █████████████████████████ additional chunk assets processing (90%)
* Client █████████████████████████ building (46%) 301/309 modules 8 active
 node_modules\vue-style-loader\lib\listToStyles.js
* Server █████████████████████████ after chunk asset optimization (93%) SourceMapDevToolPlugin pages/index.js
* Client █████████████████████████ building (46%) 303/310 modules 7 active
 node_modules\core-js\internals\symbol-registry-detection.js
* Server █████████████████████████ emitting (95%) vue-server-plugin
* Client █████████████████████████ building (46%) 305/310 modules 5 active
 node_modules\core-js\internals\symbol-registry-detection.js
√ Server
* Client █████████████████████████ building (46%) 306/310 modules 4 active
 node_modules\core-js\internals\symbol-registry-detection.js
√ Server
* Client █████████████████████████ building (47%) 310/311 modules 1 active
 node_modules\process\browser.js
√ Server
* Client █████████████████████████ building (47%) 311/311 modules 0 active
√ Server
* Client █████████████████████████ sealing (70%)
√ Server
* Client █████████████████████████ chunk reviving (85%)
√ Server
* Client █████████████████████████ after hashing (88%)
√ Server
* Client █████████████████████████ additional chunk assets processing (90%)
√ Server
* Client █████████████████████████ emitting (95%) HtmlWebpackPlugin
√ Server
* Client █████████████████████████ after emitting (98%)
√ Server
√ Client
  Compiled successfully in 36.83s
√ Server
  Compiled successfully in 33.27s

i Waiting for file changes                                                                                                                                                                17:55:13
i Memory usage: 163 MB (RSS: 230 MB)                                                                                                                                                      17:55:13  
i Listening on: http://192.168.86.49:8080/      
```

This would happen on initial Development Server load - and then any possible changes that happen with the scope of this project's files will reload the development server once again. These files being watched with File Watchers ([inotify](https://en.wikipedia.org/wiki/Inotify)) can lead to problems in the next section.

### Container Crashes
At runtime, running a Development Server, especially with a large project with many files (especially under `node_modules`) on a remote host, which may be running a different host configuration - can introduce other factors. One that can potentially arise is hitting the **Error: ENOSPC: System limit for number of file watchers reached**. 

More information can be found in this blog post - [Error: ENOSPC: System limit for number of file watchers reached on Azure App Service Linux](https://azureossd.github.io/2022/09/28/ENOSPC-System-limit-for-number-of-file-watchers-reached/index.html)

Other issues at runtime which would be a direct reason of running through are various  development server are various compile time errors, such as - node-sass not supporting the current environment at compilation during runtime:

```
module build failed (from /node_modules/sass-loader/lib/loader.js):
error: node sass does not yet support your current environment: linux 64-bit with unsupported runtime (93)
```

Or this, due to JavaScript Heap hitting OOM due to compiling at runtime - which can especially occur for larger projects:

```
fatal error: ineffective mark-compacts near heap limit allocation failed - javascript heap out of memory
```

In both of these situations, we can completely avoid this with the resolution below.

## Resolution
A resolution to all of these scenarios is to avoid using the Development Server to begin with. Each stack mentioned here, and others, all have their own ways of running a proper production build.

**For SPAs**:
For SPA's, these all mostly generate a folder named `/dist`, `/build` or related - this folder contains pure client-side static content. Which is called the "production build". These builds can be served with PM2 or other production grade HTTP servers that handle serving static content.

See this official documentation for further details on these frameworks:
- [React - reactjs.org - Use the Production Build](https://reactjs.org/docs/optimizing-performance.html)
- [Angular - angular.io - Guide to Production Deployments](https://angular.io/guide/deployment)
- [Vue - vitejs.dev - Deploying a static site](https://vitejs.dev/guide/static-deploy.html)

See our blog posts for deploying these frameworks and serving them with PM2 on Nodejs with App Service Linux:

- [Vue Deployment on App Service Linux - GitHub Actions](https://azureossd.github.io/2022/02/11/Vue-Deployment-on-App-Service-Linux/index.html)
- [React Deployment on App Service Linux - GitHub Actions](https://azureossd.github.io/2022/02/07/React-Deployment-on-App-Service-Linux/index.html)
- [Angular Deployment on App Service Linux - GitHub Actions](https://azureossd.github.io/2022/01/29/Angular-Deployment-on-App-Service-Linux/index.html)


**For other frameworks**: Other frameworks have their various ways of deploying for production. Read the below to find more details on this.

- [NextJS - nextjs.org - Deployment](https://nextjs.org/docs/deployment#nodejs-server)
- [NuxtJS - nuxtjs.org - Deployments](https://nuxtjs.org/deployments/azure-portal)
- [NextJS Deployment on App Service Linux - Azure DevOps](https://azureossd.github.io/2022/10/18/NextJS-deployment-on-App-Service-Linux/index.html#azure-devops)


See our blog posts for deploying these frameworks on Nodejs with App Service Linux:

- [NextJS Deployment on App Service Linux](https://azureossd.github.io/2022/10/18/NextJS-deployment-on-App-Service-Linux/index.html)
- [Nest Deployment on App Service Linux](https://azureossd.github.io/2022/02/11/Nest-Deployment-on-App-Service-Linux/index.html)
- [Nuxtjs Deployment with App Service Linux](https://azureossd.github.io/2022/01/28/Nuxtjs-Deployment-with-Azure-DevOps-Pipelines/index.html)
 
PM2 is built into Nodejs "Blessed" Images on App Service Linux. Review this blog post on [Using PM2 on App Service Linux](https://azureossd.github.io/2022/02/22/Using-PM2-on-App-Service-Linux/index.html)

