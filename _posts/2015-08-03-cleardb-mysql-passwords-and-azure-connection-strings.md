---
title: " ClearDB (MySQL) Passwords and Azure Connection Strings - Deprecated"
tags:
  - ClearDB Troubleshooting
categories:
  - Azure App Service Web App
  - ClearDB
date: 2015-08-03 16:19:37
author_name: Mangesh Sangapu
---

Many Open Source Web Applications on Azure make use of the ClearDB MySQL databases. 

This article will cover how to reset your ClearDB Database Password, including updating the connection string within Azure so existing processes such as database backups will continue to function. 

  -----------------------------------------------------------
  **\*Note\*** 
  
  If you reset your database password, you will also have to update existing applications that are relying on this connection information. 

E.g: WordPress, Drupal, Joomla, etc.

 

**Changing your ClearDB Password**

The ClearDB subscription is linked to Azure accounts through the “Linked Resources” tab.

**1) Linked Resources**

> Click the ‘'”Linked Resources” Tab and select the database name

> ![](/media/2019/03/0572.01_linked_resources.png)

**2) Endpoint Information**

> Click the Endpoint Information Tab

> Click Reset to update the password

> ![](/media/2019/03/8171.02_cleardb_reset.png)

 

**3) Password Prompt**

> Click OK to generate new password.

> ![](/media/2019/03/4452.02a_reset_prompt.png)

 

 

Now that the ClearDB password is updated, we will update your “Connection String” in the Azure Portal so your database backups and other site extensions (such as PHPMyAdmin) will work properly.

**Updating Azure Connection Strings**

**1) Connection Strings**

> In Azure Portal - Configuration Tab, scroll to “Connection Strings” area
>
> Click “Show Connection Strings”

> ![](/media/2019/03/1220.03_connection_strings.png)

**2) Copy Connection Strings**

> Copy this string into your clipboard

 

> ![](/media/2019/03/2548.04_connect_strings_update.png)

**3) Update Connection String**

> Paste into a text-editor
>
> Update the password

> ![](/media/2019/03/7651.05__connection_string_notepad.png)

**4) Restore Connection String**

> Once you have your string updated, paste it back into the portal

> ![](/media/2019/03/2548.04_connect_strings_update.png)

**5) Save Settings**

> Click the save icon

> ![](/media/2019/03/2465.05a_save_settings.png)

 

 

**Update Application-specific Configuration**

> In this example, we’ll look at WordPress Database Configuration.

> In the file, wp-config.php, update ‘DB\_PASSWORD’ to the newly generated password:

> ![](/media/2019/03/3288.06_wordpress_password.png)
