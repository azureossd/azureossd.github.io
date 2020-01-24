---
title: " Accessing the Tomcat manager console on Azure Java webapp"
tags:
  - apache
  - azure
  - deploy
  - Java
  - java configuration
  - manager
  - tomcat
  - webapp
categories:
  - Azure App Service on Windows
  - Java
  - Tomcat
  - How-To
  - Configuration
date: 2015-09-18 11:28:53
author_name: Prasad K.
---

If we want to manage different applications deployed on Tomcat server, we will require to setup the access to Tomcat admin console. This can be done if you are using the Marketplace Tomcat server or if you are uploading your custom version of Tomcat server. To check how can you use Marketplace tomcat and custom Tomcat version follow the links -

[http://azure.microsoft.com/en-us/marketplace/partner](http://azure.microsoft.com/en-us/marketplace/partners/microsoft/apachetomcat7/)[rs/microsoft/apachetomcat7/](http://azure.microsoft.com/en-us/marketplace/partners/microsoft/apachetomcat7/)

<https://azure.microsoft.com/en-us/documentation/articles/web-sites-java-custom-upload/#application-configuration-examples>

 

To setup the Tomcat admin or manager console on Azure Java webapp, follow these settings -

1\. Open the Kudu console using the "scm" text azure the webapp name. For eg https://sitename.scm.azurewebsites.net.

2\. Using the Debug Console -\> CMD prompt, browse to the Tomcat's conf folder. Generally, it will be like D:\\home\\site\\wwwroot\\bin\\apache-tomcat-7.0.52\\conf.

3\. Open the tomcat-users.xml file using the Pencil sign underlined in the figure.

![](/media/2019/03/7167.conf.JPG)

4\. Edit the tomcat-users.xml file to setup the role for manager and add user for it.]

[![users](/media/2015/09/users.jpg)

5\. So, now you can access the manager-gui using the username/password as tomcat/tomcat.]

6\. Browse to the manager guid by adding "/manager" to your website URL. For eg http://sitename.azurewebsites.net/manager

7\. It will prompt you for username and password. Just enter tomcat for both, you should see the admin screen like below -

![](/media/2019/03/8156.Admin.JPG)

So, using this manager console, you can start/stop/deploy/undeploy applications. Basically, you can get complete control of the application that you have deployed. 

If you are deploying a huge war file using this method, you may get following exception -

\*         The server encountered an internal error () that prevented it from fulfilling this request.*

\*         Exception java.lang.IllegalStateException: org.apache.tomcat.util.http.fileupload.FileUploadBase\$SizeLimitExceededException*

To resolve this, please modify the web.xml under the manager application "manager/WEB-INF/web.xml" to increase the max file size

*\<multipart-config\>*

\*       \<!– 50MB max –\>*

\*       \<max-file-size\>**52428800**\</max-file-size\>*

\*      \<max-request-size\>**52428800**\</max-request-size\>*

\*      \<file-size-threshold\>0\</file-size-threshold\>*

\*     \</multipart-config\>*


