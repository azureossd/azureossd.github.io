---
title: "Troubleshoot- logging python Application errors on Azure Web/API Apps"
tags:
  - APIAPP
  - azure
  - error-logs
  - python
  - troubleshoot
  - WAWS
categories:
  - Python
  - Azure App Service on Windows
  - Debugging
date: 2015-07-14 16:03:00
author_name: Prashanth Madi
---

After creating a Azure Web/API app using python, you may end-up getting below 500 error at some point of your application development process. This Blog describes how to enable Application logs for a python Web/API APP on Azure. `The page cannot be displayed because an internal server error has occurred.`   

If you have worked earlier on Azure Web app, General tendency would be to look at LogFiles folder in kudu console([https://Your_Website.scm.azurewebsites.net](https://samplepythonapp.scm.azurewebsites.net)) but that won't provide you much info about python application issue. To overcome this, Please follow below set of instructions to receive application logs  

1) Navigate to your new azure portal and click on settings in your Web app.  

[![](/media/2019/03/4188.new1.JPG)](/media/2019/03/4188.new1.JPG) 

2) Click on Application Settings in Settings Tab 

[![](/media/2019/03/3107.new2.JPG)](/media/2019/03/3107.new2.JPG) 

3) Enter Below Key/Value pair under App Settings in Application Settings Tab. 

> Key : WSGI_LOG Value : D:\\home\\site\\wwwroot\\logs.txt           -   (Enter your choice of file name here) 

[![](/media/2019/03/8171.new3.JPG)](/media/2019/03/8171.new3.JPG)   

4) Now you should be able to see logs.txt file in wwwroot folder as mentioned in above step 

[![](/media/2019/03/0601.end_result.JPG)](/media/2019/03/0601.end_result.JPG)    

Troubleshoot : If you still haven't found that logs.txt file, check if ptvs\_virtualenv\_proxy.py file is similar to below link content. [https://azure.microsoft.com/en-us/documentation/articles/web-sites-python-configure/#virtual-environment-proxy](https://azure.microsoft.com/en-us/documentation/articles/web-sites-python-configure/#virtual-environment-proxy)   

Find more details on using Python in Azure Web/API Apps at below links :   

\- Python Developer Center - [http://azure.microsoft.com/en-us/develop/python/](http://azure.microsoft.com/en-us/develop/python/)  

\- Configuring Python in Azure Web Apps - [https://azure.microsoft.com/en-us/documentation/articles/web-sites-python-configure/](https://azure.microsoft.com/en-us/documentation/articles/web-sites-python-configure/)