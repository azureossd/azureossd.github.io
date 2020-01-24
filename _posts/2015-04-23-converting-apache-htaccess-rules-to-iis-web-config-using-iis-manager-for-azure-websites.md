---
title: "Converting Apache .htaccess rules to IIS web.config using IIS Manager for Azure Websites"
tags:
  - .htaccess
  - azure
  - iis
  - Web Apps
  - web.config
categories:
  - Azure App Service Web App
  - Apache
date: 2015-04-23 09:36:32
author_name: Mangesh Sangapu
---

**Web.config -** the settings and configuration file for a Windows IIS Web Application.
**.htaccess -** the default filename of the directory-level configuration file for a Linux Apache Web Application.



------------------------------------------------------------------------

**Disclaimer: *The URL Rewrite tool by IIS Manager gives you suggested web.config rules. Since it is not a one-to-one conversion, the recommendation is to test these rules in a development environment.***

------------------------------------------------------------------------

> If you’re looking to ***create rewrite rules*** for the URL Rewrite Module,please see the article [here](http://www.iis.net/learn/extensions/url-rewrite-module/creating-rewrite-rules-for-the-url-rewrite-module)

 

These screenshots were taken from [IIS Manager](http://www.iis.net/downloads/microsoft/iis-manager) 8.6.9600 and assume you have [URL Rewrite](http://www.iis.net/downloads/microsoft/url-rewrite) Installed.

To convert .htaccess rules to web.config, launch IIS Manager.

 

**Step 1. In the connections pane, select your site**

> ![](/media/2019/03/0601.2015-04-23%2010_53_34-Internet%20Information%20Services%20(IIS)%20Manager.png)
>
>  

**Step 2. Double-click on URL Rewrite**

> ![](/media/2019/03/3582.2015-04-23%2010_54_05-Internet%20Information%20Services%20(IIS)%20Manager.png)
>
>  

 

**Step 3. On the right, select “Import Rules”**

> ![](/media/2019/03/7711.2015-04-23%2010_54_38-Internet%20Information%20Services%20(IIS)%20Manager.png)
>
>  

 

 

 

 

**Step 4. Copy-paste your .htaccess file or select it under “Configuration file”**

> ![](/media/2019/03/1134.2015-04-23%2010_56_08-Internet%20Information%20Services%20(IIS)%20Manager.png)

 

 

 

**Step 5. Click the “Xml view” to view in the web.config format**

> ![](/media/2019/03/1030.2015-04-23%2010_57_15-Internet%20Information%20Services%20(IIS)%20Manager.png)

 

Now that you have the rules in web.config format, validate and verify the rules on a development server.
