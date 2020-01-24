---
title: "Install ionCube Loader extension for PHP site on Azure App"
tags:
  - PHP
categories:
  - Azure App Service on Windows
  - PHP
  - How-To
date: 2016-12-28 15:34:19
author_name: Yi Wang
---

As required by this extension, ionCube should be the first Zend extension installed before any other Zend extensions. Simply adding PHP extension in application Settings could not meet this requirement. In this case, we need to edit php.ini, here are the steps:

1.  Follow this link to create custom php.ini, <https://github.com/projectkudu/kudu/wiki/Xdt-transform-samples#using-a-custom-phpini> . Find the correct php.ini from "D:\\local\\Config\\PHP-xxx\\php.ini, copy it to D:\\home\\site.
2.  Download the correct version of ionCube extension from <https://www.ioncube.com/loaders.php> (check Compiler and Architecture from phpinfo page, use Non-TS 32 bit, e.g. Windows VC11 (Non-TS) 32 bits in this example)
[![phpinfo](/media/2016/12/phpinfo-1024x117.png)

3.  Copy ioncube\_loader .dll to D:\\home\\site\\ext, for example, if you have PHP 5.6, copy "ioncube\_loader\_win\_5.6.dl" to D:\\home\\site\\ext\\ioncube\_loader\_win\_5.6.dll

4.  Edit D:\\home\\site\\php.ini, put "ioncube\_loader\_win\_5.6.dll" as first Zend extension, e.g.

![phpini](/media/2016/12/phpini.png)

5.  Verify from phpinfo page for the extension, you should see the extension if installed successfully, e.g. 

![ioncube](/media/2016/12/ioncube.png)