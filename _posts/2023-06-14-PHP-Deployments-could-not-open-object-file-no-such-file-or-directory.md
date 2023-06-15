---
title: "PHP Deployments: cannot open shared object file: no such file or directory"
author_name: "Anthony Salemo"
tags:
    - PHP
    - Troubleshooting
    - Azure App Service on Linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-06-14 12:00:00
---

This post will cover "cannot open shared object file: no such file or directory" messages seen at startup for PHP applications.

# Prerequisites
**IMPORTANT:** Make sure App Service Logs are enabled first

- LogStream
- Retrieving logs directly from the Kudu site, or directly view/download via an FTP client
- Diagnose and Solve Problems -> Application Logs detector, Container Crash detector, or Container Issues detector

If App Service Logs are not enabled, only `docker.log` files will be generated, which will not show application related stdout / stderr and will make troubleshooting issues more complicated.

# Overview
Sometimes, certain PHP packages may rely on "shared object files" (`.so` extension files) thay may not be present in the current environment - on PHP with App Service Linux, that environment would be a Debian-based Docker Container. This may look something like this:

```
cannot open shared object file: no such file or directory) /usr/local/lib/php/extensions/no-debug-non-zts-20200930/opache.so
```

Or

```
PHP Startup: Unable to load dynamic library '/home/site/ext/rdkafka-6.0.3/rdkafka.so' (tried: /home/site/ext/rdkafka-6.0.3/rdkafka.so (/home/site/ext/rdkafka-6.0.3/rdkafka.so: cannot open shared object file: No such file or directory), /usr/local/lib/php/extensions/no-debug-non-zts-20220829//home/site/ext/rdkafka-6.0.3/rdkafka.so.so (/usr/local/lib/php/extensions/no-debug-non-zts-20220829//home/site/ext/rdkafka-6.0.3/rdkafka.so.so: cannot open shared object file: No such file or directory)) in Unknown on line 0
```

The message about which `.so` file is not present will depend on your application. Below is some reasons why this may appear and how to resolve them.

# Reasons
## Bad syntax or misconfigured .ini file
Assuming that you know the extension you need to install, but it is failing with the above message, it is likely to be one of these scenarios:
- Following the `PHP_INI_SCAN_DIR` App Setting ([documentation](https://learn.microsoft.com/en-us/azure/app-service/configure-language-php?pivots=platform-linux#customize-php_ini_system-directives)), you may have created a custom `.ini` file with the `extension=` property pointing to the wrong `.so` location. Example:
    - `/home/site/ext/libgomp/modules/libgomp.so` is the full path that contains a needed `.so`
    - However, your `.ini` is pointing to `/home/site/libgomp/libgomp.so`
- The location name may have been mispelled
- There may be a syntax error in your path
- If using a custom startup script, the package may be failing to install

**Pecl**:

If installing via [Pecl](https://pecl.php.net/) - this may install to directories _outside_ of `/home`. If you then have your `.ini` pointing to an `.so`, eg., simply `extension=mysharedlib.so` - this would obviously likely fail:
- 1. Because of the path difference locations and the possibility this does **not** fall under one of the paths that PHP tries to use for dynamic libraries
- 2. After any container restart, changes outside of `/home` are reverted

You can validate where Pecl will install extensions with the `pear config-show` command and looking at the `ext_dir` column with `PEAR extension directory`.

```
root@b37f5b3aca46:/home# pear config-show
Configuration (channel pear.php.net):
=====================================
Auto-discover new Channels     auto_discover    0
Default Channel                default_channel  pear.php.net
HTTP Proxy Server Address      http_proxy       <not set>
PEAR server [DEPRECATED]       master_server    pear.php.net
Default Channel Mirror         preferred_mirror pear.php.net
Remote Configuration File      remote_config    <not set>
PEAR executables directory     bin_dir          /usr/local/bin
PEAR documentation directory   doc_dir          /usr/local/lib/php/doc
PHP extension directory        ext_dir          /usr/local/lib/php/extensions/no-debug-non-zts-20220829
PEAR directory                 php_dir          /usr/local/lib/php
```

If installing extensions this way, ensure to copy the contents from ` /usr/local/lib/php/extensions/no-debug-non-zts-yyymmdd` to `/home/site/ext` (or your relevant extension direcotry), for example:

```
cp /usr/local/lib/php/extensions/no-debug-non-zts-20220829/rdkafka.so /home/site/ext
```

**NOTE**: If you're manually uploading `.gz` packages from Pecl, or, their extracted contents, ensure that if these are being manually built with `phpize` / `./config` / `./make` - that these properly build. Packages that are incorrectly built, or fail to build, may show the same `Unable to load dynamic library` message.

Additionally, attempting to use a Shared Library that is not compatible with the application package (eg., a package under `vendor/`) may also show `Unable to load dynamic library`.

## Missing packages
Aside from the potential of a misconfiguration - there may be a chance that the PHP libraries being used may rely on `.so` files that can be installed through a [Custom Startup Script](https://azureossd.github.io/2020/01/23/php-custom-startup-script-app-service-linux/index.html) instead of configuring it as an PHP extension.

> **NOTE**: In some cases, you may have to use both a configured PHP extension and also install commands via custom startup file/script - this however depends on the application and packages being used

This will require reviewing which `.so` package is missing and seeing which Linux packages need to be installed on startup to resolve this. Typically, doing a quick google search of the missing `.so` file will normally show which package(s) need to be installed.

An an example of a startup command could just be:

```
apt-get install -y librdkafka-dev
```

Or a startup file:

```bash
#!/bin/bash

apt-get install -y librdkafka-dev
```

Note that, in either case, for a PHP image using Apache or NGINX - we don't need to explicitly invoke any `apache` or `nginx` commands as they're implicitly ran to start after the startup command or file is done.

## Further resources
These below resources can help properly set up installing PHP extensions.

- [Configure PHP applications - Customize php.ini settings](https://learn.microsoft.com/en-us/azure/app-service/configure-language-php?pivots=platform-linux#customize-phpini-settings)
- [Pecl - PHP extension repository](https://pecl.php.net/)
    - Pecl can be used as a simple way to find and install extensions
- You can use the `php -m` command to view the currently loaded modules. Below is example output:

    ```
    root@2a4e1b76038d:/home# php -m
    [PHP Modules]
    bcmath
    calendar
    Core
    ctype
    curl
    date
    dom
    exif
    fileinfo
    filter
    ftp
    ... more modules ...
    ```

- You can use the `php -i | grep ini` command to view all the `.ini's` currently loaded. For example:

    ```
    root@2a4e1b76038d:/home# php -i | grep ini
    Configuration File (php.ini) Path => /usr/local/etc/php
    Scan this dir for additional .ini files => /usr/local/etc/php/conf.d
    Additional .ini files parsed => /usr/local/etc/php/conf.d/20-sqlsrv.ini,
    /usr/local/etc/php/conf.d/30-pdo_sqlsrv.ini,
    /usr/local/etc/php/conf.d/docker-php-ext-bcmath.ini,
    /usr/local/etc/php/conf.d/docker-php-ext-calendar.ini,
    /usr/local/etc/php/conf.d/docker-php-ext-exif.ini,
    /usr/local/etc/php/conf.d/docker-php-ext-gd.ini,
    /usr/local/etc/php/conf.d/docker-php-ext-gettext.ini,
    ...more inis...
    ```

- Lastly, creating a `.php` page with a `phpinfo()` function in it can potentially be helpful for additional information on loaded extensions.