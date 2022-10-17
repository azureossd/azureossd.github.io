---
title: "Troubleshooting Common iisnode Issues"
author_name: "Aldmar Joubert"
tags:
  - logging-errors
  - remote-debug
  - troubleshoot
categories:
  - Nodejs
  - Azure App Service on Windows
  - Debugging
header:
  teaser: "/assets/images/nodejslogo.png" 
toc: true
toc_sticky: true
date: 2022-10-17 12:00:00
---

Azure provides built-in diagnostics to assist in debugging node applications hosted on Azure App Service Windows. This article will cover how to enable logging of stdout/stderr and use diagnostic tools to troubleshoot common iisnode issues.

Use caution when using troubleshooting steps on your production site. The recommendation is to troubleshoot your app on a non-production setup, for example, your staging slot and when the issue is fixed, swap your staging slot with your production slot.

# Enable Logging
## Enable logging on the platform

Azure provides built-in diagnostics to assist with debugging an App Service app. For Windows applications, you can enable application logging, web server logging, detailed error messages and failed request tracing.

![Windows Diagnostic Logging](/media/2022/08/windows-diagnostic-logging.png)

More details on the above configurations can be found here:
https://docs.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs

## Configure application level logging

You can use an **iisnode.yml** file to control several configuration options for iisnode. If not already created, the file can be placed under the **/home/site/wwwroot** directory.

We will use the issnode.yml file for:

- Allowing stdout and stderr streams from node processes to be captured and made available.  
- Configure where the files with stdout and stderr captures will be stored.
- Watch error info on the web page (not recommended for production apps).

iisnode.yml:
```yaml
loggingEnabled: true
logDirectory: /home/logfiles/iisnode
devErrorsEnabled: true
```
The **iisnode.yml** file can be created or edited within the **Kudu Debug Console**. You can access this through Advanced tools in the portal or by editing this URL to include your app name. 

<i>web-app-name.scm.azurewebsites.net/DebugConsole</i>

![Kudu Debug Console - WWWROOT Directory](/media/2022/08/kudu-debug-console.png)

## Accessing log files

The contents of the **/home/logfiles** directory can be downloaded by following: 
<i>web-app-name.scm.azurewebsites.net/api/zip/logfiles</i>

You can also access the log files through the Kudu Debug Console.
![Kudu Debug Console - LogFiles Directory](/media/2022/08/kudu-logfiles.png)

## Viewing Uncaught Exceptions

All uncaught exceptions are by default written to **logging-errors.txt** file under \home\LogFiles\Application directory.
Note, If you have updated your **iisnode.yml** file to point to a custom log directory, then **logging-errors.txt** will be found there.

## STDOUT and STDERR

The below screenshot shows how to enable application logging through the portal. This will send STDOUT and STDERR output to the **\home\logfiles\application** directory.

![App Service Portal Overview - Enable Application Logging ](/media/2022/08/enable-application-logging-iisnode.png)

**stdout**: console.log("log content") - log content will be visible in the XXX-stdout-xxx.txt file under \home\LogFiles\Application directory

**stderror**: console.error("error content") - error content will be visible in the XXX-stderr-xxx.txt file under \home\LogFiles\Application directory

![Kudu Debug Console - STDOUT / STDERR LogFiles](/media/2022/08/stdout-stderr-logs-iisnode.png)

## Using Failed request tracing in Azure Web Apps for Windows

- Click on **App Service logs** under **Monitoring** settings and Turn On Failed Request Tracing.

    ![App Service Portal Overview - Enable Failed Request Tracing](/media/2022/08/freb-logs.png)

- Another way to enable these logs is through using the Azure CLI with the following command:

  ```
  az webapp log config --name <sitename> --resource-group <resourcegroupname> --failed-request-tracing true
  ```

