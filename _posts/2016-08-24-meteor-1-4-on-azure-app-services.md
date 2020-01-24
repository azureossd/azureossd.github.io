---
title: " Meteor 1.4 App on Azure App Services"
tags:
  - meteor
  - nodejs
categories:
  - Azure App Service on Windows
  - Nodejs
  - How-To
date: 2016-08-24 10:13:17
author_name: Prashanth Madi
toc: true
toc_sticky: true
header:
    teaser: /assets/images/meteor.png
---

**Meteor** is a full-stack JavaScript platform for developing modern web and mobile applications. Meteor includes a key set of technologies for building connected-client reactive applications, a build tool, and a curated set of packages from the Nodejs and general JavaScript community. This Blog would help you create a sample meteor app in local environment and later we would help you move sample app to Azure Web Apps

## Creating Sample Meteor App

Use Below command to install meteor on local environment

    curl https://install.meteor.com/ | sh
    

Check for your meteor version. we highly recommend using > 1.4

    meteor --version
    

Use Below command to create a sample meteor app

    meteor create simple-todos
    

Above command would create a new folder with few files for our sample app as in below screenshot ![Meteor App](http://techiecouple.azurewebsites.net/content/images/2016/08/Screen-Shot-2016-08-23-at-11-08-29-PM.png)

## Using Demeteorizer to convert app into node.js format

Use below cmd to install Demeteorizer

    npm install -g demeteorizer
    

Navigate to your meteor app root folder and enter below cmd

    >demeteorizer
    

It would create a new .demeteorized folder ![Demeteorized App](http://techiecouple.azurewebsites.net/content/images/2016/08/Screen-Shot-2016-08-23-at-11-15-01-PM.png) Navigate to .demeteorized/bundle/programs/server using below cmd

    cd .demeteorized/bundle/programs/server
    
    

> **Please Use npm > 3 if you are getting any  long path issues.. Use NVM([https://github.com/coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows)) to easily change node/npm version in local environment. **

Enter below cmd to install all the required node.js modules

    npm install
    

## Running App on Local Env

Use below cmd to execute demeteorized/converted nodejs app in local environment

    PORT=8080 ROOT_URL=http://localhost:8080 npm start
    

![Local Meteor](http://techiecouple.azurewebsites.net/content/images/2016/08/local_meteor.png)

## Moving App to Azure

Create a new web app on azure and Setup continuous deployment and get the git url. Below link has details on it [https://azure.microsoft.com/en-us/documentation/articles/web-sites-nodejs-develop-deploy-mac/](https://azure.microsoft.com/en-us/documentation/articles/web-sites-nodejs-develop-deploy-mac/) Add below app setting to your web app inside Azure portal App Settings Key : `ROOT_URL` Value : web app url(ex: `http://Your_APP_Name.azurewebsites.net/`) Create a web.config file @ .demeteorized/bundle/ and insert below link content [https://raw.githubusercontent.com/christopheranderson/azure-demeteorizer/master/resources/web.config](https://raw.githubusercontent.com/christopheranderson/azure-demeteorizer/master/resources/web.config) ![web config file](http://techiecouple.azurewebsites.net/content/images/2016/08/Screen-Shot-2016-08-23-at-11-24-13-PM.png) Navigate to .demeteorized/bundle/ folder and Commit your changes to `WEB_APP_GIT_URL`

    git init  
    git add .  
    git commit -m "initial commit"  
    git remote add samplemeteorapp WEB_APP_GIT_URL  
    git push samplemeteorapp master  
    

![web config file](http://techiecouple.azurewebsites.net/content/images/2016/08/final_meteor.png)