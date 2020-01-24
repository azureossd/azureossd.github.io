---
title: " Debug Django Web Application in Azure Web Apps"
tags:
  - APIAPP
  - azure
  - error-logs
  - python
  - troubleshoot
  - WAWS
  - Web Apps
categories:
  - Python
  - Django
  - Azure App Service on Windows
  - Debugging
date: 2015-08-04 10:16:00
author_name: Prashanth Madi
---

After creating a Azure Web/API app using Django Framework in Python, you may end-up getting Application errors at some point of your Application Development Process. [[This Blog describes how to enable Application logs for a Azure Web/API APP which uses Django Framework. 

 

Before starting debug process make sure that you have below two important files at Web/API APP Root folder. You can find them in wwwroot folder @ kudu console https://samplepythonapp.scm.azurewebsites.net/ 

``` {.scroll}
 web.config 
 ptvs_virtualenv_proxy.py
```

Please find more information on above files @ <https://azure.microsoft.com/en-us/documentation/articles/web-sites-python-configure/#webconfig>

 

You can display Django Application errors using below three channels

1) Display Application Errors on Web Browser

- Open settings.py file in your Django Web App

![](/media/2019/03/7384.dj1.JPG)

- In Settings.py file change debug option to True as below

``` {.scroll}
DEBUG = True
```

[[Output :

![](/media/2019/03/2451.dj2.JPG)

As you can see in above screen shot, Application error info is shown on web page with error Traceback. 

It is highly recommended to Swtich **DEBUG** option to **False** when you move the site into **Production**. 

 

2) Log Errors in a Azure File System.

- In settings.py file add below content for LOGGING variable

``` {.scroll}
LOGGING = {
 'version': 1,
 'disable_existing_loggers': False,
 'filters': {
 'require_debug_false': {
 '()': 'django.utils.log.RequireDebugFalse'
 }
 },
 'handlers': {
 'logfile': {
 'class': 'logging.handlers.WatchedFileHandler',
 'filename': 'D:\home\site\wwwroot\myapp.log'
 }
 },
 'loggers': {
 'django': {
 'handlers': ['logfile'],
 'level': 'ERROR',
 'propagate': False,
 }
 }
 }
```

- You can find more information on LOGGING module @ <https://docs.djangoproject.com/en/dev/topics/logging/>

**Output :**

[[After making above changes, You would see [myapp.log file in wwwroot folder]{style="background-color: #ffff00"} as in Below screenshot.

![](/media/2019/03/6253.dj3.JPG)

 

[Below Screenshot has the error message in myapp.log file.

![](/media/2019/03/4034.dj4.JPG)

 

This option is highly suitable for websites in production. 

 

3) Email Application Errors to Developers

- In settings.py file add below content for LOGGING variable. I have highlighted configuration which is required to send an Email in [RED]

``` {.scroll}
LOGGING = {
 'version': 1,
 'disable_existing_loggers': False,
 'filters': {
 'require_debug_false': {
 '()': 'django.utils.log.RequireDebugFalse'
 }
 },
 'handlers': {
 'mail_admins': {
 'level': 'ERROR',
 'filters': ['require_debug_false'],
 'class': 'django.utils.log.AdminEmailHandler',
 'include_html': True
 },
 'logfile': {
 'class': 'logging.handlers.WatchedFileHandler',
 'filename': 'D:\home\site\wwwroot\myapp.log'
 }
 },
 'loggers': {
 'django.request': {
 'handlers': ['mail_admins'],
 'level': 'ERROR',
 'propagate': True,
 },
 'django': {
 'handlers': ['logfile'],
 'level': 'ERROR',
 'propagate': False,
 }
 }
 }
```

- Include smtp connection details in settings.py file as below

``` {.scroll}
 EMAIL_USE_TLS = True
 EMAIL_HOST = 'smtp.gmail.com'
 EMAIL_PORT = 587
 EMAIL_HOST_USER = 'Your_GMAIL@gmail.com'
 EMAIL_HOST_PASSWORD = 'Your_GMAIL_Password'
```

- Change recipient email address in setting.py file as Below

``` {.scroll}
ADMINS = (
 ('Prashanth madi', 'prmadi@microsoft.com'),
 )
```

Output : 

A email would be sent to recipients mentioned above when a application error occurs. Below is a Sample Application error message which I received for my website.

![](/media/2019/03/3482.dj5.JPG)
 

You can also send an email in html format by including below line of code in logger handler. Below is a Sample Application error message which I received for my website in HTML format.

``` {.scroll}
'include_html': True
```

![](/media/2019/03/1031.dj6.JPG)

 

Find more details on using Python in Azure Web/API Apps at below links :  

- Python Developer Center - <http://azure.microsoft.com/en-us/develop/python/> 

- Configuring Python in Azure Web Apps - <https://azure.microsoft.com/en-us/documentation/articles/web-sites-python-configure/>

- Troubleshoot- logging Fatal Errors of Azure Web/API Apps in Python - <http://blogs.msdn.com/b/azureossds/archive/2015/07/15/troubleshoot-logging-python-application-errors-on-azure-web-api-apps.aspx>
