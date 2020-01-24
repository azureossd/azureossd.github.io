---
title: " Debug Node.js Web Apps on Azure"
tags:
  - logging-errors
  - /media
  - remote-debug
  - troubleshoot
categories:
  - Nodejs
  - Azure App Service on Windows
  - Debugging
date: 2015-08-19 11:20:00
---

Azure provides built-in diagnostics to assist with debugging Node.js applications hosted in Azure App Service Web Apps. In this article, you will learn how to enable logging of stdout and stderr, display error information in the browser, and how to get heap and CPU profiles.

Diagnostics for Node.js applications hosted on Azure is provided by IISNode. While this article discusses the most common settings for gathering diagnostics information, it does not provide a complete reference for working with IISNode. For more information on working with IISNode, see the IISNode Readme on GitHub.

**Finding Error Info:**

If you are receiving a 500 error on your node.js webapp, Here are few things which you can try to get more info

1) Watch error info on web page (not recommended for production app)

  Include below line of code in iisnode.yml file at webapp root folder(D:\\home\\site\\wwwroot).

    devErrorsEnabled: true

  After including above line, restart your web app and You would start seeing something like below on web browser.

    iisnode encountered an error when processing the request.  HRESULT: 0x6d HTTP status: 500 HTTP subStatus: 1013 HTTP reason: Internal Server Error

2) Using Failed request tracing in azure webapps 

*   Select your web app in Azure portal([https://ms.portal.azure.com/](https://ms.portal.azure.com/)).
*   Click on Diagnostic logs in webapp settings and Turn On Failed Request Tracing in Diagnostic Logs Tab.

 [![](/wp-content/uploads/2019/03/1362.failed_request.JPG)](/wp-content/uploads/2019/03/1362.failed_request.JPG)

*   After turning on Failed Request Tracing, Access your error page in browser. This would create new folders(W3SV****) containing failed request logs @ D:\\home\\LogFiles\ in kudu console([https://Your\_Website\_name.scm.azurewebsites.net/DebugConsole).](https://Your_Website_name.scm.azurewebsites.net/DebugConsole)
*   Failed request logs would provide you more meaningful info about application error. Below is a sample screenshot

[![](/wp-content/uploads/2019/03/5415.freb_logs.JPG)](/wp-content/uploads/2019/03/5415.freb_logs.JPG)

**Useful Logs :**

To Troubleshoot above issue, below logs may help you

\- Uncaught Exception: All uncaught exceptions are by default written to logging-errors.txt file in D:\\home\\LogFiles\\Application folder. You can view them using kudu console([https://Your\_Webapp\_name.scm.azurewebsites.net/DebugConsole).](https://Your_Website_name.scm.azurewebsites.net/DebugConsole)

 [![](/wp-content/uploads/2019/03/4721.unhandled_exception.JPG)](/wp-content/uploads/2019/03/4721.unhandled_exception.JPG)

\- stdout and stderror:

stdout : console.log("log content")  -  log content would be visible in  XXX-stdout-xxx.txt file @ D:\\home\\LogFiles\\Application folder

stderror: console.error("error content") - error content would be visible in XXX-stderr-xxx.txt file @ D:\\home\\LogFiles\\Application folder

[![](/wp-content/uploads/2019/03/8304.stdout_stderror.JPG)](/wp-content/uploads/2019/03/8304.stdout_stderror.JPG)

You can turn-on these stdout and stderr using below two ways

1) Using iisnode.yml file : Include below line of code in iisnode.yml file at webapp root folder(D:\\home\\site\\wwwroot).

    loggingEnabled: true

2) Using Azure Portal :

*   Select your web app in Azure portal([https://ms.portal.azure.com/](https://ms.portal.azure.com/)).
*   Click on Diagnostic logs in settings option and Turn On Application logging in Diagnostic Logs Tab.

[![](/wp-content/uploads/2019/03/8233.application_log.JPG)](/wp-content/uploads/2019/03/8233.application_log.JPG)

**Remote debug :**

**Below content explains how to remotely debug your Node.js application deployed on Azure Web Apps using the node-inspector debugger.**

**1) Enter below line of code in iisnode.yml file at webapp root folder(D:\\home\\site\\wwwroot).**

    debuggingEnabled: true

**2) Check if your web.config file has below rule, else Include it.**

    <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">  <match url="^server.js\/debug[\/]?" /> </rule>

**3) Navigate to [http://yourapp.azurewebsites.net/server.js/debug](http://yourapp.azurewebsites.net/server.js/debug)_._****_This should bring up the familiar node-inspector interface for your application, which allows you to set breakpoints, inspect code, etc_**

**[![](/wp-content/uploads/2019/03/5826.node_inspector.png)](/wp-content/uploads/2019/03/5826.node_inspector.png)**

**For Advanced configuration on using custom debug url, please refer [http://tomasz.janczuk.org/2013/07/debug-/media-applications-in-windows.html](http://tomasz.janczuk.org/2013/07/debug-/media-applications-in-windows.html)**

**More Debug Info:**

**1) Enter below line of code in iisnode.yml file at webapp root folder(D:\\home\\site\\wwwroot)**.

    debugHeaderEnabled: true

After making above change you would see a url in each response header as in below screen shot. It would provide us insights into state of node.js application.

[![](/wp-content/uploads/2019/03/2548.debug_header.JPG)](/wp-content/uploads/2019/03/2548.debug_header.JPG)

Sample Url : [http://bit.ly/NsU2nd#iisnode\_ver=0.2.19&node=node.exe&dns=RD000D3A7037D6&worker\_pid=6056&node\_pid=2556&worker\_mem\_ws=9676&worker\_mem\_pagefile=31928&node\_mem\_ws=29872&node\_mem\_pagefile=29372&app\_processes=1&process\_active\_req=1&app\_active\_req=1&worker\_total\_req=21&np\_retry=0&req\_time=221&hresult=0](http://bit.ly/NsU2nd#iisnode_ver=0.2.19&node=node.exe&dns=RD000D3A7037D6&worker_pid=6056&node_pid=2556&worker_mem_ws=9676&worker_mem_pagefile=31928&node_mem_ws=29872&node_mem_pagefile=29372&app_processes=1&process_active_req=1&app_active_req=1&worker_total_req=21&np_retry=0&req_time=221&hresult=0)

Please find more details @ [http://tomasz.janczuk.org/2012/11/diagnose-/media-apps-hosted-in-iis-with.html](http://tomasz.janczuk.org/2012/11/diagnose-/media-apps-hosted-in-iis-with.html)