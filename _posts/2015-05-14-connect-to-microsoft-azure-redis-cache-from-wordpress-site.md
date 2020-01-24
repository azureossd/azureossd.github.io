---
title: "Connect to Microsoft Azure Redis Cache from WordPress site"
tags:
  - Redis Cache
  - Web Apps
  - WordPress Azure CDN
categories:
  - WordPress
  - Redis
  - How-To
date: 2015-05-14 14:50:00
author_name: Yi Wang
---

Microsoft Azure Redis Cache is based on the popular open source Redis Cache. It gives users access to a secure, dedicated Redis Cache managed by Microsoft. You can use Microsoft Azure Redis Cache with WordPress site to improve performance. In this article, we cover how to setup Redis cache and connect to it fro WordPress.

1\. Create Azure Redis Cache from Azre portal, <http://azure.microsoft.com/en-us/services/cache/>

![](/media/2019/03/2311.redis-00.PNG)

 

2\. Install WordPress "Redis Object Cache" plugin, <https://wordpress.org/plugins/redis-cache/>

3\. Add following information in wp-config.php

``` {style="background: white;color: black;font-family: Consolas;font-size: 10pt"}
define('WP_REDIS_SCHEME', 'tcp');
define('WP_REDIS_HOST', '<your redis account name>.redis.cache.windows.net');
define('WP_REDIS_PORT', '6379');
define('WP_REDIS_DATABASE', '0');
define('WP_REDIS_PASSWORD', '<your primary access key>');
```


Note: Be sure to put the code above /* Thant's all, stop editing! Happy blogging */ comment line


(refer to https://wordpress.org/support/topic/enabling-with-predis-and-remote-redis )

Get Redis host name and Access key from Azre portal. If you need non-SSL port, enable it from "Access Ports".


4. Check from WordPress plugins, confirm that "Redis Object Cache" is connected to Microsoft Azure Redis Cache.



There is another way to configure and use Redis Cache on WordPress:


1)       Create Azure Redis Cache account

2)       Download php\_redis.dll from <http://windows.php.net/downloads/pecl/releases/redis/2.2.7/>. Download nts-vc11-x86.zip for php version being used.

5.  For php 5.5: <http://windows.php.net/downloads/pecl/releases/redis/2.2.7/php_redis-2.2.7-5.5-nts-vc11-x86.zip>
6.  For php 5.6: <http://windows.php.net/downloads/pecl/releases/redis/2.2.7/php_redis-2.2.7-5.6-nts-vc11-x86.zip>
7.  For php 5.4: <http://windows.php.net/downloads/pecl/releases/redis/2.2.7/php_redis-2.2.7-5.4-nts-vc9-x86.zip>

3)       Extract php\_redis.dll from the zip file.

4)       Create D:\\home\\site\\ext folder from ftp/kudu and Copy extracted php\_redis.dll to d:\\home\\site\\ext folder

5)       Create D:\\home\\site\\ini folder from ftp/kudu and create extensions.ini file. add below lines to the file:

; Enable Extensions

extension=d:\\home\\site\\ext\\php\_redis.dll

6)       Install WP Redis plugin from pantheon from WP dashboard.

7)       Add these line above db information (above define('DB\_NAME', 'abcdefg')) in wp-config.php:

      \$redis\_server = array(

      'host' =\> 'abcd.redis.cache.windows.net',

      'port' =\> 6379,

      'auth' =\> 'key',

      );

8)       Copy d:/home/site/wwwroot/wp-content/plugins/wp-redis/object-cache.php file to d:/home/site/wwwroot/wp-content folder.

9)       Once you enable the plugin from dashboard, and browse around you should see hits/misses on Azure Redis Cache dashboard.
