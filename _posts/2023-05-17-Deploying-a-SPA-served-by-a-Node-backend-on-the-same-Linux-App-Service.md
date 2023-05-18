---
title: "Deploying a SPA served by a Node backend on the same Linux App Service"
author_name: "Anthony Salemo"
tags:
    - Nodejs
    - Deployments
    - Troubleshooting
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration
    - Nodejs # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Troubleshooting 
header:
    teaser: /assets/images/nodelinux.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-05-17 12:00:00
---

This post will cover deploying an application using a SPA (Single Page Application) as a front-end, which serving said static content on a Node-based backend - while on the same Linux Node App Service .

# Prerequisites
**IMPORTANT**: Make sure App Service Logs are enabled first

- LogStream
- Retrieving logs directly from the [Kudu](https://github.com/Azure/app-service-linux-docs/blob/master/Things_You_Should_Know/things_you_should_know.md#you-can-discover-and-download-the-latest-docker-logs-using-kudu) site, or directly view/download via an FTP client
- Diagnose and Solve Problems -> Application Logs detector, Container Crash detector, or Container Issues detector

If App Service Logs are not enabled, only `docker.log` files will be generated, which will not show application related `stdout` / `stderr` and will make troubleshooting issues more complicated.

# Overview
**NOTE**: The scope of this post can also would with essentially any Single Page Application being used as a frontend. Since the main concept here is serving the production build from the SPA by Express.js.

When running an application with a Front-end and Back-end - you may choose to decouple the two and deploy them as such. On App Service Linux, you could create two different Node App Service's - one for the front-end and another for the back-end. However, there are times you may need to keep them coupled, such as:
- A scenario that doesn't allow calls to an external URI for the backend
- Needing the front-end served by the backend to make use of server side functionality that would otherwise not be able to be done - like if deploying the front-end in it's own App Service and only serving that static content through something like PM2 or NPX 

There will be additional configuration, _at a minumum_, that will needed to be done to have something like this deployed to Node on App Service Linux while using a **Blessed Image**. This post will try to cover just that.

The application being used will be a React front-end and a back-end using Express which serves the production build from React.

Source code for this can be found [here](https://github.com/azureossd/frontend-backend-spa-node-example)

# Quickstart
You can clone the source code above or use an existing project. The project is structured as so:

```
| - frontend/
| - node_modules/
| - package-lock.json
| - package.json
| - server.js
```

Where `frontend` contains your React project. Outside of `frontend` is the backend (eg., `server.js`.)

1. `cd` into the `frontend` folder, or the folder containing your SPA, and run `npm run build` (or `yarn run build`).
2. The output from this should be a `/build` folder under your `frontend` direcotry (in React's case) - using Angular or others may produce a folder named `/dist`.
    - You can run this folder directly to test with something like `npx serve -s build`.
3. Update your backend to reflect your front end production builds location. The below code is an example from the source code mentioned earlier:

```javascript
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.port || 8080;

// We serve the build folder using express
app.use(express.static(path.join(__dirname, './frontend/build')));
// Any requests that doesn't match a route on the server (express) will be redirected using this catch-all wildcard back to index.html
// This is so client-side routing can take over (if it's being used)- otherwise, you'll end up with a "cannot GET /someroute"
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, './frontend/build/index.html'));
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
```

**NOTE**: The example above is **not** intended to show how to proxy requests from the Front End to the Backend in terms of API calls, like using the `proxy` property in `package.json` or the `isomorphic-fetch` package. This is outside the scope of this post.

## Update package.json (Express.js)
To avoid the need for a custom deployment script, we can edit our `package.json` to take advance of [Oryx's build and run logic](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/nodejs.md#build). The same change outlined here can also be used for GitHub Actions and Azure DevOps Pipelines, to make installing and building packages and SPA content more simple.

In your `package.json` at the **root** of your repository, **relative** to `server.js`, change your `scripts` property to the following:

```json
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js",
    "build": "cd ./frontend && npm run build"
  }
```

We add a `build` command. This will change directories into `frontend` and build React for production (which generates the `/frontend/build` folder.)

We have our `start` command defined to run this through Express.js.

If Oryx detects a `build` property in `scripts`, it will run this. This will make it so we're not manually building locally, and then deploying - or, having to use other custom deploy methods.

You should now be able to run this locally as well.

# Deployment
> **NOTE**: Any of the deployment methods utilizing Oryx will essentially all follow the same concept of needing to find `start` and `build` in `package.json`. Only one of the method utilizing Oryx will be covered here.

## Local Git
1. Go to **Deployment Center** and choose **Local Git** as your deployment method:

    ![Deployment Center Local Git](/media/2023/05/azure-blog-node-deployment-1.png)

2. Copy the **Git Clone Uri** to your local machine:

    ![Deployment Center Git Clone Uri](/media/2023/05/azure-blog-node-deployment-2.png)

3. In the root of your project folder, run the following commands:

```
git init
git remote add azure https://yoursite.scm.azurewebsites.net:443/yoursite.git
git add .
git commit -m "initial commit"
git push azure master
```

In your termina, you should see output something like below:

```
8:14:08 PM: Running oryx build...
8:14:09 PM: Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
8:14:09 PM: You can report issues at https://github.com/Microsoft/Oryx/issues
8:14:09 PM: Oryx Version: 0.2.20230210.1, Commit: a49c8f6b8abbe95b4356552c4c884dea7fd0d86e, ReleaseTagName: 20230210.1
8:14:09 PM: Build Operation ID: a17869556577cf89
8:14:09 PM: Repository Commit : eeba30ec-4391-4d42-9fcc-f8b61c78c67a
8:14:09 PM: OS Type           : buster
8:14:09 PM: Image Type        : githubactions
8:14:09 PM: Detecting platforms...
8:14:13 PM: Detected following platforms:
8:14:13 PM:   nodejs: 16.20.0
8:14:13 PM:   php: 8.0.28
8:14:13 PM: Detected the following frameworks: Express
8:14:14 PM: Using intermediate directory '/tmp/8db5734cc41498d'.
8:14:14 PM: Copying files to the intermediate directory...
8:14:23 PM: Done in 9 sec(s).
8:14:23 PM: Source directory     : /tmp/8db5734cc41498d
8:14:23 PM: Destination directory: /home/site/wwwroot
8:14:23 PM: Removing existing manifest file
8:14:23 PM: Creating directory for command manifest file if it does not exist
8:14:23 PM: Creating a manifest file...
8:14:23 PM: Node Build Command Manifest file created.
8:14:23 PM: Using Node version:
8:14:23 PM: v16.20.0
8:14:23 PM: Using Npm version:
8:14:24 PM: 8.19.4
8:14:24 PM: Running 'npm install'...
...[truncated]...
8:14:25 PM: npm WARN old lockfile 
8:14:28 PM: added 61 packages, and audited 62 packages in 4s
8:14:28 PM: 8 packages are looking for funding
8:14:28 PM:   run `npm fund` for details
8:14:28 PM: found 0 vulnerabilities
8:14:28 PM: Running 'npm run build'...
8:14:29 PM: > azure-webapps-linux-node-spafe-nodebe@1.0.0 build
8:14:29 PM: > cd ./frontend && npm i && npm run build
8:14:31 PM: npm WARN old lockfile 
8:14:31 PM: npm WARN old lockfile The package-lock.json file was created with an old version of npm,
8:14:31 PM: npm WARN old lockfile so supplemental metadata must be fetched from the registry.
8:14:32 PM: npm WARN old lockfile 
8:14:32 PM: npm WARN old lockfile This is a one-time fix-up, please be patient...
8:14:32 PM: npm WARN old lockfile 
8:15:28 PM: removed 1 package, and audited 1492 packages in 59s
8:15:28 PM: 235 packages are looking for funding
8:15:28 PM:   run `npm fund` for details
8:15:28 PM: 6 high severity vulnerabilities
8:15:28 PM: To address all issues (including breaking changes), run:
8:15:28 PM:   npm audit fix --force
8:15:28 PM: Run `npm audit` for details.
8:15:28 PM: > frontend@0.1.0 build
8:15:28 PM: > react-scripts build
8:15:30 PM: Creating an optimized production build...
8:15:41 PM: Compiled successfully.
8:15:41 PM: File sizes after gzip:
8:15:41 PM:   53.27 kB  build/static/js/main.dec2504d.js
8:15:41 PM:   1.78 kB   build/static/js/787.cda612ba.chunk.js
8:15:41 PM:   541 B     build/static/css/main.073c9b0a.css
8:15:41 PM: The project was built assuming it is hosted at /.
8:15:41 PM: You can control this with the homepage field in your package.json.
8:15:41 PM: The build folder is ready to be deployed.
8:15:41 PM: You may serve it with a static server:
8:15:41 PM:   npm install -g serve
8:15:41 PM:   serve -s build
8:15:41 PM: Find out more about deployment here:
8:15:42 PM:   https://cra.link/deployment
8:15:42 PM: Zipping existing node_modules folder...
8:15:42 PM: Done in 1 sec(s).
8:15:42 PM: Preparing output...
8:15:42 PM: Copying files to destination directory '/home/site/wwwroot'...
8:22:27 PM: Done in 405 sec(s).
8:22:27 PM: Removing existing manifest file
8:22:27 PM: Creating a manifest file...
8:22:27 PM: Manifest file created.
8:22:27 PM: Copying .ostype to manifest output directory.
8:22:27 PM: Done in 493 sec(s).
8:22:29 PM: Running post deployment command(s)...
8:22:29 PM: Generating summary of Oryx build
8:22:29 PM: Parsing the build logs
8:22:29 PM: Found 0 issue(s)
8:22:29 PM: Build Summary :
8:22:29 PM: ===============
8:22:29 PM: Errors (0)
8:22:29 PM: Warnings (0)
8:22:30 PM: Triggering recycle (preview mode disabled).
8:22:30 PM: Deployment successful
```

In this output you can see that:
- `npm install` is initially ran, to install dependencies for the server portion of the project (express.js)
- `npm run build` is ran, and we execute our React production build

Browsing the site and reviewing the file system, we can confirm out expected content is there:

```
   _____                               
  /  _  \ __________ _________   ____  
 /  /_\  \\___   /  |  \_  __ \_/ __ \ 
/    |    \/    /|  |  /|  | \/\  ___/ 
\____|__  /_____ \____/ |__|    \___  >
        \/      \/                  \/ 
A P P   S E R V I C E   O N   L I N U X

Documentation: http://aka.ms/webapp-linux
NodeJS quickstart: https://aka.ms/node-qs
NodeJS Version : v16.20.0
Note: Any data outside '/home' is not persisted

root@5fdf0b5f04ec:/home# ls /home/site/wwwroot/
frontend  hostingstart.html  node_modules  node_modules.tar.gz  oryx-manifest.toml  package-lock.json  package.json  server.js
```

In line with our source code, we can confirm this is working by validating our client-side routing and the startup command being ran by Oryx:

```
2023-05-18T00:22:39.158057103Z npm start
2023-05-18T00:22:39.160143223Z Found tar.gz based node_modules.
2023-05-18T00:22:39.160332424Z Removing existing modules directory from root...
2023-05-18T00:22:39.195385444Z Extracting modules...
2023-05-18T00:22:39.609136617Z Done.
2023-05-18T00:22:42.334680671Z npm info using npm@9.6.4
2023-05-18T00:22:42.335149075Z npm info using node@v16.20.0
2023-05-18T00:22:42.405558417Z 
2023-05-18T00:22:42.405638518Z > azure-webapps-linux-node-spafe-nodebe@1.0.0 start
2023-05-18T00:22:42.405646518Z > node server.js
2023-05-18T00:22:42.405651718Z 
2023-05-18T00:22:42.668641616Z App listening on port 8080
```

(Root path)

![Root Path](/media/2023/05/azure-blog-node-deployment-3.png)


(/react path)

![Root Path](/media/2023/05/azure-blog-node-deployment-4.png)

## CI/CD
CI/CD deployment approaches such as Azure DevOps pipelines or GitHub Actions will generally be the same as discussed [here](https://azureossd.github.io/nodejs/#deployment).

For example, you can follow the [Nest.js Azure DevOps and GitHub Actions](https://azureossd.github.io/2022/02/11/Nest-Deployment-on-App-Service-Linux/index.html#deployment-options) `.yaml` examples. Change the startup command in the example as needed - eg., `pm2 start server.js --no-daemon`.

## Configuration
Since we have control over what we send server side, as well as serving our UI - we can do things like programatically change response headers. Below is an example of overriding the `X-Powered-By` header which normally has the value of `express` when using Express.js

```javascript
const customHeadersAppLevel = (_req, res, next) => {
    res.setHeader('X-Powered-By', 'Custom Express Header')
    next();
};

app.use(customHeadersAppLevel)
...rest of your code...
```

![Root Path](/media/2023/05/azure-blog-node-deployment-5.png)

> **Note**, that using something like [Application Gateway to rewrite request and response headers](https://learn.microsoft.com/en-us/azure/application-gateway/rewrite-http-headers-url#request-and-response-headers) may be more beneficial than programatically doing such a task.
