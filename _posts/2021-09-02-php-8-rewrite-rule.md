---
title: "NGINX Rewrite Rules for Azure App Service Linux PHP 8.x"
author_name: "Christopher Maldonado"
tags:
    - php8
    - nginx
    - app service linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: false
toc_sticky: true
date: 2021-09-02 12:00:00
---

Configuring NGINX Rewrite Rules for Azure App Service blessed images running PHP 8.x

## Intro

Azure App Service on Linux images using PHP 8.x are now bundled with NGINX instead of Apache. The use of `.htaccess` files will not work for NGINX as these are used for Apache only. This will require the need to setup a custom startup script and modifying the existing NGINX site configuration.

## Steps

Navigate to your App Service via the Azure Portal. Under the `Development Tools` section, select `SSH` then `Go -->`.

### Modifying the default site config

You will want to make a copy of the existing configuration and place the file inside the `/home/site` directory.

```sh
cp /etc/nginx/sites-enabled/default /home/site/default
```

Once copied, edit the `/home/site/default` file and update the section below:

```ini
server {

    # Section Excluded

    location / {
        index  index.php index.html index.htm hostingstart.html;
        try_files $uri $uri/ /index.php?$args;
    }

    # Section Excluded
}
```

### Creating the custom startup script

You will now need to create a custom startup script and save the file as `/home/site/startup.sh`

```sh
#!/bin/bash

cp /home/site/default /etc/nginx/sites-enabled/default
service nginx reload
```

In the custom startup script we are doing the following:

  1. Overriding the existing `/etc/nginx/sites-enabled/default` file with the `/home/site/default` file.
  2. Reloading the NGINX service to make the updates take effect.

### Updating the application settings

Navigate back to your App Service via the Azure Portal. Under the `Settings` section, select `Configuration`.

Go over to the `General Settings` section of the `Configuration` blade.

For the `Startup Command` enter the following: `/home/site/startup.sh`

Save these settings and navigate to your application `https://{sitename}.azurewebsites.net/`
