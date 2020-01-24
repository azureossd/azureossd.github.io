---
title: " Troubleshooting MySQL Database on ClearDB - Deprecated"
tags:
  - azure
  - cleardb
  - ClearDB Troubleshooting
  - mysql
  - Web Apps
  - wordpress troubleshooting
categories:
  - ClearDB
date: 2015-05-07 14:27:44
author_name: Mangesh Sangapu
---

This article covers some common scenarios customers may run into using ClearDB with Microsoft Azure. For reference, here is a link to the ClearDB FAQ: [https://www.cleardb.com/developers/help/faq](https://www.cleardb.com/developers/help/faq "https://www.cleardb.com/developers/help/faq") As listed on the ClearDB FAQ, there are some general guidelines for using ClearDB. These guidelines include limitations on:

*   Maximum Database Connections
*   Maximum Database Size
*   Maximum SELECT Query Execution Time

\* Maximum amounts vary depending on your [subscription plan](https://www.cleardb.com/store/azure).

* * *

**Error Message**

Error establishing a database connection **(displayed on web site)**

PHP Warning: mysqli\_real\_connect(): (HY000/1226): User ‘abcdefghijk79' has exceeded the ‘max\_user\_connections’ resource (current value: 4) in D:\\home\\site\\wwwroot\\wp-includes\\wp-db.php on line 1454 **(displayed in php_errors.log or WordPress debug.log)**

**Source**

Web site, php_errors.log or debug.log

**Solution**

If you see this error in your debug.log or php_errors.log, then your application is exceeding the number of connections. If you’re hosting on ClearDB, please verify that number of connections available in your [service plan](https://www.cleardb.com/pricing.view).

* * *

**Error Message**

The management site for the database isn’t available right now. Please try again later.

**Source**

Microsoft Azure Dashboard > Linked Resources > Database Name

**Example**

**![](/media/2019/03/1541.management.png)**

**Solution**

The link between Azure and ClearDB _may_ have been broken or was never linked to begin with. Email [support@cleardb.com](mailto:support@cleardb.com) and provide the Subscription ID located within the [Azure Dashboard (lower-right corner)](/media/2019/03/2068.subscription_id.png).

* * *

**Error Message**

Operation failed: There was an error while applying the SQL script to the database.

ERROR 1142: 1142: UPDATE command denied to user ‘name@ip’ for table ‘table_name’.

**Source**

MySQL Client/ DB Server Response in Application Code

**Example**

![](/media/2019/03/8228.update_error2.png)

**Solution**

There are multiple reasons this may occur, but a common one is due to the subscription quota being exceeded. See the question below “How do I check the current size of my MySQL Database on ClearDB?”

If you have in-fact gone over your limit, please upgrade or read tips below on how to reduce your disk usage.

* * *

**Error Message**

Error Code: 1142. INSERT command denied to user ‘name@ip’ for table ‘table_name’.

**Source**

MySQL Client/ DB Server Response in Application Code

**Example**

![](/media/2019/03/2703.insert_error.png)

**Solution**

This may also point to the subscription quota being exceeded. Read below on how to check your current size on the MySQL database.

If you have in-fact gone over your limit, please upgrade or read tips below on how to reduce your disk usage.

* * *

How do I check the current size of my MySQL database on ClearDB? There are multiple options to check your current size. One solution is through the Azure Portal and the other is to run a query on your database instance:

**1) Using Azure Portal**

![](/media/2019/03/7587.linked_resources.png)

![](/media/2019/03/6254.database_growth.png)

**2) Using a MySQL Client, run a query on your ClearDB Database**

       SELECT
              table_schema "Data Base Name",
              sum( data\_length + index\_length ) / 1024 / 1024 "Data Base Size in MB"
       FROM
              information_schema.TABLES
       GROUP BY
              table_schema;

* * *

My ClearDB MySQL Database quota is exceeded, now what? The simplest solution is to [upgrade to the recommended subscription on ClearDB](https://www.cleardb.com/store/azure), especially if you’re on the Mercury Tier. If you are still developing your app and want to remain on the free, Mercury Tier, then you will need to get rid of extra data. Use the following query to find which tables are taking up space:

       SELECT
              table_name AS "Table",
              round(((data\_length + index\_length) / 1024 / 1024), 2) MB
       FROM
              information_schema.TABLES
       WHERE
              table_schema = "**<SCHEMA/DATABASE NAME HERE>"**
       ORDER BY
              MB desc;

* * *

Where do I find my MySQL connection details?

Through the Azure Dashboard, click on “View Connection Strings”

![](/media/2019/03/8203.connection_strings.png)

 

![](/media/2019/03/7658.strings_detail.png)

This will pop-up a window with the following connection information:

*   Database (AKA Schema)
*   Data Source (Host Name)
*   UserID
*   Password

* * *

How do I connect to my MySQL Database on ClearDB?

**1) [Use a MySQL Client](http://www.bing.com/search?q=download+mysql+client&go=Submit&qs=n&form=QBLH&pq=download+mysql+clien&sc=8-15&sp=-1&sk=&ghc=1&cvid=46f98f58c2284e1ea45a6afde72e4801).**

**2) Use the PHP My Admin site extension**

Step 1. Go to your website with the following URL format:   http://&lt;sitename>.scm.azurewebsites.net

Step 2. Click “Site Extension”

![](/media/2019/03/1616.site_extension_menu.png)

Step 3. Select “Gallery”

![](/media/2019/03/2063.gallery_site_extensions.png)

Step 4. Find phpMyAdmin and click the plus button. Once installed, launch the extension by clicking the play button.

![](/media/2019/03/3438.site_extension_phpmya.png)