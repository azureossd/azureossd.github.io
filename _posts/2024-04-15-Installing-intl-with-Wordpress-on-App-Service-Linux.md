---
title: "Installing intl with Wordpress on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Configuration
    - Azure App Service on Linux
    - Wordpress
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Wordpress
    - Deployment # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/WordPress.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-04-15 12:00:00
---

This post will cover how to install the "intl" extension on Azure's Wordpress on Linux

# Overview
`intl` is an installable extension for unicode and globalization support. This is not one of the pre-installed extensions that is a part of the container image that Wordpress on Linux uses. However, this can easily be installed.

Note, that the Wordpress on Linux container image uses Alpine Linux as it's distro - commands to install this will be using `apk`.

# Installation
1. First, familiarize yourself with [How to run Bash scripts in WordPress on Azure App Service (techcommunity)](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/how-to-run-bash-scripts-in-wordpress-on-azure-app-service/ba-p/3625692) / [How to run Bash scripts in WordPress on Linux App Services (GitHub)](https://github.com/Azure/wordpress-linux-appservice/blob/main/WordPress/running_post_startup_scripts.md) regarding the startup script location under `/home/dev/startup.sh`. Next, read [Adding PHP extensions for WordPress Linux App Services](https://github.com/Azure/wordpress-linux-appservice/blob/main/WordPress/wordpress_adding_php_extensions.md)
   - You will need to do a combination of the first two to get his properly working
2. Add the following into `/home/dev/startup.sh`:

```bash
#!/bin/bash

apk add icu-dev && \
   docker-php-ext-configure intl && \
   docker-php-ext-install intl && \
   docker-php-ext-enable intl

echo "Restarting php-fpm via supervisord.."
supervisorctl restart php-fpm
```

> **NOTE**: You _must_ add this to `/home/dev/startup.sh`. Supervisord, which is used to run the startup script execution, will only run startup scripts from this location based on it's configuration for this image.

- After installation, while in SSH, you can run `pear config-show` to find the "PHP extension directory" which should have the `intl.so` shared object file. The directory location is typically something like `/usr/local/lib/php/extensions/no-debug-non-zts-20220829`.

3. Create a directory named `ini` under `/home/site`. In this new directory, create an `extensions.ini` file with the following:

```
extension=/path/to/php/ext/dir/intl.so
```

4. Add an App Setting with the key/value pair of `PHP_INI_SCAN_DIR` and `/usr/local/etc/php/conf.d:/home/site/ini`
5. You can now validate that `intl` has been loaded by adding a `phpinfo.php` file to `/home/site/wwwroot`

![intl via phpinfo](/media/2024/04/install-intl-wordpress-1.png)

> Make sure to delete `phpinfo.php` afterwards

# Alternative installation
Another method for installation is persist `intl.so` somewhere under `/home`. However, you will still need to use a startup script to install `icu-dev` as that is a needed dependency.

1. Go into SSH (WebSSH), and run the commands earlier that installed `intl`. This will create a `intl.so` under the PHP Extension Directory location - use `pear config-show` to confirm the path.
2. Create a folder named `/home/site/ext` - navigate to the extension directory and copy the `.so` - eg., `cp intl.so /home/site/ext` (or you can do this elsewhere with an absolute path)
3. Follow the rest of the steps above with creating a `.ini` file under `/home/site/ini` and adding the `PHP_INI_SCAN_DIR` App Setting. Add the value of `extension=/home/site/ext/intl.so` to the `.ini` file you created under `/home/site/ini`.
4. Lastly, change your startup script under `/home/dev/startup.sh` to the following:

```bash
#!/bin/bash

apk add icu-dev

echo "Restarting php-fpm via supervisord.."
supervisorctl restart php-fpm
```

# Troubleshooting
If you notice that `intl` is not being loaded - or - `intl.so` is not appearing under the PHP extension directory.

Ensure that:
1. App Service Logs are enabled. These can be reviewed if there is any `stderr` appearing that may be fatal/error related. Or, if the container is now crashing/exiting.
2. If nothing relevant is seen above - go into SSH (assuming that the container is running) and check the output of `/tmp/post-startup-script-stderr---supervisor-00000000.log` or `post-startup-script-stdout---supervisor-00000000.log`.

Below is an example of reviewing stdout from a custom startup script in one of these log files:

```
7fd6d23d988d:/tmp# cat post-startup-script-stdout---supervisor-yb_gtkno.log 
This is being executed from /home/dev/startup.sh..
```

Furthermore, by reviewing `default_docker.log` (the equivalent is also shown in `/var/log/supervisor/supervisord.log`), you can confirm if a startup script is successfully executed by finding the below in logging:

```
2023-11-13 14:32:40,214 INFO spawned: 'post-startup-script' with pid 237
2023-11-13 14:32:40,306 WARN exited: post-startup-script (exit status 0; not expected)
```

Although supervisord is showing "not expected" - an exit of status 0 is successful - and what we want to see. An exit code greater than > 0 is deemed unsuccessful.
