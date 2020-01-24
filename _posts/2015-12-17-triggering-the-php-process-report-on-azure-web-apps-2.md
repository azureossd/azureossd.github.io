---
title: " Triggering the PHP Process Report on Azure Web Apps"
tags:
  - Azure web app
  - PHP troubleshooting
  - process report
  - troubleshooting
  - wordpress
categories:
  - Azure App Service on Windows
  - PHP
  - Debugging
  - How-To
date: 2015-12-17 16:56:00
author_name: Mangesh Sangapu
toc: true
toc_sticky: true
---

The PHP Process Report can be a vital tool in troubleshooting slowness or errors with your PHP Web Application. This article covers how to trigger the report based on a rule.

**Reference**

Apurva Joshi has a great article on Diagnostics as a Service (DaaS) for Azure Websites located here: [https://azure.microsoft.com/en-us/blog/new-updates-to-daas-diagnostics-as-a-service-for-azure-websites/](https://azure.microsoft.com/en-us/blog/new-updates-to-daas-diagnostics-as-a-service-for-azure-websites/ "https://azure.microsoft.com/en-us/blog/new-updates-to-daas-diagnostics-as-a-service-for-azure-websites/")

Details on the Azure Web Apps Support Portal can be found here by Sunitha Mutukrishna: [https://sunithamk.wordpress.com/category/azure/](https://sunithamk.wordpress.com/category/azure/ "https://sunithamk.wordpress.com/category/azure/")

  
Let’s get started!  

* * *

## DaaS Web Job

Before the Process Report can be triggered, ensure the DaaS web job is running.

1.  Browse to [http://portal.azure.com](http://portal.azure.com)
2. Select your Web App
3.  Click on WebJobs
4.  Ensure DaaS is configured to run continuously

![](/media/2019/03/webjob.png)

Figure 1. DaaS web job is enabled and running

  
  

## Support Portal

Now that the DaaS web job has been verified, let’s browse to the Support Portal and configure the alert rule.

1.  Browse to http://\<webapp name\>.scm.azurewebsites.net/support
2.  Select Mitigate

![](/media/2019/03/5824.02-supportPortal.png)

Figure 2. Mitigate area within the support portal showing the “Add new rule” button  
  

## Configuring The Alert Rule

There are multiple categories for the rule (Max Requests, Status Code, Slow Requests, Memory Private Set) which can be used. I’ll be using a **Status Code** in this example.

1.  Select Status Code
2.  Click **Add New Rule**

![](/media/2019/03/4188.03-addRule.png)

Figure 3. Status Code rule configuration

  
  
  
## Setting the Action

Once the rule has been set, click on Action to configure the process to trigger.  
  

![](/media/2019/03/1307.04-clickAction.png)

Figure 4. After Status Code rule has been set, action area needs to be configured  
  
  

1.  If not already set, the executable field should point to D:\\home\\data\\DaaS\\bin\\DaasConsole.exe
2.  Set the parameters to **–Troubleshoot “PHP Process Report” 30** as shown below
3.  Click the green Update button

  

![](/media/2019/03/1220.05-updateAction.png)

Figure 5. Action area with PHP Process Report configured

  

That’s it! You have successfully configured an Alert Rule to trigger the PHP Process Report. Please see the reference links for more information. Feel free to post comments or questions below!

…. but wait, there’s more!

  
  
## Viewing the Reports

Once a report has been executed, it can be seen within the Analyze section of the Support Portal.  

![](/media/2019/03/3603.06-analyze.png)

Figure 6. Analyze area showing the PHP Process Report

In addition to the analyze area, the reports can also be found within: **d:\\home\\data\\DaaS\\Reports\\&lt;web app name>\\**  
  

![](/media/2019/03/1881.07-reportsDirectory.png)