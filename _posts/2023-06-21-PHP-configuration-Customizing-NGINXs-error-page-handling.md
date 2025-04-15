---
title: "PHP configuration: Customizing NGINX's error page handling"
author_name: "Anthony Salemo"
tags:
    - PHP
    - Configuration
    - Azure App Service on Linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-06-21 12:00:00
---

This post will cover how to alter NGINX's error page handling when using PHP 8.x "Blessed Images" on App Service Linux.

# Overview
With PHP 8.x Blessed Images using NGINX (the current default), if the application returns a status code in the range of 5xx - this may surface as a response from NGINX as an HTTP 404

![NGINX HTTP 404](/media/2023/06/azure-oss-blog-php-config-nginx-1.png)

While in application logging, you may see:

```
127.0.0.1 -  21/Jun/2023:15:56:54 +0000 "GET /index.php" 502
```

Or

```
127.0.0.1 -  21/Jun/2023:16:56:15 +0000 "GET /index.php" 500
```

This is because of the below directive and location block in `/etc/nginx/sites-available/default`:

```
# redirect server error pages to the static page /50x.html
#
error_page   500 502 503 504  /50x.html;
location = /50x.html {
   root   /html/;
}
```

Ultimately, the reason is that `50x.html` does not exist on the file system. Therefor, a 404 is returned. This can be misleading if not aware. There is a few ways we can change the behavior here.

# Override NGINX's default behavior
To start, you need to override NGINX's configuration by following this post - [NGINX Rewrite Rules for Azure App Service Linux PHP 8.x](https://azureossd.github.io/2021/09/02/php-8-rewrite-rule/index.html)  - or if using frameworks that serve content out of a different directory, like Laravel ([Laravel Deployment on App Service Linux](https://azureossd.github.io/2022/04/22/PHP-Laravel-deploy-on-App-Service-Linux-copy/index.html)) - this can be followed.

We can now change the behavior in a few different ways.

**IMPORTANT**: None of these methods will alter an applications debug mode. You still may need to enable debug mode, depending on the situation, which must be done from an application standpoint - eg., `APP_DEBUG`, `WP_DEBUG`, etc. 

## Return the error directly from the application
The easiest way to do this is to override `/etc/nginx/sites-available/default` by commenting out both the block and directive:

```
# redirect server error pages to the static page /50x.html
#
# error_page   500 502 503 504  /50x.html;
# location = /50x.html {
#   root   /html/;
# }
```

![Laravel HTTP 500](/media/2023/06/azure-oss-blog-php-config-nginx-2.png)

We see here this HTTP 500 is now returned directly from Laravel - instead of seeing an HTTP 404 from NGINX.

To keep these changes permanent, meaning not to lose them when the app service is restarted, follow the below link. Here it explains various methods of applying the changes without having any conflicts. 

