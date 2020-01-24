---
title: "Use Redis Cache Memcache Option on Azure with Drupal 7"
tags:
  - memcache drupal
categories:
  - Drupal
  - Memcache
date: 2015-06-01 13:58:00
author_name: Yi Wang
---

Memcache is commonly used with Drupal sites to improve performance. If you find memcache client not supporting "Memcached Cloud" or Memcachier on Azure, here is a workaround

(refer to <https://azure.microsoft.com/en-us/documentation/articles/web-sites-connect-to-redis-using-memcache-protocol/> ).

 

1\. Setup Redis Cache Service on Azure:

[![](/media/2019/03/7180.redis-00.PNG)](/media/2019/03/7180.redis-00.PNG)

 

2\. Enable Memcache shim from Redis Cache:

From Azure management portal, add following app settings in CONFIGURE:

[![](/media/2019/03/0121.memcache-1.PNG)](/media/2019/03/0121.memcache-1.PNG)

Copy REDIS\_HOST, REDIS\_KEY values from your Redis Cache subscription

Set MEMCACHESHIM\_REDIS\_ENABLE to true

Note: Enable NON-SSL port 6379 from Redis Cache if SSL port 6380 is not supported by client library.

 

3\. Install PHP memcache extension (php\_memcache.dll) for your website, (download memcache extension for windows from <http://pecl.php.net/package/memcache/3.0.8/windows> )

To add the PHP extension, copy the downloaded php\_memcache.dll to wwwroot/bin/ folder, add PHP EXTENSIONS to "app settings" in Azure management portal.

For more detail, refer to <https://azure.microsoft.com/en-us/documentation/articles/web-sites-php-configure/>

 

4\. Download and install memcache module on your Drupal site ( <https://www.drupal.org/project/memcache> ), and add configuration in Settings.php:

 

\$conf\['memcache\_servers'\] = array('localhost:'.getenv("MEMCACHESHIM\_PORT") =\> 'default');

\$conf\['cache\_backends'\]\[\] = 'sites/all/modules/memcache/memcache.inc';

\$conf\['cache\_default\_class'\] = 'MemCacheDrupal';

\$conf\['cache\_class\_cache\_form'\] = 'DrupalDatabaseCache';

\$conf\['memcache\_key\_prefix'\] = 'something\_unique';

 

5\. To view cache hits, enable memcache from Drupal admin, and configure memcache statistic to show at bottom of pages, check the hit/miss ratio. View cache usage from Reids Cache account on Azure portal.

 
