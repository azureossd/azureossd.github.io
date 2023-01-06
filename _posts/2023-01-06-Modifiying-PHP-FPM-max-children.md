---
title: "Modifiying PHP FPM max children"
author_name: "Keegan D'Souza"
tags:
    - PHP
    - Nginx
    - Performance
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - PHP # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Performance # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-01-06 00:00:00
---
This post will cover how to modify the value of pm.max_children for Linux PHP 8 app services.

## Overview

If you notice slow performance on your PHP app service and the below warning message in your log files you might want to consider increase this setting.

```
2023-01-06T16:41:41.955903016Z [06-Jan-2023 16:41:41] WARNING: [pool www] server reached pm.max_children setting (5), consider raising it
```
![Documentation](/media/2023/01/azure-blog-php-max-children-2.png)

[PHP: Configuration - Manual](https://www.php.net/manual/en/install.fpm.configuration.php)

## How To 
1. Go to the Kudu (Advanced Tools) site for the App Service and select *WebSSH* from the menu.

    `https://<your-app-service-name>.azurewebsites.net/newui`

2. Copy the default *www.conf* file under the */home* folder so it can be persisted after a container restart.
    ```
    root@806c3760a0b9:/home# cp /usr/local/etc/php-fpm.d/www.conf /home
    ```
3.  Modify the *www.conf* file you copied under */home* and using a text editor of your choice. Change the value of pm.max_children to the desired value and save your changes.

    ```
    pm.max_children = 50
    ```

4. Create a startup script under the */home* directory and add the below content. In this example the script filename is called *startup.sh* .
    ```
    root@806c3760a0b9:/home# vi startup.sh
    ```

    ```bash
    #!/bin/bash

    # Copies our modified www.conf file to the correct location.
    cp /home/www.conf /usr/local/etc/php-fpm.d

    # Kills the php-fpm process so it can be restarted.
    pkill -o -USR2 php-fpm
    ```
5. Reference your script on container startup by naviagating to the `App Service Azure Portal -> Settings -> Configuration -> Startup Command `section. Then enter the full path of the script you created and save the changes.

    ![Settings](/media/2023/01/azure-blog-php-max-children-1.png)

## What should the value of this pm.max_children be?
This is dependant on the application and the amount of memory allocated to the app service plan.
Below are a few open source articles that can help your team make an informed decision. 
* [Adjusting child processes for PHP-FPM (Nginx) · MYSHELL.CO.UK](https://myshell.co.uk/blog/2012/07/adjusting-child-processes-for-php-fpm-nginx/)
* [Finding the correct pm.max_children settings for PHP-FPM - Chris Moore](https://chrismoore.ca/2018/10/finding-the-correct-pm-max-children-settings-for-php-fpm/)
* [How to Change the PHP-FPM max_children Setting - ServerPilot](https://serverpilot.io/docs/how-to-change-the-php-fpm-max_children-setting/#:~:text=The%20max_children%20setting%20limits%20the,to%20run%20out%20of%20memory)

The only thing to be aware of is that increasing this setting might raise the memory usage on the app service plan. 

We recommend your team monitor the app service plan memory usage when expirementing with this value.
[Monitor apps - Azure App Service | Microsoft Learn](https://learn.microsoft.com/en-us/azure/app-service/web-sites-monitor#understand-metrics)


 