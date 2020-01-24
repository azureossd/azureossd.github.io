---
title: "Giving your existing WordPress MultiSite a new domain name on Microsoft Azure"
tags:
  - azure
  - domain name
  - multisite
  - Web Apps
  - wordpress
categories:
  - PHP
  - WordPress
  - Multisite
date: 2015-04-06 11:50:00
author_name: Mangesh Sangapu
---

**Prerequisites:**

This article assumes you acquired a new domain name and have configured the DNS Zones.
If you haven't already done so, see the article here: [Configuring a custom domain name for a Microsoft Azure Web Site](http://blogs.msdn.com/b/brunoterkaly/archive/2014/03/24/configuring-a-custom-domain-name-for-a-microsoft-azure-web-sites.aspx)

 

**Problem:**

You installed WordPress through the MS Azure Gallery and setup a MultiSite (WP feature).\
However, now that you’re ready for launch, you decide you want to change the name from: http://\<sitename\>.azurewebsites.net while remaining hosted on Azure.

If you already have your custom domain name pointing to your WP instance and now want to enable MultiSites, then please follow this article here: [Convert Azure WordPress MultiSite](http://azure.microsoft.com/en-us/documentation/articles/web-sites-php-convert-wordpress-multisite/%20)

If you do not have MultiSites enabled, there are easier solutions you should be following.

 

**Make a backup!**

[Before we get started, I kindly ask that you make a backup of both your Azure Website. Here is a link that show you how to accomplish this. [Azure Web Sites Backup](http://azure.microsoft.com/en-us/documentation/articles/web-sites-backup/)

 

------------------------------------------------------------------------

 

**Getting Started:**

 

Using a MySQL client, connect to your MySQL database.

Verify that WordPress is the only application using the database.

If there are other tables unrelated to WordPress on your database, you'll have to ensure you do not modify those in anyway.

![](/media/2019/03/6835.wp_tables.png)

**Step 1. Export your MySQL database**

 

Using MySQL Workbench or similar MySQL client, select the Export menu.

![](/media/2019/03/2311.mysql_data_export.png)
 

Select all the WP tables for exporting and be sure to select "Export to Self-Contained File".

![](/media/2019/03/8814.mysql_start_export.png)

 

 

**Step 2. Find / Replace in Notepad**

Open the .SQL file in notepad. Do not open this file up in something like MS Word or some fancy editor.\
We want a simple editor that will not modify end-of-line characters or anything of that sort.

Do a find-\>replace of \<sitename\>.azurewebsites.net to newsite.com. Replace All.

![](/media/2019/03/6521.notepad_search_replace.png)

Save this file with a new name (so you don't overwrite your backup) 


Import your newly modified MySQL Database\
![](/media/2019/03/4762.mysql_data_import.png)

 

 

**Step 3. Modify wp-config: Update DOMAIN\_CURRENT\_SITE\**

Use WebMatrix to connect to your site\
![](/media/2019/03/7532.web_matrix.png)

Edit wp.config
![](/media/2019/03/3531.webmatrix_wpconfig.png)

In wp.config change the DOMAIN\_CURRENT\_SITE to your new site

![](/media/2019/03/6560.wp_config.png)

 

**Step 4. Verify your website!**

Before you log into your wordpress admin, be sure to clear your cookies.

![](/media/2019/03/3302.cookies.png)

Go to your website: [http://newsite.com/]{style="color: #800080;text-decoration: underline"}

Log into WordPress! 

![](/media/2019/03/2656.wp_dashboard.png)