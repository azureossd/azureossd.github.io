---
title: " Use custom context for Azure Tomcat application"
tags:
  - azure webapps
  - custom context
  - custom deploy
  - Git
  - Java
  - java configuration
  - tomcat
categories:
  - Azure App Service on Windows
  - Java
  - Tomcat
  - How-To
  - Configuration
date: 2015-12-11 12:37:00
author_name: Prasad K.
---

Sometimes, you don't want to deploy your application in the default deployment folder for your Java webapp on Azure env. One of the best examples could be while using the Git deployment. In that case your deployment gets copied to wwwroot folder and Tomcat checks the deployments in the webapps folder, so you might want to change the default folder.

There are two ways of deploying your Java web app in azure

1. Create empty web app and turn on Java in application settings

2. Install tomcat from marketplace, which comes wrapped in a new web app

   For the web app created using first scenario,

   - It would use default tomcat present in D:\\Program Files\ folder

   - It would consider D:\\home\\site\\wwwroot as application root folder

   - This approach is generally preferred by users who don’t want to configure much of tomcat.

   For the web app created using second scenario,

   - It would come with another instance of tomcat installed at D:\\home\\site\\wwwroot\\bin folder (which doesn’t exist in previous approach)

   - It would consider D:\\home\\site\\wwwroot\\bin\\apache-tomcat-8.0.27\\webapps as application root folder

   - This approach is generally preferred by users who want to have custom configuration of tomcat

   Git always pushes content to D:\\home\\site\\wwwroot\ folder, while the tomcat is looking for the same app in D:\\home\\site\\wwwroot\\bin\\apache-tomcat-8.0.27\\webapps

This is how you can achieve it -

   
1. Navigate to D:\\home\\site\\wwwroot\\bin\\apache-tomcat-8.0.27\\conf folder or to your custom tomcat folder using the [Kudu](http://blogs.msdn.com/b/benjaminperkins/archive/2014/03/24/using-kudu-with-windows-azure-web-sites.aspx "Kudu console") console

2. Open server.xml file and add below line of code within

        <Host>
               <Context path="" docBase="_\[specify the absolute path or relative to tomcat folder\]_" reloadable="true">
               </Context>
        </Host>

   [![](/media/2019/03/3162.Settings.jpg)](/media/2019/03/3162.Settings.jpg)

   After this you can deploy your application in the folder specified above and it'll be used by tomcat container to deploy the application.

   Example index.jsp in the d:\\home\\site\\wwwroot folder -

   [![](/media/2019/03/3343.Kudu.jpg)](/media/2019/03/3343.Kudu.jpg)

**Note**: On Azure webapps env, you can specify these values only when you are using [custom tomcat version](https://azure.microsoft.com/en-us/documentation/articles/web-sites-java-custom-upload/ "Custom Tomcat") or using the [marketplace tomcat version](https://azure.microsoft.com/en-us/marketplace/partners/microsoft/apachetomcat7/ "Marketplace Tomcat") as they expose tomcat configurations.