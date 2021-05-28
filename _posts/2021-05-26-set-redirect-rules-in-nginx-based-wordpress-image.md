---
title: "How to set the redirect rules in Nginx based Wordpress Image"
author_name: "Arjun Baliga"
tags:
    - nginx
    - Wordpress
    - redirect rules
categories:
    - Azure App Service on Linux
    - PHP
    - WordPress
    - Configuration
header:
    teaser: "/assets/images/WordPress.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
toc: true
toc_sticky: true
date: 2021-01-28 16:00:00
---
In the Nginx based WordPress image, if you'd like to configure the redirect rules please follow the steps below -


1. Start and access your site in a browser and open a direct SSH session with your container.<br>
Paste the following URL into your browser and replace &lt;app-name&gt; with your app name: <br>
https://&lt;app-name&gt;.scm.azurewebsites.net/webssh/host
2. Run the following commands to update the Nginx configurations -<br>
cd /etc/nginx/conf.d<br>
vi default.conf <br>
Press I and switch to Insert mode 
3. Based on your requirement update the redirect rule below in the “location” section<br> 
Please use the below syntax if the redirect is to the different folder - <br>
location /global/ {<br>
            try_files $uri $uri/ /global/index.php?$args;}<br>
The below syntax can be used in case if you'd like to redirect the URLs to the different domain.<br/>
/global/about.php {<br/> 
rewrite ^(.*)$ https://www.slkgroup.com/global/about redirect; <br>
}<br/>
![nginx rules](/media/2021/05/nginx-redirect-rules.png)
4. Save the new settings by pressing ESC and :wq!
5. Restart your site and test the redirect rules.

