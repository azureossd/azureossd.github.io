---
title: " Custom deployment folder on Azure Web Apps with Git"
tags:
  - Azure web app
  - custom deploy
  - deploy
  - Git
  - Java
  - java configuration
categories:
  - Azure App Service on Windows
  - Java
  - Deployment
date: 2015-12-17 16:12:00
author_name: Prasad K.
---

Sometimes you don't want to deploy your application in the default webapps directory when deploying from GitHub (continuous deployment) on Azure webapp. You can do this in 2 ways -

1\. Use the SCM\_TARGET\_PATH to set your path which can be absolute or relative to the D:\\home\\site path.

    ![](/media/2019/03/1778.App%20Setting.JPG)

2\. Create two files in your git root:

### .deployment

``` {.default .prettyprint .prettyprinted}
[config] command=deploy.cmd 
```

### deploy.cmd

``` {.default .prettyprint .prettyprinted}
@echo off 

echo ---Deploying site 
REM ---Deploy the wwwroot folder in repository to default target (wwwroot)
xcopy %DEPLOYMENT_SOURCE%\wwwroot\* %DEPLOYMENT_TARGET%/Y /s 
REM ---Deploy the myapp folder in repository to folder above default target (wwwroot\..\myapp)
xcopy %DEPLOYMENT_SOURCE%\myapp\* %DEPLOYMENT_TARGET%\..\myapp /Y /s 
Commit, push
```
 

Remember if you are customizing the deployment folder also set the application folder in the Azure portal accordingly, so that Azure recognizes the custom application folder -

![](/wp-content/uploads/2019/03/5810.Application%20Directory.JPG)

 

In case you have a Java webapp and want to change the default context you can refer to my blog - [Use Custom Context for Azure Tomcat Application.](../archive/2015/12/11/use-custom-context-for-azure-tomcat-application.aspx)

Good Luck!!
