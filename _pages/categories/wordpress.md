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

> Find additional WorPress articles on [Technet/TechCommunity - Apps on Azure Blog](https://techcommunity.microsoft.com/t5/forums/searchpage/tab/message?filter=location&q=WordPress&location=blog-board:AppsonAzureBlog&collapse_discussion=true).

> Current image tag is `appsvc/wordpress-alpine-php:latest`. We encourage to migrate to the new image tag if you have any version under this tag `appsvcorg/wordpress-alpine-php:<version>` to have all the [new features](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/wordpress-on-azure-app-service-top-features-you-must-know-about/ba-p/3697873).  


You can find a compilation of resources by categories:

# Linux 

## Configuration and Best Practices
* [Change MySQL Database Password for WordPress on Linux App Service](./WordPress/changing_mysql_database_password.md)
* [Change WordPress Admin Credentials of the WordPress hosted on Linux App Service](./WordPress/changing_wordpress_admin_credentials.md)
* [Setup Startup scripts for WordPress running on Linux App Service](./WordPress/running_post_startup_scripts.md)
* [Configuring Nginx for WordPress running on Linux App Service](./WordPress/configuring_nginx_for_wordpress.md)
* [A view of Application Settings of WordPress on Linux App Service](./WordPress/wordpress_application_settings.md)
* [Connect to database with phpmyadmin of WordPress on Linux AppService](./WordPress/wordpress_phpmyadmin.md)
* [Configure WordPress on Linux AppService with existing MySQL database](./WordPress/using_an_existing_mysql_database.md)
* [Migrate any WordPress site to WordPress on Linux App Service](./WordPress/wordpress_migration_linux_appservices.md)
* [Adding PHP extensions for WordPress on Linux App Service](./WordPress/wordpress_adding_php_extensions.md)
* [AFD Integration with WordPress on Azure App Service](./WordPress/wordpress_afd_configuration.md)
* [WordPress Best Practices for Security](https://azureossd.github.io/2021/01/28/wordpress-best-practices-for-security/index.html)
* [Installing WordPress within Subdirectory](https://azureossd.github.io/2023/03/30/wordpress-subdirectory/index.html)

## Performance
- [How to improve performance of WP Admin](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/how-to-improve-performance-of-wp-admin-wordpress-on-azure-app/ba-p/3731647)
- [WordPress Best Practices for Performance](https://azureossd.github.io/2020/08/07/wordpress-best-practices-for-performance/index.html)

## Availability
- [WordPress Common Troubleshooting Scenarios](https://azureossd.github.io/2022/08/03/WordPress-common-troubleshooting-scenarios/index.html)
