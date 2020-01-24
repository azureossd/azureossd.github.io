---
title: " Setting environment variable and accessing it in Java program on Azure webapp"
tags:
  - App Setting
  - Azure web app
  - Environment Variable
  - Java
  - java configuration
categories:
  - Azure App Service on Windows
  - Java
  - Tomcat
  - How-To
  - Configuration
date: 2015-10-09 12:25:00
author_name: Prasad K.
---

Sometimes, you want to set new environment variable and want to access it in your Java Program. 

You can do this by setting up the value in JAVA\_OPTS either in web.config or in webapps App Setting. 

1. In web.config - 

        <httpPlatform processPath=”%AZURE_TOMCAT7_HOME%binstartup.bat” arguments=””>
        <environmentVariables>
        <environmentVariable name=”JAVA_OPTS” value=”-DmyNewEnvVar=Wow” />
        </environmentVariables>
        </httpPlatform >

2. In App Setting - 

[![](/media/2019/03/5736.App%20Setting.JPG)](/media/2019/03/5736.App%20Setting.JPG) 

**Note**: Make sure you set the “-D” text before your variable name.

Once you add the environment variable as mentioned above, you can access it in code using the System class in Java program.

System.getProperty(“myNewEnvVar”);

 

To list multiple variables use can delimit it by a space ” “. For eg.  -DmyNewEnvVar=Wow -DmyAnotherEnvVar=Wowa

 

If you want to list all the available environment variable you can use the getProperties() method call.

**Note**: The web.config setting will override the app_setting way.

 

Also, if you want to access the existing environment variable, you can use the "-D" way to set the value in the web.config.

For eg, you want to use the %HTTP_PLATFORM_PORT% value, you can set

JAVA_OPTS="-Dhttp.port=%HTTP_PLATFORM_PORT%"

Now, using the System.getProperty("http.port"), you can access the port value for the platform.

 