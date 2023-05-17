---
title: "Node Deployments and 'npm ERR! Missing script'"
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
date: 2023-05-16 12:00:00
---

This post will cover application failures with Node on App Service Linux - specifically regarding the `npm ERR! Missing script:` message. 

# Prerequisites
**IMPORTANT**: Make sure App Service Logs are enabled first

- LogStream
- Retrieving logs directly from the [Kudu](https://github.com/Azure/app-service-linux-docs/blob/master/Things_You_Should_Know/things_you_should_know.md#you-can-discover-and-download-the-latest-docker-logs-using-kudu) site, or directly view/download via an FTP client
- Diagnose and Solve Problems -> Application Logs detector, Container Crash detector, or Container Issues detector

If App Service Logs are not enabled, only `docker.log` files will be generated, which will not show application related `stdout` / `stderr` and will make troubleshooting these kinds of issues more complicated.

# Overview
This will be a brief post covering the message `npm ERR! Missing script:`. This is targeted towards **Blessed Images** on App Service Linux.

Generally, this may show if a **Startup command** is specified, while there is no matching `scripts` property in your `package.json` - or, if the `scripts` property or the associated command in `scripts` is missing.


## Overview
Consider reviewing the **run** logic that is defined for Node.js applications [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/nodejs.md#run)


- _Run npm start if a start script is specified._
- _Else, if a script is specified in package.json's main field, run that._
- _Run the first found of the following scripts in the root of the repo:_
    - _bin/www_
    - _server.js_
    - _app.js_
    - _index.js_
    - _hostingstart.js_


With the above logic in mind, take the below `package.json`:

```json
{
  "name": "azure-webapps-linux-node-express-basic",
  "version": "1.0.0",
  "main": "server.js",
  "license": "MIT",
  "dependencies": {
    "axios": "^0.27.2",
    "express": "^4.18.2"
  },
  "scripts": {
    "dev": "node server.js"
  }
}
```

The above `package.json` is actually valiate to run, even without a `start` property - since a `scripts` property does exist. Even if it didn't, it would then try to run `node server.js` as it would eventually find `server.js` (in this example)

### Cause

What is **not** valid is having a `scripts` property (or no `scripts` property) but setting a **Startup Command** to a non-existent `scripts` property. 

For instance, using the above `package.json`, and using the below Startup command:

![Oryx-startup-script](/media/2023/05/azure-blog-node-startupscript-1.png)


Will cause the error in this post:

```
npm ERR! Missing script: "start:dev"
npm ERR! To see a list of scripts, run:
npm ERR!   npm run
```

### Resolution
In this case, it's important to:
- Review your `package.json` - especially what has been deployed to Azure, as well as your local file.
- Correct any missing `scripts` commands. If specifying a Startup Command in the portal, ensure this is targeting an _existing_ command under `scripts` in `package.json`.
- Validate this works locally.


