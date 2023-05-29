---
title: "Using WebDeploy on Linux App Services"
author_name: "Keegan D'Souza"
tags:
    - Azure App Service on Linux
    - Dotnet Core
    - Deployment
categories:
    - Azure App Service on Linux
    - .NET Core
    -  How-To
    
header:
    teaser: "/assets/images/dotnetcorelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-05-26 12:00:00
---

This post will cover how to use Web Deploy to Deploy to a Linux App Service, using Visual Studio 2022.

## Overview

[Web Deploy / MS Deploy](https://www.iis.net/downloads/microsoft/web-deploy)  is a deployment tool bundled within IIS.

For Linux App Services, normally it is recommend to use [zip deploy](https://learn.microsoft.com/en-us/azure/app-service/deploy-zip?tabs=cli) for most deployment cases. If your team is just deploying for the first time we recommend you stick with this method. 

However Web Deploy is supported for Linux App Service, in certain [scenarios](#sample-scenarios) this can be useful. 

For this tutorial we are using a .Net Core 6 application, deploying from Visual Studio 2022

## How To

1. Add the following [App setting](https://learn.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal) using the Azure Portal or Azure CLI and save your changes.

   ```
   WEBSITE_WEBDEPLOY_USE_SCM = false
   ```
2. Navigate to your ***Deployment Center -> Manage Publish Profile -> Download*** publish profile.

     ![Download Publish Profile](/media/2023/05/linux-web-deploy-1.png)

3. Open your publish profile in any editor in a .xml format and take note of the following information the publishProfile value labeled ***{your app service name} - Web Deploy***
    - publishUrl
    - userName
    - userPWD

    ![Publish Profile Values](/media/2023/05/linux-web-deploy-2.png)

4. Open your project in Visual Studio 2022 and right click on your ***Solution -> Publish -> + New*** .

     ![Publish Profile VS New](/media/2023/05/linux-web-deploy-3.png)

5. Make sure to choose Web Server (IIS)

    ![Publish Profile VS Web Server Selection](/media/2023/05/linux-web-deploy-4.png)

6. Enter the values you downloaded in step 3 and click Finish. 

    ![Publish Profile VS Enter Config](/media/2023/05/linux-web-deploy-5.png)

7. When you are ready to deploy your application click on Publish, you now should be able to successfully deploy using Web Deploy.

    ![Publish Profile VS Enter Config](/media/2023/05/linux-web-deploy-6.png)

## Sample Scenarios.  

There are multiple reasons why your team might use Web Deploy instead of the Standard Zip Deploy. 

- Your team has configured [access restrictions](https://learn.microsoft.com/en-us/azure/app-service/app-service-ip-restrictions?tabs=azurecli) / [private endpoints](https://learn.microsoft.com/en-us/azure/app-service/networking/private-endpoint) on your Kudu (Advanced Tools) Site, that will prevent a Zip Deploy Operation.

- Rare occasions where the Kudu (Advanced Tools) Site is down, your team can use Web Deploy as a mitigation, until the issue is mitigated. 

- Organizational practices or policy to use Web Deploy / Ms Deploy.