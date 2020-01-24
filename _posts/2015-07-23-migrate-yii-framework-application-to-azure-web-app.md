---
title: " Migrate Yii Framework Application to Azure Web App"
tags:
  - Azure web app
  - web.config
  - Yii framework application
categories:
  - Yii
date: 2015-07-23 11:53:00
author_name: Yi Wang
---

1\. Create a PHP Empty Web App on Azure:

    [![](/media/2019/03/1184.yii-0001.PNG)](/media/2019/03/1184.yii-0001.PNG)

    [![](/media/2019/03/6305.yii-0002.PNG)](/media/2019/03/6305.yii-0002.PNG)

2\. Copy the contents from Yii framework application root to wwwroot, e.g.

    [![](/media/2019/03/3835.yii-002.PNG)](/media/2019/03/3835.yii-002.PNG)

   Note: In this example, framework and application (assets, themes, index.php, etc.) are all in wwwroot.

3\. Turn on error log, so that you can watch for errors in php_errors.log during migration:

    If log_errors is default to "Off", create a .user.ini file in wwwroot, add this line in .user.ini:

    log_errors=On

4\. Modify database connection criteria from main.php (in this demo, it is protected/config/main.php), link to right database.

5\. If you have hiding index.php implemented, configure it in web.config (create web.config file under wwwroot if it is not there), add rewriting rules. Here is sample web.config:

    <?xml version="1.0" encoding="UTF-8"?>

    <configuration>

      <system.webServer>

      <rewrite>

      <rules>

        <!--# otherwise forward it to index.php-->

        <rule name="Imported Rule 1">

          <match url="." ignoreCase="false" />

          <conditions>

            <!--# if a directory or a file exists, use it directly-->

            <add input="{REQUEST_FILENAME}" matchType="IsFile" ignoreCase="false" negate="true" />

            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" ignoreCase="false" negate="true" />

          </conditions>

          <action type="Rewrite" url="index.php" />

        </rule>

      </rules>

      </rewrite>

      </system.webServer>

    </configuration>

6\. Check index.php, validate the paths for $yii and $config. If you included any php functions, validate file path as well.

    Test your site <your-site-name>.azurewebsites.net, it should point to site home page, e.g.

    [![](/media/2019/03/5228.yii-003.PNG)](/media/2019/03/5228.yii-003.PNG)