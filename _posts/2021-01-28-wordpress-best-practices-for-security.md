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

## Best Practices

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
5.  Web Server config modifications (**IIS** and **Apache**)
    -   Restrict access to `wp-config.php`
    -   Limit access to `wp-config.php`
    -   Prevent clickjacking with header: `X-FRAME-OPTIONS = SAMEORIGIN`
6.  Delete `xml-rpc.php` if not used
7.  Enable Static/Dynamic IP Restrictions
8.  PHP modifications:
    -   Reduce XSS Attacks:
        -   Add `session.cookie_httponly = true` in `php.ini` or `.user.ini`
9.  Use a WordPress security plugin

### Modifications in `wp-config.php`

1. Change the `$table_prefix` from `wp_` to something unique.
    -   Example: `$table_prefix = 'mysite_';`
2. Utilize the encoding for Keys and Salts
    -   You can generate these using the following: [https://api.wordpress.org/secret-key/1.1/salt/](https://api.wordpress.org/secret-key/1.1/salt/)
3. Disable File Editing by adding `define('DISALLOW_FILE_EDIT', true);`
    -   This will remove `edit_themes`, `edit_files`, and `edit_plugins` capabilites to all users.

### WordPress Updates

You can enable various levels of auto updates for WordPress by adding the following in your `wp-config.php` file.

`define('WP_AUTO_UPDATE_CORE', true);`

- When set to `true` - Development, minor, and major updates are all **enabled**.
- When set to `false` - Development, minor, and major updates are all **disabled**.
- When set to `'minor'` - Minor updates are **enabled**, development, and major updates are **disabled**.

### Backup Regularly

Follow these steps in the Azure App Service documentation for backing up your site with the Backup feature. [https://docs.microsoft.com/en-us/azure/app-service/manage-backup](https://docs.microsoft.com/en-us/azure/app-service/manage-backup)

### Web Server config

- Restrict access to `wp-config.php`
    - Apache:
        ```apache
        <Files wp-config.php>
        # Apache 2.2
        Order Deny,Allow
        Deny from all

        # Apache 2.4+
        Require all denied
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
        ```
- Limit access to `wp-login.php`
    - Apache
        ```apache
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

### Enable Static/Dynamic IP Restrictions

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

### PHP Modifications

- Reduce Cross Site Scripting (XSS) attacks:
    - Add `session.cookie_httponly = true` in the `php.ini`, `.user.ini`, or custom `.ini` file being loaded into PHP.

### WordPress security plugin

There are many different WP Security plugins out there that you could use. Using any one of them could help provide better overall security for your WordPress site compared to not having one at all. A list of some well known plugins are below:

- Wordfence Security: [https://wordpress.org/plugins/wordfence/](https://wordpress.org/plugins/wordfence/)
- All In One WP Security: [https://wordpress.org/plugins/all-in-one-wp-security-and-firewall/](https://wordpress.org/plugins/all-in-one-wp-security-and-firewall/)
- Sucuri Security: [https://wordpress.org/plugins/sucuri-scanner/](https://wordpress.org/plugins/sucuri-scanner/)
