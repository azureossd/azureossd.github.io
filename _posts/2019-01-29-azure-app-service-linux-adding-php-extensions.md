---
title: "Azure App Service Linux - Adding PHP Extensions"
author_name: Toan Nguyen
categories:
  - Azure App Service on Linux
  - PHP
  - Configuration
date: 2019-01-29 12:14:34
tags:
header:
    teaser: /assets/images/phplinux.png
toc: true
toc_sticky: true
---

Customers that need to install PHP extensions that are not available on the provided PHP images on Azure App Services Linux can perform the following steps below to install their extensions.

## Install PHP Extensions

1. Go to your KUDU console https://\<sitename\>.scm.azurewebsites.net
2. Select SSH.
3. In your SSH session, run the command highlighted in yellow.

         root@3628690f5888:/home/site/wwwroot# pear config-show
         Configuration (channel pear.php.net):
         =====================================
         Auto-discover new Channels     auto_discover    <not set>
         Default Channel                default_channel  pear.php.net
         HTTP Proxy Server Address      http_proxy       <not set>
         PEAR server [DEPRECATED]       master_server    pear.php.net
         Default Channel Mirror         preferred_mirror pear.php.net
         Remote Configuration File      remote_config    <not set>
         PEAR executables directory     bin_dir          /usr/local/bin
         PEAR documentation directory   doc_dir          /usr/local/lib/php/doc
         PHP extension directory        ext_dir          /usr/local/lib/php/extensions/no-debug-non-zts-20151012
         PEAR directory                 php_dir          /usr/local/lib/php
         PEAR Installer cache directory cache_dir        /tmp/pear/cache
         PEAR configuration file        cfg_dir          /usr/local/lib/php/cfg

4. In the output above, the path for ext\_dir is where your extension will be downloaded.  Note the path for later use.

5. To install an extension, perform the following.  I'll be installing the PHP extension "redis" in this example.

         root@3628690f5888:/home/site/wwwroot# pecl install redis
         downloading redis-4.1.1.tgz ...
         Starting to download redis-4.1.1.tgz (220,894 bytes)
         ..............................................done: 220,894 bytes
         25 source files, building
         running: phpize
         Configuring for:
         PHP Api Version:         20151012
         Zend Module Api No:      20151012
         Zend Extension Api No:   320151012
         enable igbinary serializer support? [no] :
         enable lzf compression support? [no] :
         ……
         Build process completed successfully
         Installing '/usr/local/lib/php/extensions/no-debug-non-zts-20151012/redis.so'
         install ok: channel://pecl.php.net/redis-4.1.1
         configuration option "php_ini" is not set to php.ini location
         You should add "extension=redis.so" to php.ini

6. You'll notice the path to the newly installed extension (highlighted in green) is also returned after it's installed and matches the "ext\_dir" path returned from the Pear configurations.

7. Now that the extension is installed, we'll need to create an "ext" directory under "/home/site" and copy the extension to that directory so that the extension persists if the container is restarted.  Below are the commands to do this.

          root@9a793907fbb0:/home/site/wwwroot# mkdir /home/site/ext
          root@9a793907fbb0:/home/site/wwwroot# cp /home/site/ext/usr local/lib/php/extensions/no-debug-non-zts-20151012/redis.so /home/site/ext

**Note:**  The text may continue and look \*garbled.  Don't worry, keep entering the command.

8. The command highlighted in yellow creates the "ext" directory and the one in green copies the files from the installation location to the new directory.

9. Once this is done, perform the steps provided at [App Service Linux - Update PHP Settings](/2019/01/29/azure-app-service-linux-update-php-settings/).

## Recompiling PHP extensions

If you need to reconfigure an extension such as GD, please use the following steps.

1.  SSH into your container and run the following
2.  "docker-php-ext-configure gd --with-freetype-dir=/usr --with-jpeg-dir=/usr"
3.  "docker-php-ext-install gd"
4.  cp /usr/local/lib/php/extensions/no-debug-non-zts-20151012/gd.so /home/site/ext

To test, run "service apache2 reload" then go your PHP info page to see if the "freetype" is listed under GD.  If so, update the "extensions.ini" as shown in the "Adding the Extension" section.  We will need to make some further modifications to avoid a conflict with the GD extension if the site were to be rebooted.  In your Application Settings, add the following so that the "extensions.ini" is loaded before the ones under "/usr/local/etc/php/conf.d"

Additionally, you can perform the additional steps to move the other INI files to the "/home/site/ini" directory.  In step 3, we'll rename the INI for GD so that it doesn't load the original GD extension on startup but continues to load other extensions.

1.  cp /usr/local/etc/php/conf.d/\* /home/site/ini
2.  cd /home/site/ini
3.  mv docker-php-ext-gd.ini docker-php-ext-gd.old

## Adding the Extension

Once the steps performed at [App Service Linux - Updating PHP settings](/2019/01/29/azure-app-service-linux-update-php-settings/) are complete, you'll have an "extensions.ini" in your "/home/site/ini" directory.  Below are some options for modifying the extensions.ini file to include our new PHP extension.

### Option #1 - Echo

1.  Change directories to /home/site/ini.
2.  Type the following.

      echo "extensions=/home/site/ext/redis.so" >> extensions.ini

### Option #2 - Vi

1.  Change directories to /home/site/ini.
2.  Perform the following

     a) vi extensions.ini\
     b) Press "i" on your keyboard to start editing and add the following.

      extension=/home/site/ext/redis.so


     c) Press "Esc", then ":wq!" and enter to save.

Once you're done, restart the site using the Azure Portal and you'll now see the extension installed in your PHPInfo page.
