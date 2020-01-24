---
title: " Deploying Django App to Azure App Services using Git and new version of Python"
tags:
  - Django
  - Git
  - python
categories:
  - Azure App Service on Windows
  - Python
  - Django
  - Deployment
date: 2016-08-25 10:38:27
author_name: Prashanth Madi
toc: true
toc_sticky: true
header:
    teaser: /assets/images/django-logo.png
---

**Django** is a high-level Python Web framework that encourages rapid development and clean, pragmatic design. Built by experienced developers, it takes care of much of the hassle of Web development, so you can focus on writing your app without needing to reinvent the wheel. It’s free and open source.

Below are list of steps which we would follow in this blog to create and deploy Django app to Azure App Services

-   Create Sample Project
-   Create Azure WebApp and Use Site Extension to Upgrade Python
-   Create Deployment script
-   Change Deployment script
-   Copy necessary files
-   Publish App

You can find a Sample Python Django project with above operations @ [GitHub Link](https://github.com/prashanthmadi/azure-django-customdeployment)

## Create Sample Project

Follow <https://www.djangoproject.com/start/> to get started with Django

-   Install Django and
-   Create your first project

(or)

If you have [PyCharm](https://www.jetbrains.com/pycharm/), Follow details at below link to create a sample app\
<https://www.jetbrains.com/help/pycharm/2016.1/creating-django-project.html>

![Sample Django Project](http://techiecouple.azurewebsites.net/content/images/2016/08/djangosample.PNG)

## Create Azure WebApp and Use Site Extension to Upgrade Python

Navigate to [Azure portal](https://portal.azure.com/)

-   Create a new web app
-   Setup Continuous Deployment

Follow below blog on how to upgrade python using site extension\
<https://blogs.msdn.microsoft.com/pythonengineering/2016/08/04/upgrading-python-on-azure-app-service/>

As Steve has mentioned in his blog at above link, add site extension to your web app.\
For this blog I'm choosing `Python 2.7.12 x64`, It would install new version of python @ D:\\home\\Python27

## Create Deployment script

I have explained more on how to utilize deployment script and what it does @[link](http://techiecouple.azurewebsites.net/azure-custom-deployment/)

Install Azure Cli using below command

    npm install azure-cli -g

Use Below command to create deployment script.

    azure site deploymentscript --python

Above step would create below two files

-   .deployment
-   deploy.cmd

### Change Deployment script Content 

Replace content of deploy.cmd file with content at [Link](https://github.com/prashanthmadi/azure-django-customdeployment/blob/master/deploy.cmd)

I have changed the code to utilize new python executable available @ D:\\home\\Python27

### Copy necessary files 

Create below two new files at root folder and copy content from [link](https://github.com/prashanthmadi/azure-django-customdeployment)

-   `web.config` - used to configure IIS
-   `ptvs_virtualenv_proxy.py` - Helper python file to activate virtual environment

Create requirements.txt file and add app required modules in it. you can find a sample @ [link](https://github.com/prashanthmadi/azure-django-customdeployment)

### Publish App 
Navigate to your root folder and commit your changes to `WEB_APP_GIT_URL`

    git init  
    git add .  
    git commit -m "initial commit"  
    git remote add sampledjangoapp WEB_APP_GIT_URL  
    git push sampledjangoapp master  

Here is my App on Azure After publish

![Django Sample App Azure](http://techiecouple.azurewebsites.net/content/images/2016/08/djangopublish.PNG)

You can find a Sample Python Django project with above operations @ [GitHub Link](https://github.com/prashanthmadi/azure-django-customdeployment)

