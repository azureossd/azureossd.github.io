---
title: " Use Microsoft Azure Redis Cache with Drupal 7"
tags:
  - Drupal Redis Module
  - Microsoft Azure Redis Cache
  - Predis
categories:
  - PHP
  - Drupal
  - Redis
date: 2015-07-14 12:58:00
author_name: Yi Wang
---

1\. Install Drupal Redis Module: <https://www.drupal.org/project/redis>

2\. Subscribe Microsoft Azure Redis Cache: <http://azure.microsoft.com/en-us/services/cache/>

3\. Install Predis package:\
- Download: <https://github.com/nrk/predis/>\
- Install: Unzip predis-1.0.zip (downloaded from above link), create a folder "predis" at wwwroot, copy contents in "predis-1.0" to "wwwroot/predis"\
- Run "php composer.phar install" (in the same directory with composer.json)

[![](/media/2019/03/8117.install-predis.PNG)](/media/2019/03/8117.install-predis.PNG)

 

(If you do not have composer.phar installed, install it at wwwroot, download site: <https://getcomposer.org/download/>, you can use the curl command on Azure)

[![](/media/2019/03/4572.download-composer.PNG)](/media/2019/03/4572.download-composer.PNG)

\- Modify include\_path in .user.ini: add include\_path='.;D:\\home\\site\\wwwroot\\predis' )\
- Require Predis package before use it: Add  require("predis/autoload.php"); in PHP code

4\. Configure Redis in Drupal:\
In .settings.php, add following code to configure redis cache (sample code):

require("predis/autoload.php");

\$conf\['redis\_client\_interface'\] = 'Predis';\
\$conf\['redis\_client\_host'\] = '\<redisCacheName.redis.cache.windows.net\>';\
\$conf\['redis\_client\_port'\] = 6379;\
\$conf\['redis\_client\_password'\] = '\<Primary Access Key\>';\
\$conf\['lock\_inc'\] = 'sites/all/modules/contrib/redis/redis.lock.inc';\
\$conf\['cache\_backends'\]\[\] = 'sites/all/modules/contrib/redis/redis.autoload.inc';\
\$conf\['cache\_default\_class'\] = 'Redis\_Cache';

Note: If SSL port 6380 does not work, turn on NON-SSL PORT 6379 (change the value of "Allow access only via SSL" to "No")

[![](/media/2019/03/3286.redis-ssl.PNG)](/media/2019/03/3286.redis-ssl.PNG)

 

5\. Test:

\- If the configuration works and connect to Azure Redis Cache, you should see the hostname and port populated in Drupal.

\- Turn on Diagnostic in your Microsoft Azure Redis Cache, check the data from Monitoring tool, example data:

[![](/media/2019/03/2068.redis-monitor.PNG)](/media/2019/03/2068.redis-monitor.PNG)

 

6\. Reference: <https://redislabs.com/drupal-redis>
