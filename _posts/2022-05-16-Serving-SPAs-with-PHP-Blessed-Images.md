---
title: "Serving SPAs with PHP Blessed Images"
author_name: "Anthony Salemo"
tags:
    - PHP
    - Single Page Application
    - Deploy
    - SPA
categories:
    - PHP
    - Configuration
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/azure-containerapps-logo.png
toc: true
toc_sticky: true
date: 2022-05-13 12:00:00
---

This post provides information on how to serve Single Page Applications(SPAs) with Azure App Service on Linux PHP "Blessed" Images.

# Getting started

A question that may be asked is why would one need to do this? 

PHP for Linux App Service Images use Apache (PHP 7.4) and NGINX (PHP 8.0), therefor these Web Servers could be utilized to do things on the server side while still serving static content, such as redirects, rewrites, or other various Web Server configuration, that cannot be done using a regular Node for Linux App Service "Blessed" Image. 

This is because by default neither of these Web Servers run in the container for Node App Service "Blessed" Images and it is up to the developer to bring the server of their choosing (eg, plain Node itself or any number of framework/libraries that can run a 'live' node server).

Another possible reason is not wanting to do any of the above programatically or place another device or product in between the client and the application for the same metioned functionality.

## Create a Linux PHP App Service
We can get started on this by creating a [PHP Linux App Service](https://docs.microsoft.com/en-us/azure/app-service/quickstart-php?pivots=platform-linux).

## Create a Single Page Application
For the SPA itself, use a quickstart for any of the following
- [React](https://create-react-app.dev/docs/getting-started)
- [Angular](https://angular.io/cli#basic-workflow)
- [Vue](https://vuejs.org/guide/quick-start.html#with-build-tools)


**Important information on deployments**:

Depending on how deployment is done, you may run into errors if you attempt to deploy a typical SPA directly to a Linux PHP App Service without any additional configuration. This is because of the logic **[here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/php.md#detect)** in what Oryx (the build agent for certain deployments) looks for.

# PHP 7.4 (Apache)
This will target deployment and configuration for deploying SPA's to a PHP 7.4 Linux App Service which utilizes Apache as its Web Server.

## Configure a startup script to override Apache (Optional)
If using this approach for Apache specific configuration, then a startup script will need to be added. 

1. SSH into the Linux PHP App Service you created and run `cp /etc/apache2/apache2.conf /home`.
2. Copy this down with an FTP client of your choice.
3. Make your changes in `apache2.conf`. Upload this back to `/home`. In this example, we'll assume to be removing the `Server` header. In `apache2.conf` the following is added:

```apache
<IfModule security2_module>
    SecRuleEngine on
    ServerTokens Min
    SecServerSignature " "
</IfModule> 
```
4. Create your custom startup script, which must be a `.sh` file. We'll add the following:

```bash
#!/bin/bash

echo "Installing mod_security.."
apt-get update -yy && \
    apt-get install libapache2-mod-security2 -yy

echo "Removing Apache Server header.."
cp /home/apache2.conf /etc/apache2/apache2.conf
```

5. Upload the custom startup script to `/home` as well and update the Azure Portal for the PHP Linux App Service under 'Configuration' -> 'General Settings':

  ![Configuration tab](/media/2022/05/azure-php-spa-5.png)

6. Click 'Save'.

## FTP

Before deploying, generate the production build folder for your SPA locally. Depending on what you're using (React, Angular, Vue), this is generally done through either `yarn build` or `npm run build`, depending on your package manager.

React will output a folder named `/build`, Angular will have `/dist` and Vue will also have `/dist`. If you're unfamiliar with what your production build folder should look like for your framework/library - please consult its documentation.

1. Go to the Azure Portal for the PHP App Service you created. Go to Deployment Center and choose the FTPS credentials tab.

    ![FTPS credentials tab](/media/2022/05/azure-php-spa-1.png)

    ![FTPS credentials](/media/2022/05/azure-php-spa-2.png)

2. Using an FTP client of your choosing, connect using the credentials in the portal, as seen above.
3. Copy the contents **within** your production build folder to `/home/site/wwwroot` with your FTP client session. Make sure this is **not** the build folder itself. The directory should look something like the below. The important takeaway is that `index.html` is within `wwwroot`. 

    ![wwwroot contents](/media/2022/05/azure-php-spa-3.png)
**NOTE**: Apaches `DocumentRoot` is set to `/home/site/wwwroot`  


4. Restart the site. Shortly after your SPA should be viewable.
5. If wanting to do further Apache configuration along with serving your static content please refer this the above [section](#configure-a-startup-script-to-override-apache-optional)

## Local Git

**Before doing this an App Setting with the name `SCM_DO_BUILD_DURING_DEPLOYMENT` set to `false` needs to be added.** If this isn't done, deployment will fail since [no PHP project structure](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/php.md#detect) will be detected.

Local Git can be deployed in two general ways:

1. Either with updating Apache's DocumentRoot to point to `/home/site/wwwroot/build`.
2. Or, navigating into the production folder that was built locally and deploy from there.

**Option 1:**
- Set your deployment method to Local Git in the portal for the App Service you're deployting to under **Deployment Center**.
- Change `DocumentRoot` to `/home/site/wwwroot/build` using the above [section](#configure-a-startup-script-to-override-apache-optional).
- Navigate to your site root and run the below commands:

    ```bash
    git add .
    git commit -m "initial commit"
    git remote add azure https://<sitename>.scm.azurewebsites.net:443/<sitename>.git
    git push azure master
    ```
