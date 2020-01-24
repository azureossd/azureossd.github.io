---
title: " Migrate Zend Framework 2 Project to Azure Web App"
tags:
  - Azure web app
  - PHP
  - Zend Framework 2
categories:
  - PHP
date: 2015-07-17 12:45:00
author_name: Yi Wang
---

1\. Create an empty web app on Azure

   [![](/media/2019/03/4278.zend-01.PNG)](/media/2019/03/4278.zend-01.PNG)

2\. Check PHP runtime

    \- Default PHP version on Azure web apps is PHP 5.4, you can change it from Azure portal "CONFIGURE" page. Change PHP version to match the version used in your ZF2 project

    \- Create an info page at wwwroot, e.g. info.php, and check it from <your-site-name>.azurewebsites.net/info.php

3\. Deploy Zend Framework 2 project to wwwroot

    There are different ways to deploy the project to Azure web app. When you deploy the project, copy the contents under ZF2 project root to wwwroot, e.g.

    [![](/media/2019/03/8053.zend-02.PNG)](/media/2019/03/8053.zend-02.PNG)

4\. Modify web.config and set application root to wwwroot/public


5\. Compare customer PHP extensions

    Check PHP extensions from info.php, if your PHP extension(s) is not listed in the info page, find the matching window version of that extension, install it on Azure App

6\. Create .user.ini in wwwroot/public

   Under wwwroot/public, create .user.ini file, turn on PHP error log, add this line to .user.ini:

    log_errors=On

    If you have any PHP package(s) installed with ZF2 project, add them to include_path in .user.ini

7\. Test your site:

    &lt;your-site-name>.azurewebsite.net should link to the home page (wwwroot/public/index.php) of the site, e.g.

    [![](/media/2019/03/3660.zend-03.PNG)](/media/2019/03/3660.zend-03.PNG)