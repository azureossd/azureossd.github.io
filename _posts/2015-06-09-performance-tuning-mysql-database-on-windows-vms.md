---
title: "Performance Tuning MySQL Database on Windows VMs"
categories:
  - MySQL
  - Performance
  - Configuration
  - Azure VM
  - How-To
date: 2015-06-09 14:27:41
tags:
author_name: Srikanth S.
---

This blog provides best practices for optimizing MySQL database performance in Azure Virtual Machines running Windows. Below are couple of quick steps that can be performed during virtual machine setup:

1.  Keep the storage account and Windows VM in the same region.
    
2.  Do not use OS or temporary disks for data or log folders.
    
3.  Stripe multiple data disks to get increased IO throughput (IOPS).
    
4.  Separate data and log file paths to obtain higher IOPS for data and log.
    
5.  Do not use any caching options on the data disks ( cache = none).
    

Below are some of the settings that can be performed on MySQL database itself to get higher performance:

1.  skip-name-resolve : This disables DNS host name lookups. The server will use IP addresses only and not match host names to match connecting hosts. This option skims off about 5-10 sec taken to connect to the database immediately, if you are using ip addresses.
    
2.  innodb\_buffer\_pool_size: The amount of RAM allocated to innodb storage engine to cache data and indexes of tables. This can normally be set to 70-80 % of the RAM, if this VM is dedicated for MySQL.
    
3.  innodb\_log\_file_size: Size of the log file. The higher the log file size, the lesser checkpoints are done which saves disk I/O. Set this to 256/512 MB depending on the size of your database. There is a hard limit of 4GB on the size of this file.
    
4.  max_connections: Depending on how efficient your code is, you may not need higher connections, but the max limit is 10000. You can adjust this parameter based on your code.
    
5.  innodb\_file\_per_table: Set this to 1 so that innodb can create individual files for storing each tables data and indexes. If this is set to 0, tables data and indexes are stored in a shared file. This could lead to resource contention.
    
6.  innodb\_flush\_log\_at\_trx_commit: Default value is 1. Other options are 0 and 2. Default value of 1 is needed to get ACID compliance up to the second. You can achieve better performance by using 2, but there is a chance that you can lose 1 second of data in case of an OS crash or power outage.
    
7.  innodb\_log\_buffer_size: This enables innodb to store log information in cache before writing out to disk. In an oltp setting, this should be set to a higher size so that disk I/O is kept low.
    
8.  innodb\_io\_capacity: This can be set to match the IOPS of your data disks.
    
9.  innodb\_thread\_concurrency: You can play with this setting to achieve higher concurrency.
    

Above settings can be changed in my.ini file (under mysqld section) that resides under your MySQL Installation. If you installed (MySQL 5.6) with default settings, it will be under %PROGRAMDATA%\\MySQL\\MySQL Server 5.6\\my.ini. Location may change based on the version installed. Another way of changing these settings is through MySQL Workbench ( Administration – Options File). You can run benchmark tests on your VM after tuning these parameters and create baseline tests and further tune the database to see if you are getting better performance. You can also turn on slow\_query\_log and use long\_query\_time to log slow queries taking more than the value set ( in seconds). This provides insights into which query is running slower and provides an opportunity to tune the query. **Note: All these should be tested on your testing/staging environment before moving them to production.**