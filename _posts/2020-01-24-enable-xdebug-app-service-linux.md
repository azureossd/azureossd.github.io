---
title: " Azure App Service Linux - Enable XDebug for PHP"
author_name: Toan Nguyen
categories:
  - PHP
  - Azure App Service on Linux
  - Configuration
  - How-To
  - Debugging
date: 2020-01-23 11:50:06
tags:
header:
    teaser: /assets/images/Xdebug_Logo.svg
toc: true
toc_sticky: true
---

XDebug is commonly used to help with debugging PHP applications.  To enable the feature during development or testing, please following the steps outlined in this blog.

## Enable XDebug

1. In the Azure Portal, add an App Setting with the following Key and Value.

    ```text
    key = PHP_ZENDEXTENSIONS
    value = xdebug
    ```
2. Save settings.

## Verify XDebug is Enabled

To verify that the extension is enabled, create a phpinfo page and check if XDebug is there.

### Create PHPInfo Page

1. Go to the Kudu site for your App (i.e. https://\<sitename\>.azurewebsites.net) and select SSH from the menu.
2. Using SSH, go to "/home/site/wwwroot" directory.
3. Enter the following.

    ```bash
    echo "<?php phpinfo();" >> info.php
    ```
4. You should now see that XDebug is enabled by going to https://\<sitename\>.azurewebsites.net/info.php

    ![XDebug](/media/2020/01/xdebugext.png)

5. **Remove the info.php page** once you're done using the page.

## Configure XDebug

By default, only "xdebug.remote_enable=on" is configured which isn't too helpful.  We have a blog for how to enable XDEBUG on Web Apps (Windows) [here](/2017/01/09/steps-to-enable-xdebug-for-php-profiling), so to stay inline with those steps, you can enable the xdebug_enable_trigger by performing the following.

1. Go to https://<sitename>.scm.azurewebsites.net.
2. Select "Debug Console" -> "SSH".
3. Using your favorite editor, open the following file.  I'll be using vi.

    ```bash
    vi /usr/local/etc/php/conf.d/xdebug.ini
    ```

   NOTE:  You can also modify the following file instead.

    ```bash
    vi /usr/local/php/etc/conf.d/xdebug.ini
    ``` 
4. Add the following at the end of the file.

    ```ini 
    xdebug.profiler_enable_trigger=on
    ```

## Reload Apache

Type the following to reload the changes into Apache.

```bash
service apache2 reload
```

## Debugging
XDebug will generate a "cachegrind" file that you can use to help debug your app.  To generate the cachegrind file, to your site and add `?XDEBUG_PROFILE=1` to the end of the URL.  Example below.
 
http://\<your-site\>/\<page-name\>.php?XDEBUG_PROFILE=1
 
You can use FTP to download the cachegrind files from the "home/LogFiles" directory and use http://ceefour.githugrb.io/wincachegrind/ to view the files to determine where the issue is occurring. You can also download the log by going to https://\<sitename\>.scm.azurewebsites.net/api/dump
