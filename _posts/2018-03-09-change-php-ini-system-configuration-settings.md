---
title: " Change PHP_INI_SYSTEM configuration settings"
categories:
  - Azure App Service on Windows
  - PHP
  - Configuration
date: 2018-03-09 18:56:35
tags:
author_name: Yi Wang
header:
    teaser: /assets/images/phplogo.svg
---

PHP\_INI\_SYSTEM level settings cannot be changed from .user.ini or ini\_set function. To make change for PHP\_INI\_SYSTEM settings on Azure web app, follow the steps,

1. Add an App Setting to your Web App with the key PHP\_INI\_SCAN\_DIR and value d:\\home\\site\\ini

2. Create an settings.ini file using Kudu Console (http://\<site-name\>.scm.azurewebsite.net) in the d:\\home\\site\\ini directory.

3. Add configuration settings to the settings.ini file using the same syntax you would use in a php.ini file. For example, if you wanted to point the curl.cainfo setting to a \*.crt file and set 'wincache.maxfilesize' setting to 512K, your settings.ini file would contain this text:

     ; Example Settings
     curl.cainfo="%ProgramFiles(x86)%\Git\bin\curl-ca-bundle.crt"
     wincache.maxfilesize=512

4. Restart your Web App to load the changes

Reference: <https://docs.microsoft.com/en-us/azure/app-service/web-sites-php-configure>
