---
title: " Redirect HTTP to HTTPS from .htaccess for Azure Web App on Linux on Apache"
tags:
  - .htaccess
  - Web App on Linux
  - Apache
categories:
  - Azure App Service Web App
  - Azure App Service on Linux
  - Apache
  - Configuration
date: 2017-06-19 17:46:50
author_name: Yi Wang
---

1. To verify the request is sent from HTTP or HTTPS for Web App on Linux:

   Unlike the application running on Web App on Windows, the server variable "HTTPS" is not defined for Web App on Linux. Check for "X-ARR-SSL", this variable is set if the request is HTTPS.

   This information may be verified from Apache server variables, but not showing from header in Fiddler.

2. Implement rewrite rule in .htaccess to allow HTTP to HTTPS redirect:

   Instead of using system variable "HTTPS", modify the RewriteCond to use "HTTP:X-ARR-SSL", sample code in .htaccess:


        RewriteEngine On
        RewriteCond %{HTTP:X-ARR-SSL} ^$
        RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
