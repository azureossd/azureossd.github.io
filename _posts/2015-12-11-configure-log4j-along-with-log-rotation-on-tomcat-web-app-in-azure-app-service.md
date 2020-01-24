---
title: " Configure log4j along with log rotation on Tomcat Web App in Azure App Service"
tags:
  - azure log rotation webapp
  - azure log4j
  - azure webapp java log4j
  - Java
  - java configuration
  - log4j tomcat webapp
  - tomcat webapp
categories:
  - Azure App Service on Windows
  - Java
  - Tomcat
  - How-To
  - Configuration
date: 2015-12-11 15:02:00
author_name: Srikanth S.
---

  On Azure App Service Web App deployed with Tomcat (from marketplace), the default logger is set to java.util.logging. If your application is setup with log4j, then you will need to make some changes for it to work. You can use log4j to rotate your logs as well upto the minute. Here is how you can achieve this: Deploy Tomcat 8 Web App from gallery/marketplace. Download these jars:

> a. tomcat-juli.jar and tomcat-juli-adapters.jar from this url: [http://archive.apache.org/dist/tomcat/tomcat-8/v8.0.28/bin/extras/](http://archive.apache.org/dist/tomcat/tomcat-8/v8.0.28/bin/extras/)

> b. Download log4j-1.2.17.zip from here: [http://www.apache.org/dyn/closer.cgi/logging/log4j/1.2.17/log4j-1.2.17.zip](http://www.apache.org/dyn/closer.cgi/logging/log4j/1.2.17/log4j-1.2.17.zip)

Unzip or extract log4j-1.2.17.jar from log4j-1.2.17.zip. Copy (replace) tomcat-juli.jar to D:\\home\\site\\wwwroot\\bin\\apache-tomcat-8.0.28\\bin folder on your Azure Web App. Copy tomcat-juli-adapters.jar and log4j-1.2.17.jar to D:\\home\\site\\wwwroot\\bin\\apache-tomcat-8.0.28\\lib folder on your Azure Web App. Add a file log4j.properties to D:\\home\\site\\wwwroot\\bin\\apache-tomcat-8.0.28\\lib folder on your Azure Web App. Sample log4j.properties file is below for your reference:  

    log4j.debug=true
     log4j.rootLogger=INFO, CATALINA, CONSOLE
     
     # Define all the appenders
     log4j.appender.CATALINA = org.apache.log4j.DailyRollingFileAppender
     log4j.appender.CATALINA.File = ${catalina.base}/logs/catalina
     log4j.appender.CATALINA.Append = true
     log4j.appender.CATALINA.Encoding = UTF-8
     # Roll-over the log once per day
     log4j.appender.CATALINA.DatePattern = '.'yyyy-MM-dd-HH-mm'.log'
     log4j.appender.CATALINA.layout = org.apache.log4j.PatternLayout
     log4j.appender.CATALINA.layout.ConversionPattern = %d [%t] %-5p %c- %m%n
     
     log4j.appender.LOCALHOST = org.apache.log4j.DailyRollingFileAppender
     log4j.appender.LOCALHOST.File = ${catalina.base}/logs/localhost
     log4j.appender.LOCALHOST.Append = true
     log4j.appender.LOCALHOST.Encoding = UTF-8
     log4j.appender.LOCALHOST.DatePattern = '.'yyyy-MM-dd-HH-mm'.log'
     log4j.appender.LOCALHOST.layout = org.apache.log4j.PatternLayout
     log4j.appender.LOCALHOST.layout.ConversionPattern = %d [%t] %-5p %c- %m%n
     
     log4j.appender.MANAGER = org.apache.log4j.DailyRollingFileAppender
     log4j.appender.MANAGER.File = ${catalina.base}/logs/manager
     log4j.appender.MANAGER.Append = true
     log4j.appender.MANAGER.Encoding = UTF-8
     log4j.appender.MANAGER.DatePattern = '.'yyyy-MM-dd-HH-mm'.log'
     log4j.appender.MANAGER.layout = org.apache.log4j.PatternLayout
     log4j.appender.MANAGER.layout.ConversionPattern = %d [%t] %-5p %c- %m%n
     
     log4j.appender.HOST-MANAGER = org.apache.log4j.DailyRollingFileAppender
     log4j.appender.HOST-MANAGER.File = ${catalina.base}/logs/host-manager
     log4j.appender.HOST-MANAGER.Append = true
     log4j.appender.HOST-MANAGER.Encoding = UTF-8
     log4j.appender.HOST-MANAGER.DatePattern = '.'yyyy-MM-dd-HH-mm'.log'
     log4j.appender.HOST-MANAGER.layout = org.apache.log4j.PatternLayout
     log4j.appender.HOST-MANAGER.layout.ConversionPattern = %d [%t] %-5p %c- %m%n
     
     log4j.appender.CONSOLE=org.apache.log4j.ConsoleAppender
     log4j.appender.CONSOLE.encoding=UTF-8
     log4j.appender.CONSOLE.layout=org.apache.log4j.PatternLayout
     log4j.appender.CONSOLE.layout.conversionPattern=%d [%t] %-5p %c - %m%n
     
     # Configure which loggers log to which appenders
     log4j.logger.org.apache.catalina.core.ContainerBase.[Catalina].[localhost]=INFO, LOCALHOST
     log4j.logger.org.apache.catalina.core.ContainerBase.[Catalina].[localhost].[/manager]= INFO, MANAGER
     log4j.logger.org.apache.catalina.core.ContainerBase.[Catalina].[localhost].[/host-manager]= INFO, HOST-MANAGER

  Stop your Web App and rename logging.properties in D:\\home\\site\\wwwroot\\bin\\apache-tomcat-8.0.28\\conf folder to logging.properties.juli Start your application and you should see the log files under D:\\home\\site\\wwwroot\\bin\\apache-tomcat-8.0.28\\logs folder which rotate every min.