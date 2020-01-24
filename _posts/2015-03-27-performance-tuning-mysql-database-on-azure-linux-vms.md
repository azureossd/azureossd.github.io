---
title: "Performance Tuning MySQL Database on Azure Linux VM's"
tags:
  - azure mysql performance tuning
categories:
  - MySQL
date: 2015-03-27 07:53:00
author_name: Srikanth S.
---

  **Please tune these settings in your Test/Staging environments and simulate load to see if it increases performance. These settings should not be applied directly in Production environment.** In addition to the settings mentioned in below article: [http://azure.microsoft.com/en-us/documentation/articles/virtual-machines-linux-optimize-mysql-perf/](http://azure.microsoft.com/en-us/documentation/articles/virtual-machines-linux-optimize-mysql-perf/) You can also tune some of these settings to obtain higher performance if you are using Raid 0 (Following the instructions provided in above article) and are using innodb storage engine.

1.  You can use innodb\_flush\_method = O\_DIRECT to get higher performance when using Raid 0 configuration with Azure Storage disks presented to your linux VM’s. On some flavors of Linux setting innodb\_flush\_method = O\_DSYNC also can give you improved performance.
2.  You can use innodb\_io\_capacity to match with IOPS settings that Azure offers for Basic/Standard storage. IOPS limits for Basic Storage account is 300 IOPS and for Standard is 500 IOPS. If you are using multiple storage disks to configure your RAID 0, then you can stack your IOPS based on number of storage disks in the RAID group.

1.  For ex: if you have a VM which has 4 storage disks presented which are associated with Basic Tier Storage, you can get iops of 1200. (4 x 300 IOPS).
2.  If you have a VM which has 8 storage disks presented which are associated with Standard Tier Storage, you can iops of 4000. (8 x 500 IOPS).
3.  There is an option for premium storage as well which provides much higher IOPS. Please check this article for information on premium storage: [http://azure.microsoft.com/en-us/documentation/articles/storage-premium-storage-preview-portal/#overview](http://azure.microsoft.com/en-us/documentation/articles/storage-premium-storage-preview-portal/#overview)
4.  There is a limit to the number of storage disks that can be attached to a VM. Please refer to this document for disk limits: [https://msdn.microsoft.com/library/azure/dn197896.aspx](https://msdn.microsoft.com/library/azure/dn197896.aspx)

Other settings that can be tuned when using innodb storage engine are below:

1.  You can play with innodb\_thread\_concurrency settings to get more performance when concurrent user count is high. Please refer to documentation provided here to play with this setting on your VM.

1.  [http://dev.mysql.com/doc/refman/5.7/en/innodb-parameters.html#sysvar\_innodb\_thread_concurrency](http://dev.mysql.com/doc/refman/5.7/en/innodb-parameters.html#sysvar_innodb_thread_concurrency)

3.  You can set innodb_doublewrite = 0 when using a MySQL DB mainly for read heavy operations only. Setting this on a transactional database can lead to data integrity issues.
4.  You can set innodb\_flush\_log\_at\_trx_commit = 2, when using MySQL DB mainly for read heavy operations. Setting this on a transactional database can lead to it not being ACID compliant and hence lead to data integrity issues.
5.  Consider using innodb\_file\_per_table = 1 setting. This will force each table and its indexes into its own data file.

On Linux VM’s thread_concurrency setting has no effect. So you can comment out this setting. Also consider having your data files and logs files on different file systems which are not on same storage drive. This will avoid IO contention for log writers and data writers on a database which is under heavy usage.

**Please tune these settings in your Test/Staging environments and simulate load to see if it increases performance. These settings should not be applied directly in Production environment.**