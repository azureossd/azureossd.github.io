---
title: "Tomcat HTTP 404's on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Java
    - Tomcat
    - Configuration
    - Linux
categories:
    - Azure App Service on Linux
    - Java
    - Troubleshooting
    - Linux
header:
    teaser: /assets/images/javalinux.png
toc: true
toc_sticky: true
date: 2024-12-20 12:00:00
---

This post will go over general troubleshooting for HTTP 404's when using Java on App Service Linux with .war-based applications, which uses Tomcat.

# Overview
> **NOTE**: The below mostly applies to Tomcat/.war-based applications. Java SE applications would not ideally need to worry about the below type of deployment behavior since only a singular standalone `.jar` can be deployed to an application as a "Java SE" runtime. If 404s are seen, start from the **Resource not found/no endpoint mapping** section and then move to **Application errors** below.

HTTP 404's with Tomcat-based applications (and potentially other embedded web servers when using a `.jar`) have a particular meaning, in the sense, aside from simply a specific resource missing on an endpoint (eg. resource not found), it can also include these other possibilities:
- A `.war` was attempted to be deployed but the application context is not running, was never unpacked, or was never deployed successfully by Tomcat
- An application error has occurred

For application errors - the HTTP 404 occurs may occur there is no default error page resource mapping in Tomcat. This can be a bit misleading.

If a 404 is seen, regardless of the above scenario, this means that **Tomcat is running** - but this might fall into one of the 3 issues above.

On newer versions of Java/Tomcat runtimes, you'll see this "blue" 404 page:

![App Service Tomcat 404 - New blue page](/media/2024/12/tomcat-404-1.png)

Other versions of this may look like this - which is the "White label 404" page from Spring Boot, which can be deployed as a `.war`:

![Spring Boot 404 page](/media/2024/12/tomcat-404-2.png)

On older versions of Tomcat offerings with App Service, you may see the "classic" Tomcat 404 page:

![Classic Tomcat 404 page](/media/2024/12/tomcat-404-3.png)

## Prerequisites
Ensure [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) are enabled for your App Service application.

Without these logs enabled, runtime troubleshooting will make it much harder or almost impossible to diagnose problems.

You can view/retrieve these logs directly from the Kudu site or FTP. You can also go to **Diagnose and Solve Problems** -> **Application Logs** on the App Service to view logging, as well as using the Logstream option.

