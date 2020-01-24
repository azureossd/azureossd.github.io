---
title: "Setup SMTP in Drupal 8 on Azure Webapp"
categories:
  - Azure App Service on Windows
  - Drupal
  - SMTP
  - How-To
date: 2017-10-09 14:33:51
tags:
author_name: Yi Wang
---

Example of setup SMTP in Drupal 8 using O365 SMTP server for the Drupal8 site hosted on Azure Webapp: 

1.Download smtp module 8.x-1.x-dev from [https://www.drupal.org/project/smtp/releases/8.x-1.x-dev](https://www.drupal.org/project/smtp/releases/8.x-1.x-dev) 

2.Extract "smtp-8.x-1.x-dev" and copy "smtp" folder to 

"D:\\home\\site\\wwwroot\\modules" 

3.Login as Drupal admin, find Extend -> MAIL->SMTP Authentication Support, check it and click install 

[![](/media/2017/10/drupal8smtp_1-1024x181.png)](/media/2017/10/drupal8smtp_1.png) 

4.Configure SMTP module, find Configuration -> SYSTEM -> SMTP Authentication Support 

[![](/media/2017/10/drupal8smtp_31.png)](/media/2017/10/drupal8smtp_31.png) 

[![](/media/2017/10/drupal8smtp_4.png)](/media/2017/10/drupal8smtp_4.png) 

5.Save the settings, you should see the message and notification that test email has sent 

[![](/media/2017/10/drupalsmtp_2-1024x270.png)](/media/2017/10/drupalsmtp_2.png) 

6.Verify from your email, 

[![](/media/2017/10/drupal8smtp_5.png)](/media/2017/10/drupal8smtp_5.png)