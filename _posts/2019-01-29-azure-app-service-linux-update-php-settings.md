---
title: " Azure App Service Linux - Update PHP Settings"
author_name: Toan Nguyen
categories:
  - PHP
  - Azure App Service on Linux
  - Configuration
date: 2019-01-29 11:50:06
tags:
header:
    teaser: /assets/images/phplinux.png
toc: true
toc_sticky: true
---

Azure App Service Linux provides PHP images with preconfigured settings and extensions.  If you need to adjust your PHP settings, follow the steps provided below.  

## Updating PHP Settings
 
 Settings such as upload\_max\_filesize, expose_php, and others can be modified using a custom "ini" file. You can use either SSH or Bash to accomplish this.  

1.  Go to your KUDU site https://\<sitename\>.scm.azurewebsites.net
2.  Select Bash or SSH from the top menu.
3.  In Bash/SSH, go to your "/home/site" directory.
4.  Create a directory called "ini" (i.e. mkdir ini)
5.  Change directories to "ini".
6.  We'll need to create an "ini" file to add our settings to. In this example, I'm using "extensions.ini". There are no file editors such as Vi, Vim, or Nano so we'll simply use echo to add the settings to the file. I'm changing the "upload\_max\_filesize" from 2M to 50M. Below is the command that I used to add the setting and create an "extensions.ini" file if one doesn't already exist.

**NOTE:** If you already have an extensions.ini file, you can use the same command which will add the new setting to the file.

    /home/site/ini>echo "upload_max_filesize=50M" >> extensions.ini
    /home/site/ini>cat extensions.ini
    
    upload_max_filesize=50M
    
    /home/site/ini>

If using SSH, you can use vi to create/edit the extensions file using the following commands. a) vi extensions.ini b) Press "i" on your keyboard to start editing and add the following.

     upload_max_filesize=50M

Press "Esc", then ":wq!" and enter to save.   

## Add an Application Setting

 We'll now need to go to the Azure Portal and add an Application Setting to scan the "ini" directory that we just created to apply the change for upload\_max\_filesize.  

1.  Go to the Azure Portal ([https://portal.azure.com](https://portal.azure.com/)) and select your App Service Linux PHP application.
2.  Select Application Settings for the app.
3.  Under the Application settings section, press the "+ Add new setting".
4.  For the App Setting Name, enter "PHP\_INI\_SCAN_DIR".
5.  For the value, enter "/usr/local/etc/php/conf.d:/home/site/ini"

  **NOTE**: If you're you've recompiled a PHP extension such as GD, perform the steps at "Recompiling PHP Extensions" at [Azure App Service - Adding PHP Extensions](https://blogs.msdn.microsoft.com/azureossds/2019/01/29/azure-app-service-linux-adding-php-extensions/) and enter a value of "/home/site/ini" and omit the "/usr/local/etc/php/conf.d:" portion.  

1.  The first portion of the value is the location of other ini files that come with the Docker container and the second part (after the ":") is the directory that contains our new ini file.
2.  Press the save button.

## Testing

1. You should now see the upload\_max\_filesize increase from 2M to 50M if you have a PHP info page. If not, create one by going to your /home/site/wwwroot directory and perform the following.

        echo "<?php phpinfo();" >> info.php

2. You should now see the values by going to https://\<sitename\>.azurewebsites.net/info.php

3. Remove the info.php page once you're done using the page.