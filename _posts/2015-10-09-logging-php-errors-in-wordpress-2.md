---
title: " Enable WordPress Error Logs"
tags:
  - azure app service web app
  - error-logs
  - local cache
  - PHP troubleshooting
  - phpinfo
  - timezone
  - wordpress
categories:
  - Azure App Service on Windows
  - PHP
  - WordPress
  - Debugging
date: 2015-10-09 21:43:30
author_name: Mangesh Sangapu
---

Logs can help identify slowness, HTTP 500 Fatal Errors,  **WordPress "white screen of death"** and other issues your Azure App Service Web App may be experiencing. To enable error logging in WordPress, you will have to make **both** of the following changes.

* * *

#### ** Quick Instructions**

 

**.user.ini**

Within wwwroot directory, create a file named .user.ini Add the following setting within your file:

`log_errors=on`

**wp-config.php**

Within wwwroot directory, open wp-config.php Add the following settings BEFORE the line /* That's all, stop editing! ... . */ :

`//Enable WP_DEBUG mode define('WP_DEBUG', true);`

`//Enable Debug Logging to /wp-content/debug.log define('WP_DEBUG_LOG', true);`

`//Supress errors and warnings to screen define('WP_DEBUG_DISPLAY', false);`

`//Supress PHP errors to screen ini_set('display_errors', 0);`

* * *

 

### **Step-by-Step instructions**

The .user.ini and wp-config.php files can be updated using either Kudu console or FTP Client (such as FileZilla).

Instructions for Kudu are below:

#### **Step 1. Browse to Kudu**

In your favorite Microsoft browser, surf to http://"sitename".scm.azurewebsites.net.

Ex: if your Azure App Service Web App name is "example", then surf to http://example.scm.azurewebsite.net

Once there, you will see the interface below:

[![step1](/media/2015/10/step1.png)](/media/2015/10/step1.png)

#### **Click 'Debug Console' and select 'CMD'**

[![step2](/media/2015/10/step2.png)](/media/2015/10/step2.png)

#### **Step 2. Traverse to wwwroot folder**

[![step3](/media/2015/10/step3.png)](/media/2015/10/step3.png)

[![step4](/media/2015/10/step4.png)](/media/2015/10/step4.png)

#### **Step 3. Create .user.ini file**

If .user.ini already exists, skip to step 4, otherwise create the .user.ini file

[![step4a](/media/2015/10/step4a.png)](/media/2015/10/step4a.png)

`touch .user.ini`

#### **Step 4. Update the .user.ini file**

[![step5](/media/2015/10/step5.png)](/media/2015/10/step5.png)

[![step6](/media/2015/10/step6.png)](/media/2015/10/step6.png)

`log_errors=on`

#### ** Step 5. For WordPress, update wp-config.php**

[![step7](/media/2015/10/step7.png)](/media/2015/10/step7.png)

[![step8](/media/2015/10/step8.png)](/media/2015/10/step8.png)

[![step9](/media/2015/10/step9.png)](/media/2015/10/step9.png)

Save the file:

 [![step6a9a](/media/2015/10/step6a9a.png)](/media/2015/10/step6a9a.png)

* * *

### **Q & A**

**1\. There are errors in my application, where do I find the error logs?**

First, ensure that logging is enabled for PHP in .user.ini as mentioned above in (1). Second, if you are searching for WordPress logs, verify step (2) is complete.

By default, PHP Errors are located at d:\\home\\LogFiles\\php_errors.log and WordPress Debug Log is located at d:\\home\\site\\wwwroot\\wp-content\\debug.log

**2\. I have local cache enabled - what happened to my logs?**

If you have local cache enabled, check the d:\\home\\LogFiles\\xxxxx_timestamp folders.

**3\. I want to capture all logs in one file, not two - what should I do?**

WordPress stores errors logs within the wp-content folder.

To integrate these messages into d:\\home\\LogFiles\\php_errors.log, edit **d:\\home\\site\\wwwroot\\wp-includes\\load.php** and comment the following line:

`ini_set ('error_log', WP_CONTENT_DIR . '/debug.Log' );`

The updated code should look like this:

[![load_php](/media/2015/10/load_php.png)](/media/2015/10/load_php.png)

Once this change has been made, all subsequent WordPress logs will be saved at the default error_log location.

**4\. How do I verify my error log location?**

Create a .php file (example: myinfo.php) within the wwwroot directory and place the following code:

    <?php phpinfo();

After you've saved the file, browse to

http://sitename.azurewebsites.net/myinfo.php

To find the location, search the page for "error_log".

Once the path has been located, remember to delete the myinfo.php file so others won't have access to your environment configuration.

**5\. I want my local timezone in the logs - how do I update this?**

[Click here for a list of Time Zones.](http://php.net/manual/en/timezones.php "PHP Time Zones")

Within .user.ini file, add the time zone relevant to your app:

date.timezone = "US/Central"

For WordPress logs, update the Time Zone through the WordPress admin interface. Click "settings" and then "general". Select the proper Time Zone within the drop down:

[![wordpress_timezone](/media/2015/10/wordpress_timezone.png)](/media/2015/10/wordpress_timezone.png)

Save your changes.