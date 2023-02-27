---
title: "How to set Nginx headers"
author_name: "Edison Garcia"
tags:
    - Nginx
    - Security
    - Configuration
categories:
    - Azure App Service on Linux, Azure Linux Virtual Machine
    - Nginx
    - Configuration 
header:
    teaser: /assets/images/nginxlogo.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-02-24 12:00:00
---

This post will cover how you can modify Nginx headers, in specific for security perspective but it applies for any custom header needed. 
>**Note**: This is just a reference in how to do it, the values posted here are just examples and these are not recommended to use in production scenarios, every app's purpose is different and will require validation for the best security headers and be tested in a non-production environments first.

# Server Header

As part of the best recommendations for hardening your server is to remove the nginx version, you can do it following the next steps:

![Nginx ServerName Header](/media/2023/02/nginx-headers-01.png)

## App Service Linux

1. SSH your web app through `https://SITE-NAME-HERE.scm.azurewebsites.net/webssh`
2. Copy the existing `nginx.conf` file with `cp /etc/nginx.conf /home/site/`
3. Modify `nginx.conf` with `nano /home/site/nginx.conf`
4. Uncomment `server_tokens off` under http section:

    ![Nginx ServerName Header](/media/2023/02/nginx-headers-02.png)

5. Save (`Control + o`) and then `Enter` and close (`Control + x`)
6. Create a startup script in any location inside home directory, example: `/home/site/startup.sh` with the following content:

    ```shell
    #!/bin/bash

    cp /home/site/nginx.conf /etc/nginx/nginx.conf
    service nginx reload
    ```
7. Update `Startup Command` using Azure Portal from `Configuration` -> `General Settings` with the startup script location `/home/site/startup.sh`

    ![Nginx ServerName Header](/media/2023/02/nginx-headers-03.png)

    Or using Azure CLI: 
    
    ```shell
    az webapp config set --resource-group <resource-group-name> --name <app-name> --startup-file "/home/site/startup.sh"
    ```

## Azure Virtual Machine
>These steps can be applied for Debian based distributions.

1. Modify `nginx.conf` with `sudo nano /etc/nginx/nginx.conf`
2. Uncomment `server_tokens off` under http section:

    ![Nginx ServerName Header](/media/2023/02/nginx-headers-02.png)

3. Save (`Control + o`) and then `Enter` and close (`Control + x`)
4. Restart nginx with `sudo service nginx restart` and test the configuration with `sudo nginx -t` for any typo or issue.

# Security Headers

You can use `add_header` directive to add security headers that your server needs, here is a list of the most common ones:

- X-Frame-Options
- Strict-Transport-Security (HTTP Strict Transport Security (HSTS))
- X-XSS-Protection
- Content-Security-Policy (Content Security Policy (CSP))
- Referrer-Policy

## App Service Linux

1. SSH your web app through `https://SITE-NAME-HERE.scm.azurewebsites.net/webssh`
2. Copy the existing `default` file with `cp /etc/nginx/sites-enabled/default /home/site/`
3. Modify `default` with `nano /home/site/default`
4. Under `server` tag add the security headers:

    ```bash
    add_header X-Frame-Options "SAMEORIGIN"; 
    add_header Strict-Transport-Security "max-age=31536000; includeSubdomains; preload";
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Referrer-Policy "strict-origin";
    ```

    ![Nginx Security Headers](/media/2023/02/nginx-headers-04.png)

5. Save (`Control + o`) and then `Enter` and close (`Control + x`)
6. Create a startup script in any location inside home directory, example: `/home/site/startup.sh` with the following content:

    ```shell
    #!/bin/bash

    cp /home/site/default /etc/nginx/sites-enabled/default
    service nginx reload
    ```

7. Update `Startup Command` using Azure Portal from `Configuration` -> `General Settings` with the startup script location `/home/site/startup.sh`

    ![Nginx ServerName Header](/media/2023/02/nginx-headers-03.png)

    Or using Azure CLI: 
    
    ```shell
    az webapp config set --resource-group <resource-group-name> --name <app-name> --startup-file "/home/site/startup.sh"
    ```

   ![Nginx ServerName Header](/media/2023/02/nginx-headers-05.png)

## Azure Virtual Machine
1. Modify `default` with `sudo nano /etc/nginx/sites-enabled/default`
2. Under `server` tag add the security headers:

    ```bash
    add_header X-Frame-Options "SAMEORIGIN"; 
    add_header Strict-Transport-Security "max-age=31536000; includeSubdomains; preload";
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Referrer-Policy "strict-origin";
    ```

    ![Nginx Security Headers](/media/2023/02/nginx-headers-04.png)

3. Save (`Control + o`) and then `Enter` and close (`Control + x`)
4. Restart nginx with `sudo service nginx restart` and test the configuration with `sudo nginx -t` for any typo or issue.

>Note: If you are using Let's encrypt, cerbot will add this configuration `include /etc/letsencrypt/options-ssl-nginx.conf` which can be conflicting with security headers, review if there is any header that is overwritten in this file.

# Additional references
You can find other ways to edit response headers in App Service Linux using code, or services as Application Gateway, Azure Front Door, etc in this reference. 
["Editing Response Headers on Linux App Service"](https://azureossd.github.io/2022/05/25/Editing-Response-Headers-on-Linux-App-Service/index.html)