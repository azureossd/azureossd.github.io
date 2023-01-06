---
title: " Running Python Webjob on Azure App Services using non-default python version"
tags:
  - pip
  - python
  - Python-Wheel
  - WebJob
categories:
  - Azure App Service on Windows
  - Python
  - WebJob
date: 2016-12-09 16:46:24
author_name: Prashanth Madi
toc: true
toc_sticky: true
---

You can run programs or scripts in WebJobs in your Azure App Service web app in three ways: on demand, continuously, or on a schedule. There is no additional cost to use WebJobs. This article shows how to run Python Webjob on Azure App Services using non-default python version. we would follow below list of steps to do this

*   Create a sample app in local
*   Create Azure WebApp and Use Site Extension to Upgrade Python
*   Add run.cmd file to change default Python version
*   Upload the app
*   Install dependencies

## Create a sample app in local

ex: **start.py**

    import sys  
    print(sys.version)  
    

## Create Azure WebApp and Use Site Extension to Upgrade Python

*   Navigate to [Azure portal](https://portal.azure.com/)
*   Create a new web app
*   Navigate to your App Service blade, select Extensions and then Add.
*   From the list of extensions, scroll down until you spot the Python logos, then choose the version you need![Site Extension](/media/2016/11/siteextensions.png)

For this blog I'm choosing `Python 3.5.2 x64`, It would install new version of python @ D:\\home\\Python35

## Add run.cmd file to change default Python version

To give little background, We use the following logic to decide which file is the script to run within the job's directory:

*   Per file type we look first for a file named: run.{file type extension} (for example run.cmd or run.exe ).
*   If it doesn't exists for all file types, we'll then look for the first file with a supported file type extension.
*   The order of file types extension used is: .cmd , .bat , .exe , .ps1 , .sh , .php , .py , .js .
*   The recommended script file to have in your job directory is: `run.cmd` .

Source: [https://github.com/projectkudu/kudu/wiki/Web-jobs](https://github.com/projectkudu/kudu/wiki/Web-jobs) In order for us to use custom python version instead of default python27, we add run.cmd file with below content in it

    D:\home\Python35\python.exe start.py  
    

you can use any other file instead of `start.py` and python version above as per your requirement.

## Upload the app

*   zip all your app content in local
*   Navigate to [Azure portal](https://portal.azure.com/)
*   Navigate to your App Service blade, select WebJobs and then Add.
*   ![Add Webjob](/media/2016/11/webjob1.PNG)
*   Provide Necessary details like type and others
*   ![Webjob details](/media/2016/11/webjob2.PNG)
*   After clicking Ok, you should see new webjob available to run
*   Below is my webjob output, where i'm printing python version used to run it![Webjob Output](/media/2016/11/webjob3.PNG)

## Install dependencies

Refer Below link for details [Install Native Python Modules on Azure Web Apps/API Apps](/2015/06/29/install-native-python-modules-on-azure-web-apps-api-apps/)