---
title: "Verify Peer Certificate from PHP cURL for Azure Apps"
tags:
  - cainfo
  - PHP
  - php curl ssl certificate azure
categories:
  - PHP
  - SSL
date: 2015-06-12 13:43:00
author_name: Yi Wang
---

When you use PHP cURL extension, be aware that CURLOPT\_SSL\_VERIFYPEER option is set to TRUE by default as of cURL version 7.10 (Azure has cURL 7.40 installed). Common error messages related to SSL_VERIFYPEER option could be: SSL certificate problem, verify that the CA cert is OK SSL certificate problem: unable to get local issuer certificate The error is usually caused by missing or having invalid SSL certificate in cURL option. If you see these messages, consider to validate SSL certificate, and check the path to CA certificate file. CA certificate must be in PEM format, for more detail about CA extract, visit [http://curl.haxx.se/docs/caextract.html](http://curl.haxx.se/docs/caextract.html) Do not turn off CURLOPT\_SSL\_VERIFYPEER  unless your cURL connect to non certificate protected server.   There are two ways that you can specify certificate info for cURL in PHP environment.

#### 1\. Specify CURLOPT_CAINFO in cURL option: (sample code)

curl\_setopt($ch, CURLOPT\_CAINFO, getcwd() . "\\cert\\ca-bundle.crt"); Note: getcwd() . "\\cert\\ca-bundle.crt" returns absolute path of your ca-bundle.crt. Make sure ca-bundle is installed at correct path.  

#### 2\. Set curl.cainfo path in php.ini

Since curl.cainfo is PHP\_INI\_SYSTEM directive, the value cannot be set in ".user.ini". You can change the setting with PHP\_INI\_SCAN_DIR, follow the steps:

*   In the Azure Portal, select your web app and go to “Application Settings”.
*   Go to the App Settings section and add the following key and value and press save.

        KEY = PHP_INI_SCAN_DIR
        VALUE = D:\home\site\ini




[![php_ini_scan_dir](/media/2017/03/php_ini_scan_dir.png)](/media/2017/03/php_ini_scan_dir.png)

*   Go to the KUDU site for your web app (https://&lt;sitename>.scm.azurewebsites.net/debugconsole).
*   Go to site directory and press the “+” button and create an “ini” directory.

[![kudu_add](/media/2017/03/KUDU_Add.png)](/media/2017/03/KUDU_Add.png)

*    In the ini directory, create an “extensions.ini” file.
*   Press the edit button next to the file.
*   Add the following to the file and save.

 

curl.cainfo="%ProgramFiles(x86)%\\Git\\usr\\ssl\\certs\\ca-bundle.crt"

  Refer to this blog for PHP configuration on Azure,  [https://azure.microsoft.com/en-us/documentation/articles/web-sites-php-configure/](https://azure.microsoft.com/en-us/documentation/articles/web-sites-php-configure/ "https://azure.microsoft.com/en-us/documentation/articles/web-sites-php-configure/")   CURLOPT\_SSL\_VERIFYHOST option is used along with verify peer, default value of this option is 2, to check the existence of a common name and also verify that it matches the hostname provided (more detail at [http://php.net/manual/en/function.curl-setopt.php](http://php.net/manual/en/function.curl-setopt.php))