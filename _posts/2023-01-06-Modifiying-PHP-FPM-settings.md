---
title: "Modifiying PHP FPM settings"
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
date: 2023-01-06 12:00:00
---
This post will cover how to modify the values of PHP FPM settings for Linux PHP 8 App Services.

## Overview

If you notice slow performance on your PHP app service and the warning messages similar to the one listed below in your log files you might want to consider modifying these settings. 

```
2023-01-06T16:41:41.955903016Z [06-Jan-2023 16:41:41] WARNING: [pool www] server reached pm.max_children setting (5), consider raising it
```
For App Service Linux PHP 8 images the below are the PHP-FPM settings that can be modified.

[PHP: Configuration - Manual](https://www.php.net/manual/en/install.fpm.configuration.php)

[Oryx/configuration.md at main · microsoft/Oryx (github.com)](https://github.com/microsoft/Oryx/blob/main/doc/configuration.md)


![Documentation](/media/2023/01/azure-blog-php-max-children-1.png)

## How To 
These configuration options can be added as Application Settings.

[Configure apps - Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal#configure-app-settings)

![App Settings](/media/2023/01/azure-blog-php-max-children-2.png)


## Testing and Validation

When these settings are applied, the app service image will apply the below lines of code to modify these values within the file */opt/startup/startup.sh*. This file can be viewed from navigating from the app service's [SSH console](https://learn.microsoft.com/en-us/azure/app-service/configure-linux-open-ssh-session).

![App Service Startup Script](/media/2023/01/azure-blog-php-max-children-3.png)

From the SSH console run the *top* command, to validate the correct number of FPM process are created according to the settings inputed. 

![top Command OutPut](/media/2023/01/azure-blog-php-max-children-4.png)

## What should the value of these settings be?
This is dependant on the application and the amount of memory allocated to the app service plan.
Below are a few open source articles that can help your team make an informed decision. 
* [Adjusting child processes for PHP-FPM (Nginx) · MYSHELL.CO.UK](https://myshell.co.uk/blog/2012/07/adjusting-child-processes-for-php-fpm-nginx/)
* [Finding the correct pm.max_children settings for PHP-FPM - Chris Moore](https://chrismoore.ca/2018/10/finding-the-correct-pm-max-children-settings-for-php-fpm/)
* [How to Change the PHP-FPM max_children Setting - ServerPilot](https://serverpilot.io/docs/how-to-change-the-php-fpm-max_children-setting/#:~:text=The%20max_children%20setting%20limits%20the,to%20run%20out%20of%20memory)

The only thing to be aware of is that increasing this setting might raise the memory usage on the app service plan. 

We recommend your team monitor the app service plan memory usage when expirementing with this value.

[Monitor apps - Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/web-sites-monitor#understand-metrics)


 