---
title: "How to enable PHP LDAP in Azure Web Apps"
tags:
  - LDAP
  - PHP
categories:
  - Azure App Service on Windows
  - PHP
  - How-To
date: 2017-03-03 12:01:45
author_name: Edison
---

**PHP LDAP extension** is not enabled by default in Azure Web App, you need the following steps:

[How to enable extensions in the default PHP runtime](https://docs.microsoft.com/en-us/azure/app-service-web/web-sites-php-configure#how-to-enable-extensions-in-the-default-php-runtime)

1.  Go to <https://portal.azure.com>
2.  Select your web app and go to **App Settings**
3.  Add an app setting called **PHP\_INI\_SCAN\_DIR** with value **d:\\home\\site\\ini![ldap-php1](/media/2017/03/ldap-php1.png)**
4.  Go to **Kudu Console** <https://%3Cyourwebappname%3E.scm.azurewebsites.net/DebugConsole>
5.  Navigate to **site** and create a new folder called **ini** with **mkdir ini** command.![ldap-php2](/media/2017/03/ldap-php2.png)
6.  Create the file **extensions.ini** inside this folder with **touch extensions.ini** command.![ldap-php3](/media/2017/03/ldap-php3.png)
7.  Write the following line: **extension=php\_ldap.dll**
8.  Restart the web app and test.

 

You can check LDAP Documentation for more information: <http://php.net/manual/en/function.ldap-bind.php>

    // Authentication example
    $ldaprdn  = 'uname';     // ldap rdn or dn
    $ldappass = 'password';  // associated password

    // Connection to LDAP server
    $ldapconn = ldap_connect("ldap.example.com")
        or die("Could not connect to LDAP server.");

    if ($ldapconn) {
        $ldapbind = ldap_bind($ldapconn, $ldaprdn, $ldappass);

        if ($ldapbind) {
            echo "LDAP bind successful...";
        } else {
            echo "LDAP bind failed...";
        }
    }