---
title: "Redirect azurewebsites.net to your custom domain"
author_name: "Kendrick Dubuisson"
tags:
    - Linux
    - Nginx
    - Redirect
categories:
    - Azure App Service on Linux
    - How-To
    - Configuration
    - Nginx
header:
    teaser: "/assets/images/nginxlogo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2020-03-30 12:00:00
---

## How to update Nginx to redirect to your custom domain.

App Services on Linux supports a number of built-in images to help fast track your development & If the runtime your application requires is not supported in the built-in images we also support building your own docker images & deploying this to App Services on Linux.

Depending on the path taken, Nginx may be the webserver used within the image & might require some additional configuration. Below, we'll be walking through how to update the Nginx configuration file to redirect your users from azurewebsites.net & to your custom domain.

## Getting Started 
   1. Using Azure Portal, open a new SSH session. (https://\<your-site-name\>.scm.azurewebsites.net/webssh/host)
   ![Azure Portal - App Service SSH"](/media/2020/03/nginxdomain3.png)
   
   2. Since we are using VIM below are a few of the basic commands we'll reference.
 
        | VIM Command | Description |
        |----|----|
        |i|Enter Insert Mode|
        |\<Esc\> key |Enter command mode|
        |\<Esc\> + :wq|Save and quit Vim|
        |\<Esc\> + :q!|Force quit Vim discarding all changes|
        |[[ or gg|Move to the beginning of a file|
        |]] or G|Move to the end of a file|

 
## Updating Nginx Default.conf - Server Block 
 
   3. Using vim Go to "/home/etc/nginx/conf.d/default.conf" & here we can see the default server configuration block. 
   On line ten we should see "server_name _;" but instead we'll update this with our custom domain of kdubuis.com which should be seen as "server_name kdubuis.com;".
   ![Nginx server block using new custom domain of "kdubuis.com"](/media/2020/03/nginxdomain1.png)


## Updating Nginx Default.conf - Location Block

   4. On line 58 we'll find the location block which we will update a new condition to redirect to our custom domain.
        
        ```bash
        if ( $host != $server_name ) {
        return 301 $scheme://kdubuis.com$request_uri;
         }
        ```
   ![Nginx location block with redirect logic](/media/2020/03/nginxdomain2.png)

## Saving Changes
   
   5. After the changes have been made & the files are saved, use command below to restart the Nginx Service & load the new configuration so that your redirects should be working as expected. 
    
   ```bash
    nginx -s reload
   ```