- After turning on Failed Request Tracing, new folders(W3SV****) containing failed request logs will be generated under __\home\LogFiles__ and can be accessed through the Kudu console. 

  Acces the Kudu debug console by following:
  <i>web-app-name.scm.azurewebsites.net/DebugConsole</i>

  ![Kudu Debug Console - view freb logs](/media/2022/08/freb-logs-W3SVC.png)

- Failed request logs can provide you with more meaningful insight into application errors. You can access the error pages within the browser for easier viewing.

  ![Kudu Debug Console - view freb logs](/media/2022/08/failed-request-log-sample.png)


# IISNODE http status and substatus

The below table is referenced from:

https://docs.microsoft.com/en-us/azure/app-service/app-service-web-nodejs-best-practices-and-troubleshoot-guide#iisnode-http-status-and-substatus

| HTTP Status | HTTP Substatus | Possible reason? |
|-------------|----------------|------------------|
| 500         | 1000           | 	There was some issue dispatching the request to IISNODE – Check if node.exe was started. Node.exe could have crashed when starting. Check your web.config configuration for errors. |
| 500         | 1001           | - Win32Error 0x2 - App is not responding to the URL. Check the URL rewrite rules or check if your express app has the correct routes defined. - Win32Error 0x6d – named pipe is busy – Node.exe is not accepting requests because the pipe is busy. Check high cpu usage. - Other errors – check if node.exe crashed. |
| 500          | 1002          | Node.exe crashed – check d:\home\LogFiles\logging-errors.txt for stack trace. |
| 500          | 1003          | Pipe configuration Issue – The named pipe configuration is incorrect. |
| 500          | 1004-1018     | 	There was some error while sending the request or processing the response to/from node.exe. Check if node.exe crashed. check d:\home\LogFiles\logging-errors.txt for stack trace. |
| 503          | 1000          | Not enough memory to allocate more named pipe connections. Check why your app is consuming so much memory. Check maxConcurrentRequestsPerProcess setting value. If it's not infinite and you have many requests, increase this value to prevent this error. |
| 503          | 1001          | Request could not be dispatched to node.exe because the application is recycling. After the application has recycled, requests should be served normally. |
| 503          | 1002          | 	Check win32 error code for actual reason – Request could not be dispatched to a node.exe. |
| 503          | 1003          | Named pipe is too Busy – Verify if node.exe is consuming excessive CPU. |

# Troubleshooting Common Issues

## You do not have permission to view this directory or page

The below output typically indicates you are missing a **web.config** file. When using the App Service Build engine, one will be generated, but if using a service like GitHub Actions, you will need to configure your own **web.config**. For more information, see:

https://docs.microsoft.com/en-us/azure/app-service/configure-language-nodejs?pivots=platform-windows#you-do-not-have-permission-to-view-this-directory-or-page

![You do not have permissions to view this directory or page](/media/2022/08/no-permissions-to-view-page-iisnode.png)

## Application code displayed on browser window

![Application code displayed on browser window - iisnode](/media/2022/08/code-displayed-in-browser-iisnode.png)

Validate which file is being displayed and check your **web.config**. In this scenario, the dynamic content rule was misconfigured in the **web.config** file, and after updating it to **/bin/www** the expected output was displayed.

![web.config re-write rule - iisnode](/media/2022/08/web-config-rewrite-iisnode.png)

## Avoid hardcoding Node Versions

With PaaS services, such as App Services, the platform underneath is managed for you - therefor over time versions(major, minor, or patch) may be upgraded, removed, or deprecated. Given this, it is best to not hardcode to a specific version within code as this may cause unintended issues down the road.

If either major, minor or patch is removed. This will throw a HTTP **500.1002**, but can show other ranges of HTTP **500.1xxx** status codes.

When creating a Node.js application, the Node version is reliant upon the value set in **WEBSITE_NODE_DEFAULT_VERSION**, which is an App Setting created by default. This is only relevant on Windows and Node.js App Services.

