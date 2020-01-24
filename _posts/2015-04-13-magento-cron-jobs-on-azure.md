---
title: "Magento Cron Jobs to Azure Web Jobs"
tags:
  - azure
  - Magento
  - Web Apps
  - Web Jobs
categories:
  - PHP
  - Magento
date: 2015-04-13 12:23:00
author_name: Mangesh Sangapu
---

**Magento Cron Jobs**

> Crons are essential to Magento as they perform maintenance tasks and essential duties to keep your E-commerce store running.

> If you’re coming from a Linux environment, you’re probably used to Magento’s crons working out-of-the-box. Due to Azure’s enhanced, scheduling system, Magento from Azure Gallery requires Azure Web Jobs to initiate the crons.

> This article will show you just that – get your crons up and running in no time!

**Overview**  

> We’re going to create a windows batch file, compress into zip format and then upload it to the Azure Web Jobs. Once there, you can configure the schedule interval for crons. Magento recommends a 5-minute interval.

* * *

**Let’s get started!**

**Step 1. Create a new file in a text editor**

**Step 2. Create the batch script to initiate Magento’s main cron**

> Copy/paste this into your text file. Change the PHP version accordingly:
> 
> "D:\\Program Files (x86)\\PHP\v5.4\\php.exe" D:\\home\\site\\wwwroot\\cron.php cli/auto

**Step 3.** **Save the script**

> Save the file with the extension of .bat (batch file)

**Step 4. Compress the script into a zip file**

> Now compress the file into a compressed zip format

[](/media/2019/03/5430.image_5859D806.png)

> [![image](/media/2019/03/4150.image_thumb_2E5ACBCD.png "image")](/media/2019/03/5344.image_45A4DE4F.png)

**Now that the .zip file is created, we will setup a Web Job within Azure**

**Step 5. Select your Magento Instance on the Azure Portal and click on WebJobs**

> ![](/media/2019/03/1738.2015-04-13%2000_20_09-Web%20apps%20-%20Windows%20Azure%20-%20Internet%20Explorer.png)

**Step 6). Click the ADD button located at the bottom**

> ![](/media/2019/03/2677.2015-04-13%2000_20_56-Web%20apps%20-%20Windows%20Azure%20-%20Internet%20Explorer.png)

**Step 7.** **Configure the New Job and upload the zip file created from step 4**

> [](/media/2019/03/6862.image_19F41453.png)[![image](/media/2019/03/2570.image5_thumb_6FEFE679.png "image")](/media/2019/03/0820.image5_2A02E30A.png)

**8) Define a schedule**

> ![](/media/2019/03/8475.2015-04-13%2000_23_08-Web%20apps%20-%20Windows%20Azure%20-%20Internet%20Explorer.png)

**That’s it, you’re finished!**

**After completing these steps, your Magento Crons will be running per the set schedule.**

![](/media/2019/03/6076.2015-04-13%2000_23_44-Web%20apps%20-%20Windows%20Azure%20-%20Internet%20Explorer.png)

**If you’re expecting emails from Magento, be sure that you’ve setup your SMTP server. One option is to use a 3rd-party tool like Windows Live or SendGrid.**

**If you would like to provide feedback on Azure, please do so** [**here**](http://feedback.azure.com/forums/169385-web-sites)**.**