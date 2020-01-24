---
title: " Troubleshooting PHPMyAdmin Site Extension"
tags:
  - Azure web app
  - mysql
  - php extension
  - PHP troubleshooting
  - PHPMyAdmin
  - WAWS
  - Web Apps
categories:
  - PHP
  - MySQL
  - phpmyadmin
  - Azure App Service on Windows
date: 2015-07-20 10:44:30
author_name: Mangesh Sangapu
---

If you recently started having trouble (HTTP 500) with PHPMyAdmin (PMA) SiteExtension, it may be a problem with sessions. The errors look like this:

|**Browser**|**Screenshot of Error**|**Text Description**|
|----|----|----|
|Chrome|![](/media/2019/03/8015.02-chrome500.png)|The page cannot be displayed because an internal server error has occurred.
|Internet Explorer|![](/media/2019/03/8345.01-ie500.png)|The website cannot display the page This error (HTTP 500 Internal Server Error) means that the website you are visiting had a server problem which prevented the webpage from displaying. For more information about HTTP errors, see Help.|

We can force PMA to use files as session handler. To do this, follow these steps:   

**1\. Launch Kudu Console (&lt;site>.scm.azurewebsites.net)** 

**2\. Under Debug Console, select CMD, then click SiteExtensions**

> ![](/media/2019/03/1663.03-DebugCMD.png)

**3\. Click phpmyadmin**

> ![](/media/2019/03/7750.04-PMA.png)

**4\. Click libraries**

> ![](/media/2019/03/0310.05-Libraries.png)

**5\. Once here, expand the list area by clicking the down arrow**

> ![](/media/2019/03/5824.06-expand.png)

**6\. Scroll down and find session.inc.php, open it by clicking the pencil icon**

> ![](/media/2019/03/2538.07-session.png)

**7\. Search (ctrl-f) for save_handler**

> ![](/media/2019/03/2845.08-savehandler.png)

**8\. From the beginning of the line, remove the // characters**

> ![](/media/2019/03/2766.09-uncomment.png) So this should now read:
> 
> ini\_set(‘session.save\_handler’, ‘files’);
> 
> _Notice the // characters have been removed._

**9\. Click save**

> ![](/media/2019/03/1121.10-save.png)

10\. Now startup PMA !