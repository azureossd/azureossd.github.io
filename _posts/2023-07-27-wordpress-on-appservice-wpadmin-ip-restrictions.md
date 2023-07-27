---
title: "How to enable IP access restrictions on wp-admin for the WordPress on App Service offering"
author_name: "Aldmar Joubert"
tags:
    - Configuration
    - WordPress
    - Nginx
    - IP filtering
    - access restrictions
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/WordPress.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-07-27 12:00:00
---

The below guide walks through configuring IP access restrictions on wp-admin for the WordPress on App Service offering. 

# 1. Using the SSH console, copy /etc/nginx/conf.d/default.conf to /home/dev/default.conf

The SSH console can be accessed from here: WEBAPP-NAME.scm.azurewebsites.net/webssh/host

```sh
cp /etc/nginx/conf.d/default.conf /home/dev/default.conf
```

# 2. Edit /home/dev/default.conf to use the X-Forwarder-For header and add a location block for wp-login.php

You can edit the file using the Kudu newui file manager which can be accessed from here: WEBAPP-NAME.scm.azurewebsites.net/newui/fileManager#

![Kudu newui file manager - edit pencil icon](/media/2023/07/WordPress-filemanager-edit-default.png)

![Kudu newui file manager - edit file](/media/2023/07/wordpress-newui-filemanager-editing.png)

```sh
set_real_ip_from 0.0.0.0/0;
real_ip_header X-Forwarded-For;
```	

```sh
location ~* wp-login\.php {
            allow <YOUR-IP>;
            deny all;
            
            #Copied from the existing PHP location block
            include fastcgi.conf;
            include fastcgi_params;
            fastcgi_intercept_errors on;
            fastcgi_pass php;

            fastcgi_read_timeout 300;
            fastcgi_cache_bypass $skip_cache;
            fastcgi_no_cache $skip_cache;
            fastcgi_cache off;
            fastcgi_cache_valid 60m;     
}
```	

# 3. Update /home/dev/startup.sh with the below snippet

```sh
#!/bin/sh
	
cp /home/dev/default.conf /etc/nginx/conf.d/default.conf 
	
/usr/sbin/gnix -s reload
```

# 4. Point to /home/dev/startup.sh in the App Service portal under configuration --> general settings. Saving the changes will restart the App Service.

![App Service portal configuration general settings - set startup command](/media/2023/07/WordPress-Configuration-startupcommand.png)

# 5. Test the access using different devices to ensure the IP access restrictions are applied.

![App Service portal configuration general settings - set startup command](/media/2023/07/WordPress-403-wp-admin.png)

# Articles of Note:
- [Create a WordPress site](https://learn.microsoft.com/en-us/azure/app-service/quickstart-wordpress)
- [WordPress Best Practices for Security](https://azureossd.github.io/2021/01/28/wordpress-best-practices-for-security/index.html)
- [WordPress Best Practices for Performance](https://azureossd.github.io/2020/08/07/wordpress-best-practices-for-performance/index.html)
