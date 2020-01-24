---
title: "Configure WordPress Database Connection on Azure App Services"
categories:
  - Azure App Service on Linux
  - MySQL
  - PHP
  - WordPress
  - Configuration
date: 2018-05-22 16:36:27
tags:
author_name: Yi Wang
header:
    teaser: /assets/images/WebAppWordPress.svg
---

Configure WordPress Database Connection on Azure App Services

For WordPress sites hosted on Azure App Services, there are two ways to configure database connection in wp-config.php. When you modify database connection for WordPress, verify the connection from wp-config.php.

1. Current WordPress installed on Azure App Services pull database connection information from hosting environment- code in wp-config.php reads data from environment variable.

If using MySQL in-app, connection info is in "D:\\home\\data\\mysql\\MYSQLCONNSTR\_localdb.txt" , no connection string needed in Application Settings.

If using Azure database for MySQL or other database services, define connection string in Application Settings, e.g.

    Database=database-name;Data Source=database-host;User Id=database-username;Password=database-password

[![](/media/2018/05/connstring.png)](/media/2018/05/connstring.png)   

**Code in wp-config.php :**

    $connectstr_dbhost = '';
    $connectstr_dbname = '';
    $connectstr_dbusername = '';
    $connectstr_dbpassword = '';

    foreach ($_SERVER as $key => $value) {
     if (strpos($key, "MYSQLCONNSTR_localdb") !== 0) {
     continue;
     }
     
     $connectstr_dbhost = preg_replace("/^.*Data Source=(.+?);.*$/", "\\1", $value);
     $connectstr_dbname = preg_replace("/^.*Database=(.+?);.*$/", "\\1", $value);
     $connectstr_dbusername = preg_replace("/^.*User Id=(.+?);.*$/", "\\1", $value);
     $connectstr_dbpassword = preg_replace("/^.*Password=(.+?)$/", "\\1", $value);
    }

    // ** MySQL settings - You can get this info from your web host ** //
    /** The name of the database for WordPress */
    define('DB_NAME', $connectstr_dbname);

    /** MySQL database username */
    define('DB_USER', $connectstr_dbusername);

    /** MySQL database password */
    define('DB_PASSWORD', $connectstr_dbpassword);

    /** MySQL hostname : this contains the port number in this format host:port . Port is not 3306 when using this feature*/
    define('DB_HOST', $connectstr_dbhost);

 

2\. Some WordPress prefer to store the hard coded database information in wp-config.php - in this case, the connection is not impacted by connection string in Application Settings.

**Code in wp-config.php:**

    /** MySQL database name */
    define('DB_NAME', 'database-name');

    /** MySQL database username */
    define('DB_USER', 'database-username');

    /** MySQL database password */
    define('DB_PASSWORD', 'database-password');

    /** MySQL hostname */
    define('DB_HOST', 'database-host');
