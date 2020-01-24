---
title: " Using wildfly-swarm on Azure App Service"
tags:
  - azure app service web app
  - java configuration
categories:
  - Azure App Service on Windows
  - Java
  - How-To
date: 2016-07-19 23:50:50
author_name: Prasad K.
---

This blog is for the customers who wants to use wildfly-swarm container which is the reconstitution of the popular WildFly Java Application Server. As you know you can bring your own customized version of Tomcat and Jetty containers are described in the blog - [https://azure.microsoft.com/en-us/documentation/articles/web-sites-java-custom-upload/](https://azure.microsoft.com/en-us/documentation/articles/web-sites-java-custom-upload/). 

On similar lines, you can use the wildfly-swarm by adding the following configuration in the web.config - 

[![WebConfig](/media/2016/07/WebConfig.jpg)](/media/2016/07/WebConfig.jpg) 


You can achieve same by using the site extension [Java Configurator](/2016/05/04/azure-webapps-java-configurator-site-extension/). The advantage of using the site extension is that, it uses applicationHost.xdt file instead of web.config, so that your webapp is not restarted when you make the changes and you can control the restart when desired. Also, it avoids any manual configuration errors and you can revert it anytime you want easily.