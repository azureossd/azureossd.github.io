---
title: " Enable PHP extensions on Azure Web App on Windows"
categories:
  - Azure App Service on Windows
  - PHP
  - Configuration
date: 2017-08-21 13:15:31
tags:
author_name: Yi Wang
---

For the case your web app is hosted on Azure App Service on Windows, if the PHP extensions are not available, you need to install or enable them.

Some PHP extensions that are available in default PHP but not enabled, such as php\_gmp, php\_ldap, php\_sockets,  etc. You can verify this from Kudu. If you use PHP on 32-bit platform, preinstalled PHP extensions are under "D:\\Program Files (x86)\\PHP\\\<your-php-version\>\\ext". If you use PHP 7 on 64-bit, check "D:\\Program Files\\PHP\\\<your-php-version\>\\ext".

 

Here is how to enable them for your Azure App,

1.  Create the a file in d:\\home\\site\\ini (create the folder "ini" if the folder does not exist) and name it "extensions.ini" ,
2.  Add the extension(s) in "extensions.ini" file, e.g.

<!-- -->

         extension=php_gmp.dll
         extension=php_ldap.dll

3\. Add PHP\_INI\_SCAN\_DIR in App settings from Azure portal

         Key = PHP_INI_SCAN_DIR
         Value = d:\home\site\ini

 

Verify the extension from phpinfo page, if you see the extension section from phpinfo page, it is enabled.

Reference, <https://docs.microsoft.com/en-us/azure/app-service-web/web-sites-php-configure>
