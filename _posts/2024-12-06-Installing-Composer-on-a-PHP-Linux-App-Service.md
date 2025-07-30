---
title: "Installing Composer on a PHP Linux App Service"
author_name: "Ryan Douglass"
tags:
    - Linux
    - PHP
    - Configuration
    - Azure App Service on Linux
    - Composer
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/composerphp.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-12-06 12:00:00
---

This post will show you how to instal Composer on a PHP Linux App Service.  We will show you how to persist the installation through container recycles.

# Installation

To install Composer, we will download the installer onto the container.  Then, run the installer and generate a composer.phar.  We will create a startup command that copies the composer.phar to /usr/local/bin/composer.  This will make composer available every time the app starts up.  Optional steps for removing potential warnings for running composer as root, and for keeping composer automatically up to date.

## Download on webssh

Go to `yourappname.scm.azurewebsites.net`

- Or, from the Azure portal, go to your App Service.  In the left menu, Under `Development Tools`, click `Advanced Tools`.  On this page, click `Go->`.

This will bring you to the Kudu site.  Click on `SSH` on the top bar.

In the terminal, run the following commands:

```shell
mkdir /home/site/ext && cd /home/site/ext && curl -sS https://getcomposer.org/installer | php
```

![Command shows creating a new directory /home/site/ext and downloading the composer install and running it with php](/media/2024/12/composer-install-01.png)

This creates a new directory in the persistent storage on the App Service.  We download the installer for Composer, then pipe the output to php.  This creates our composer.phar which will be the latest release.

## Startup command

From the same webssh terminal, we want to create a startup script that copies the composer.phar to `/usr/local/bin/composer`.

In the terminal, run the following command:

```shell
touch /home/site/startup.sh && nano /home/site/startup.sh
```

In the nano window that opened you can right click to paste the following shell script:

```shell
#!/bin/sh

cp /home/site/ext/composer.phar /usr/local/bin/composer
```

![A nano window showing the startup script which copies the composer.phar to /usr/local/bin](/media/2024/12/composer-install-02.png)

Press `CTRL + O` then `ENTER` to write the file.  Press `CTRL + X` to close the editor.

## Azure portal configuration

In the Azure Portal, we need to add the startup script to the configuration for the startup command.

From the Azure Portal, go to your App Service.  On the left menu, under `Settings`, click `Configuration`.  Under `General Settings` add `/home/site/startup.sh` to the `Startup Command`.

![configuration window for an app service showing how to add a startup command](/media/2024/12/composer-install-03.png)

After, click `Save` at the top of the page, then `Continue`.

- Note that this will cause your app to restart.

Composer is now available in the container.

![shows the output of running composer -V from the terminal](/media/2024/12/composer-install-04.png)

## Optional configurations

### Super user warning

If you receive a warning about running composer as a super user, you can add the following app setting `COMPOSER_ALLOW_SUPERUSER` = `1`.

- Reference: [COMPOSER_ALLOW_SUPERUSER](https://getcomposer.org/doc/03-cli.md#composer-allow-superuser)
- *If set to 1, this env disables the warning about running commands as root/super user. It also disables automatic clearing of sudo sessions, so you should really only set this if you use Composer as a super user at all times like in docker containers.*

From the Azure Portal go to `Settings` then `Environment variables`.  Click `+ Add`, then enter the name `COMPOSER_ALLOW_SUPERUSER` and value `1`.

![Adding an environment variable from the portal](/media/2024/12/composer-install-05.png)

Click `Apply` at the bottom the page, click `Apply` again, then click `Confirm`.  This should disable the warning.

- Note this will restart the web app.

### Automatic update

With the configuration we have discussed, you will need to manually update composer.  You can follow the steps under [Download on webssh](#download-on-webssh) to download the most recent version of composer.  The startup script will use the new composer.phar on the next restart.

This behavior may be preferable in production applications where you want to avoid unexpected changes.  However if you prefer to have composer updated automatically change your startup script to the following.

```shell
#!/bin/sh

curl -sS https://getcomposer.org/installer | php && mv composer.phar /usr/local/bin/composer
```

This will download the composer installer on every restart, generate a new composer.phar, rename and move it to /usr/local/bin/composer.  This ensures that composer is the most recent release every time you restart the application.
