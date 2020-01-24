---
title: "Access Oracle Databases from Azure Web Apps using OCI8 drivers with PHP"
tags:
  - azure php oracle web app
  - azure webapp oracle
  - oracle webapp
  - PHP
  - php oracle webapp
categories:
  - PHP
  - Azure App Service on Windows
  - How-To
date: 2016-02-23 23:04:56
author_name: Srikanth S.
---

You can connect to different databases (MySQL, PostgresDB, MongoDB, MSSQL Server) from Azure Web Apps with PHP. But connecting to Oracle database is not provided by default, as this requires Oracle native client. We cannot install full blown Oracle client, but you can install Oracle instant client and connect to your Oracle databases

OCI drivers are already installed on Azure Web Apps, but we need to setup Oracle instant client and configure your web app to access OCI dll's provided by instant client.

Here is how we do it.

Download **32-bit** Oracle Instant Client 12c (Instant Client Package - Basic) from here: <http://www.oracle.com/technetwork/topics/winsoft-085727.html>

It should download a file instantclient-basic-nt-12.1.0.2.0.zip.

Once you unzip the file you can upload instantclient\_12\_1 folder to **d:\\home\\site\\** using ftp. You can also drag and drop the instantclient-basic-nt-12.1.0.2.0.zip to **d:\\home\\site** from kudu debug console (<https://sitename.scm.azurewebsites.net/DebugConsole>). This will unzip the contents and create instantclient\_12\_1 folder

![clip\_image001](/media//2016/02/clip_image001_thumb2.png "clip_image001")

Once you have uploaded/copied instantclient\_12\_1 folder to **d:\\home\\site**, we need to add it to web app environment path. The way to do this on web app is by using application transform model based on XML document transformation (XDT).

Create an applicationHost.xdt file under d:\\home\\site folder and add below contents to it:

    <?xml version="1.0"?> 
    <configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform"> 

    <system.webServer> 

    <runtime xdt:Transform="InsertIfMissing"> 

    <environmentVariables xdt:Transform="InsertIfMissing"> 

    <add name="PATH" value="%PATH%d:\home\site\instantclient_12_1\;" xdt:Locator="Match(name)" xdt:Transform="InsertIfMissing" />

    </environmentVariables> 

    </runtime> 

    </system.webServer> 

    </configuration>




Now we have configured Oracle instant client into our web app environment path. Next we move to enable/invoke the PHP OCI8 driver. This will be done via ini settings:

From portal, browse to your App Service application settings - \> App Settings and add this key PHP\_INI\_SCAN\_DIR with value of d:\\home\\site\\ini.

![clip\_image002](/media//2016/02/clip_image002_thumb4.png "clip_image002")

Now go back to the kudu debug console (<https://sitename.scm.azurewebsites.net/DebugConsole>) and type "cd d:\\home\\site\\ini" in command prompt window. Here add a file extensions.ini by issuing this command "touch extensions.ini". This will create a file extensions.ini. Now we need to add a line to enable OCI8 driver for PHP. That would depend on PHP version and Oracle instant client version you want to use.

Please refer to Note here <http://php.net/manual/en/oci8.requirements.php> to find out which Oracle database versions are supported with OCI8.

|**PHP Version**|**OCI8 Driver Version**|**Oracle Instant Client Version**|**Line to Include in extensions.ini file**|
|---|---|---|---|
|5.4|1.4.10|10.2|extension="D:\Program Files (x86)\PHP\v5.4\ext\php_oci8.dll"|
|5.4|1.4.10|11.2|extension="D:\Program Files (x86)\PHP\v5.4\ext\php_oci8_11g.dll"|
|5.5|1.4.10|10.2|extension="D:\Program Files (x86)\PHP\v5.4\ext\php_oci8.dll"|
|5.5|1.4.10|11.2|extension="D:\Program Files (x86)\PHP\v5.4\ext\php_oci8_11g.dll"|
|5.6|2.0.10|12.1|extension="D:\Program Files (x86)\PHP\v5.6\ext\php_oci8_12c.dll"|


NOTE: You can also use php\_pdo\_oci.dll file which will enable PDO\_OCI support. These files are also installed in the same directory as php\_oci8.dll files.

Below screenshot show how we created the extensions.ini file and also added OCI8 driver for PHP 5.6.

![clip\_image003](/media//2016/02/clip_image003_thumb2.png "clip_image003")

Once this is done, if you create and browse to your phpinfo page you should see OCI8 driver loaded. Below is a screenshot from my PHP 5.6 enabled web app.

![clip\_image004](/media//2016/02/clip_image004_thumb5.png "clip_image004")

Now you should be able to use OCI8 driver and connect to your Oracle database.
