---
title: " Azure App Service Linux - Custom Startup Script for Nodejs & Python"
author_name: Toan Nguyen
categories:
  - Python
  - Nodejs
  - Azure App Service on Linux
  - Configuration
  - How-To
date: 2020-01-23 12:50:06
tags:
header:
    teaser: /assets/images/pynodelinux.png
---
In my previous post [Azure App Service Linux - PHP Custom Startup Script](/2020/01/23/php-custom-startup-script-app-service-linux) I covered steps for adding a custom startup script for PHP.  In this post, I'l be providing some examples for creating custom startup scripts that will work for both our Nodejs and Python images. 

## Modifying the Startup Script

Both the Nodejs and Python images create startup scripts based on default settings or based on a "Startup Command" that you may be specifying in the Azure Portal, Azure CLI, etc.  We'll be copying and modifying the file to use for our custom script.

1. Go to the Kudu site for your App (i.e. https://\<sitename\>.azurewebsites.net) and select SSH from the menu.
2. SSH into the container and copy the current startup script by typing the following
```bash
cp /opt/startup/startup.sh /home
```
3. Using your favorite editor, 	edit the startup.sh under /home/startup.sh and add your changes to the top of the file after **"#!/bin/sh"**.  In the sample below, I'll be installing cron to run a cronjob.

```bash
# Installing cron
apt-get update -qq && apt-get install cron -yqq
service cron start
mkdir /home/BackupLogs
(crontab -l 2>/dev/null; echo "*/5 * * * * cp /home/LogFiles/*.log /home/BackupLogs")|crontab
```
4. Save the file.

## Saving the Changes
In the Azure Portal configurations, add "/home/startup.sh" as the Startup Command and restart the site.



