---
title: " How to identify/review PHP errors on Azure Web Apps using Log Stream service"
tags:
  - error-logs
  - LogStream
  - PHP
categories:
  - Azure App Service Web App
  - PHP
  - Debugging
date: 2016-09-28 13:22:59
author_name: Edison
---

If you are getting **internal server errors (HTTP error 500)** trying to request your PHP application inside Azure Web Apps,

![http 500 internal server error](/media/2016/09/140.png)

You can do the following:

1. Create **.user.ini** file and set **log\_errors = on** to check if there a php error related, following this reference from step 1 to 4: [Login PHP errors](/2015/10/09/logging-php-errors-in-wordpress-2/)

2. But sometimes there are not php errors related, could be related to configuration, auth permissions, cache, file issues, etc. In this situation you can use **Log stream** feature inside your web app.  To use this feature you need to activate Diagnostics Logs on azure portal for your web app. You can follow this reference for more information: [Enable Diagnostics Logs in Azure Web Apps](https://azure.microsoft.com/en-us/documentation/articles/web-sites-enable-diagnostic-log)

![Diagnostics Logs](/media/2016/09/233.png)

Then go to **Log stream** and **Start** this service. Just remember that this service will be logging all requests to the current web app.

![Activate LogStream](/media/2016/09/325.png)

Try to request again the web app that is throwing the HTTP 500 error and you will get a better detail of what is failing in your site.

![Get error in Log Stream](/media/2016/09/422.png)

In this example. My web app is having some access issues with web.config, probably the web app doesn't have any web.config or the correct permissions to access this file.

You can clear the log stream service and check the error. In this case my web app didn't have any correct configuration in web.config file.
![Clear Log stream](/media/2016/09/517.png)
 

I fixed the problem and I was able to request successfully the php application.

![web app is working now](/media/2016/09/616.png)

You can request again web app after you fix the problem and you will start getting 200 successful requests.

![Requesting again Log stream](/media/2016/09/710.png)

You can run this service from Kudu Console or your command prompt using cURL using the following command:

    curl -u {username} https://{YOURWEBAPPNAME}.scm.azurewebsites.net/logstream

Or using Powershell or CLI following these references:

-   [Diagnostics Log Stream in Kudu Console](https://github.com/projectkudu/kudu/wiki/Diagnostic-Log-Stream#using-logstream)
-   [Streaming with Azure PowerShell or Command-Line Interface](https://azure.microsoft.com/en-us/documentation/articles/web-sites-enable-diagnostic-log/#streamlogs)

For example if you are using CLI:

    azure site log tail {yourwebapp}

![azure cli and log stream](/media/2016/09/86.png)

If you get another internal server error:

![internal server error](/media/2016/09/105.png)

You can activate the error filter in CLI using this command:

    azure site log tail {yourwebapp} --filter Error

In this case my web.config was not well-formed XML and I was able to detect and fix the issue.
![CLI Filter error](/media/2016/09/97.png)

Usually PHP fatal errors could map to internal server error,s but not all HTTP 500 error map to PHP error, take a look on php error log for more details on this.

I hope this can help you to identify php errors. This service is useful for all applications inside Azure Web App.
