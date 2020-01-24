---
title: " Steps to Enable Xdebug for PHP Profiling"
tags:
  - PHP
  - Xdebug
categories:
  - Azure App Service on Windows
  - PHP
  - How-To
  - Debugging
date: 2017-01-09 09:57:41
author_name: Yi Wang
header:
    teaser: /assets/images/xdebug_logo.svg
---

By [Yi Wang](wangyi@microsoft.com) and [Mangesh Sangapu](mangapu@microsoft.com)

1.  Find the matching version of xdebug extension from "D:\\devtools\\xdebug\\2.4.0\\",for example, if you have PHP 5.6, use "D:\\devtools\\xdebug\\2.4.0\\php\_5.6\\php\_xdebug-2.4.0-5.6-vc11-nts.dll". To access D: drive, use Kudu &lt;your-website-name>.scm.azurewebsites.net, or "Advanced Tools" in Azure portal,

[![kudu](/media/2017/01/kudu.png)](/media/2017/01/kudu.png)

2.  Add Xdebug extension in Application Settings->App settings: PHP\_ZENDEXTENSIONS = D:\\devtools\\xdebug\\2.4.0\\php\_5.6\\php_xdebug-2.4.0-5.6-vc11-nts.dll 

[![appsettings](/media/2017/01/Appsettings1.png)](/media/2017/01/Appsettings1.png)

3.  Create Xdebug profile output directory "D:\\home\\site\\wwwroot\\bin\\xdebug_profiles"

4.  Create "D:\\home\\site\\wwwroot\\.user.ini", add follow in settings in ".user.ini"
    
    xdebug.profiler\_enable=0 xdebug.profiler\_output\_dir="D:\\home\\site\\wwwroot\\bin\\xdebug\_profiles" xdebug.profiler\_enable\_trigger=1
    
    (Note: To enable Xdebug all the time, set "xdebug.profiler\_enable=1", and remove "xdebug.profiler\_enable_trigger" )
    
5.  Trigger Xdebug profiling as "http://&lt;your-site>/&lt;page-name>.php?XDEBUG_PROFILE=1"

  **Additional Settings** To append the filename to the xdebug output filename, use the following setting in .user.ini: xdebug.trace\_output\_name = cachegrind.out.%s

|**Specifier**|**Meaning**|**Example Format**|**Example Filename**|
|----|----|----|----|
|%s|script name 2|cachegrind.out.%s|cachegrind.out.\_home\_httpd\_html\_test\_xdebug\_test_php

 

* * *

**Links to Xdebug Profile Viewers**

[Wincache Grind](http://ceefour.github.io/wincachegrind/)

[QCacheGrind](https://sourceforge.net/projects/qcachegrindwin/)   **Xdebug Reference Documentation** [https://xdebug.org/docs/](https://xdebug.org/docs/)   **More reference** [Troubleshooting PHP Performance in Microsoft Azure Web Sites with Xdebug](https://blogs.msdn.microsoft.com/waws/2014/04/04/troubleshooting-php-performance-in-microsoft-azure-web-sites-with-xdebug/)