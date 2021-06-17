---
title: "Run WordPress in subfolder or Virtual Directory on Azure App Service"
author_name: "Anand Anthony Francis"
tags:
    - WordPress
    - subdirectory
    - Virtual Directory
categories:
    - Azure App Service on Windows # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - PHP # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - WordPress # Django, Spring Boot, CodeIgnitor, ExpressJS
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplogo.svg" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2020-07-24 13:00:00
---

## About

This post specifically mentions the steps we can take to configure and run a WordPress application in subfolders as well in virtual directories. In addition to this, how we can use subdomains to point to WordPress applications running in different subfolders or virtual directories in the same Azure App Service.

Scenario:

| Application Folder | Default App Service domain | Custom Domain |
|----|----|----|
|/wwwroot|appservicename.azurewebsites.net|base.yourcustomdomain.com|
|/wpinvirtualdir|appservicename.azurewebsites.net/wpinvirtaldir|virtdir.yourcustomdomain.com|
|/wwwroot/subfolder|appservicename.azurewebsites.net/subfolder|subfolder.yourcustomdomain.com|

## First Step - Add a subfolder in D:/home/site/wwwroot

1. The default folder in App Services is the wwwroot folder under D:/home/site/wwwroot, wherein an application is generally deployed. Now, in case we want to run another instance of WordPress inside a folder in wwwroot, create a folder for eg., subfolder in D:/home/site/wwwroot
2. In the subfolder, deploy a WordPress Application (**make sure you do not copy the same app as in wwwroot, which could be an issue if the WP_HOME and WP_SITEURL**) which is configured correctly to it's database.
3. The most important thing to take into consideration once the WordPress application has been setup inside the sub folder, is to check WP_HOME and WP_SITEURL configurations.
4. In case the above two configurations are in the database, it can be viewed in the wp_options table (please refer screenshot). The other way we can configure these settings is in the wp-config.php file.

   ![wp_options Table](/media/2020/07/anfranci-wp_options.PNG)

    ```wp-config.php
    define('WP_HOME','http://anandwpcheck.azurewebsites.net/subfolder');
    define('WP_SITEURL','http://anandwpcheck.azurewebsites.net/subfolder');
    ```

5. As we can see that the domain name is followed by the subfolder name **'/subfolder'**.

## Second Step - Bind the WordPress applications with a custom domain

1. In the first step we have deployed and configured a WordPress app in a subfolder under wwwroot (D:/home/site/wwwroot). Though, currently it is configured to run with the subfolder in the domain name. For example, the root application can be accessed via the URL -  **appservicename.azurewebsites.net** and the application under subfolder can be accessed over - **appservicename.azurewebsites.net/subfolder**.
2. Sometimes, it is required that we access both the Applications over different domain names. For example, the root application on - **base.yourcustomdomain.com** and the subfolder specific application over **subfolder.yourcustomdomain.com**
3. For configuring the subdomain to point to the site, we would need a domain name which has a CNAME mapping to our Azure App Service. More in detail about configuring and mapping a domain name can be found in this [article](https://docs.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain).
4. In our case, both the subdomains would be mapped to the same App Service. The important configuration that does the trick is URL rewrite in the web.config under the wwwroot folder. Following is an example of the rules to be configured in the web.config.

    ```web.config
    <?xml version="1.0" encoding="UTF-8"?>
    <configuration>
    <system.webServer>
        <rewrite>
        <rules>
                <!--This rule matches the sub domain subfolder.domain.com and redirects to the sub folder /subfolder-->
                <rule name="redirect to subfolder.yourcustomdomain.com" stopProcessing="true">
                <match url=".*" />
                    <conditions>
                    <add input="{HTTP_HOST}" pattern="^subfolder.yourcustomdomain.com$" />
                    <add input="{PATH_INFO}" pattern="^/subfolder/" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="\subfolder\{R:0}" />
                </rule>
                <!--This is the default rule for redirecting request to WordPress app in /wwwroot-->
                <rule name="WordPress: https://abc.azurewebsites.net" patternSyntax="Wildcard">
                    <match url="*"/>
                        <conditions>
                            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true"/>
                            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true"/>
                        </conditions>
                    <action type="Rewrite" url="index.php"/>
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
    </configuration>
    ```

5. Another point that should be taken into consideration is that now, the WP_HOME & WP_SITEURL should be configured with the domain name.

```wp-config.php
define('WP_HOME','http://subfolder.yourcustomdomain.com/');
define('WP_SITEURL','http://subfolder.yourcustomdomain.com/');
```

*Note: The above settings once set in wp-config.php, the application does not take into reference the settings in the database. Though, if we remove or comment these settings the WP_HOME & WP_SITEURL configured in the database are referred.*

## Add a WordPress Application to a folder outside wwwroot.

1. In addition to the above method of running two WordPress applications in nested folders, we can also configure a WordPress application outside wwwroot i.e., under D:/home/site/.
2. Create a folder in the D:/home/site directory and add your WordPress application to this folder.
3. In the Azure Portal, under the *Configuration* blade, there is a tab - 'Path Mappings', here we can add the folder created in step 1 as a virtual Directory. (refer image)
   ![virtual directory](/media/2020/07/anfranci-virtdir.PNG)

4. On adding the virtual directory in the Configuration blade, we can access the WordPress app using the default domain in a similar way we did for the app in the sub folder - 'appservicename.azurewebsites.net/wpinvirtaldir'.
5. For configuring a subdomain for the Application in the Virtual Directory, we just need to add another rule in our web.config in wwwroot.

   ```web.config
    <?xml version="1.0" encoding="UTF-8"?>
    <configuration>
    <system.webServer>
        <rewrite>
        <rules>
                <!--This rule matches the sub domain subfolder.domain.com and redirects to the sub folder /subfolder-->
                <rule name="redirect to subfolder.yourcustomdomain.com" stopProcessing="true">
                <match url=".*" />
                    <conditions>
                    <add input="{HTTP_HOST}" pattern="^subfolder.yourcustomdomain.com$" />
                    <add input="{PATH_INFO}" pattern="^/subfolder/" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="\subfolder\{R:0}" />
                </rule>
                <rule name="redirect to sub.anandanthonyfrancislinux.in" stopProcessing="true">
                 <match url=".*" />
                    <conditions>
                    <add input="{HTTP_HOST}" pattern="^virtdir.anandanthonyfrancislinux.in$" />
                    <add input="{PATH_INFO}" pattern="^/virtdir/" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="\virtdir\{R:0}" />
                </rule>
                <!--This is the default rule for redirecting request to WordPress app in /wwwroot-->
                <rule name="WordPress: https://abc.azurewebsites.net" patternSyntax="Wildcard">
                    <match url="*"/>
                        <conditions>
                            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true"/>
                            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true"/>
                        </conditions>
                    <action type="Rewrite" url="index.php"/>
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
    </configuration>
    ```

6. Again, please make sure to update the WP_HOME & WP_SITEURL in the wp-config.php file to take into consideration the subdomain configured for the virtual directory.

```wp-config.php
define('WP_HOME','http://subfolder.yourcustomdomain.com/');
define('WP_SITEURL','http://subfolder.yourcustomdomain.com/');
```

Hope that the above steps help in quickly setting up WordPress application in sub folders inside the same Azure App Service on Windows.

```Note
App Services specifically gives us a platform to deploy our applications. A more manageable way for multiple WordPress applications would be to run in different App Services. This does not incur any additional cost since we pay for an App Service Plan(ASP) and not for the App Services running in the App Service Plan.
```
