---
title: "Custom Tomcat Configuration on Azure App Service Linux"
author_name: "Kendrick Dubuisson"
tags:
    - Java
    - Tomcat
    - Linux
categories:
    - Azure App Service on Linux
    - Java
    - How-To
    - Troubleshooting
header:
    teaser: "/assets/images/javalinux.png" 
toc: true
toc_sticky: true
date: 2022-05-20 00:00:00
---

The pre-built images for Tomcat on App Service Linux include the default Catalina Base located in /usr/local/tomcat. By design, any changes made outside of /home will not be persistent after restarts. So, if making changes to the Tomcat server, this would need to be done with a [startup script](https://docs.microsoft.com/en-us/azure/app-service/configure-language-java?pivots=platform-linux#shared-server-level-resources-1) or moving our entire Catalina base within /home, which is covered in this article.

 >![Java Perfomance](/media/2022/05/javalinuxtomcat-1.png)

> 📝 When changing the Catalina Base, this installation is no longer maintained nor in sync with the App Service Platform if changes occur around the default configuration, path mappings or environment variables.
> If minimal changes are required we recommend using a [startup script](https://docs.microsoft.com/en-us/azure/app-service/configure-language-java?pivots=platform-linux#shared-server-level-resources-1) 


**See below to learn more about Persistent Storage or Leveraging startup scripts to modify Tomcat:**
>
> **Persistent Share Storage:** [https://docs.microsoft.com/en-us/azure/app-service/configure-custom-container?pivots=container-linux#use-persistent-shared-storage](https://docs.microsoft.com/en-us/azure/app-service/configure-custom-container?pivots=container-linux#use-persistent-shared-storage)
> 
> **Java Startup Scripts:** [https://docs.microsoft.com/en-us/azure/app-service/configure-language-java?pivots=platform-linux#shared-server-level-resources-1](https://docs.microsoft.com/en-us/azure/app-service/configure-language-java?pivots=platform-linux#shared-server-level-resources-1)

## Custom Tomcat Configuration
The Java Tomcat image includes built-in logic during startup to update the Catalina base if `/home/tomcat/conf/server.xml` is detected on the filesystem. Once moved this will allows for complete control over the Tomcat installation & which will also be persistent between restarts. 

1. Navigate to SSH via Kudu i.e `https://<sitename>.scm.azurewebsites.net/webssh/host`

2. Run the command to copy the existing tomcat contents from /usr/local/ to /home/ 
```bash
cp -R /usr/local/tomcat/ /home/tomcat
```

3. Restart the container & validate the $CATALINA_BASE from SSH or check the default parking page.
```bash
echo $CATALINA_BASE
```
 >![Java Perfomance](/media/2022/05/javalinuxtomcat-2.png)

4. Walk through the default configuration & make any necessary changes to your installation. 