[Suppress 404s permanently - not to lose the changes when the app is restarted](https://azureossd.github.io/2023/06/21/PHP-configuration-Customizing-NGINXs-error-page-handling/index.html#suppress-404s-permanently---not-to-lose-the-changes-when-the-app-is-restarted)

## Return the status code from NGINX
You can return the status code sent back by the application by updating _only_ the `error_page` directive - delete or comment out the `50x.html` location block from earlier:

```
error_page   500 502 503 504 /index.php;
```

The `.php` file must be relative to where root is set. For example, root may be set to`/home/site/wwwroot/public` - this `index.php` file must be under this directory.

For example, here we're purposefully returning an HTTP 502:

```php
return response('test', 502);
```

![NGINX HTTP 502](/media/2023/06/azure-oss-blog-php-config-nginx-3.png)

But organic application errors, like HTTP 500's, will be surfaced like this as well:

![NGINX HTTP 500](/media/2023/06/azure-oss-blog-php-config-nginx-4.png)

## Return a custom error page from NGINX
We can return a custom error page through NGINX using the directives and location block above. We'd need to first:

- Create a `50x.html` file on the file system. Put whatever desired content in here as needed.
- Place this under an appropriate directory. For example, `/home/site/wwwroot`

Change our location and directives to something like the below:

```
# redirect server error pages to the static page /50x.html
#
error_page   500 502 503 504  /50x.html;
location = /50x.html {
   root   /home/site/wwroot;
}
```

With some HTML like the below, you should see the following on a route encountering a 5xx status code:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
</head>
<body>
    <h1>NGINX - Custom Error Page</h1>
</body>
</html>
```

![NGINX Custom error page](/media/2023/06/azure-oss-blog-php-config-nginx-5.png)

# Further troubleshooting
## App Service Logs
If further troubleshooting is needed, ensure that [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) are enabled. You can then view logging in a few different ways:

- LogStream
-  logs directly from the Kudu site, or directly view/download via an FTP client
- Diagnose and Solve Problems -> Application Logs detector, Container Crash detector, or Container Issues

If App Service Logs are not enabled, only `docker.log files` will be generated, which will not show application related stdout / stderr and will make troubleshooting issues more complicated. `default_docker.log` files are the files that show application stdout/err.

## Application Debug logging
Do not solely rely on this configuration change for debugging - enabling App Service Logs plus the relevant environment variable or configuration for application **debug mode**, which will depend on the framework/library/application type use, while reproducing the issue can help uncover the issue faster.

## NGINX errors - "Reloading nginx configuration: nginx failed!"
If you're overriding NGINX via startup command or script, you may see this:

```
Reloading nginx configuration: nginx failed!
```

This most likely may be happening due to invalid syntax in one of the NGINX files.

You can use the `nginx -t` command for a syntax check. In this case, it may call out an issue like the below:

```
root@fb9fbe0e7314:/home# nginx -t
nginx: [emerg] directive "server" has no opening "{" in /etc/nginx/sites-enabled/default:1
nginx: configuration file /etc/nginx/nginx.conf test failed
```

## Suppress 404s permanently - not to lose the changes when the app is restarted

You may either comment out the following section in `/etc/nginx/sites-enabled/default` or `/etc/nginx/sites-available/default`.
If it is for the first time, you may apply the changes in `/etc/nginx/sites-enabled/default`. 
If the changes are already present in `/etc/nginx/sites-available/default` and `/home/site/startup.sh` was already built, just incorporate the changes in `/etc/nginx/sites-available/default`.

Once the app is restarted or when the nginx is reloaded succesfully, the changes will be applied in both `/etc/nginx/sites-available/default` and `/etc/nginx/sites-enabled/default`. You may simply check the contents of both the files in SSH using cat filename. 

Follow the approach as mentioned here [NGINX Rewrite Rules for Azure App Service Linux PHP 8.x](https://azureossd.github.io/2021/09/02/php-8-rewrite-rule/index.html) if this is the first time you are applying changes. Besides what was recommended for location /, you need to comment out the following section in `/home/site/default`. 

```
# redirect server error pages to the static page /50x.html
#
# error_page   500 502 503 504  /50x.html;
# location = /50x.html {
#   root   /html/;
# }
```

To test whether the changes you applied are working or not, you may run the cp commands manually and run 'service nginx reload' from SSH. Once the changes loook fine, you may restart the app service and do a final test. Restart triggers the startup script defined in the Startup command.  

By any chance, if you arrive at the startup.sh file with the similar lines shown below, make sure the changes in the second file (`/home/site/sites-available-default`) do not override changes applied in the `/home/site/default`. 

```
#!/bin/bash

cp /home/site/default /etc/nginx/sites-enabled/default
cp /home/site/sites-available-default /etc/nginx/sites-available/default
service nginx reload
```

For example, if you have commented out 5xx section in `/home/site/default`, and not in `/home/site/sites-available-default`, the `/home/site/sites-available-default` will override the changes you applied in `/home/site/default`. Hence, you will still see 404s instead of actual 500s coming from your application. 