The reccomended method is to set the version to the latest minor of the major version found on the instance using the **tilda (~)** syntax.

**WEBSITE_NODE_DEFAULT_VERSION=~16**

Be mindful of conflicts between versions set in the **issnode.yml**, **web.config** and **WEBSITE_NODE_DEFAULT_VERSION** 

More inforamtion on this can be found here:
[Avoiding hardcoding Node versions on App Service Windows](https://azureossd.github.io/2022/06/24/Avoiding-hardcoding-Node-versions-on-App-Service-Windows/index.html#in-the-azure-portal)

# Troubleshooting 5xx Server Errors

If your application is returning a **HTTP 500 error**, the next place to look is the detailed errors within the **/home/LogFiles** directory. This will give you the **substatus code** and **win32 error code**, which can be used to help isolate the issue further. An example of the detailed error output can be observed in the next section.

![iis node 500 error](/media/2022/08/iisnode-500.png)

## HTTP Error 500.50 - URL Rewrite Module Error

![HTTP Error 500.50 - URL Rewrite Module Error](/media/2022/08/500-50-url-rewrite-error-iisnode.png)

500.50 can indicate a conflict with the **web.config**. Review your **web.config** and check:

1. There are no duplicate entries.
2. You are pointing to the correct path for your Node start file.

## HTTP Error 500.1001 - Internal Server error

As well as the detailed errors view, we will receive the below browser output if we have **dev errors enabled** within the **issnode.yml** file.

![HTTP Error 500.1001 - DevErrors enabled](/media/2022/08/dev-errors-enabled-iisnode.png)

Searching for HResult code 0x2 returns - **Win32Error 0x2** - App is not responding to the URL. Check the URL rewrite rules and if your app has the correct routes defined.

The above scenario was resolved after updating the misconfigured handlers within the **web.config**.

![HTTP Error 500.1001 - misconfigured handlers in web.config](/media/2022/08/web-config-handlers-iisnode.png)

## HTTP Error 500.1013 with code Win32ErrorCode: 0x0000006d (IISNODE_ERROR_FAILED_PROCESS_HTTP_STATUS_LINE)

This condition often indicates that the connection between **node.exe** and **iisnode** was broken in the middle of the application sending back the HTTP response. This, in turn, may result from an exception during response processing.

Reviewing your response code paths for unhandled exceptions and checking the application logs for further details will be an excellent next step.  

All uncaught exceptions are by default written to **logging-errors.txt** and can be found under **\home\logfiles\application** or the directory specified in your **iisnode.yml**.

Suppose the Nodejs process is crashing but not logging anything in the Application Logs. In that case, the application logging will need to be improved to capture the uncaught exceptions before the process crashes. 

The below recommendation should only be used for **troubleshooting purposes and as a last resort**. The correct use of **'uncaughtException'** is to perform synchronous cleanup of allocated resources (e.g. file descriptors, handles, etc.) before shutting down the process. It is not safe to resume regular operation after **'uncaughtException'** because the system becomes corrupted. 


[Using 'uncaughtException' correctly](https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly)
```JavaScript
process.on('unhandledRejection', (reason, p) => {
  console.error(reason, 'Unhandled Rejection at Promise', p);
  }).on('uncaughtException', err => { 
  console.error(err, 'Uncaught Exception thrown');
   process.exit(1);
});
```


This scenario can also occur when the application runs out of memory or has a high CPU. You can review **memory** and **CPU usage** through the [diagnose and solve problems blade](https://learn.microsoft.com/en-us/azure/app-service/overview-diagnostics). 


# Articles of Note:
- [Configure a Node.js app for Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs?pivots=platform-windows)
- [Best practices and troubleshooting guide for node applications on Azure App Service Windows](https://learn.microsoft.com/en-us/azure/app-service/app-service-web-nodejs-best-practices-and-troubleshoot-guide)
- [Easy profiling for Node.js Applications](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Local Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)