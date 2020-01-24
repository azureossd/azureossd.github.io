---
title: " RewriteRule sample for WordPress in subdirectory"
tags:
  - .htaccess
  - web.config
  - Wordpress
categories:
  - WordPress
  - Azure App Service on Windows
  - Configuration
date: 2018-10-01 13:45:27
author_name: Yi Wang
header:
    teaser: /assets/images/WordPress.png
---

In the case you installed another instance of WordPress in a subdirectory of main WordPress site in Azure web app for Windows, your WordPress installation may be like this, 

![](/media/2018/10/wordpress2-1.png)  

if use "Post name" Permalink setting, with default web.config, articles in subdirectory might give 404 (not found), for example, 

![](/media/2018/10/notfound-1.png) 

For this problem, you can modify web.config to exclude subdirectory "blogs" from main site rewrite rules, here is sample web.config,

    <?xml version="1.0" encoding="UTF-8"?>
    <configuration>
    <system.webServer>
      <rewrite>
      <rules>
        <rule name="Imported Rule 1" stopProcessing="true">
          <match url="^index.php$" ignoreCase="false" />
          <action type="None" />
        </rule>
        <rule name="Imported Rule 2" stopProcessing="true">
          <match url="." ignoreCase="false" />
          <conditions>
            <!--# Include in the next line all folders to exclude-->
            <add input="{URL}" pattern="(blogs)" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsFile" ignoreCase="false" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" ignoreCase="false" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.php" />
        </rule>
      </rules>
      </rewrite>
    </system.webServer>
    </configuration>

  If the WordPress sites are hosted on Apache on Azure web app for containers, modify wwwroot/.htaccess, for example,

    \# BEGIN WordPress
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index.php$ - [L]

    # Include in the next line all folders to exclude
    RewriteCond %{REQUEST_URI} !(blogs) [NC]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.php [L]
    # END WordPress