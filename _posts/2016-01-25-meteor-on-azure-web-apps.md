---
title: " Meteor 1.2 app on Azure Web Apps (OS X)"
tags:
  - meteor
  - nodejs
categories:
  - Azure App Service on Windows
  - Nodejs
  - How-To
date: 2016-01-25 20:44:10
author_name: Prashanth Madi
toc: true
toc_sticky: true
---

Refer Below link for running Meteor 1.4 App on Azure App Services https://blogs.msdn.microsoft.com/azureossds/2016/08/24/meteor-1-4-on-azure-app-services/   

**Meteor** is a full-stack JavaScript platform for developing modern web and mobile applications. Meteor includes a key set of technologies for building connected-client reactive applications, a build tool, and a curated set of packages from the Nodejs and general JavaScript community. Support for Meteor on Azure WebApps has been a big ask. This Blog would help you create a sample meteor app in local environment and later we would help you move sample app to Azure Web Apps - [https://feedback.azure.com/forums/169385-web-apps-formerly-websites/suggestions/6848937-add-support-for-meteor-on-azure-websites](https://feedback.azure.com/forums/169385-web-apps-formerly-websites/suggestions/6848937-add-support-for-meteor-on-azure-websites "https://feedback.azure.com/forums/169385-web-apps-formerly-websites/suggestions/6848937-add-support-for-meteor-on-azure-websites") 

Below steps are valid for MAC OS X. If you have windows OS, please refer [https://github.com/christopheranderson/azure-demeteorizer](https://github.com/christopheranderson/azure-demeteorizer "https://github.com/christopheranderson/azure-demeteorizer") Azure by default doesn't support meteor but we can convert your meteor app into Nodejs level using demeteorizer [https://github.com/onmodulus/demeteorizer](https://github.com/onmodulus/demeteorizer "https://github.com/onmodulus/demeteorizer") . 

## Creating Sample Meteor App

*   Use Below command to install meteor on local environment

    > curl https://install.meteor.com/ | sh
    

*   Use Below command to create a sample meteor app

    > meteor create simple-todos

[![1](/media/2016/01/115-300x104.png)](/media/2016/01/115.png)

*   Above command would create a new folder with few files for our sample app as in below screenshot

[![2](/media/2016/01/27-300x54.png)](/media/2016/01/27.png)

*   Now check if you have node v0.10.40 using below cmd. You can't use latest version of nodejs for this process

    > node -v
    

[![3](/media/2016/01/37-300x44.png)](/media/2016/01/37.png)   

## Why i can't use latest version of Nodejs?

*   Meteor has a dependency on fibers module which cant be installed with newer version of nodejs

issue tracker : [https://github.com/laverdet/node-fibers/issues/248](https://github.com/laverdet/node-fibers/issues/248 "https://github.com/laverdet/node-fibers/issues/248") 

``fibers@1.0.5 install /Users/prashanth/workspace/meterosample/simple-todos/.demeteorized/bundle/programs/server/node_modules/fibers > node ./build.js `(node) child_process: options.customFds option is deprecated. Use options.stdio instead. CXX(target) Release/obj.target/fibers/src/fibers.o ../src/fibers.cc:132:44: error: too many arguments to function call, expected at most 2, have 4 return Signature::New(isolate, receiver, argc, argv); ~~~~~~~~~~~~~~ ^~~~~~~~~~ /Users/prashanth/.node-gyp/4.1.2/include/node/v8.h:4675:3: note: 'New' declared here static Local New( ^ ../src/fibers.cc:140:3: error: no member named 'SetResourceConstraints' in namespace 'v8'; did you mean simply 'SetResourceConstraints'? v8::SetResourceConstraints(isolate, constraints);` ``   

## How to change my existing Nodejs version?

*   Use Below command to install nvm(node version manager) on local environment. This would help us change nodejs version easily

    > curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.2/install.sh | bash

NVM - [https://github.com/creationix/nvm](https://github.com/creationix/nvm "https://github.com/creationix/nvm")

*   Use Below command to install node v0.10.40

    > nvm install 0.10.40
    

*   Check your nodejs version again using below cmd

    > node -v
    

  **Using Demeteorizer to convert app into node.js format**

*   Use below cmd to install Demeteorizer

    npm install -g demeteorizer

*   Navigate to your meteor app root folder and enter below cmd

    > demeteorizer
    

[![5](/media/2016/01/55-300x89.png)](/media/2016/01/55.png)

*   Navigate to .demeteorized/bundle/programs/server using below cmd

    > cd .demeteorized/bundle/programs/server

*   Enter below cmd to install all the required node.js modules

    > npm install
    

  **Running App on Local Env** \- Use below cmd to execute demeteorized/converted nodejs app in local environment

    > PORT=8080 ROOT_URL=http://localhost:8080 npm start

[![6](/media/2016/01/64-300x174.png)](/media/2016/01/64.png) 

## Moving App to Azure

*   Create a sample web app on azure and Setup continuous deployment and get the git url. Below link has details on it

[https://azure.microsoft.com/en-us/documentation/articles/web-sites-nodejs-develop-deploy-mac/](https://azure.microsoft.com/en-us/documentation/articles/web-sites-nodejs-develop-deploy-mac/ "https://azure.microsoft.com/en-us/documentation/articles/web-sites-nodejs-develop-deploy-mac/")

*   Add ROOT\_URL with value as your web app url(ex: http://Your\_APP\_Name.azurewebsites.net/) and set WEBSITE\_NODE\_DEFAULT\_VERSION to 0.10.40 as in below screenshot inside Azure portal App Settings

[![7](/media/2016/01/77-300x178.png)](/media/2016/01/77.png)

*   Create a web.config file @ .demeteorized/bundle/  folder and insert below link content

[https://raw.githubusercontent.com/christopheranderson/azure-demeteorizer/master/resources/web.config](https://raw.githubusercontent.com/christopheranderson/azure-demeteorizer/master/resources/web.config "https://raw.githubusercontent.com/christopheranderson/azure-demeteorizer/master/resources/web.config") 

[![9](/media/2016/01/94-228x300.png)](/media/2016/01/94.png)

*   Navigate to .demeteorized/bundle/  folder and Commit your changes to web app git url

        > git init
        > git add .
        > git commit -m "initial commit"
        > git remote add samplemeteorapp WEB_APP_GIT_URL
        > git push samplemeteorapp master

*   Navigate to your azure web app

[![8](/media/2016/01/85-300x167.png)](/media/2016/01/85.png)   **Troubleshoot :** 1) Unaught exception: Error: \`D:\\home\\site\\wwwroot\\programs\\server\\node_modules\\fibers\\bin\\win32-ia32-v8-4.5\\fibers.node\` is missing. Try reinstalling \`node-fibers\`?

*   Check if you are using node v0.10.40 on azure web apps
*   Default node.exe on azure webapps are 32-bit. check if there is  bin\\win32-ia32-v8-4.5\ in fibers module

2) Unaught exception: Error: Must pass options.rootUrl or set ROOT_URL in the server environment

*   You need to define ROOT\_URL in App Settings at Azure Portal (ex: http://Your\_APP_Name.azurewebsites.net/)