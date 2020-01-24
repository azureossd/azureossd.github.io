---
title: " Using Bower in Node.js Azure WebApps"
tags:
  - bower
  - nodejs
categories:
  - Azure App Service on Windows
  - Nodejs
  - How-To
date: 2016-01-25 04:35:00
author_name: Prashanth Madi
---

**Bower** is a package manager for web app. It offers a generic, unopinionated solution to the problem of **front-end package management**, while exposing the package dependency model via an API that can be consumed by a more opinionated build stack. Most of the web apps involve below step before moving web app to production/build process. \- Download and install front-end dependencies like ionic, Bootstrap. You can list all your dependencies in a bower.json file which would be installed during deployment process into Azure web apps. Although you can achieve most of similar work using npm, still bower is pretty famous with front-end dev's.

sample app on github @ [https://github.com/prashanthmadi/Azure-bower-sample](https://github.com/prashanthmadi/Azure-bower-sample)

**Automate Bower install process :** Azure Source Control deployment process would involve below steps

1.  Moves content to azure web app
2.  Creates default deployment script, if there isn’t one(deploy.cmd, .deployment files) in web app root folder
3.  Run’s deployment script where it install’s npm modules

At Step 2, Instead of deployment process creating a default script. We can include custom deployment script and change it's content to install all the modules listed in bower.json file.  Below steps would help you generate custom deployment script :

*   Install the azure-cli tool, it'll also give you some cool features on managing azure related resources directly from the command-line:

    npm install azure-cli -g

*   Go to the root of your repository (from which you deploy your site).
*   Run the custom deployment script generator command:

    azure site deploymentscript --node

*   Above command will generate the files required to deploy your site, mainly:

` .deployment - Contains the command to run for deploying your site.` 

` deploy.cmd - Contains the deployment script.` 

[![1](/media/2016/01/114-300x205.png)](/media/2016/01/114.png)

*   Considering you have bower.json file in public folder as in below screenshot.

[![5](/media/2016/01/54-300x122.png)](/media/2016/01/54.png)

*   Sample bower.json file

        {
        "name": "bowersample-app",
        "version": "0.0.1",
        "dependencies": {
        "sass-bootstrap": "~3.0.0",
        "modernizr": "~2.6.2",
        "jquery": "~1.10.2"
        },
        "private": true
        }

*   In deploy.cmd file include below lines of code after installing npm packages (after line 110). Change bower install folder based on your requirement.

        IF EXIST "%DEPLOYMENT_TARGET%\public\bower.json" (
        
        pushd "%DEPLOYMENT_TARGET%\public"
        
        call ..\node_modules\.bin\bower install
        
        IF !ERRORLEVEL! NEQ 0 goto error
        
        popd
        
        )

Sample Screenshot: 

[![4](/media/2016/01/45-300x201.png)](/media/2016/01/45.png)

*   You can git ignore bower_components folder before pushing your code to Azure Web App.
*   Below is a screenshot of newly created bower_components folder after deployment process.

[![2](/media/2016/01/26-300x153.png)](/media/2016/01/26.png)

*   Below screenshot has all the modules i have listed in bower.json file installed in public/bower_components folder.

[![3](/media/2016/01/36-300x161.png)](/media/2016/01/36.png)