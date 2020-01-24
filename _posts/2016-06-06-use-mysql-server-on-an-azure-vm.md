---
title: " Use MySQL server on an Azure VM"
categories:
  - Azure VM
  - MySQL
  - PHP
  - How-To
date: 2016-06-06 15:47:09
tags:
author_name: Yi Wang
---

Here is an option that you can host MySQL server on an Azure VM, connect your PHP sites such as WordPress, Joomla, OpenCart, etc. to the database hosted on the server.

1. Create MySQL server on Azure VM (published by Bitnami) from Marketplace:

   ![Bitnami-mysql](/media/2016/06/Bitnami-mysql-300x128.png)

   If you already have a web site on Azure, you can use the same resource group and select the same location.

   ![Bitnami-mysql-2](/media/2016/06/Bitnami-mysql-2-300x275.png)

   When you select VM, D-series is faster than A-series, with a little more cost. For more detail, refer to https://azure.microsoft.com/en-us/pricing/details/virtual-machines/

   After the VM is deployed, it is ready to use. You can make the IP of the VM to static, and the IP won't change in the case you need to reboot the VM

   ![StaticIP](/media/2016/06/StaticIP-300x139.png)

2. Migrated MySQL database to the new database, you can do it from MySQL client tool, such as PHPMyAdmin, MySQL Wordkbench, or copy sql dump to the VM, import from command line, e.g.

        mysql -u<user> -p<password> <dbname> < sqlfile.sql

3. If you need to use MySQL client tool such as PHPMyAdmin to connect to the database, modify connectionString from application setting, e.g.

        Database=<database name>;Data Source=<IP of the VM hosting MySQL server>;User Id=<database user name>;Password=<database user password>

4. Change database connection configuration in your web site to connect to the database hosted on the VM, for example, in WordPress change it in wp-config.php, for Joomla site, modify the database info in configuration.php, and so on.

5. If you have existing backup schedule using database on ClearDB , you will need to disable database backup, let the backup perform on web site only. You will need to create an entry for database backup in crontab (contab -e) on the VM that hosting MySQL server, for example, you want the database backup database "produtiondb" start at 11:30 PM daily

        30 23 * * * date=`date -I`; /opt/bitnami/mysql/bin/mysqldump -u<database user name> -p<database user password> produtiondb > /home/dbbackup/produtiondb_$date.sql

   You can also schedule a job to purge older database backup, e.g.

        45 23 * * * date=`date --date="n days ago" -I`; rm /home/dbbackup/produtiondb_$date.sql
