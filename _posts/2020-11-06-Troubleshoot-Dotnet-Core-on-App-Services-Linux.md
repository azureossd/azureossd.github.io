---
title: "Troubleshoot .NET Core Applications on App Services - Linux"
author_name: "Anand Anthony Francis"
tags:
    - Dotnet Core
    - Azure App Service
    - Linux
    - Troubleshooting Dotnet Core on Linux
categories:
    - Azure App Service on Linux
    - Dotnet Core on Linux #Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - .NET Core # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - How-To
    - Troubleshooting #How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/NETCoreIcon.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2020-11-06 13:00:00
---

## About

In this article we will primarily discuss on the steps we can take to investigate issues in Dotnet Core Applications running on Azure App Services - Linux. We would discuss on the following key areas:

- Application level Logging in .NET Core
- Using ASPNETCORE_ENVIRONMENT App Setting
- How to leverage dotnet-trace in App Services Linux
- Application Insights with .NET Core Applications on App Services Linux

## Application level logging in .NET Core

1. For adding custom logs in a .NET Core Application we need to use the ILogger interface of the Microsoft.Extensions.Logging namespace. For more information [refer](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/logging/?view=aspnetcore-3.1#create-logs). 
2. We can implement logging anywhere in our Application by simply adding a parameter of type <i>ILogger</i> to the constructor of our class and ASP.NET Core DI would pass the ILogger instance which can further be used to log in any of the methods in the specific class.
    ```C#
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IConfiguration Config;

        public HomeController(ILogger<HomeController> logger, IConfiguration config)
        {
            _logger = logger;
            Config = config;
        }
        ....
    ```
3. Now, in order to log any information inside any of the methods inside the class, we can just use the <i>_logger</i> field.
    ```C#
     public IActionResult handledException()
        {
            try
            {
                int i = 0;
                i = 5 / i;
            }
            catch(DivideByZeroException ex)
            {
                _logger.LogInformation("Stack Trace from Logger: " + ex.StackTrace);
            }
            return View("Index");
        }
    ```
4. In order to view the logs for your Linux App Service, make sure that the logging is enabled from the portal under the <b>App Service Logs</b> blade.
5. Once the logs are written, we can find them in the default docker log files under the directory /home/LogFiles.
![Default Docker Log](/media/2020/11/ILoggerDefaultDockerLog.PNG)

    ```Note
    Please note that adding logs using System.Diagnostics.Trace.WriteLine() would not output the logs to the standard out logs.
    ```

## Using ASPNETCORE_ENVIRONMENT App Setting

Generally, after deployment to App Services, in case the Application encounters any unhandled exceptions, we would see a default page (refer Image) -
![.NET Core Error Page](/media/2020/11/aspnetcoreError.PNG)
 and not the stack trace of the exception. In order to get the stack trace itself, we can take one of the following steps:

1. Check the default docker logs (must be enabled from the portal).
2. Add the App Setting - <b>ASPNETCORE_ENVIRONMENT</b> with value as <i>Development</i> (Not recommended for Production environments)

```Note
When running a .NET Core Application in Development mode, in case an App Setting is mentioned in the appsetting.Development.json file - the Application will start referencing the value defined in this file.
```

## How to leverage dotnet-trace in App Services Linux

The dotnet-trace tool is a cross-platform tool for .NET Core Apps and it enables the collection of .NET traces for an Application. Since it's cross-platform it can very well be leveraged for collecting traces for .NET Core Applications running on Linux App Services. 

We can leverage the tool in scenarios wherein an issue is reproducible and the tool can give the following information:

- EventCounter for basic health monitoring
- Collect traces
- Analyze CPU usage

In order to collect the trace via <i>dotnet-trace</i> command, we can take teh following steps:

1. Run the Application on the respective App Service and SSH into the Application Container using the Kudu site (appname.scm.azurewebsites.net).
2. In the Application Container use the top command to check the PID for the dotnet process running the Application.

    ![Top Command from SSH](/media/2020/11/topCommandSSH.PNG)

3. Once we have the PID for the dotnet process we should run the following command:

    ```Note
    dotnet-trace collect --process-id <PID>
    ```

4. Once the command is run, reproduce the issue for which we would want the trace to be generated. After entirely reproducing the issue, stop the trace collection by pressing CTRL + C key.

5. This would generate a <b>trace.nettrace</b> file in the directory where the command was run. Download the file on to your machine by accessing the URL: appname.scm.azurewebsites.net/vfs/(path-to-file).

    ```Example
    Let's say we ran the command in the directory /home/site/, the URL would be:
    appname.scm.azurewebsites.net/vfs/site/trace.nettrace
    ```
6. Now, we can open this file in Visual Studio itself and analyze it or use [PerfView](https://github.com/microsoft/perfview/releases/tag/P2.0.61).

**The following sources have more information on dotnet-trace and analyzing the trace.nettrace file. Also dotnet-counters can be utilized to monitor .NET Core Apps**

- [dotnet-trace](https://docs.microsoft.com/en-us/dotnet/core/diagnostics/dotnet-trace)
- [Analyze trace file](https://docs.microsoft.com/en-us/visualstudio/profiling/cpu-usage?view=vs-2019)
- [dotnet-counters](https://docs.microsoft.com/en-us/dotnet/core/diagnostics/dotnet-counters)

## Application Insights with .NET Core Applications on App Services Linux

In App Services on Linux platform the Application Insights blade is greyed out in the portal, though implementing Application Insights with .NET Core Applications is a very simple process. 

1. Add the Nuget package for Application Insights - "Microsoft.ApplicationInsights.AspNetCore" to the .NET Core project.
2. Set the Instrumentation Key of our Application Insights resource to the .NET Core App. This can be done by modifying the appsettings.json file.

    ```appsettings.json
    {
    "Logging": {
        "LogLevel": {
        "Default": "Information",
        "Microsoft": "Warning",
        "Microsoft.Hosting.Lifetime": "Information"
        }
    },
    "AllowedHosts": "*",
    "ApplicationInsights": {
        "InstrumentationKey": "<Instrumentation Key Value>"
    },
    "myappsetting": "testvaluefromappsettingjson"
    }
    ```

3. Enable Applicaiton Insights telemetry for the Applicaiton by adding the Service in ConfigureServices method of the Startup class (Startup.cs).

Deploy the Application to App Services and monitor the Application Insights resource for telemetry. Features like Application Map, Failures, Performance can be leveraged to investigate performance and availability issues for the respective .NET Core App. Also refer the following link which have information around .NET Core with Application Insights.

- [Application Insights with .NET Core Apps](https://docs.microsoft.com/en-us/azure/azure-monitor/app/asp-net-core)



