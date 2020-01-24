---
title: " How to upgrade ClearDB database for Azure App Service - Deprecated"
tags:
  - Azure web app
  - Azure webapp
  - cleardb
  - ClearDB upgrade
  - mysql
  - MySQL upgrade
categories:
  - ClearDB
date: 2016-02-29 23:03:52
author_name: Srikanth S.
---

  

If you are using ClearDB as your MySQL database on Azure, you probably know that there is no upgrade path available on Azure portal. The only way to upgrade would be through ClearDB dashboard. You will need to put your credit card information on ClearDB portal to upgrade your database. This [blog](https://blogs.msdn.microsoft.com/azureossds/2016/03/02/migrating-data-between-mysql-databases-using-kudu-console-azure-app-service/) talks about how to migrate to a higher plan, if you don’t want to put credit card on ClearDB portal.

You can upgrade ClearDB database from ClearDB portal, but there are two ways you can get there:

> 1\) ClearDB Upgrade URL
>
> 2\) Azure Portal – Manage Database link.

****ClearDB Upgrade URL****

The url for upgrading ClearDB database is: <https://www.cleardb.com/store/azure/upgrade>. But when you go to upgrade url, you will be asked for a username/password/database name to get in (unless you have setup a profile already).

> Note: If you have a profile setup already, then you can login into ClearDB portal and upgrade directly.

Below is a screen which will show up if you go to upgrade url:

![image](/media/2016/02/image_thumb157.png "image")

You would need to get the username/password and database name from your application config file which has database details specified. Below are list of config files for some applications:

> WordPress: d:\\home\\site\\wwwroot\\wp-config.php
>
> Drupal: d:\\home\\site\\wwwroot\\sites\\default\\settings.php
>
> Joomla: d:\\home\\site\\wwwroot\\configuration.php

You can access these files from [kudu](http://blogs.msdn.com/b/benjaminperkins/archive/2014/03/24/using-kudu-with-windows-azure-web-sites.aspx) console or by [ftp’ing](http://blogs.msdn.com/b/kaushal/archive/2014/08/02/microsoft-azure-web-site-connect-to-your-site-via-ftp-and-upload-download-files.aspx) to your Web App.

****Azure Portal – Manage Database Link****

Login into Azure Portal ( <http://portal.azure.com>) and Click on Browse ( at bottom Left) – \> Type “mysql” in Filter box –\> Choose “MySQL databases” (second option) from the list.

![image](/media/2016/02/image_thumb158.png "image")

You should now see a list of databases.

Click on one of the databases and you should see a “Manage Database” link like below:

![clip\_image002](/media/2016/02/clip_image002_thumb5.jpg "clip_image002")

Click on “Manage Database” and this should take you to ClearDB dashboard portal.

> Note: If you do not see any databases under the list, you can create a Free (Mercury) tier database and go to ClearDB dashboard from there. It should list all databases created under your current subscription.
>
> ![image](/media/2016/02/image_thumb159.png "image")
![image](/media/2016/02/image_thumb160.png "image")

Once you are on ClearDB dashboard portal, click on “Dashboard” tab. This will show all your databases created with ClearDB like this:

![clip\_image002\[5\]](/media/2016/02/clip_image0025_thumb1.jpg "clip_image002[5]")

Click on Upgrade and it should take you through the upgrade process.

> Note: Sometimes you don’t see the same database name on Azure Portal and ClearDB dashboard. This is because ClearDB creates a unique database name across its landscape. So you will see database names like acsm\_db1234xyzetc. The way to find out your actual database name is again on Azure portal as shown below under connection string:
>
> ![image](/media/2016/02/image_thumb161.png "image")

Also please find ClearDB FAQ for Azure App Service here: <https://azure.microsoft.com/en-us/documentation/articles/store-cleardb-faq/>
