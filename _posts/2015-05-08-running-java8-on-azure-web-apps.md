---
title: "Running Java8 on Azure web apps"
tags:
  - azure
  - Java
categories:
  - Java
date: 2015-05-08 09:27:00
author_name: Prashanth Madi
---

Switching to Java 8 version has got easier in new Azure Portal. Below are list of instructions

1)     Navigate to [https://ms.portal.azure.com/](https://ms.portal.azure.com/)

2)     Select your Java Web app and Click on settings

 [![](/media/2019/03/0535.1.jpg)](/media/2019/03/0535.1.jpg)

3)     Click on Application Settings in Settings bar

 [![](/media/2019/03/8400.2.png)](/media/2019/03/8400.2.png)

4)     You should see drop-down's to select different java version and web container.

 [![](/media/2019/03/8535.3.jpg)](/media/2019/03/8535.3.jpg)

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\- Below content is deprecated in favor of New Azure Portal -------------------------------------------------------

Note :  Please refer [http://azure.microsoft.com/en-us/documentation/articles/web-sites-java-custom-upload/](http://azure.microsoft.com/en-us/documentation/articles/web-sites-java-custom-upload/) for changing java version in application server.

Java 1.8 binaries are pre-installed in Azure Web apps and Below are steps to activate it

1)     Go to configure tab in your webapp

[![](/media/2019/03/0160.first.png)](/media/2019/03/0160.first.png)  
 

2)     Add following content in app settings

Key : JAVA_HOME 

Value : D:\\Program Files\\Java\\jdk1.8.0_25

[![](/media/2019/03/8814.two.jpg)](/media/2019/03/8814.two.jpg)

3)     Navigate to your website kudu console - [https://yourWebsiteName.scm.azurewebsites.net/Env](https://yourWebsiteName.scm.azurewebsites.net/Env) and check if you have below content

    JAVA_HOME = D:\Program Files\Java\jdk1.8.0_25

4)     Set java bin path in debug console

    set PATH=%PATH%;%JAVA_HOME%/bin

  
 [![](/media/2019/03/0028.three.jpg)](/media/2019/03/0028.three.jpg)

5)     Check if changes are reflected

    Java –version

 [![](/media/2019/03/3058.four.png)](/media/2019/03/3058.four.png)

Note :  Please refer [http://azure.microsoft.com/en-us/documentation/articles/web-sites-java-custom-upload/](http://azure.microsoft.com/en-us/documentation/articles/web-sites-java-custom-upload/) for changing java version in application server.

Troubleshoot :

1) You can skip setting PATH variable from step 4 above and run java directly using below command

    D:\home>"%JAVA_HOME%"\bin\java -version 

[![](/media/2019/03/1323.java_cap.JPG)](/media/2019/03/1323.java_cap.JPG)

2) If you would like to make this change at application server level, please use below config file for tomcat. You can find more details @ [https://azure.microsoft.com/en-us/documentation/articles/web-sites-java-custom-upload/](https://azure.microsoft.com/en-us/documentation/articles/web-sites-java-custom-upload/)

        <?xml version="1.0" encoding="UTF-8"?>
        <configuration>
        <system.webServer>
        <handlers>
        <add name="httpPlatformHandler" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified" />
        </handlers>
        <httpPlatform processPath="%HOME%sitewwwrootbintomcatbinstartup.bat" 
        arguments="">
        <environmentVariables>
        <environmentVariable name="CATALINA_OPTS" value="-Dport.http=%HTTP_PLATFORM_PORT%" />
        <environmentVariable name="CATALINA_HOME" value="%HOME%sitewwwrootbintomcat" />
        <environmentVariable name="JRE_HOME" value="%JAVA_HOME%" /> 
        <environmentVariable name="JAVA_OPTS" value="-Djava.net.preferIPv4Stack=true" />
        </environmentVariables>
        </httpPlatform>
        </system.webServer>
        </configuration>

    As suggested by PERTU in comments try using JAVA_HOME1 if azure overrides value set in user interface