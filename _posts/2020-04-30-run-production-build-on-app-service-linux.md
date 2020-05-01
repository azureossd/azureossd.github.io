---
title: "Running Production Build Nodejs Apps on App Service Linux"
author_name: "Toan Nguyen"
tags:
    - ReactJS
    - Startup
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Nodejs # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - ReactJS, Angular, ExpressJS # Django, Spring Boot, CodeIgnitor, ExpressJS
    - How-To, Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/nodelinux.png" 
toc: true
toc_sticky: true
date: 2020-04-30 00:00:00
---

When you create production build for your React, Angular, other Node framework the files will either be placed in a `build` or `dist` directory depending on the framework.  App Service on Linux uses *Oryx* to detect, build, and start your application.  For more information about how this is done, please go to the [Oryx](https://github.com/microsoft/Oryx/blob/master/doc/runtimes/nodejs.md) GitHub page for more info.  In order to serve the built content, you can perform either of the following.

## PM2 Serve

1. In the Azure Portal, go to *Configuration*.
1. Select *General* and locate the *Startup Command* box.
1. If all of the items in the `build` directory are in `wwwroot`, change the path to `/home/site/wwwroot`.
    ```bash	
        pm2 serve /home/site/wwwroot/build --no-daemon
    ```
1. If the content is under `dist`, make sure to use the following.
    ```bash
       pm2 serve /home/site/wwwroot/dist --no-daemon
    ```

1. Press Save.

## Process File

1. Create a process.json or process.yml and place it in `/home/site/wwwroot`.  
1. In this example, I'm using a process.json file and my files are under the `build` directory.  Make sure to change this to `dist` if your framework is outputing to the `dist` directory.
	
    ```bash	
        {
        "script": "serve",
        "env": {
            "PM2_SERVE_PATH": './build'
        }
        "args": '--no-daemon'
        }
    ```
1. In the Azure Portal, go to *Configuration*.
1. Select *General* and locate the *Startup Command* box and enter `process.json`.
1. Press Save.