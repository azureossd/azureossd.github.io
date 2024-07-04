---
title: "WordPress Best Practices for Security"
author_name: "Christopher Maldonado"
tags:
    - azure
    - app services
    - wordpress
    - best practices
    - security
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/WordPress.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
toc: true
toc_sticky: true
date: 2021-01-28 16:00:00
---

WordPress Security Best Practices on Azure App Services (Windows/Linux)

**NOTICE** [After November 28, 2022, PHP will only be supported on App Service on Linux.](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/php_support.md#end-of-life-for-php-74)

# Best Practices

When it comes to Security, there are a few Best Practices recommended when using Azure App Services.

1.  Modifications in `wp-config.php` file:
    -   Change default `$table_prefix` from `wp_` to a unique string
    -   Utilize the encoding for Keys and Salts
    -   Disable File Editing with: `define('DISALLOW_FILE_EDIT', true);`
        -   This will remove `edit_themes`, `edit_files`, and `edit_plugins` capabilities to all users.
2.  **DO NOT** use weak passwords or usernames like: *admin*, *administrator*, *test123*, *password*, etc.
3.  Keep WordPress updated.
4.  Backup regularly
    -   Use Backups for Azure App Services.
5.  Web Server config modifications
    -   Restrict/Limit access to `wp-config.php` and `wp-login.php`
    -   Prevent clickjacking with header: `X-FRAME-OPTIONS = SAMEORIGIN`
6.  Delete `xml-rpc.php` if not used
7.  Enable Static/Dynamic IP Restrictions
8.  PHP modifications:
    -   Reduce XSS Attacks:
        -   Add `session.cookie_httponly = true` in `php.ini` or `.user.ini`
9.  Use a WordPress security plugin

## Modifications in `wp-config.php`

1. Change the `$table_prefix` from `wp_` to something unique.
    -   Example: `$table_prefix = 'mysite_';`
2. Utilize the encoding for Keys and Salts
    -   You can generate these using the following: [https://api.wordpress.org/secret-key/1.1/salt/](https://api.wordpress.org/secret-key/1.1/salt/)
3. Disable File Editing by adding `define('DISALLOW_FILE_EDIT', true);`
    -   This will remove `edit_themes`, `edit_files`, and `edit_plugins` capabilites to all users.

## Password Recommendations

It is always recommended to use a strong password for WordPress. This should include some of the following examples:

- Uppercase and lowercase characters
- Numbers
- Special haracters (@, #, *, etc.)
- A minimum of 10 characters preferred.
- Avoid using common phrases like: admin, administrator, test, password, 1234, etc.

## WordPress Updates

You can enable various levels of auto updates for WordPress by adding the following in your `wp-config.php` file.

`define('WP_AUTO_UPDATE_CORE', true);`

- When set to `true` - Development, minor, and major updates are all **enabled**.
- When set to `false` - Development, minor, and major updates are all **disabled**.
- When set to `'minor'` - Minor updates are **enabled**, development, and major updates are **disabled**.

## Backup Regularly

Follow these steps in the Azure App Service documentation for backing up your site with the Backup feature. [https://docs.microsoft.com/en-us/azure/app-service/manage-backup](https://docs.microsoft.com/en-us/azure/app-service/manage-backup)

## Web Server config

- Restrict/limit access to `wp-config.php` and `wp-login.php`
  - Nginx

    ```nginx
    location = /wp-config.php {
        deny all;
    }

    location = /wp-login.php {
        allow xxx.xxx.xxx.xxx;
        deny all;
    }
    ```

  - Apache

    ```apache
    <Files wp-config.php>
    # Apache 2.2
    Order Deny,Allow
    Deny from all

    # Apache 2.4+
    Require all denied
    </Files>

    <Files wp-login.php>
    # Apache 2.2
    Order Deny,Allow
    Deny from all
    Allow from xxx.xxx.xxx.xxx
    Allow from xxx.xxx.xxx.xxx

    # Apache 2.4+
    Require all denied
    Require ip xxx.xxx.xxx.xxx
    Require ip xxx.xxx.xxx.xxx
    </Files>
    ```

  - IIS
  
    ```xml
        <location path="wp-config.php">
            <system.webServer>
                <security>
                    <ipSecurity allowUnlisted="false" />
                </security>
            </system.webServer>
        </location>
        <location path="wp-login.php">
            <system.webServer>
                <security>
                    <ipSecurity allowUnlisted="false">
                        <add ipAddress="xxx.xxx.xxx.xxx" allowed="true" />
                    </ipSecurity>
                </security>
            </system.webServer>
        </location>
    ```

- Prevent clickjacking by adding an addditional header: `X-FRAME-OPTIONS = SAMEORIGIN`
    - Apache
        ```apache
        # Inside the apache2.conf or httpd.conf file
        Header always append X-Frame-Options SAMEORIGIN
        ```
    - IIS
        ```xml
        <system.webServer>
            <httpProtocol>
                <customHeaders>
                    <add name="X-Frame-Options" value="SAMEORIGIN" />
                </customHeaders>
            </httpProtocol>
        </system.webServer>
        ```

## Enable Static/Dynamic IP Restrictions

IP restrictions can be enabled in App Services by setting up access restrictions. More information on this can be found here: [https://docs.microsoft.com/en-us/azure/app-service/app-service-ip-restrictions](https://docs.microsoft.com/en-us/azure/app-service/app-service-ip-restrictions)

- Dynamic IP Restrictions
    - Apache
        ```apache
        # Requires libapache2-modsecurity to be installed
        # ex. apt-get install libapache2-modsecurity

        SecRuleEngine On

        <LocationMatch "^/.*">
        # initialise the state based on X-Forwarded-For ip address
        SecRule REQUEST_HEADERS:X-Forwarded-For "@unconditionalMatch" "phase:2,initcol:ip=%{MATCHED_VAR},pass,nolog,id:100"

        # if greater then burst_rate_limit then pause set RATELIMITED var and then return 509
        SecRule IP:ACCESS_COUNT "@gt {{ burst_rate_limit }}" "phase:2,deny,status:509,setenv:RATELIMITED,skip:1,nolog,id:102"

        # if above rule doesnt match increment the count
        SecAction "phase:2,setvar:IP.access_count=+1,pass,nolog,id:103"

        # set the base rate to one per second
        SecAction "phase:5,deprecatevar:IP.access_count=1/1,pass,nolog,id:104"

        # set a header when ratelimited
        Header always set Retry-After "10" env=RATELIMITED
        </LocationMatch>

        ErrorDocument 509 "Rate Limit Exceeded"
        ```
    - IIS
        ```xml
        <system.webServer>
            <security>
                <dynamicIpSecurity enableLoggingOnlyMode="true">
                    <denyByConcurrentRequests enabled="true" maxConcurrentRequests="10" />
                    <denyByRequestRate enabled="true" maxRequests="30" requestIntervalInMilliseconds="300" />
                </dynamicIpSecurity>
            </security>
        </system.webServer>
        ```

## PHP Modifications

- Reduce Cross Site Scripting (XSS) attacks:
    - Add `session.cookie_httponly = true` in the `php.ini`, `.user.ini`, or custom `.ini` file being loaded into PHP.

## WordPress security plugin

There are many different WP Security plugins out there that you could use. Using any one of them could help provide better overall security for your WordPress site compared to not having one at all. A list of some well known plugins are below:

- Wordfence Security: [https://wordpress.org/plugins/wordfence/](https://wordpress.org/plugins/wordfence/)
- All In One WP Security: [https://wordpress.org/plugins/all-in-one-wp-security-and-firewall/](https://wordpress.org/plugins/all-in-one-wp-security-and-firewall/)
- Sucuri Security: [https://wordpress.org/plugins/sucuri-scanner/](https://wordpress.org/plugins/sucuri-scanner/)

# Update for new WordPress on Linux App Service Marketplace offering (2022)

More information regarding this offering can be found here: [https://github.com/Azure/wordpress-linux-appservice](https://github.com/Azure/wordpress-linux-appservice)

## Updating Nginx headers

This will allow for updating many different headers for WordPress security. To do this, follow the steps below:

- Copy the required config file to the `/home` directory.
  ```
  cp /etc/nginx/conf.d/spec-settings.conf /home/custom-spec-settings.conf
  ```
- Edit `/home/custom-spec-settings.conf` using vi/vim editors to add custom settings.

**NOTE**: you can also upload a custom config file to `/home` directory using file manager. Navigate to file manager through this URL: `<Wordpress_App_Name>.scm.azurewebsites.net/newui/fileManager`. Upload the custom configuration file in `/home` directory (ex: `/home/custom-spec-settings.conf`)

- Edit `/home/custom-spec-settings` and at the bottom of file you can add the headers for security

    ```nginx
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;
    add_header X-Xss-Protection "1; mode=block" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security 'max-age=31536000; includeSubDomains; preload';
    add_header Referrer-Policy "strict-origin";
    add_header Permissions-Policy "geolocation=(),midi=(),sync-xhr=(),microphone=(),camera=(),magnetometer=(),gyroscope=(),fullscreen=(self)";
    ```

## Allow a different domain or sharepoint site to show the site content in an iFrame

- Copy the required config file to the `/home` directory, if not done earlier.
  ```
  cp /etc/nginx/conf.d/spec-settings.conf /home/custom-spec-settings.conf”
  ```
  This copies the spec-settings.conf into the permanent folder (/home), so that the contents of it is permanent and does not get changed every time the app is restarted. 
- Edit `/home/custom-spec-settings.conf` using vi/vim/nano editors to add/update the custom settings.
  ```
  vi /home/custom-spec-settings.conf
  ```
  This step is to add/modify the headers.
- Add the following line in custom-spec-settings.conf to allow the other domain to load the site page. 
  ```
  add_header X-Frame-Options "ALLOW-FROM domain.com";
  ```
  Here, the other domain is domain.com, it could be anything and varies from one domain to another.
- Remove the following line if it is there, otherwise please ignore. 
  ```
  add_header X-Frame-Options "SAMEORIGIN" always;
  ```
  **NOTES**: There are two possible values, with three separate use cases:

  DENY: Denies the site form being loaded in an iFrame at all. This is the recommended if iFrames are not used.

  SAMEORIGIN: Only allows (elements of) the site to be loaded on the same domain. This is recommended if you load elements of your own site in an iFrame, within the domain itself.

  If you want your site to be loaded in iFrame on a every other domain, do not set the X-Frame-Options header at all.

- Paste the below content in /home/dev/startup.sh (this file should be empty by default)
    ```nginx
    #!/bin/bash 
    echo "Copying custom specific settings over to /etc/nginx/conf.d/spec-settings.conf" 
    cp /home/custom-spec-settings.conf /etc/nginx/conf.d/spec-settings.conf
    nginx -s reload
    ```
    This script runs everytime the app is restarted and copies the changes back to /etc/nginx/conf.d/spec-settings.conf, so that changes will not be lost.

    If this file has some contents already, make sure those are not touched and add line 2 and 3 before `nginx -s reload`
- Restart the app


## Remove `phpinfo()` file

It is strongly recommended to remove any file that contains `phpinfo()`. By doing so, this will ensure that the database credentials stored as environment variables are not exposed to the public.
