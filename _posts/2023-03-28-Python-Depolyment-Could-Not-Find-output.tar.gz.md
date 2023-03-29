---
title: "Python Deployment - Could not find output.tar.gz"
author_name: "Keegan D'Souza"
tags:
    - Python
    - Deployment
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/pylinux.png"  # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-03-28 12:00:00
---

This post will cover troubleshooting a specific deployment startup message for python app services on Linux.

# Overview
When deploying your python application to a linux app service, you may encounter the below error message on startup.

~~~
    _____                               
   /  _  \ __________ _________   ____  
 /  /_\  \\___   /  |  \_  __ \_/ __ \ 
/    |    \/    /|  |  /|  | \/\  ___/ 
\____|__  /_____ \____/ |__|    \___  >
         \/      \/                  \/ 
A P P   S E R V I C E   O N   L I N U X

Documentation: http://aka.ms/webapp-linux
Python 3.9.16
Note: Any data outside '/home' is not persisted
Starting OpenBSD Secure Shell server: sshd.
Command Line not configured, will attempt auto-detect
Starting periodic command scheduler: cron.
Launching oryx with: create-script -appPath /home/site/wwwroot -output /opt/startup/startup.sh -virtualEnvName antenv -defaultApp /opt/defaultsite
Found build manifest file at '/home/site/wwwroot/oryx-manifest.toml'. Deserializing it...
Build Operation ID: |MhrvOK2skdE=.25fa9d03_
Oryx Version: 0.2.20230103.1, Commit: df89ea1db9625a86ba583272ce002847c18f94fe, ReleaseTagName: 20230103.1
Output is compressed. Extracting it...
panic: Could not find file '/home/site/wwwroot/output.tar.gz'.
 
goroutine 1 [running]:
common.ExtractTarball({0xc0000184e0, 0x20}, {0xc00001c2a0, 0x14})
 	/usr/local/go/src/common/compressionHelper.go:29 +0x354
 main.(*PythonStartupScriptGenerator).GenerateEntrypointScript(0xc0000bbbd8)
 	/go/src/python/scriptgenerator.go:62 +0x2a9
 main.main()
 	/go/src/python/main.go:89 +0x9e5
 chmod: cannot access '/opt/startup/startup.sh': No such file or directory
 /opt/startup/init_container.sh: line 87: /opt/startup/startup.sh: No such file or directory
~~~


# Explanation
On app service startup, if your application is built with our oryx build system our python images look for the following file named *output.tar.gz*. If a *oryx-manifest.toml* file exists and the *output.tar.gz* file is not found the app service will throw the above exception on startup. 

More information here: [Python Build Changes](https://github.com/Azure-App-Service/KuduLite/wiki/Python-Build-Changes)

# Common Scenarios / Fixes

## Intermittent Behavior
You may notice this error *intermittantly* if you are deploying mulitple times, in conjuction with an app service restart operation. 

If you are in the deployment phase of your project. The easiest way to fix this is stop your app service and fully to wait for your deployment operation to complete successfully, then restart your app service. 

If you notice this happens during deployment to your production site, try a restart of the app service.

## Consistent Behavior
It is very rare to have this specific error message occur more that once. However if you do notice this within your [App Service Log Files](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#access-log-files), it likely means either the *output.tar.gz* file does not exist. 

Please try stopping your app service and redeploying, then validate if the file exists under */home/site/wwwroot*. You can do this by accessing the [New Kudu Advanced Tools Site](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/new-kudu-ui-for-app-service-on-linux-preview/ba-p/3212270), then use the *BASH* console. 

If this file does not exist make sure you have the below app setting enabled. 

~~~
SCM_DO_BUILD_DURING_DEPLOYMENT=TRUE
~~~ 

Then validate that your deployment went through successfully, if it is failing during the [oryx](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md) build stage, the file will not be generated. 

You will need to investigate why it is failing during the build stage. You can find more helpful information regarding troubleshooting various deployment failures using the links belows.

- [Configure a LInux Python app for Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-language-python)
- [Azure OSS Developer Support - Python](https://azureossd.github.io/python/)
- [Oryx Runtimes - Python](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md)

