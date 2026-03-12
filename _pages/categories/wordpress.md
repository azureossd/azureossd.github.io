---
permalink: "/wordpress/"
layout: single
toc: true
title: "WordPress"
sidebar: 
    nav: "links"
---

`WordPress` hosted on Azure App Service is a fully managed Azure PaaS offering with built-in infrastructure maintenance, security patching and scaling.

>**Image tag version** - You can review which is the current Php/Nginx version linked to the latest tag in [Image Details](https://github.com/Azure/wordpress-linux-appservice/tree/main#image-details).

> Find additional WordPress articles on [Technet/TechCommunity - Apps on Azure Blog](https://techcommunity.microsoft.com/t5/forums/searchpage/tab/message?filter=location&q=WordPress&location=blog-board:AppsonAzureBlog&collapse_discussion=true).

> Current image tag is `appsvc/wordpress-alpine-php:latest`. We encourage to migrate to the new image tag if you have any version under this tag `appsvcorg/wordpress-alpine-php:<version>` to have all the [new features](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/wordpress-on-azure-app-service-top-features-you-must-know-about/ba-p/3697873).  


You can find a compilation of resources by categories:

# Configuration and Best Practices

## Security
- [WordPress Best Practices for Security](https://azureossd.github.io/2021/01/28/wordpress-best-practices-for-security/index.html)
- [Best Practices for WordPress Security on Azure](https://azureossd.github.io/2016/12/26/best-practices-for-wordpress-security-on-azure/index.html)
- [How to enable IP access restrictions on wp-admin for the WordPress on App Service offering](https://azureossd.github.io/2023/07/27/wordpress-on-appservice-wpadmin-ip-restrictions/index.html)
- [Restrict access to login for the WordPress running on Azure web app container](https://azureossd.github.io/2018/10/12/restrict-access-to-login-for-the-wordpress-running-on-azure-web-app-container/index.html)

## Linux Configuration
- [Wordpress on Linux - Configuring NGINX](https://azureossd.github.io/2024/01/30/Wordpress-on-Linux-Configuring-NGINX/index.html)
- [Changing php-fpm 'pm' settings in App Service Wordpress on Linux](https://azureossd.github.io/2024/01/18/Changing-php-fpm-pm-settings-in-App-Service-Wordpress-on-Linux/index.html)
- [Installing intl with Wordpress on App Service Linux](https://azureossd.github.io/2024/04/15/Installing-intl-with-Wordpress-on-App-Service-Linux/index.html)
- [How to change memory_limit on Wordpress Web App for Linux on Azure](https://azureossd.github.io/2018/09/27/how-to-change-memory-limit-on-wordpress-web-app-for-linux-on-azure/index.html)
- [How to set the redirect rules in Nginx based Wordpress Image](https://azureossd.github.io/2021/05/26/set-redirect-rules-in-nginx-based-wordpress-image/index.html)
- [HTTP to HTTPS redirect for WordPress on Azure Web App on Linux](https://azureossd.github.io/2017/08/04/http-to-https-redirect-for-wordpress-on-azure-web-app-on-linux/index.html)

## Database Configuration
- [Configure WordPress Database Connection on Azure App Services](https://azureossd.github.io/2018/05/22/configure-wordpress-database-connection-on-azure-app-services/index.html)

## Subdirectory/Custom Paths
- [Installing WordPress within Subdirectory](https://azureossd.github.io/2023/03/30/wordpress-subdirectory/index.html)
- [Run WordPress in subfolder or Virtual Directory on Azure App Service](https://azureossd.github.io/2020/07/24/Run-WordPress-in-subfolder-or-Virtual-Directory/index.html)
- [RewriteRule sample for WordPress in subdirectory](https://azureossd.github.io/2018/10/01/web-config-sample-for-wordpress-nested-in-subdirectory/index.html)

## Domain and URL Configuration
- [WordPress: Redirecting to wrong URL!!](https://azureossd.github.io/2016/07/12/wordpress-redirecting-to-wrong-url/index.html)
- [Giving your existing WordPress MultiSite a new domain name on Microsoft Azure](https://azureossd.github.io/2015/04/06/giving-your-existing-wordpress-multisite-a-new-domain-name-on-microsoft-azure/index.html)

## Email Configuration
- [An Example of Setting WordPress Email with Office 365 SMTP](https://azureossd.github.io/2017/04/20/an-example-of-setting-wordpress-email-with-office-365-smtp/index.html)

# Performance Optimization

- [WordPress Best Practices for Performance](https://azureossd.github.io/2020/08/07/wordpress-best-practices-for-performance/index.html)
- [How to improve performance of WP Admin](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/how-to-improve-performance-of-wp-admin-wordpress-on-azure-app/ba-p/3731647)
- [Use Azure CDN for WordPress site on Azure App](https://azureossd.github.io/2015/04/27/improving-wordpress-performance-use-azure-cdn/index.html)
- [Connect to Microsoft Azure Redis Cache from WordPress site](https://azureossd.github.io/2015/05/14/connect-to-microsoft-azure-redis-cache-from-wordpress-site/index.html)
- [WordPress Scheduled Jobs (wp-cron.php) and Slowness](https://azureossd.github.io/2015/06/11/wordpress-scheduled-jobs-wp-cron-php-and-slowness/index.html)

# Migration and Deployment

- [WordPress Migration Plan to Azure App Services](https://azureossd.github.io/2020/08/07/wordpress-migration-plan-to-azure/index.html)
- [WordPress Migration: Easy as A-B-C, 1-2-3](https://azureossd.github.io/2017/04/28/wordpress-migration-easy-as-a-b-c-1-2-3/index.html)
- [LAMP Migration to Web Apps (previously known as Websites)](https://azureossd.github.io/2015/04/07/lamp-migration-to-web-apps-previously-known-as-websites/index.html)
- [Migrate WordPress content to Azure blob storage](https://azureossd.github.io/2017/06/21/migrate-wordpress-content-to-azure-blob-storage/index.html)

# Azure VM Deployments

- [First steps with Bitnami WordPress in Azure VM](https://azureossd.github.io/2017/05/26/first-steps-with-bitnami-wordpress-in-azure-vm/index.html)

# Debugging and Troubleshooting

## Error Logging and Debugging
- [Enable WordPress Error Logs](https://azureossd.github.io/2015/10/09/logging-php-errors-in-wordpress-2/index.html)
- [Using Xdebug with Wordpress on App Service Linux](https://azureossd.github.io/2023/08/17/Using-Xdebug-with-Wordpress-on-App-Service-Linux/index.html)

## Common Issues
- [WordPress Common Troubleshooting Scenarios](https://azureossd.github.io/2022/08/03/WordPress-common-troubleshooting-scenarios/index.html)
- [WordPress: Error establishing a database connection](https://azureossd.github.io/2015/10/14/wordpress-error-establishing-a-database-connection/index.html)
- [WordPress MultiSite 404 on Admin Dashboard](https://azureossd.github.io/2016/06/23/wordpress-multisite-404-on-admin-dashboard/index.html)

## Database Troubleshooting
- [Troubleshooting MySQL database on ClearDB](https://azureossd.github.io/2015/05/07/troubleshooting-mysql-database-on-cleardb/index.html)
- [ClearDB: MySQL passwords and Azure connection strings](https://azureossd.github.io/2015/08/03/cleardb-mysql-passwords-and-azure-connection-strings/index.html)
