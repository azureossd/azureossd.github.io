---
title: "Deployment and Configuration - App Service Linux"
author_name: "Abhilash Konnur"
tags:
    - Deployment
    - Configuration
    - App Service Linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To, Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2021-01-05 00:00:00
---

## About

In this article we will discuss on how to configure and deploy application on App Service Linux.

## Preparing Application

1. Which port should my application run on?

   Applications that run on App Service Linux need to respond to HTTP pings. Different stacks on App Service use different PORT to listen on, in general it is recommended to use PORT environment variable for your application to listen on. Ex: For Nodejs.

   ```Note
   server.listen(process.env.PORT)
   ```

   In case you are not starting any server then this step can be skipped, for example when you are bringing '.war' file and rely on App Service to deploy it on Tomcat.

   <b>Note:</b> Irrespective of which port you run application on, it is accessible to internet via 80 (<http://appname.azurewebsites.net>) and 443 (<https://appname.azurewebsites.net>) only.

2. How to build the application?

   Application can either be built on local machine/DevOps pipeline or we can let App Service handle the build. We recommend using App Service build so that you do not run into platform version dependency issues.

   Azure App Service Linux uses <b>Oryx</b> to perform the build. Please find detailed process for each application stack [here](https://github.com/microsoft/Oryx/tree/master/doc/runtimes).

   In short, Oryx automatically detects the stack of the application and runs necessary commands as needed. For ex: If the root of the application has <b>package.json</b> file, Oryx determines stack to be Nodejs and runs <b>npm install</b>.

## Deployment Categories

1. Build is not carried out on App Service by default with following deployment techniques.

   - [FTP](https://docs.microsoft.com/en-us/azure/app-service/deploy-ftp)
   - [Zip Deploy](https://docs.microsoft.com/en-us/azure/app-service/deploy-zip)
   - [VS Code](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azureappservice)
   - [Azure DevOps - App Service Deployment Task](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/deploy/azure-rm-web-app-deployment?view=azure-devops)

   If you would like to use Zip Deploy/VS Code/Azure DevOps and still build application on App Service - add the below Application Setting on App Service <b>OR</b> create a file called '.deployment' in the root of your repo and add the following content to it.

     ```Note
    [config]
    SCM_DO_BUILD_DURING_DEPLOYMENT=true
     ```

    ![SCM_DO_BUILD_DURING_DEPLOYMENT](/media/2021/01/SCM_DO_BUILD_DURING_DEPLOYMENT.png)

2. Build is carried out by default with these methods of deployment.

   - [Local git](https://docs.microsoft.com/en-us/azure/app-service/deploy-local-git)
   - [GitHub](https://docs.microsoft.com/en-us/azure/app-service/deploy-continuous-deployment)

## Additional Deployment Options

1. Prebuild and Post build.

   We can use Appliation Setting <b>PRE_BUILD_COMMAND</b>/<b>POST_BUILD_COMMAND</b> or <b>PRE_BUILD_SCRIPT_PATH</b>/<b>POST_BUILD_SCRIPT_PATH</b> to perform certain opertions before and after the build happens. Below is an example where I am deleting all the contents of wwwroot folder before the deployment happens.

   ![PRE_BUILD_COMMAND](/media/2021/01/PRE_BUILD_COMMAND.png)

   If there are multiple commands, create a prebuild.sh file with those commands and upload it to <b>/home</b>. Sample content for prebuild.sh is shown below, then set <b>PRE_BUILD_SCRIPT_PATH</b> to <b>/home/prebuild.sh</b>

    ```Note
    #!/bin/sh
    rm -rf /home/site/wwwroot/* 
    ```

    ![PRE_BUILD_SCRIPT_PATH](/media/2021/01/PRE_BUILD_SCRIPT_PATH.png)

    <b>Note:</b> App Service Deployment is handled by KUDU, hence pre- and post-build command are run on kudu container and not application container.

2. Kudu REST API

   If you need to upload few files to server without making complete deployment, easiest way to go would be to use FTP. However if FTP is not vialbe option, you can use [kudu REST API](https://github.com/projectkudu/kudu/wiki/REST-API#vfs). Use [Deployment Credentials](https://github.com/projectkudu/kudu/wiki/Deployment-credentials#user-credentials-aka-deployment-credentials) for Authentication.

   ```Note
   curl -X PUT --data-binary "@abc.txt" https://<appName>.scm.azurewebsites.net/api/vfs/site/abc.txt -u <userName>
   ```

## Logs

Deployment logs are available in <b>/home/site/deployments</b> folder. For every deployment, a new folder with alphanumeric name is created and logs will be available in that folder.
These can be downloaded using FTP or using the URL http://<<appName>>.scm.azurewebsites.net/api/zip/site/deployments

<b>Note:</b> If the deployment is successful and application is failing to come up, enable <b>Application Logging</b> from App Service Logs blade from Azure Portal. Application Logs can be found in /home/LogFiles folder.