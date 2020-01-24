---
title: " HTTP to HTTPS redirect for WordPress on Azure Web App on Linux"
tags:
  - https
  - Wordpress
categories:
  - Azure App Service on Linux
  - WordPress on Linux
  - Configuration
date: 2017-08-04 12:00:24
author_name: Yi Wang
---

If you host WordPress site on Azure Web App on Linux running Apache, here are the steps to implement HTTP to HTTPS redirect:

1. Add RewriteRule in .htaccess in WordPress application root

     RewriteCond %{HTTP:X-ARR-SSL} ^$
     RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

2. Once this RewriteRule is added, you may see wp-admin page lost style like this, this is caused by loading mixed content from http and https,

![](/media/2017/08/wp-admin-1024x430.png)

Here is a way to fix this, add following code in wp-config.php,

    define('FORCE_SSL_ADMIN', true); 
    if ( isset($_SERVER['HTTP_X_ARR_SSL']) ) 
            $_SERVER['HTTPS']='on';
