---
title: " WordPress Migration: Easy as A-B-C, 1-2-3"
categories:
  - Azure App Service Web App
  - WordPress
  - How-To
date: 2017-04-28 16:04:42
tags:
  - WordPress
  - Migration
author_name: Mangesh Sangapu
toc: true
toc_sticky: true
---

![WordPress Migration Components](/media/2017/04/2017-04-28-15_27_24-Migration-Notes-OneNote.png) Fig 1. WordPress Migration Components

* * *

There are 3 steps to migrating a WordPress website to Azure App Service Web Apps.

1.  Copy WordPress files
2.  Migrate the MySQL Database
3.  Configure WordPress

 

## Step 1. Copy WordPress files

Make a backup of the current WordPress website. Tools commonly used for this is FTP Software like FileZilla or WinSCP.

Sample WordPress Installation Folder: [![2017-04-28-15_47_39-clipboard](/media/2017/04/2017-04-28-15_47_39-Clipboard.png)](/media/2017/04/2017-04-28-15_47_39-Clipboard.png)

Again, use FTP software or Kudu (http://&lt;webappname>.scm.azurewebsites.net) to upload the files to your web app.

## Step 2. Migrate the MySQL Database

If the DB is visible externally, you can use tools such as [WP Buddy+](../2016/12/21/wordpress-tools-and-mysql-migration-with-wordpress-buddy/) to migrate the MySQL contents. Other popular methods are [MySQL Workbench](https://poosh.co/moving-wordpress-database-with-mysql-workbench-on-windows/), PHPMyAdmin or [command-line](../2016/03/02/migrating-data-between-mysql-databases-using-kudu-console-azure-app-service/) in Kudu.

## Step 3. Configure WordPress

Now that the contents and database have been migrated. The next step is to configure WordPress to talk to the new database. This is done in wp-config.php. Open this file and ensure the appropriate credentials are being used to communicate with the MySQL Database. Once the DB is working, use tools such as WordPress Buddy+ to update the HOME and SITE_URL. More on this [here](../2016/12/21/wordpress-tools-and-mysql-migration-with-wordpress-buddy/) (see WordPress Tools).

[MySQL In-App Sample](../2016/12/09/mysql-in-app-configuration-for-php-content-management-systems/)