---
title: " Run PHP Webjob on Azure App Service (Windows)"
categories:
  - Azure App Service on Windows
  - PHP
  - WebJob
  - How-To
date: 2017-10-27 17:17:42
tags:
author_name: Yi Wang
header:
    teaser: /assets/images/phplogo.svg
---

When you [deploy a webjob](https://docs.microsoft.com/en-us/Azure/app-service/web-sites-create-web-jobs) to run PHP program, there are few items to verify and help to understand the PHP runtime for webjobs.

1. How to create a PHP webjob
- Execute a .php file
- Create batch to execute .php file
- Create shell to execute .php file

2. PHP runtime for webjob uses the PHP in Kudu container, which is difference from the PHP runtime for webapp, to verify the PHP runtime, you can trigger a webjob export phpinfo, or run the following command from Kudu 'Debug console',

       php -i > phpinfo.txt

3. From phpinfo.txt (if you run a phpinfo from webjob, check the output log),

\- find the php.ini location
**Loaded Configuration File =\> D:\\Program Files (x86)\\PHP\\v7.1\\php.ini**

\- find PHP\_INI\_SCAN\_DIR\
**Scan this dir for additional .ini files =\> d:\\home\\site\\ini**\
**Additional .ini files parsed =\> d:\\home\\site\\ini\\settings.ini**

You can define PHP\_INI\_SCAN\_DIR in App Settings:

 [![](/media/2017/10/Capture8.png)](/media/2017/10/Capture8.png) 
 
 \- find if PHP error log is enabled

**log\_errors =\> Off =\> Off**

\- find PHP error log file location (you can modify this location in additional .ini file defined in PHP\_INI\_SCAN\_DIR, e.g. d:\\home\\site\\ini\\settings.ini)\

**error\_log =\> D:\\Windows\\temp\\php71\_errors.log =\> d:\\Windows\\temp\\php71\_errors.log**

\- Enable PHP extensions
Check from Kudu, default installed PHP extensions are listed in D:\\Program Files (x86)\\PHP\\v7.x\\ext\
If you use PHP 7.x 64-bit, check from D:\\Program Files\\PHP\\v7.x\\ext\
To enable an extension in this list, add it in additional .ini file, for example,

    extension=php_ldap.dll

\- Install PHP extensions\
If the PHP extension is not available from default extension list, download the matching version, for example, you can put it in d:\\home\\site\\ext, then add the extension in additional .ini file, e.g.

extension="D:\\home\\site\\ext\\php\_redis.dll"

\- Use "-c" option to specify php.ini in command, e.g.

    php -c [Path to php.ini file] [Path to .php file]
