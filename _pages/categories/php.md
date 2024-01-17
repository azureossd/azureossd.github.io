---
permalink: "/php/"
layout: single
toc: true
title: "PHP"
sidebar: 
    nav: "links"
---

App Service on Linux supports `PHP` as a runtime stack built-in image.

>**PHP Update Policy** - App Service upgrades the underlying PHP runtime of your application as part of the regular platform updates. As a result of this regular update process, your application will be automatically updated to the latest patch version of PHP available in the platform. For more information about current supported PHP versions check [Support Timeline](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/php_support.md#support-timeline).

> Find additional PHP articles on [Technet/TechCommunity - Apps on Azure Blog](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/bg-p/AppsonAzureBlog/label-name/PHP).


You can find a compilation of resources by categories:

# Linux

## Availability and Post Deployment issues
- [PHP Deployments: cannot open shared object file: no such file or directory](https://azureossd.github.io/2023/06/14/PHP-Deployments-could-not-open-object-file-no-such-file-or-directory/index.html)
- [PHP Deployments: Troubleshooting PHP availability scenarios](https://azureossd.github.io/2023/07/06/PHP-availability-Troubleshooting-common-availability-scenarios/index.html)
- [Troubleshooting HTTP 404s with NGINX and PHP](https://azureossd.github.io/2023/12/01/Troubleshooting-HTTP-404s-with-NGINX-and-PHP/index.html)

## Configuration
- [Modifiying PHP FPM settings](https://azureossd.github.io/2023/01/06/Modifiying-PHP-FPM-settings/index.html)
- [How to set Nginx headers](https://azureossd.github.io/2023/02/24/how-to-modify-nginx-headers/index.html)
- [NGINX Rewrite Rules for Azure App Service Linux PHP 8.x](https://azureossd.github.io/2021/09/02/php-8-rewrite-rule/index.html)
- [PHP configuration: Customizing NGINX’s error page handling](https://azureossd.github.io/2023/06/21/PHP-configuration-Customizing-NGINXs-error-page-handling/index.html)

## Performance
- [Debugging PHP Applications on Azure App Services Linux/Containers using XDEBUG](https://azureossd.github.io/2020/05/05/debugging-php-application-on-azure-app-service-linux/index.html)
- [PHP performance: AH00161: server reached MaxRequestWorkers setting](https://azureossd.github.io/2023/06/19/PHP-performance-AH00161-server-reached-MaxRequestWorker-setting/index.html)
- [PHP performance: Disk I/O causing poor performance](https://azureossd.github.io/2023/07/06/PHP-performance-Disk-IO-causing-slow-performance/index.html)
- [PHP performance: Profilers and debuggers for PHP applications on App Service Linux](https://azureossd.github.io/2023/07/06/PHP-performance-Profilers-and-debuggers-for-PHP-applications-on-App-Service-Linux/index.html)

## Deployment
- [PHP Deployments: Troubleshooting PHP deployments on App Service Linux with Oryx](https://azureossd.github.io/2023/06/27/PHP-deployments-Troubleshooting-PHP-deployments-on-App-Service-Linux-with-Oryx/index.html)
- **Frameworks**
   - [Laravel Deployment on App Service Linux](https://azureossd.github.io/2022/04/22/PHP-Laravel-deploy-on-App-Service-Linux/index.html)
   - [Yii Deployment on App Service Linux](https://azureossd.github.io/2022/05/03/PHP-Yii-deploy-on-App-Service-Linux/index.html) 
   - [Deploying Drupal Applications on App Service Linux with App Cache](https://azureossd.github.io/2023/09/20/Deploying-Drupal-Applications-AppServiceLinux-Using-AppCache/index.html)
   - [Deploying Drupal Applications on App Service Linux with App Cache](https://azureossd.github.io/2023/09/20/Deploying-Drupal-Applications-AppServiceLinux-Using-AppCache/index.html)

# Windows

## Configuration
- [How to use a Custom PHP runtime for App Service Windows](http://azureossd.github.io/2022/05/18/Custom-PHP-runtime-for-App-Service-Windows/index.html)