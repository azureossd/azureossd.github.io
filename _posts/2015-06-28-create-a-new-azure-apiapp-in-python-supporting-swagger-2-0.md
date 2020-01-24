---
title: "Create a new Azure Apiapp in python supporting swagger 2.0"
tags:
  - APIAPP
  - flask-restplus
  - python
url: 281.html
id: 281
categories:
  - Python
  - Flask
  - Azure App Service on Windows
  - How-To
date: 2015-06-28 19:33:00
author_name: Prashanth Madi
---

An API app is an [App Service web app](https://azure.microsoft.com/en-us/documentation/articles/app-service-web-overview/) with additional features that enhance the experience of developing, deploying, publishing, consuming, managing, and monetizing RESTful web APIs.

For More information Please refer : <https://azure.microsoft.com/en-us/documentation/articles/app-service-api-apps-why-best-platform/>
 

This Blog would provide steps to create a sample Azure API APP in Python using [Flask-restplus](http://flask-restplus.readthedocs.org/en/latest/index.html)

1) Add a new virtual environment proxy file(`ptvs_virtualenv_proxy.py).sample file is available @ `<https://azure.microsoft.com/en-us/documentation/articles/web-sites-python-configure/#virtual-environment-proxy>

2) Create a requirements.txt file with below content. Find more details about package management @ <https://azure.microsoft.com/en-us/documentation/articles/web-sites-python-configure/#package-management>

``` {.scroll}
flask-restplus==0.7.2 
```

3) Get a sample flask-restplus code available @ <http://flask-restplus.readthedocs.org/en/latest/example.html>. I have placed my code in [api.py]

4) Create a new folder and add a web.config file in your local workspace. You can find a sample @ <https://azure.microsoft.com/en-us/documentation/articles/web-sites-python-configure/#webconfig>

Change value of WSGI\_ALT\_VIRTUALENV\_HANDLER in web.config as required. I have mentioned it as api.app because my sample code was in api.py file with app as main method in it.

![](/media/2019/03/2234.webconfig.JPG)

5) Create a new file apiapp.json at root folder

``` {.scroll}
{
 "$schema": "http://json-schema.org/schemas/2014-11-01/apiapp.json#",
 "id": "Bumblebee",
 "namespace": "microsoft.com",
 "gateway": "2015-01-14",
 "version": "1.9.0",
 "title": "Bumblebee",
 "summary": "",
 "author_name": "",
 "endpoints": {
 "apiDefinition": "/swagger",
 "status": null
 }
}
```

6) At the end you would see below list of files

![](/media/2019/03/0361.pythonapiapp.JPG)

 

Please find more details on creating and deploying Azure API app at below link

https://azure.microsoft.com/en-us/documentation/articles/app-service-api-nodejs-api-app/

 

After deploying your app, you should be able to see app definition in portal as below

![](/media/2019/03/7824.swaggerdocdef.JPG)

 


 

 
