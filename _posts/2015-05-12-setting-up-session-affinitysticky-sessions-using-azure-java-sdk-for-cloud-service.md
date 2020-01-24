---
title: " Setting up Session Affinity/Sticky Sessions using Azure Java SDK for cloud service"
tags:
  - Affinity
  - ARR
  - azure
  - Java
  - SDK
  - Session
  - SSL Offloading
  - Sticky
categories:
  - Java
date: 2015-05-12 12:26:00
author_name: Prasad K.
---

To setup the Session Affinity for your cloud service using Azure Java SDK, follow these steps -

1\. Open eclipse and browse to your project.

2\. Traverse to the WorkerRole in your project and click on Properties.

[![](/media/2019/03/7444.WorkerRole%20Property.jpg)](/media/2019/03/7444.WorkerRole%20Property.jpg)

3\. Check the enable http session affinity check box.

[![](/media/2019/03/3441.Enable%20Session%20Affinity.jpg)](/media/2019/03/3441.Enable%20Session%20Affinity.jpg)

4\. Open ServiceDefinition.csdef file for your project in Text Editor and you should see text as -

[![](/media/2019/03/3718.ARR%20Endpoint.JPG)](/media/2019/03/3718.ARR%20Endpoint.JPG)

5\. Install Web Platform Installer on your eclipse machine.

6\. Copy following WebpiCmd files to your Azure .Net SDK plugin’s folder (Default directory is: C:\\Program Files\\Microsoft SDKs\\Azure\\.NET SDK\\v2.5\\bin\\plugins\\WebDeploy). It is possible that you have multiple versions of SDK present in your system, make sure you replace it in latest version. WebpiCmd files are located in the WebPI install directory (default directory is ‘C:\\Program Files\\Microsoft\\Web Platform Installer’).

*   WebpiCmd-x64.exe
*   WebpiCmd-x64.exe.config
*   Microsoft.Web.PlatformInstaller.dll
*   Microsoft.Web.PlatformInstaller.UI.dll 

7\. Browse to your eclipse cloud service deployment project from windows explorer. You should see a folder “ROLE/approot/.arrconfig”. ROLE can be WorkerRole1 or WebRole1 or a custom name you have given to your web/worker role.

8\. In the .arrconfig folder, edit ConfigureARR.bat file and comment/delete the original line and add the new line for installing ARR 3.0: 

*   Original Line: %ROLEROOT%\\plugins\\WebDeploy\\WebpiCmd.exe/Install /accepteula /Products:ARR
*   New: %ROLEROOT%\\plugins\\WebDeploy\\WebpiCmd-x64.exe/Install /accepteula /Products:ARRv3_0

9\. Save the ConfigureARR.bat file and deploy the package with overwrite selected and you should see that ARR 3.0 is now successfully installed and configured.