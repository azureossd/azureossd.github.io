---
title: "How to change memory_limit on Wordpress Web App for Linux on Azure"
tags:
  - Azure Linux php ini
  - Azure Linux Web App
  - Azure Linux Web App PHP Settings
  - Azure memory_limit change
  - php ini change azure web apps linux
categories:
  - Azure App Service on Linux
  - PHP
  - WordPress on Linux
  - Configuration
date: 2018-09-27 12:41:37
author_name: bledwards1
header:
    teaser: /assets/images/phplogo.svg
---

Do you need to edit the memory\_limit and post\_max_size PHP settingson your Linux Web App hosted with MS Azure? I can show you how to do this without needing to install anything via SSH (which by the way is not recommended. Read up on why [here](https://blogs.msdn.microsoft.com/waws/2017/09/08/things-you-should-know-web-apps-and-linux/#InstallGone)). 

**Step 1: Login to the portal and go to the "Advanced Tools" section and go to the SSH option.** 

**Step 2: Copy these entries and place them in the .htaccess file located at /home/site/wwwroot/ using your preferred method. I prefer to use vi.** 

php\_value memory\_limit 256M 
php\_value post\_max\_size 256M 
php\_value upload\_max\_filesize 128M 

**Step 3: Save the file using vi to add these entries into the .htaccess file. It should look something like this once you are done:** 

[![](/media/2018/09/SSH-Htaccess-Entry-500x238.png)](/media/2018/09/SSH-Htaccess-Entry.png) 

**Step 4: Confirm they have been set by creating a phpinfo.php file and make sure the settings are correct. Or, you can check in the Wordpress Media Upload tool:** 

[![](/media/2018/09/Wordpress-Upload-Dialog-500x105.png)](/media/2018/09/Wordpress-Upload-Dialog.png) 

You can see that these settings have now been updated and no need to make a custom Docker image just to edit a few PHP variables.   Let me know what other interesting settings work in our .htaccess files in the comments below!