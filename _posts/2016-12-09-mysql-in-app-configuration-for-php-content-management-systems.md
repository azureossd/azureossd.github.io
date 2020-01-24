---
title: " MySQL In-App Configuration for PHP Content Management Systems"
tags:
  - azure
  - CMS
  - credentials
  - database
  - MySQL In-App
  - PHP
  - WordPress
  - Joomla
  - Drupal
categories:
  - Azure App Service on Windows
  - WordPress
  - Joomla
  - Drupal
  - MySQL In App
  - Configuration
date: 2016-12-09 14:29:26
author_name: Mangesh Sangapu
---

Read more about MySQL In-App [here](https://blogs.msdn.microsoft.com/appserviceteam/2016/08/18/announcing-mysql-in-app-preview-for-web-apps/). Content Management Systems such as WordPress, Drupal, Joomla contain the database credentials within a configuration file. If you decide to use MySQL In-App for development purposes, you will quickly realize that you need to modify these credentials to work with MySQL In-App. Below is a table containing the default configuration, followed by In-App credentials and configuration. To update your configuration with MySQL In-App, copy-paste both Part 1 and Part 2 for your respective CMS.

<table style="border-collapse: collapse" border="0">
<colgroup>
<col>
</col>
<col>
</col>
<col>
</col>
<col>
</col>
</colgroup>
<tbody valign="top">
<tr>
<td style="padding-left: 7px;padding-right: 7px;border: solid 0.5pt">
</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: solid 0.5pt;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

**WordPress 4+**

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: solid 0.5pt;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

**Joomla 3+** 

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: solid 0.5pt;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

**Drupal 8+**

</td>
</tr>
<tr>
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: solid 0.5pt;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

**Configuration Location**

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

wwwroot/wp-config.php

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

wwwroot/configuration.php

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

wwwroot/sites/default/settings.php

</td>
</tr>
<tr style="height: 172px">
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: solid 0.5pt;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

**Default Configuration**

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

`/** The name of the database for WordPress */ define('DB_NAME', 'databaseName');/** MySQL database username */ define('DB_USER', 'databaseUserName');/** MySQL database password */ define('DB_PASSWORD', 'databasePassword');/** MySQL hostname */ define('DB_HOST', 'databaseHostName');`

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

public \$dbtype = 'mysql';\
public \$host = 'databaseHostName';\
public \$user = 'databaseUserName';\
public \$password = 'databasePassword';\
public \$db = 'databaseName';\
public \$dbprefix = 'jos\_';

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

\$databases\['default'\]\['default'\] = array (\
'database' =\> 'databasename',\
'username' =\> 'sqlusername',\
'password' =\> 'sqlpassword',\
'host' =\> 'localhost',\
'port' =\> '3306',\
'driver' =\> 'mysql',\
'prefix' =\> '',\
'collation' =\> 'utf8mb4\_general\_ci',);

</td>
</tr>
<tr>
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: solid 0.5pt;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

**MySQL In-App\
Part 1 - Connection String**

</td>
<td colspan="3" style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

`$connectstr_dbhost = ''; $connectstr_dbname = ''; $connectstr_dbusername = ''; $connectstr_dbpassword = '';foreach ($_SERVER as $key => $value) { if (strpos($key, "MYSQLCONNSTR_localdb") !== 0) { continue; }$connectstr_dbhost = preg_replace("/^.*Data Source=(.+?);.*$/", "\\1", $value); $connectstr_dbname = preg_replace("/^.*Database=(.+?);.*$/", "\\1", $value); $connectstr_dbusername = preg_replace("/^.*User Id=(.+?);.*$/", "\\1", $value); $connectstr_dbpassword = preg_replace("/^.*Password=(.+?)$/", "\\1", $value); }`

</td>
</tr>
<tr>
<td style="padding-left: 7px;padding-right: 7px;border: solid 0.5pt">
</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: solid 0.5pt;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

**WordPress 4+**

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: solid 0.5pt;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

**Joomla 3+** 

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: solid 0.5pt;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

**Drupal 8+**

</td>
</tr>
<tr>
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: solid 0.5pt;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

**MySQL In-App\
Part 2 - Configuration**

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

`// ** MySQL settings - You can get this info from your web host ** // /** The name of the database for WordPress */ define('DB_NAME', $connectstr_dbname); /** MySQL database username */ define('DB_USER', $connectstr_dbusername); /** MySQL database password */ define('DB_PASSWORD', $connectstr_dbpassword); /** MySQL hostname : this contains the port number in this format host:port. /** Port is not 3306 when using this feature*/ define('DB_HOST', $connectstr_dbhost);`

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

`public $dbtype = 'mysql'; public $host = DB_HOST; public $user = DB_USER; public $password = DB_PASSWORD; public $db = DB_NAME; public $dbprefix = 'jos_';`

</td>
<td style="padding-left: 7px;padding-right: 7px;border-top: none;border-left: none;border-bottom: solid 0.5pt;border-right: solid 0.5pt">

\$databases\['default'\]\['default'\] = array (\
'database' =\> \$connectstr\_dbname,\
'username' =\> \$connectstr\_dbusername,\
'password' =\> \$connectstr\_dbpassword,\
'prefix' =\> '',\
'host' =\> \$connectstr\_dbhost,\
'port' =\> \$\_SERVER\['WEBSITE\_MYSQL\_PORT'\],\
'driver' =\> 'mysql',\
'namespace' =\> 'Drupal\\\\Core\\\\Database\\\\Driver\\\\mysql',\
'collation' =\> 'utf8mb4\_general\_ci',\
);

</td>
</tr>
</tbody>
</table>
