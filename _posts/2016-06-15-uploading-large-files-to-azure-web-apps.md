---
title: "Uploading Large Files to Azure Web Apps"
categories:
  - Azure App Service on Windows
  - Joomla
  - PHP
  - WordPress
  - How-To
  - Debugging
  - Configuration
date: 2016-06-15 17:25:24
tags:
author_name: Toan Nguyen
---

Attempting to upload a file larger than 28.6MB to Azure Web Apps can result in a HTTP 404.13 for WordPress developers or a HTTP 502 for Tomcat Manager. This can be due to the default Request Limits value for the maxAllowedContentLength on IIS which is 30000000 (roughly 28.6MB). To modify this value, add the following to your web.config file.  

    <configuration>
       <system.webServer>
          <security>
             <requestFiltering>
                <requestLimits maxAllowedContentLength="<valueInBytes>"/>
             </requestFiltering>
          </security>
       </system.webServer>
    </configuration>

  You may also need to make changes to your Web App to increase the maximum file upload size as well. Below is some additional information for how to increase the limits for popular Content Management Systems that run on PHP such as WordPress, Drupal, and Joomla!. Information for Tomcat Manager can be found [here](../2015/09/18/accessing-the-tomcat-manager-console-on-azure-java-webapp/).  

## PHP Content Management Systems (WordPress, Joomla!, etc.)

### App Service Windows
  WordPress and other CMS site have its own maximum file upload size which are based on the default PHP values. These can be modified by creating a “.user.ini” file. Azure Web Apps developers can create/modify this file by performing the following. 

1. Go to your KUDU console ([https://\<sitename>.scm.azurewebsites.net/debugconsole](https://%3csitename%3e.scm.azurewebsites.net/debugconsole)) 

2. Go to the “site” directory then the “wwwroot” directory. 

3. To create a “.user.ini” file, go to the console window below and type “touch .user.ini”. 

   [![console](/media/2016/06/console-300x182.png)](/media/2016/06/console.png) 

4. Once the file is created, press the edit button next to the file. 
   [![userini](/media/2016/06/userini-300x21.png)](/media/2016/06/userini.png) 

5. Add the following values to the file and press Save.

        upload_max_filesize = 64M
        post_max_size = 64M

6. Restart your site.   

### App Service Linux

For App Service Linux, please see steps at [Updating PHP Settings](https://azureossd.github.io/2019/01/29/azure-app-service-linux-update-php-settings/)

**NOTE:** For WordPress Multisite users, you will also need to modify the Network Admin Settings to increase the value. 

1. Select Network Admin -> Settings 

   [![multisite](/media/2016/06/multisite-300x159.png)](/media/2016/06/multisite.png) 

2. Scroll down to the "Upload Setting" section and modify the "Max upload file size" then press "Save Changes". 

   [![multisiteupload](/media/2016/06/multisiteupload-300x248.png)](/media/2016/06/multisiteupload.png)