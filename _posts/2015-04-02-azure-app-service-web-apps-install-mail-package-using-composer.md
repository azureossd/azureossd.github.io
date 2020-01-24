---
title: "Azure App Service Web Apps  - Install Mail package using composer"
tags:
  - azure
  - Web Apps
url: 93.html
author_name: Prashanth Madi
id: 93
categories:
  - PHP
  - Composer
date: 2015-04-02 11:04:00
---

For Information about installing MediaWiki on Azure : <http://blogs.msdn.com/b/benjguin/archive/2012/09/25/installing-mediawiki-to-free-windows-azure-web-sites-installation-de-mediawiki-vers-les-windows-azure-web-sites-gratuits.aspx> 

 
[This Blog provides an easy way of setting the email client on mediawiki. Below are step by step instructions for doing this:

1)  We need to edit the compose.json file located in the root folder of your website. You can edit your site using [WebMatrix](https://www.youtube.com/watch?v=ioz6KJChXNc).

     Please add the following in the composer.json file and save the file

``` {.scroll}
{
 "repositories": [
 {
 "type": "pear",
 "url": "http://pear.php.net"
 }
 ],
 "require": {
 "php": ">=5.3.2",
 "psr/log": "1.0.0",
 "pear-pear.php.net/PEAR": "1.9.4",
 "pear-pear.php.net/Mail": "1.2.0",
 "pear-pear.php.net/Mail_Mime": "1.8.5",
 "pear-pear.php.net/Net_SMTP": "1.6.1"
 }
 }
```

   The edited file should look like this:

![](/media/2019/03/7317.composer_file.PNG)

2) Download the **composer.phar** file from http://getcomposer.org/composer.phar

Save this file in the wwwroot folder of your site using an FTP client.

 

3) Please connect to the “Debug Console” for your site in Kudu by browsing to: 

https://YourSiteName.scm.azurewebsites.net/Debugconsole

 

[4)   Install packages in composer.json using below command

``` {.scroll}
php composer.phar install
```

 

![](/media/2019/03/3527.composer_install.PNG)

 
5)  If you are using Gmail account, please add the following code at the end of localsettings.php file in the root folder and replace the IDHost, username and password with your credentials:

 

``` {.scroll}
$wgSMTP = array(
 'host' => "ssl://smtp.gmail.com", // could also be an IP address. Where the SMTP server is located
 'IDHost' => "YourSiteName.azurewebsites.net", // generally this will be the domain name of your website (aka mywiki.org)
 'port' => 465, // Port to use when connecting to the SMTP server
 'auth' => true, // Should we use SMTP authentication (true or false)
 'username' => "YourID@gmail.com", // Username to use for SMTP authentication (if being used)
 'password' => "YourPassword" // Password to use for SMTP authentication (if being used)
 );
 
```

 

6) Restart Your website by clicking on Restart in the Azure portal.

 

### Testing :

1)  Browse to your website’s main page. For example: <http://samplemediawiki.azurewebsites.net/index.php?title=Main_Page>

2) Click “Create account” on top right

3) Enter details on the account creation page and click Submit.

4) Check if you received an email.
 

### Troubleshooting:

If you haven't received any email, include the lines of code below in LocalSettings.php to check errors on the webpage. Make sure to remove them before moving to production.

``` {.scroll}
error_reporting( -1 );
ini_set( 'display_errors', 1 );
```


 

Note: Please note that PEAR extensions are not officially supported for Web Apps. It would be great to have a feedback item open for voting so we can evaluate overall priority for customers. You can post on this subject on the feedback forum [here](http://feedback.azure.com/forums/169385-web-sites). 

 
