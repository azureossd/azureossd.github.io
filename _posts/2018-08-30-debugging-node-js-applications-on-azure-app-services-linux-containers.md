---
title: "Debugging Node.js applications on Azure App Services Linux/containers"
categories:
  - Azure App Service on Linux
  - Nodejs
  - Debugging
date: 2018-08-30 03:50:42
tags:
author_name: krvillia
header:
    teaser: /assets/images/nodelinux.png
---

  This is the continuation of the earlier post where I had explained how to enable logging for node applications on [App Service Windows](/2018/08/03/debugging-node-js-apps-on-azure-app-services/).  In this blog, you will learn how to debug the node.js applications that are hosted on Azure App Service Linux / Azure webapp for containers. Enabling logs on linux offerings of AppService is fairly easier and pretty straight forward when compared to Windows. **Enable Logging on Linux**

*   Navigate to your webapp from the azure portal

*   Choose the Diagnostic Logs blade. Here we have only one option to enable logs which is docker container logs unlike in Windows, where we have the storage option as well. As of today, we do not have the option of storing the logs to blob storage in App Service Linux.
*   Choose File System, specify the retention period of your choice. This will delete the logs that are older than specified number of days

[![clip_image001](/media/2018/08/clip_image001_thumb3.jpg "clip_image001")](/media/2018/08/clip_image0013.jpg) 

*   This will gather all the **STDOUT** and **STDERR** logs of the container into **/home/LogFiles** folder
*   Once you have configured using above step, you will be able to access these log files by following the steps below

1.    Go to your file system by browsing [https://{webapp_name}.scm.azurewebsites.net](https://%7bwebapp_name%7d.scm.azurewebsites.net) url (called as kudu site)
2.    Click on **Debug Console –>** **Bash**. If it is app service Linux, you can alternatively choose **SSH** option
3.    Please note that **SSH** works only for App Service Linux. But for Webapp Containers, you would need to configure it by following the official documentation [here](https://docs.microsoft.com/en-us/azure/app-service/containers/app-service-linux-ssh-support)
4.    Navigate to the **LogFiles** folder by running the command “**cd LogFiles**”
5.    Now run the command “**ls -lrt**” to list all the log files with the latest one in the bottom. The **stderr** and **stdout** logs are stored in the file that ends with **default_docker.log** as shown below

[![clip_image002](/media/2018/08/clip_image002_thumb7.jpg "clip_image002")](/media/2018/08/clip_image0029.jpg)

*   You can view this by running the command **cat <filename>**. If your application has any **stdout/stderr** configured, it will be seen in this log file.

[![clip_image003](/media/2018/08/clip_image003_thumb4.jpg "clip_image003")](/media/2018/08/clip_image0034.jpg)

*   You can also download it using **FTP** and steps to follow are specified [here](https://blogs.msdn.microsoft.com/kaushal/2014/08/01/microsoft-azure-web-site-connect-to-your-site-via-ftp-and-uploaddownload-files/)
*   If you are only looking for the **_latest docker logs_**, the quickest way is to go to Kudu console and click on **Current Docker Logs** option as shown below. However, this will only give the information related to the container, but not the **stdout/stderr** logs.

[![clip_image004](/media/2018/08/clip_image004_thumb10.jpg "clip_image004")](/media/2018/08/clip_image00410.jpg)

*   Once you click on this link, you will be redirected to a new page with all the details related to the latest docker logs

[![clip_image005](/media/2018/08/clip_image005_thumb2.jpg "clip_image005")](/media/2018/08/clip_image0052.jpg)

*   Now, copy paste the link that is highlighted into the new tab and you should see the output as below

[![clip_image006](/media/2018/08/clip_image006_thumb7-1.jpg "clip_image006")](/media/2018/08/clip_image0068.jpg)