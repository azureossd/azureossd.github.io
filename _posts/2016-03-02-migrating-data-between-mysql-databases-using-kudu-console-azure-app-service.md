---
title: "Migrating data between MySQL databases using kudu console – Azure App Service"
tags:
  - Azure web app
  - Azure webapp
  - cleardb
  - ClearDB upgrade
  - database migration
  - mysql
  - MySQL migrate
categories:
  - MySQL
  - How-To
  - Azure App Service on Windows
date: 2016-03-02 20:49:43
author_name: Srikanth S.
---

**NOTE: Always keep multiple backup’s of your database before migration.** There are often times when you want to migrate data from one MySQL server to another. This maybe because you are migrating from an On-Premise environment to Azure or upgrading a ClearDB database to a different tier or other reasons. Database migration can be done in different ways as described [here](../2015/06/18/migrating-data-from-on-premise-mysql-database-to-cleardb/). If you do not want to install MySQL Workbench/PHPMyAdmin/MySQL client, then you can do this through Azure App Service Kudu console. **In this blog we will cover data migration between two ClearDB databases.**

> There is no upgrade path for ClearDB databases on Azure portal. If you are ok to add credit card to your ClearDB profile, then you can upgrade directly without migrating from ClearDB portal. You can follow this [blog](../2016/02/29/how-to-upgrade-cleardb-database-for-azure-app-service/) on how to upgrade. But if you do not want to add your credit card information multiple places, then you will have to migrate your database from one tier to another.  

> For Ex: If you choose Venus tier while creating your Web App and later on decide to move to Jupiter tier, then you would need to create a new Jupiter tier database and migrate data from Venus tier database to Jupiter tier database.

The easiest way to get to kudu console would be to go directly to [http://yoursitename.scm.azurewebsites.net/DebugConsole](http://yoursitename.scm.azurewebsites.net/DebugConsole) (replace yoursitename with your actual Web App name) through browser. You can also launch kudu console from Azure portal: [![image](/media/2016/03/image_thumb3.png "image")](/media/2016/03/image7.png) Once you get to kudu console, you will need to get source/destination database details. We will need these from both (source/destination) databases:

*   Username
*   Password
*   Hostname
*   Database Name
*   Port

For ClearDB, you can get these from Azure Portal: [![image](/media/2016/03/image_thumb4.png "image")](/media/2016/03/image8.png) 

**Export data from source database:** 

Go to kudu console and change directory into a folder where you can write and want to put backup files. In this example, i use D:\\home\\data. Run below command to export after replacing Username,Password,Hostname,port (is 3306 by default) and source\_database\_name `"D:\Program Files\MySQL\MySQL Server 5.1\bin\mysqldump.exe" -uUsername -pPassword -hHostname -P3306 source_database_name > dump.sql ` or alternatively you can use like this `"D:\Program Files\MySQL\MySQL Server 5.1\bin\mysqldump.exe" --user=Username --password=Password --host=Hostname --port=3306 source_database_name > dump.sql ` [![image](/media/2016/03/image_thumb5.png "image")](/media/2016/03/image9.png) 

**Import data into destination database:** 

In the same kudu console as above ( in directory D:\\home\\data or where you put you took your export), run below command to import after replacing Username,Password,Hostname,port (is 3306 by default) and destination\_database\_name: `"D:\Program Files\MySQL\MySQL Server 5.1\bin\mysql.exe" –uUsername –pPassword –hHostname –P3306 destination_database_name < dump.sql ` or alternatively you can use like this `"D:\Program Files\MySQL\MySQL Server 5.1\bin\mysql.exe" --user=Username --password=Password --host=Hostname --port=3306 destination_database_name < dump.sql ` You can also alternatively use the latest mysql client to import data. So you can replace `"D:\Program Files\MySQL\MySQL Server 5.1\bin\mysql.exe"` with `"D:\Program Files (x86)\mysql\5.7.9.0\bin\mysql.exe"` in above import statements. [![image](/media/2016/03/image_thumb6.png "image")](/media/2016/03/image10.png) This should populate all your data from source MySQL database into destination MySQL database. Please find ClearDB FAQ for Azure App Service here: [https://azure.microsoft.com/en-us/documentation/articles/store-cleardb-faq/](https://azure.microsoft.com/en-us/documentation/articles/store-cleardb-faq/)