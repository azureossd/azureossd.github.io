---
title: "Install APCU extension for Azure App Service Linux PHP 7.4"
author_name: "Christopher Maldonado"
tags:
    - php74
    - app service linux
    - apcu
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: false
toc_sticky: true
date: 2021-10-21 12:00:00
---

Installing PHP extension APC for Azure App Services on Linux PHP 7.4

## Intro

There are many different caching solutions for various types of applications out there. Alternative PHP Cache is an opcode caching plugin for PHP. With APC, your PHP script executions will run more efficiently.

## Steps

Navigate to your App Service via the Azure Portal. Under the `Development Tools` section, select `SSH` then `Go -->`.

### Building the APCu extension

Using PECL to install the extension at times can fail, so here we will be doing a manual build and install.

Create a new folder and navigate to the newly created directory.

```sh
mkdir -p /tmp/pear/temp
cd /tmp/pear/temp
```

In the next steps we will download the bundled source using pecl to configure and build the .so extension file.

```sh
pecl bundle apcu
cd apcu
phpize
./configure
make
```

After a successful configure and make, a new directory called `modules` will have been created with an `apcu.la` and `apcu.so` file. Move the `.so` file into your home directory. For example, `/home/site/ext`.

```sh
mkdir -p /home/site/ext
cp /tmp/pear/temp/apcu/modules/apcu.so /home/site/ext
```

With the new extension moved to a location where it will persist after a restart, a `.ini` file is needed so that PHP can load this extension when it starts up. Create a new directory for your `.ini` file.

```sh
mkdir -p /home/site/ini
echo "extension=/home/site/ext/apcu.so" > /home/site/ini/apcu.ini
```

To ensure that PHP picks up this extension and loads it, an App Setting can be configured to point PHP to look inside this directory for any additional `.ini` files.

Navigate to your App Service via the Azure Portal. Under the `Configuration` section, select `New application setting`.

    Name: PHP_INI_SCAN_DIR
    Value: /usr/local/etc/php/conf.d:/home/site/ini

Save these changes and restart your App Service.

### Verify if APCU extension has been loaded

There are two ways you can verify if the extension was loaded successfully. First, would be to create a php file with the following code inside:

```php
<?php phpinfo(); ?>
```

This will output all your PHP configuration settings and more. Search for `APCu` and a section dedicated to this extension should be displayed.

The second way to verify is using the `SSH` option under `Development Tools`.

Here you will run the following command and the output will be the `apcu` specific settings.

```sh
php -i | grep apc
```

## Conclusion

Enabling this extension is optional for most PHP applications. However, this is beneficial for PHP Content Management Systems. The extension helps to provide additional performance specific to PHP scripts.
