---
title: " WordPress: Error establishing a database connection"
tags:
  - cleardb
  - ClearDB Troubleshooting
  - mysql
  - PHP
  - php error log
  - php error log azure webapps
  - php wordpress
  - webapp
  - wordpress
categories:
  - Azure App Service on Windows
  - PHP
  - WordPress
  - Debugging
date: 2015-10-14 08:11:00
author_name: Mangesh Sangapu
---

If you see the infamous "**Error establishing a database connection**", enable WordPress Debug Logging by following the steps outlined here: [Logging Errors in WordPress 2](../2015/10/09/logging-php-errors-in-wordpress-2/)  

* * *

  Debug.log will be saved within wp-content folder. Possible error messages in debug.log:

\[25-Jul-2016 15:34:44 UTC\] PHP Warning: mysqli\_real\_connect(): (HY000/1045): Access denied for user 'be96d626d450b1'@'23.102.165.199' (using password: YES) in D:\\home\\site\\wwwroot\\wp-includes\\wp-db.php on line 1490 \[25-Jul-2016 15:34:44 UTC\] PHP Warning: mysql_connect(): Access denied for user 'be96d626d450b1'@'23.102.165.199' (using password: YES) in D:\\home\\site\\wwwroot\\wp-includes\\wp-db.php on line 1520

 

\[25-Jul-2016 15:45:38 UTC\] PHP Warning: mysqli\_real\_connect(): (HY000/2002): php\_network\_getaddresses: getaddrinfo failed: No such host is known. in D:\\home\\site\\wwwroot\\wp-includes\\wp-db.php on line 1490

\[25-Jul-2016 15:45:38 UTC\] PHP Warning: mysql\_connect(): php\_network_getaddresses: getaddrinfo failed: No such host is known. in D:\\home\\site\\wwwroot\\wp-includes\\wp-db.php on line 1520

  After enabling the logs, if you see the messages above, verify the **database credentials** within wp-config.php, highlighted below:     ![2016-07-25 10_24_28-Start](/media/2015/10/2016-07-25-10_24_28-Start.png)

* * *

   

\[25-Jul-2016 00:03:13 UTC\] PHP Warning:  mysqli\_real\_connect(): (HY000/1226): User 'abcdefghijk79' has **exceeded the 'max\_user\_connections' resource (current value: 4)** in D:\\home\\site\\wwwroot\\wp-includes\\wp-db.php on line 1454

If this error is apparent in your debug.log or php_errors.log, then your application is exceeding the number of connections.

If you’re hosting on ClearDB, please verify the number of connections available in your [service plan](https://www.cleardb.com/pricing.view).

[![2016-07-25 10_57_37-Start](/media/2015/10/2016-07-25-10_57_37-Start.png)](/media/2015/10/2016-07-25-10_57_37-Start.png)

**Figure 1.** Screen showing ClearDB Service Plans with max number of connections, outlined in red.

* * *

#### If you need assistance with upgrading your ClearDB database, contact ClearDB by emailing [support@cleardb.com](mailto:support@cleardb.com).

**For optimizing WordPress, please see this article: **[https://azure.microsoft.com/en-us/blog/10-ways-to-speed-up-your-wordpress-site-on-azure-websites/](https://azure.microsoft.com/en-us/blog/10-ways-to-speed-up-your-wordpress-site-on-azure-websites/ "https://azure.microsoft.com/en-us/blog/10-ways-to-speed-up-your-wordpress-site-on-azure-websites/")