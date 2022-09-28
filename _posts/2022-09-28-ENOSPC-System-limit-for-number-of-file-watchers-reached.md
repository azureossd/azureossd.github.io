---
title: "Error: ENOSPC: System limit for number of file watchers reached on Azure App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Node
    - Linux
    - App Service
    - Configuration
    - ENOSPC
categories:
    - Node
    - Development 
header:
    teaser: /assets/images/nodejslogo.png
toc: true
toc_sticky: true
date: 2022-09-28 12:00:00
---

When developing JavaScript-based applications on App Service Linux, notably ones that also come with a development server (e.x, with "hot-reloading"/"live-reloading", or ones that use webpack) you may encounter and error when trying to start the application:

```
Error: ENOSPC: System limit for number of file watchers reached, watch '/home/site/wwwroot/public'
    at FSWatcher.<computed> (node:internal/fs/watchers:244:19)
    at Object.watch (node:fs:2251:34)
    at createFsWatchInstance (/home/site/wwwroot/node_modules/webpack-dev-server/node_modules/chokidar/lib/nodefs-handler.js:38:15)
    at setFsWatchListener (/home/site/wwwroot/node_modules/webpack-dev-server/node_modules/chokidar/lib/nodefs-handler.js:81:15)
    at FSWatcher.NodeFsHandler._watchWithNodeFs (/home/site/wwwroot/node_modules/webpack-dev-server/node_modules/chokidar/lib/nodefs-handler.js:233:14)
    at FSWatcher.NodeFsHandler._handleDir (/home/site/wwwroot/node_modules/webpack-dev-server/node_modules/chokidar/lib/nodefs-handler.js:429:19)
    at FSWatcher.<anonymous> (/home/site/wwwroot/node_modules/webpack-dev-server/node_modules/chokidar/lib/nodefs-handler.js:477:19)
    at FSWatcher.<anonymous> (/home/site/wwwroot/node_modules/webpack-dev-server/node_modules/chokidar/lib/nodefs-handler.js:482:16)
    at FSReqCallback.oncomplete (node:fs:199:5)
    at FSReqCallback.callbackTrampoline (node:internal/async_hooks:130:17)
Emitted 'error' event on FSWatcher instance at:
    at FSWatcher._handleError (/home/site/wwwroot/node_modules/webpack-dev-server/node_modules/chokidar/index.js:260:10)
    at createFsWatchInstance (/home/site/wwwroot/node_modules/webpack-dev-server/node_modules/chokidar/lib/nodefs-handler.js:40:5)
    at setFsWatchListener (/home/site/wwwroot/node_modules/webpack-dev-server/node_modules/chokidar/lib/nodefs-handler.js:81:15)
    [... lines matching original stack trace ...]
    at FSReqCallback.callbackTrampoline (node:internal/async_hooks:130:17) {
        errno: -28,
        syscall: 'watch',
        code: 'ENOSPC',
        path: '/home/site/wwwroot/public',
        filename: '/home/site/wwwroot/public'
}
```

This is **especially** common with SPA's (Single Page Applications), such as React, Angular, Vue, and others that use the same approach as these libraries/frameworks.

More than likely, preceeding this, you'll see that the **development** server is actually being ran. You can tell this is the case by making sure [App Service Logging](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) is enabled:

```
npm start
npm info it worked if it ends with ok
npm info using npm@6.14.15
npm info using node@v16.14.2
npm info lifecycle somesite@8.0.37~prestart: somesite@8.0.37
npm info lifecycle somesite@8.0.37~start: somesite@8.0.37
> somesite@8.0.37 start /home/site/wwwroot
> react-scripts start

[34mℹ[39m [90m｢wds｣[39m: Project is running at http://172.16.2.2/
[34mℹ[39m [90m｢wds｣[39m: webpack output is served from /portal
[34mℹ[39m [90m｢wds｣[39m: Content not from webpack is served from /home/site/wwwroot/public
[34mℹ[39m [90m｢wds｣[39m: 404s will fallback to /portal/
Starting the development server...
```

## Why does this happen?
The **ultimate** reason this is happening is because said person is deploying this application to be ran on it's development server. This is **NOT** recommended, for other reasons such as:
- Poor performance. These development servers are never intended to be ran in production (as described by the name, and also these libraries usually make sure to call this out when starting the development server)
   - Very long start up times
- Security
- Development servers when using hot-reloading/live-reloading will watch directories and files within for changes. If any files happen to change, this will reload the server.

There are system limits in places from an OS perpspective on the number of files that can be watched and monitored for changes. On Linux, [inotify](https://en.wikipedia.org/wiki/Inotify) is used under the hood when the development server is used to help monitor for these changes.

For Ubuntu/Debian based distributions, this can be checked with the following through App Service Linux SSH or Kudu Bash:

```
cat /proc/sys/fs/inotify/max_user_watches
```

**IMPORTANT**:
Do not try to increase this as the resolution to the problem. The above is a simple way to check the current limit.

## How to fix this
### Build for production
Depending on the library/framework you're using - **build the application for production**. This usually involves generating a folder with pure static/bundled files.

If using React or Vue, you may use the following in your project:

`npm run build` (or `yarn build`). This creates output like the below (depending on the library/framework, the build folder may be named `build`, `dist` or related).

![React Static Build](/media/2022/09/azure-oss-enospc-1.png)

> **NOTE**: The contents of the production build folder may look different for your project

Angular projects would normally use `ng build` - [documentation](https://angular.io/guide/build).

For more on creating a production build with React - see [here](https://create-react-app.dev/docs/production-build/). For Vue applications, see [here](https://vuejs.org/guide/best-practices/production-deployment.html).

### Serve for production
This build folder should now be served with something like PM2 - see this [blog post](https://azureossd.github.io/2022/02/22/Using-PM2-on-App-Service-Linux/index.html#javascript-frameworks) on how to configure this. When serving this build folder, all the content is **static**, and will not change (unless it's decided to be rebuilt, normally during deployment). Using something like PM2 to serve the content, it is **not** looking for any changes like a development server.  

This is the difference between running a development server, where the server is watching for changes and what's being served is not built for production and may be dynamic still.





