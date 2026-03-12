---
title: "Wordpress on Linux - Configuring NGINX"
author_name: "Anthony Salemo"
tags:
    - Linux
    - Wordpress
    - Configuration
    - Azure App Service on Linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-01-30 12:00:00
---

This post will cover how to change NGINX's configuration when using Wordpress on App Service Linux

# Overview
Wordpress on Linux refers to the offering that is found here - [Create a WordPress site](https://learn.microsoft.com/en-us/azure/app-service/quickstart-wordpress).

This uses an Alpine-based image with NGINX and PHP-FPM (currently PHP 8.x). NGINX is the web server used.

It is a common misconception that `.htaccess` files can be used here. `.htaccess` files **cannot** be used - as these are only relevant for Apache HTTPD servers.

Sometimes, it may be needed to change some of NGINX's configuration through its `.conf` files under certain circumentances. This post will explain some more common changes that can be done.

It is recommended that [How to run Bash scripts in WordPress on Azure App Service (techcommunity)](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/how-to-run-bash-scripts-in-wordpress-on-azure-app-service/ba-p/3625692) / [How to run Bash scripts in WordPress on Linux App Services (GitHub)](https://github.com/Azure/wordpress-linux-appservice/blob/main/WordPress/running_post_startup_scripts.md) was read before hand as well. This explains generally using startup scripts with this Wordpress image which will differ slightly from other "Blessed" images. The startup script location is _only_ under `/home/dev/startup.sh`.

----------
To start editing, you'll want to access `https://yoursite.scm.azurewebsites.net/webssh/host` to be able to copy of the files described below. Alternatively, you can go to `https://yoursite.scm.azurewebsites.net` and then select **SSH** on the top nav bar

> **NOTE**: There is the option in the Azure Portal on the Web App for "SSH" as well, which will take you to the same spot

---------


For common scenarios, you're either going to change `nginx.conf` or `default.conf`. But there may be other files as well:

- **nginx.conf**: This lives under `/etc/nginx/nginx.conf`
- **default.conf**: This lives under `/etc/nginx/conf.d/default.conf`
- **spec-settings.conf**: This lives under `/etc/nginx/conf.d/spec-settings.conf`. This is loaded in by `nginx.conf` for various NGINX and fastcgi settings.

Depending on what's being done, copy these to `/home/dev` with `cp /etc/nginx/nginx.conf /home/dev` or `cp /etc/nginx/conf.d/default.conf /home/dev` for easier editing.


# Redirects
1. Copy `/etc/nginx/conf.d/default.conf` to `/home/dev`. "Our" copy of the file will exist as `/home/dev/default.conf`
2. Edit the **existing** startup fie in `/home/dev/startup.sh` to include the following:

```bash
#!/bin/bash

echo "Copying custom default.conf over to /etc/nginx/conf.d/default.conf"

cp /home/dev/default.conf /etc/nginx/conf.d/default
nginx -s reload
```

3. Now, depending on what kind of redirect to be done, edit the `default.conf` with your intended change below.

## Redirect to an external URI

Add a **new** server block as seen below. Ensure the **old** server block and all other directives _also_ remain in your `default.conf`. Essentially, you will have _two_ `server` blocks.

```bash
server {
    server_name mysite.azurewebsites.net;
    return 301 $scheme://www.google.com$request_uri;
}

# old/original server block / other directives - KEEP this
server {
    listen 80;
....
```

## Redirect non-www to www

Add a **new** server block as seen below. Ensure the **old** server block and all other directives _also_ remain in your `default.conf`. Essentially, you will have _two_ `server` blocks.

```bash
server {
  server_name mysite.azurewebsites.net;
  return 301 $scheme://www.mysite.azurewebsites.net$request_uri;
}

# old/original server block / other directives - KEEP this
server {
   listen 80;
....
```

**Redirect www to non-www**:

Add a **new** server block as seen below. Ensure the **old** server block and all other directives _also_ remain in your `default.conf`. Essentially, you will have _two_ `server` blocks.

```bash
server {
    server_name www.mysite.azurewebsites.net;
    return 301 $scheme://mysite.azurewebsites.net$request_uri;
}

# old/original server block / other directives - KEEP this
server {
        listen 80;
....
```

## Redirect HTTP to HTTPS

Before diving into this, it's important to understand/remember that, by default, App Service Front-ends do TLS termination. Therefor, all HTTPS requests go back as HTTP to the application container.

If you try to set NGINX to do a redirect back to HTTPS, this will get into a redirect loop with `ERR_TOO_MANY_REDIRECTS` because:
- By default, this Wordpress image is only configured to have NGINX run listening for HTTP requests on port 80
- Because of this, NGINX is seeing an HTTP request come in, and redirects it back to `https://yoursite.com` - which then goes through the TLS termination process again, and repeats the whole process. Which begins the loop

Since TLS termination is done, sites get full TLS/SSL benefit. 

However, if this wanted to be done for some reason, the below would achieve this. Add a **new** server block as seen below. Ensure the **old** server block and all other directives _also_ remain in your `default.conf`

```bash
server {
   server_name mysite.azurewebsites.net;
   return 301 https://mysite.azurewebsites.net$request_uri;
}
```

# Headers
## Adding headers

You can add headers with the `add_header` directive in the following format to your `default.conf` `server` block:

```bash
add_header X-custom-header "my custom header";
```

Your startup script would look like this:

```bash
#!/bin/bash

echo "Copying custom default.conf over to /etc/nginx/conf.d/default.conf"

cp /home/dev/default.conf /etc/nginx/conf.d/default
nginx -s reload
```

![Custom header response](/media/2024/01/wp-nginx-config-1.png)

## Remove 'Server' header

Removing the `Server` header comes down to two general methods with NGINX:
- Recompiling from source - this requires removing the lines in the relevant `.c` files where this header is set and then recompile. This **cannot** be done on the Wordpress App Service image
- Installing a 3rd party module - which _can_ be done

Using the same approach above with a startup script, copy over an `nginx.conf` from `/etc/nginx/nginx.conf` to `/home/dev` for us to alter.

Add in the following to the file:

```bash
...other directives

# Add this line
load_module /usr/lib/nginx/modules/ngx_http_headers_more_filter_module.so;

events {
    worker_connections  10000;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    # Add this line
    more_clear_headers 'Server';

...other directives
```

Make sure to keep the rest of the `nginx.conf` the same aside from the two lines with the comment "Add this line" above them, which pertains to loading the module by referencing the `.so` and actually adding the `more_clear_headers` directive itself.

Your `/home/dev/startup.sh` file would now look like this:

```bash
#!/bin/bash

echo "Installing 'nginx-mod-http-headers-more'.."

apk add nginx-mod-http-headers-more

echo "Copying custom nginx.conf over to /etc/nginx/nginx.conf"
cp /home/dev/nginx.conf /etc/nginx/nginx.conf

nginx -s reload
```

Lastly, restart the site.

**(Before)**

![NGINX response with server header](/media/2024/01/wp-nginx-config-2.png)

**(After - note the lack of the `Server` header)**

![NGINX response without server header](/media/2024/01/wp-nginx-config-3.png)


# Other configuration
Most other relevant configuration directives can be found in `/etc/nginx/conf.d/spec-settings.conf`. These are all loaded into `nginx.conf` through the `include /etc/nginx/conf.d/*.conf;` directive.

Some common directives that may be changed within this file are:
- `client_max_body_size`: This is set to `512MB` in the current image
- `client_header_buffer_size`: This is set to `256K`
- `server_tokens`: This is set to `off`
- Security headers added with the `add_header` directive for common security headers
- FastCGI directives
- Others

A lot of these typically do not need to be changed. But if needed for some reason, use the same startup script approach:

1. Copy `spec-settings.conf` from `/etc/nginx/conf.d/spec-settings.conf` to `/home/dev`
2. Change the directives as needed.
3. Change your startup script to the following:

```bash
#!/bin/bash

echo "Copying custom spec-settings.conf over to /etc/nginx/conf.d/spec-settings.conf"
cp /home/dev/spec-settings.conf /etc/nginx/conf.d/spec-settings.conf

nginx -s reload
```

---------
**Blocking IPs**:

You can use NGINX to block certain IPs by following [How to enable IP access restrictions on wp-admin for the WordPress on App Service offering](https://azureossd.github.io/2023/07/27/wordpress-on-appservice-wpadmin-ip-restrictions/index.html)

# Troubleshooting
## How to see startup script output and errors
You may notice that when using [custom startup scripts on Wordpress](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/how-to-run-bash-scripts-in-wordpress-on-azure-app-service/ba-p/3625692) and either looking for stdout from an operation or from explicit stdout generation like `echo` - you will not see this appear in `default_docker.log`.

This is because supervisord usage and it's configuration. To get a general idea of how this works - see [Logging with supervisord on Web Apps for Containers](https://azureossd.github.io/2023/11/03/Logging-with-supervisord-on-Web-Apps-for-Containers/index.html)

With Wordpress on App Service, the same concept applies with supervisord and log locations. Since startup scripts are ran as a separate process (named `post-startup-script`) - they can be found in their own log files under the `/tmp` directory, which is the default for supervisord. This will either show as:
- `post-startup-script-stderr---supervisor-00000000.log`
- `post-startup-script-stdout---supervisor-00000000.log`

Below is an example of reviewing stdout from a custom startup script in one of these log files:

```
7fd6d23d988d:/tmp# cat post-startup-script-stdout---supervisor-yb_gtkno.log 
This is being executed from /home/dev/startup.sh..
```

Furthermore, by reviewing `default_docker.log` (the equivalent is also shown in `/var/log/supervisor/supervisord.log`), you can confirm if a startup script is successfully executed by finding the below in logging:

```
2023-11-13 14:32:40,214 INFO spawned: 'post-startup-script' with pid 237
2023-11-13 14:32:40,306 WARN exited: post-startup-script (exit status 0; not expected)
```
Although supervisord is showing "not expected" - an `exit` of status 0 is _successful_ - and what we want to see. An exit code greater than > 0 is deemed unsuccessful.

Ultimately, this is all relevant to know in case the startup script is failing, due to something like invalid NGINX syntax in a `.conf` files being overriden. If you notice that changes in the startup script are not applying, review the `/tmp/post-startup-script-stderr` and `/tmp/post-startup-script-stdout` files by opening an SSH session in the application container.

## $'\r': command not found
**Note**: This can happen for any editing of startup scripts on App Service Linux. This is not limited to just Wordpress.

If saving a `startup.sh` (or similar file used for startup scripts) with the `/newui` File Manager editor, and then trying to run that same bash script, the below error may appear - which can also be found in `/tmp/post-startup-script-stderr---supervisor-xxxxxxxx.log` (see the _Stdout/err through startup scripts_ above):

```bash
/home/dev/startup.sh: line 2: $'\r': command not found
```

This may not be visible in the **File Manager**, but if using `vi`, you can see extra characeters `^M` appended to the line endings. This is because the script was saved in the UI with Windows-style line endings (`\r`, return carriage)

```
#!/bin/bash^M
^M
echo "Copying custom default.conf over to /etc/nginx/conf.d/default.conf"^M
```

To resolve this, using `vi` or another text editor, delete the bad endings and save the file.

Typically, to the user, this would firstly manifest as their startup script/changes done through the script not applying, since likely the script is failing to properly execute.