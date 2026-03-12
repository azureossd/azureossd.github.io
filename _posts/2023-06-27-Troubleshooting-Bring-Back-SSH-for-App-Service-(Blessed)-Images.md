---
title: "Troubleshooting Bring Back SSH for App Service (Blessed) Images"
author_name: "Keegan D'Souza"
tags:
    - Troubleshooting
    - Deployment
    - App Service
categories:
    - Azure App Service on Linux
    - Troubleshooting
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-06-27 12:00:00
---

## Overview 
The blog will show you how to bring back the [SSH](https://learn.microsoft.com/en-us/azure/app-service/configure-linux-open-ssh-session) feature on [App Service (Blessed) Images](https://learn.microsoft.com/en-us/azure/app-service/overview#built-in-languages-and-frameworks).
By default these commands will bring up the default parking page, as shown below, and make the SSH feature available.  

![Parking Page](/media/2023/06/azure-oss-troubleshoot-bring-up-SSH-1.png){: width="50%" height="50%"}

> This blog is not written for custom docker images running on app services. Refer to the following blogs if you are using a custom image. 
- [Enabling SSH on Linux Web App for Containers - (azureossd.github.io)](https://azureossd.github.io/2022/04/27/2022-Enabling-SSH-on-Linux-Web-App-for-Containers/index.html)
- [Configure a custom container](https://learn.microsoft.com/en-us/azure/app-service/configure-custom-container?tabs=debian&pivots=container-linux#enable-ssh)

## Commands
Navigate to your app service on the Azure Portal then click on 

***Configuration -> General Settings -> Startup Command***

![Startup Command](/media/2023/06/azure-oss-troubleshoot-bring-up-SSH-2.png){: width="50%" height="50%"}

Enter the below command dependant on your language stack and save your changes.

> Make sure to remove or replace this command when you are done troubleshooting, otherwise your app service will continue to serve the default parking page. 

### Dot Net
```
dotnet /defaulthome/hostingstart/hostingstart.dll
```
### Node
```
node /opt/startup/default-static-site.js
```

### Python
```
gunicorn application:app --timeout 600 --access-logfile '-' --error-logfile '-' -c /opt/startup/gunicorn.conf.py --chdir=/opt/defaultsite
```
### Java (SE)
```
java -jar -Dserver.port=80 /usr/local/appservice/parkingpage.jar
```
### Go
```
/opt/startup/hostingstart
```
## Reasoning and Use Cases
Sometimes deployment or startup issues can be tricky to troubleshoot on linux app services.
If your container is crashing after a deployment you will not have access to this feature. This is because the SSH process is started on the app container itself. 

![Application Error](/media/2023/06/azure-oss-troubleshoot-bring-up-SSH-5.png){: width="50%" height="50%"}
![SSH connection failure](/media/2023/06/azure-oss-troubleshoot-bring-up-SSH-3.png){: width="30%" height="30%"}

With [SSH](https://learn.microsoft.com/en-us/azure/app-service/configure-linux-open-ssh-session) working you can navigate the application containers file system to see what files are present and experiment with different startup commands to validate they are working successfully. If your container is not crashing, this feature should be working by default without modifying the startup command. 

![SSH connection success](/media/2023/06/azure-oss-troubleshoot-bring-up-SSH-4.png){: width="30%" height="30%"}

