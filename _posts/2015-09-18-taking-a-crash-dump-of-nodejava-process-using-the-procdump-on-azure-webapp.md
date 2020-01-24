---
title: " Taking a crash dump of node/java process using the procdump on Azure WebApp"
tags:
  - Azure webapp
  - crash
  - Java
  - java troubleshooting
  - node
  - node.exe
  - node.js
  - nodejs
  - procdump
categories:
  - Azure App Service on Windows
  - Nodejs
  - Java
  - Debugging
date: 2015-09-18 10:14:00
author_name: Prasad K.
---

Azure provides built-in diagnostics to assist with debugging Web Applications hosted in Azure App Service Web Apps. In this article, you will learn how to enable procdump to further troubleshoot intermittent node/java process crash issues. 

We can analyze the process dump using Visual Studio to understand the root cause of the issue.

Please follow below list of steps to enable procdump : 

1\. Set SCM\_COMMAND\_IDLE_TIMEOUT to a high value in azure portal -> configure Tab of web app.

More info :[https://github.com/projectkudu/kudu/wiki/Configurable-settings#changing-the-timeout-before-external-commands-are-killed](https://github.com/projectkudu/kudu/wiki/Configurable-settings#changing-the-timeout-before-external-commands-are-killed)

[![](/media/2019/03/6746.crash2.JPG)](/media/2019/03/6746.crash2.JPG)

2\. Open your kudu console([https://Your\_Webapp\_name.scm.azurewebsites.net/DebugConsole).](https://your_website_name.scm.azurewebsites.net/DebugConsole)

3\. Browse to the Process Explorer Page -

[![](/media/2019/03/4810.Process%20explorer.JPG)](/media/2019/03/4810.Process%20explorer.JPG)

4\. Note down the process id for the process like node.exe or java.exe.

5\. Go to the DebugConsole by clicking on the Debug console menu option and select CMD in that.

6\. Switch Kudu console to ‘use old console’ (there is a link in there to switch)

[![](/media/2019/03/4604.crash1.JPG)](/media/2019/03/4604.crash1.JPG)

7. Change the directory to D:\\devtools\\sysinternals using the command prompt.

Run the below command -

    procdump -accepteula -ma <proc id for your process> -t D:\home\site\wwwroot\mydmp.dmp

Here the option "t" stands for terminate. So whenever, your process crashes the dump will be generated in the mydmp.dmp file.

For more options please refer - [https://technet.microsoft.com/en-us/sysinternals/dd996900.aspx](https://technet.microsoft.com/en-us/sysinternals/dd996900.aspx)

You can then download the dump file and open it using Visual studio to get more details for the root cause of the crash.