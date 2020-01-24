---
title: "Increase Import Max File Size for PHPMyAdmin - Azure App Service on Windows"
categories:
  - Azure App Service on Windows
  - MySQL
  - PHP
  - phpmyadmin
  - Configuration
date: 2017-03-07 18:38:50
tags:
  - Azure App Service Web App
  - MySQL
  - PHP
  - phpmyadmin
author_name: Toan Nguyen
header:
    teaser: /assets/images/phpmyadminlogo.svg
---

When using PHPMyAdmin via SiteExtension or with MySQL in-app on Azure Web Apps, the maximum upload size when Importing a SQL file is set to 8,192KiB.  This is due to the default upload\_max\_filesize and post\_max\_size for PHP on Azure Web Apps.  To increase the value, you'll need to modify both the local and master values for PHP.

**NOTE:** If you're planning to import a very large SQL file, please consider performing the steps at [Migrating data between MySQL databases using kudu console – Azure App Service](/2016/03/02/migrating-data-between-mysql-databases-using-kudu-console-azure-app-service/).

1.  In the Azure Portal, select your web app and go to "Application Settings".
2.  Go to the App Settings section and add the following key and value and press save.


        KEY = PHP_INI_SCAN_DIR
        VALUE = D:\home\site\ini


![php\_ini\_scan\_dir](/media/2017/03/php_ini_scan_dir.png)

3. Go to the KUDU site for your web app (https://\<sitename\>.scm.azurewebsites.net/debugconsole).

4. Go to site directory and press the "+" button and create an "ini" directory.

![kudu\_add](/media/2017/03/KUDU_Add.png)

5. In the ini directory, create an "extensions.ini" file.

6. Press the edit button next to the file.

7. Add the following to the file and save.  This will modify the Master values.

 


        upload_max_filesize=30M
        post_max_size=30M


8. Go to the wwwroot directory and create a ".user.ini" file.

9. Edit the file and add the same values as mentioned in step 7 above. This will modify the Local values.

10. Restart the site using the Azure Portal.

11. PHPMyAdmin Import page will also reflect the changes.

![phpmyadmin](/media/2017/03/phpmyadmin.png)