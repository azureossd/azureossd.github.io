---
title: " Convert Apache .htaccess to IIS Web.Config"
tags:
  - apache
  - Azure web app
  - Rewrite Rules
  - web.config
categories:
  - Azure App Service on Windows
  - PHP
  - Apache
  - How-To
  - Configuration
date: 2015-09-28 15:58:00
author_name: Mangesh Sangapu
---

A web.config file is the settings and configuration for applications on IIS Server (ex: Azure Paas Websites ). But what if you’re coming from a Linux host – what then?

Well, there are few options:

1\) Online Conversion Tool

> <http://www.htaccesstowebconfig.com/>
>
> As always, please verify the converted web.config rules on a development site before introducing them directly into production.

2\) IIS Manager

> More on IIS Manager .htaccess conversions [here](../2015/04/23/converting-apache-htaccess-rules-to-web-config-using-iis-manager-for-azure-and-iis-websites)

3\) Manual Conversion

There is a good article on the equivalent components. It can be found here: <http://www.iis.net/learn/application-frameworks/install-and-configure-php-applications-on-iis/translate-htaccess-content-to-iis-webconfig>

>  



|Htaccess Component|	web.config equivalent|
|----|---|
|FilesMatch<br>Example:<br><FilesMatch "\\.(gif'&#124;'jpg&#124;^png)$"><br>Order allow, deny<br><\/FilesMatch> | requestFiltering<br>Example:<br>&lt;security><br>&lt;requestFiltering><br>&lt;fileExtensions><br>&lt;add fileExtension=”.gif” allowed=”true” /><br>&lt;add fileExtension=”.jpg” allowed=”true” /><br>&lt;add fileExtension=”.png” allowed=”false” /><br>&lt;/requestFiltering><br>&lt;/security>
|Default Document<br># Set the default handler<br>DirectoryIndex index.php | &lt;defaultDocument><br>&lt;files><br>&lt;remove value=”index.php” /><br>&lt;add value=”index.php” /> <br>&lt;/files><br>&lt;/defaultDocument>
|URL Rewriting<br><br>RewriteCond %{HTTP_HOST} ^example\.com$ <br>[NC]<br>RewriteRule ^(.*)$ http://www.example.com/$1 <br>[L,R=301] <br>RewriteCond %{REQUEST_FILENAME} !-f<br>RewriteCond %{REQUEST_FILENAME} !-d <br>RewriteCond %{REQUEST_URI} !=/favicon.ico <br>RewriteRule ^(.*)$ index.php?q=$1 [L,QSA] | &lt;rewrite><br>&lt;rules><br>&lt;rule name=”Imported Rule 1″ stopProcessing=”true”><br>&lt;match url=”^(.*)$” ignoreCase=”false” /> <br>&lt;conditions><br>&lt;add input=”{HTTP_HOST}” pattern=”^example\.com$” /><br>&lt;/conditions><br>&lt;action type=”Redirect” redirectType=”Permanent” url=”http://www.example.com/{R:1}” /><br>&lt;/rule><br>&lt;rule name=”Imported Rule 2″ stopProcessing=”true”><br>&lt;match url=”^(.*)$” ignoreCase=”false” /><br>&lt;conditions> <br>&lt;add input=”{REQUEST_FILENAME}” matchType=”IsFile” ignoreCase=”false” negate=”true” /><br>&lt;add input=”{REQUEST_FILENAME}” matchType=”IsDirectory” ignoreCase=”false” negate=”true” /><br>&lt;add input=”{URL}” pattern=”^/favicon.ico$” ignoreCase=”false” negate=”true” /><br>&lt;/conditions><br>&lt;action type=”Rewrite” url=”index.php?q={R:1}” appendQueryString=”true” /><br>&lt;/rule><br>&lt;/rules> <br>&lt;/rewrite>
|Error Page Redirects / Handling<br><br># Make Application handle any 404 errors.<br>ErrorDocument 404 /index.php| &lt;!– HTTP Errors section should only be enabled if the “Error Pages” feature has been delegated as “Read/Write” at the Web Server level. <br>&lt;httpErrors><br>&lt;remove statusCode=”404″ subStatusCode=”-1″ /> ><br>&lt;error statusCode=”404″ prefixLanguageFilePath=”” path=”/index.php” responseMode=”ExecuteURL” /><br>&lt;/httpErrors><br>–>
Directory Browsing<br><br>Example:<br><br># Don’t show directory listings for URLs which map to a directory. <br>Options -Indexes| &lt;directoryBrowse enabled=”false” />