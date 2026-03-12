---
title: Installing WordPress within Subdirectory
author_name: Christopher Maldonado
tags:
    - wordpress
    - app service linux
    - php wordpress
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - PHP # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - WordPress # Django, Spring Boot, CodeIgnitor, ExpressJS
    - MySQL # MySQL, MongoDB, 
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/WordPress.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-03-30 12:00:00
---

Using Azure's Marketplace item for WordPress on App Serivce to install WordPress within a subdirectory instead of root.

## Deploying WordPress on App Services

This post assumes that the Azure Marketpleace item for WordPress on App Services is being utitilze. If this has not been deployed yet, please do so by following the steps in the following article:

[Quickstart: Create a WordPress site - Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/quickstart-wordpress)

### Settings to Update

Once we have WordPress installed on Azure App Service, browse to your newly created site to ensure it has been installed and loaded within the root of your site.

After everything has loaded up correctly, we will need to add a new Application Setting.

```yaml
Key: SKIP_WP_INSTALLATION
Value: true
```

This will ensure that the installation portion of the startup script does not execute.

From the Azure Portal, navigate to the App Service and open SSH. You can also access it via the following link updated for your site: **https://your-site-name.scm.azurewebsites.net/webssh/host**

Here we will complete a few steps:

1. Move content to new subdirectory
2. Update index.php file
3. Update wp-config.php file

#### Moving content to new subdirectory

With SSH open, navigate to the */home/site/wwwroot/* directory. Here we will create our new subdirectory. For this example, we will use *blog* as our new subdirectory. Once the subdirectory is created, we will move everything within the folder.

```bash
cd /home/site/wwwroot
mkdir blog
mv *.* blog/
mv wp-admin blog/
mv wp-content blog/
mv wp-includes blog/
```

Make a copy of the index.php file and place it in the root. This will allow the site to be accessible from the root of the domain as well as the new *blog* subdirectory.

```bash
cp blog/index.php index.php
```

#### Update index.php

In order to make the site accessible via the root, we will need to update the *index.php* file in the root directory. Use a text editor of your choice and update the following:

```php
# From this
require __DIR__ . '/wp-blog-header.php';

# To this
require __DIR__ . '/blog/wp-blog-header.php';
```

#### Update wp-config.php

The last thing we need to modify is the wp-*config.php* file within the new subdirectory. Make the following changes to reflect your new subdirectory as well.

```php
# From this
define('WP_HOME', $http_protocol . $_SERVER['HTTP_HOST']);
define('WP_SITEURL', $http_protocol . $_SERVER['HTTP_HOST']);

# To this
define('WP_HOME', $http_protocol . $_SERVER['HTTP_HOST'] . '/blog');
define('WP_SITEURL', $http_protocol . $_SERVER['HTTP_HOST'] . '/blog');
```

## Conclusion

Once all settings have been updated, your WordPress site should now be accessible via the new subdirectory.
