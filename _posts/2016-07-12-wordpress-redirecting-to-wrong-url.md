---
title: " WordPress: Redirecting to wrong URL!!"
tags:
  - custom domain
  - redirect
  - redirection
  - url
  - wordpress
categories:
  - Azure App Service Web App
  - WordPress
  - How-To
  - Configuration
date: 2016-07-12 14:57:55
author_name: Mangesh Sangapu
toc: true
toc_sticky: true
---

### Problem:

While trying to browse to http://www.example.com, it keeps redirecting to http://example.azurewebsites.net!!  

### Redirection Scenarios

There are a couple situations where one may face the WordPress Redirection issue:

*   Migrated from another host
*   Changed your custom domain name and it's going to your old domain!

 

### **Understanding The Issue**

This redirection can occur for two reasons:

1.  URL settings on the database. There are two fields named SITEURL and HOME within the wp_options table that control the URL redirects.
2.  Defined constants in wp-config.php

[![2016-07-12 16_47_49-Start](/media/2016/07/2016-07-12-16_47_49-Start.png)](/media/2016/07/2016-07-12-16_47_49-Start.png)

_MySQL Workbench showing URL settings from wp_options table_

[![2017-02-13-08_45_52-diagnostic-console](/media/2016/07/2017-02-13-08_45_52-Diagnostic-Console.png)](/media/2016/07/2017-02-13-08_45_52-Diagnostic-Console.png)

Wp-config.php showing defined constants affecting URL Redirection. To update these URLs, follow (C).

* * *

### **Stopping The Redirection (and taking control of the site)**

Not everyone is comfortable with making updates on a database so there are _**several **_options given below.   Here are a _**few**_ methods to fix this issue:

#### A) Recommended Method Through WordPress Admin

1. Login to WordPress Admin

2. Click on Settings -> General

  ![01 - General](/media/2016/07/01-General.png)

3. Find the WordPress Address (URL) and Site Address (URL) fields:

  ![03 - Update URL](/media/2016/07/03-Update-URL.png)

4. Update it to your new URL as shown:

  [![04 - Updated URL](/media/2016/07/04-Updated-URL.png)](/media/2016/07/03-Update-URL.png)

5. Save Changes

  ![05 - Save Changes](/media/2016/07/05-Save-Changes.png)

* * *

#### B) If you no longer have access to WordPress admin, set the site in "Relocate" mode within wp-config.php

1. Edit wp-config.php

2. Before the comment line "That's all, stop editing!", insert a new line: define('RELOCATE', true);

  [![2016-07-13 11_20_57-Diagnostic Console - Internet Explorer](/media/2016/07/2016-07-13-11_20_57-Diagnostic-Console-Internet-Explorer.png)](/media/2016/07/2016-07-13-11_20_57-Diagnostic-Console-Internet-Explorer.png)

3. Save wp-config.php file

4. In your browser, open wp-login.php on  your new site. Example: For the domain, http://www.mysite.com, the URL would be: http://www.mysite.com/wp-login.php

5. Login

6. Verify the address bar is correct

7. In WordPress Admin, go to Settings -> General

  [![01 - General](/media/2016/07/01-General.png)](/media/2016/07/01-General.png)

8. Verify WordPress Address (URL) and Site Address (URL) are correct

  [![04 - Updated URL](/media/2016/07/04-Updated-URL.png)](/media/2016/07/04-Updated-URL.png)

9. Save changes

10. Go back to wp-config.php

11. Remove the define from step #2.

* * *

#### C) If you are unable to log into WordPress Admin, define new settings within wp-config.php

Note: This will hardcode the URLs and they will be disabled through the WordPress Admin -> Settings -> General Area. Because of this reason, it is not recommended.

define('WP_HOME','[http://example.com'](http://example.com%27/));
define('WP_SITEURL','[http://example.com'](http://example.com%27/));

* * *

#### D) Manually update the HOME and SITEURL through a client like MySQL Workbench or PHPMyAdmin

Apply the following two queries to your WP_OPTIONS table:

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**UPDATE **wp_options

**SET** option_value='http://www.newaddress.com'

**WHERE** option_name = 'home'

**LIMIT** 1;

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**UPDATE** wp_options

**SET** option_value='http://www.newaddress.com'

**WHERE** option_name = 'siteurl'

**LIMIT** 1;

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

* * *

Reference: [https://codex.wordpress.org/Changing\_The\_Site_URL ](https://codex.wordpress.org/Changing_The_Site_URL)