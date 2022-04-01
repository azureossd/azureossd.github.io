---
title: " Best Practices for WordPress Security on Azure"
tags:
  - azure
  - best practice
  - hack
  - hacked
  - security
  - site
  - wordpress
url: 3665.html
id: 3665
categories:
  - Azure App Service 
  - PHP
  - WordPress
  - Best Practices
date: 2016-12-26 10:00:33
author_name: Mangesh Sangapu
toc: true
toc_sticky: true
header:
    teaser: /assets/images/securitycenter.svg
---

This article was put together by **Mangesh Sangapu** and **Yi Wang**. Shout-out to **Cory Fowler** and **Sunitha Muthukrishna** for additional tips.

WordPress Security is often an overlooked feature. Customers are quick to configure their site, but often forget to fine tune the security aspect. Here we have compiled steps that will help make your WordPress site more robust on Azure. Rules compiled are specified for configuration on App Service Windows, but the concepts are still identical on Linux.

More information can also be found at the official WordPress.org site: <https://codex.wordpress.org/Hardening_WordPress>

## 1) wp-config.php

Customize and modify default settings in wp-config.php

-   By default, WordPress use table prefix "wp\_" to create database tables during installation, to secure the access to database tables,\
    recommend to use different table prefix from the default value.
-   As WordPress use bare cookies instead of PHP sessions to track login state, it is important to have authentication cookie for the website. While installing WordPress, you are asked to provide the values of keys & salts, however, you may choose to skip this step for faster installation. In this case, WordPress insert default value for keys & salts ('put your unique phrase here').After the WordPress site is installed, you can edit wp-config.php, using the secret-key service [link](https://api.wordpress.org/secret-key/1.1/salt/) to generate a set of keys & salts.

## 2) WordPress admin Username and Password

The default or commonly used administrator login name can be "admin" or "administrator", do not use them as the username.

-   During WordPress installation, you are provided a strong admin login password, use the strong password, don't use weak passwords like test123, which are easy to guess and break through.

## 3) Keep WordPress updated

WordPress can automatically update itself to a new minor release without any user input. For major updates, WordPress shows a notification that an update is available and a user can initiate the update. WordPress has auto update enabled by default, you should keep this default setting. In the case you have disabled auto update, you should update WordPress periodically.

You should also keep all plugins and theme updated with most current version as well.

## 4) Disable File Editing

WordPress provide a built-in editor for editing files from your browser. This feature is enabled by default, allows administrator users to edit PHP files for plugins and theme from WordPress Dashboard. However, this is also give attackers a tool to execute code if they break login.

-   WordPress has a constant 'DISALLOW\_FILE\_EDIT', to disable editing from Dashboard. You can modify it in wp-config.php: define('DISALLOW\_FILE\_EDIT', true);

It removes the 'edit\_themes', 'edit\_plugins' and 'edit\_files' capabilities of all users. This will stop some attacks from inserting and executing malicious code.

## 5) Backup regularly

Azure provides functionality to backup your web sites automatically. Read more about it [here](https://docs.microsoft.com/en-us/azure/app-service-web/web-sites-backup).

## 6) web.config

Use web.config to disable access to wp-config.php and limit access to wp-login.php

-   Restrict web access to wp-config.php

``` 
<system.webserver>
   <security>
      <requestFiltering>
         <denyUrlSequences>
             <add sequence="wp-config.php" />
         </denyUrlSequences>
      </requestFiltering>
   </security>
</system.webserver>
```

 

-   Restrict access to wp-login.php by IP addresses
```
<!-- -->

      <location path="wp-login.php">
        <system.webServer>
          <security>
        <!-- this line blocks all IP addresses, except those listed below -->
            <ipSecurity allowUnlisted="false">
              <add ipAddress="xxx.xxx.xxx.xxx" allowed="true" />
              <add ipAddress="xxx.xxx.xxx.xxx" allowed="true" />
            </ipSecurity>
          </security>
        </system.webServer>
      </location>
```
-   Consider renaming this file (ex: login.php or secure\_xyz\_login.php)
-   In addition to the WordPress login/password, use [PHP HTTP Authentication](http://php.net/manual/en/features.http-auth.php)

<!-- this line blocks all IP addresses, except those listed below -->

## 7) Xml-rpc.php

This is WordPress API and if you don’t have any plugins requiring it, then you should disallow access by renaming it.

## 8) Dynamic and Static IP Security

If you find that unauthor_nameized IP addresses are requesting access to the site, consider implimenting [Static IP Restrictions](https://www.iis.net/configreference/system.webserver/security/ipsecurity). Alternatively, you can also restrict [Dynamic IP Addresses](https://www.iis.net/configreference/system.webserver/security/dynamicipsecurity).

## 9) Reduce XSS Attacks

In .user.ini, use the following setting to reduce XSS attacks:

`session.cookie_httponly` = false

More information [here](http://php.net/manual/en/session.configuration.php#ini.session.cookie-httponly).

## 10) Prevent clickjacking attacks

To configure IIS to send the `X-Frame-Options` header, add this your site's `Web.config` file:

``` 
<system.webServer>
  ...
  <httpProtocol>
    <customHeaders>
      <add name="X-Frame-Options" value="SAMEORIGIN" />
    </customHeaders>
  </httpProtocol>
  ...
</system.webServer>
```

More information [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options).