# Issues
## Deployments
For a dive into deployment behavior with Tomcat on App Service Linux, also look at [Tomcat deployments on App Service - War file location, behavior and troubleshooting](https://azureossd.github.io/2023/08/02/Tomcat-deployments-on-App-Service/index.html)

On App Service Linux with Tomcat, and all other languages, deployments are handled by placing site contents to `/home/site/wwwroot` - but ultimately all deployments under the hood are deployed to `/usr/local/tomcat/webapps/[CONTEXT]`. This behavior is specific to these Tomcat images - however, be aware that placing `.war's` under `/usr/local/tomcat/webapps/[CONTEXT]` is classic/typical Tomcat behavior.

> **NOTE**: If a `.war` isn't deployed yet, `/usr/local/tomcat/webapps` will be empty

_OneDeploy_ refers to the deployment type used when using something such as `az webapp deploy` or the [Maven Plugin](https://learn.microsoft.com/en-us/azure/app-service/quickstart-java?tabs=springboot&pivots=java-tomcat#3---configure-the-maven-plugin)

- If 404s are seen after deployments, confirm the:
  - Deployment method (OneDeploy, Zipdeploy, WarDeploy, etc.)
  - If the `.war` is actually under `wwwroot`. Is it deployed directly to `/home/site/wwwroot/app.war` (such as through OneDeploy or `/home/site/wwwroot/[somewar.war]` with ZipDeploy), or, deployed under `/home/site/wwwroot/webapps/[CONTEXT_NAME/` (WarDeploy).
      - `.wars` deployed to `/home/site/wwwroot/webapps/[CONTEXT]` should be "exploded" (unpacked) under this directory. If they're not, or there is no content, this may be causing the problem
  - Confirm if multiple wars (contexts) are attempting to be done directly under `wwwroot` with OneDeploy (which is not doable - they'd have to use ZipDeploy or another method). When using OneDeploy, by default/design, this one deploys a single `.war` and would replace others.
  - Confirm if site contents is unpacked under `/usr/local/tomcat/webapps/[CONTEXT]` - note, if Tomcat is showing a message in Catalina logs that it can't deploy the war, then it's expected nothing is going to be there. However, if there is no error about unpacking the `.war`, double check this directory. If site contents _does_ exist here - then it's a different issue.

The above points should help narrow down what is or isn't the issue in terms of deployment. In short, a succesfull deployment in any deployment case should have the `.war` unpacked under `/usr/local/tomcat/webapps/[CONTEXT]` - regardless if using OneDeploy methods (which deploy to `/home/site/wwwroot/app.war`, or `somewar.war` if using ZipDeploy) or other methods that may deploy to `/home/site/wwwroot/webapps/[CONTEXT]`

You can confirm if the `.war` was deployed or not by viewing the `catalina.log` file in `/home/LogFiles/Application`. An example of Tomcat deploying the war is below:

```
09-Dec-2024 15:21:13.564 INFO [main] org.apache.catalina.startup.HostConfig.deployWAR Deployment of web application archive [/usr/local/tomcat/webapps/ROOT.war] has finished in [47,826] ms
```

If deploying to a non-ROOT context, and has nothing deployed as `ROOT.war` (under a `ROOT` context) - the root path would return a HTTP 404 - which in that case is expected. 

> When using OneDeploy, this always automatically renames the `.war` to `app.war` and would always deploy to the `ROOT` context ("/") by default.

For **ZipDeploy** based deployments, a typical file structure would look like the below - if any additional `.wars` are deployed - it'll be deployed under `wwwroot/nameofwar.war` and be unpacked under this directory in `/usr/local/tomcat/webapps/[context]`. This is important to understand in case the application **doesn't** have a `.war` or context named `ROOT` - in which a HTTP 404 is expected in this

![ZipDeploy filesystem structure](/media/2024/12/tomcat-404-4.png)

For **One Deploy** all `.war`s by default are renamed to `app.war` directly under `wwwroot`. This implcitly will be deployed as `ROOT.war` under `/usr/local/tomcat/webapps`. 

![OneDeploy filesystem structure](/media/2024/12/tomcat-404-5.png)

**FTP**: Avoid deployments using FTP. This can cause file locking - and thus HTTP 404's. Also, if this is not deployed to the correct directory structure - this is another possible reason for this. This was the original motivation behind the [WarDeploy API](https://github.com/projectkudu/kudu/wiki/Deploying-WAR-files-using-wardeploy#how-does-wardeploy-work)

**File types**: Do not attempt to deploy a **.jar** and expect this to run as an application under Tomcat. Especially if this has an embedded web server. Tomcat (external Tomcat) needs to have a `.war` file deployed.

### Mixing deployment types
Some people may switch between Zip Deploy and OneDeploy (and/or WarDeploy or FTP). This may cause the below file structure where you have a mix of both. To avoid unintended behavior - delete the folder/file structure **not** being used to avoid potential HTTP 404's. Below is an example where both `webapps` and an `app.war` exist together:

![Mixed file system structure](/media/2024/12/tomcat-404-6.png)


### Spring Boot - 404's with Tomcat and Java incompatibility with certain versions
> **NOTE**: This can ideally apply to `.war`s that are not framework based too.

If the `.war` deployment is successful - confirm the Java and Tomcat version. For instance, if you try to deploy a Spring Boot application to Tomcat 10.x - you **must** be using Spring Boot 3 - see [Spring Boot - System Requirements](https://docs.spring.io/spring-boot/system-requirements.html). If you're using versions of Spring Boot that do not support Java 17 and above and/or Tomcat 10 - when this is deployed as a `.war`, this will simply return an HTTP 404 from Tomcat. There may be logging about a successful `.war` deployment in `catalina.log`, but there will be no other output.

Below is an example indicating Tomcat successfully deploying a Spring Boot `.war` - but when viewing the site, it's returning a 404 still:

```
20-Dec-2024 16:45:41.457 INFO [main] org.apache.catalina.core.AprLifecycleListener.lifecycleEvent The Apache Tomcat Native library which allows using OpenSSL was not found on the java.library.path: [/usr/java/packages/lib:/usr/lib64:/lib64:/lib:/usr/lib]
20-Dec-2024 16:45:41.934 INFO [main] org.apache.coyote.AbstractProtocol.init Initializing ProtocolHandler ["http-nio-127.0.0.1-80"]
20-Dec-2024 16:45:41.986 INFO [main] org.apache.coyote.AbstractProtocol.init Initializing ProtocolHandler ["http-nio-169.254.129.4-8080"]
20-Dec-2024 16:45:41.989 INFO [main] org.apache.catalina.startup.Catalina.load Server initialization in [927] milliseconds
20-Dec-2024 16:45:42.048 INFO [main] org.apache.catalina.core.StandardService.startInternal Starting service [Catalina]
20-Dec-2024 16:45:42.049 INFO [main] org.apache.catalina.core.StandardEngine.startInternal Starting Servlet engine: [Apache Tomcat/10.1.28]
20-Dec-2024 16:45:42.064 INFO [main] org.apache.catalina.startup.HostConfig.deployDirectory Deploying web application directory [/usr/local/tomcat/webapps/ROOT]
20-Dec-2024 16:45:44.435 INFO [main] com.microsoft.azure.appservice.logging.AppServiceLogger.info Log clean up task initializing. Log expiry period = 7 days
20-Dec-2024 16:45:44.442 INFO [main] com.microsoft.azure.appservice.logging.AppServiceLogger.info Log clean up task initialization succeeded
20-Dec-2024 16:45:44.444 INFO [pool-1-thread-1] com.microsoft.azure.appservice.logging.AppServiceLogger.info Log clean up task starting
20-Dec-2024 16:45:44.445 INFO [pool-1-thread-1] com.microsoft.azure.appservice.logging.AppServiceLogger.info Computing Tomcat log files list
20-Dec-2024 16:45:44.450 INFO [pool-1-thread-1] com.microsoft.azure.appservice.logging.AppServiceLogger.info Cleaning up stale log files in directory: /home/LogFiles/Application
20-Dec-2024 16:45:44.460 INFO [pool-1-thread-1] com.microsoft.azure.appservice.logging.AppServiceLogger.info Cleaning up stale log files in directory: /home/LogFiles/http/RawLogs
20-Dec-2024 16:45:44.471 INFO [pool-1-thread-1] com.microsoft.azure.appservice.logging.AppServiceLogger.info Log clean up task succeeded
20-Dec-2024 16:45:44.565 INFO [main] org.apache.jasper.servlet.TldScanner.scanJars At least one JAR was scanned for TLDs yet contained no TLDs. Enable debug logging for this logger for a complete list of JARs that were scanned but no TLDs were found in them. Skipping unneeded JARs during scanning can improve startup time and JSP compilation time.
20-Dec-2024 16:45:48.753 INFO [main] org.apache.catalina.startup.HostConfig.deployDirectory Deployment of web application directory [/usr/local/tomcat/webapps/ROOT] has finished in [6,688] ms
20-Dec-2024 16:45:48.757 INFO [main] org.apache.coyote.AbstractProtocol.start Starting ProtocolHandler ["http-nio-127.0.0.1-80"]
20-Dec-2024 16:45:48.771 INFO [main] org.apache.coyote.AbstractProtocol.start Starting ProtocolHandler ["http-nio-169.254.129.4-8080"]
20-Dec-2024 16:45:48.778 INFO [main] org.apache.catalina.startup.Catalina.start Server startup in [6787] milliseconds
```

In this case we can see Tomcat **is running** - and is why it can return a 404 to a user. But the `.war` (application) logic is not being invoked. You could further reaffirm that due to the lack of Spring Boot startup output typically found in these applications

In these kinds of cases - where there is no further logging from the application in `localhost.log`, `default_docker.log`, or custom log files - this can more commonly be related to users who upgrade/deploy versions of their application that simply do not work with higher versions of Tomcat (or Java). More exclusively related to Tomcat 10, because:
- Certain frameworks may require a higher Java version (eg. 17+)
- Tomcat 10 has a namespace change from `javax` to `jakarta` API's
- Certain frameworks/application logic may generally be incompatible with newer Tomcat versions or only up to a specific version

## Application errors
As discussed earlier - 404's can be returned through Tomcat - even if the issue is completely related to an application error. Since this is at runtime - and Tomcat is still running - think of this as a HTTP 500 rather than a 404. This can confuse people - but as mentioned, this would be due to no error page mapping by default. This in itself shouldn't be focused on.

If we see 404's start occurring from an application - and **deployment** is not a problem, always ensure the following:
- App Service Logs are enabled when the issue is occurring
- Gather any/all custom log files and `default_docker.log` / `catalina.log` / `localhost.log` and review the output in these.
- Set a finer logging level or better logging if needed and reproduce the issue

Application errors can happen for an infinite number of reasons. This is why it's important to have application logging set and captured.

This can also happen for compile time -> build time errors. For example, if you change an application built with Java 21 to use Java 11, you'll see this:

```
java.lang.UnsupportedClassVersionError: org/springframework/web/SpringServletContainerInitializer has been compiled by a more recent version of the Java Runtime (class file version 61.0), this version of the Java Runtime only recognizes class file versions up to 55.0 (unable to load class [org.springframework.web.SpringServletContainerInitializer])
```

Other examples of this are:
- `NoSuchMethodError`, `NoClassDefFound`, `class compiled against different version`, and other codebase/runtime errors or exceptions, or dependency related issues

This would be one of any number of reasons to produce a 404 from Tomcat. 

For other blogs on these kinds of errors, see [Java on App Service Linux - java.lang.NoSuchMethod exceptions](https://azureossd.github.io/2024/07/03/Java-on-App-Service-Linux-java-lang-NoSuchMethod-exceptions/index.html) and [Java on App Service Linux - PKIX path building failed](https://azureossd.github.io/2024/08/05/Java-on-Linux-App-Service-PKIX-path-building-failed/index.html)

## Resource not found/no endpoint mapping
The more obvious one is simply the endpoint is not mapped to something that can return a response. Either a `.html` page on the server or some type of `JSON` response, for example. As a safe and easy bet - always ensure the endpoint requested actually exists. If the 404 is on "/" - review the **Deployments** section above to see the differences in `.war` deployment that may contribute to this.