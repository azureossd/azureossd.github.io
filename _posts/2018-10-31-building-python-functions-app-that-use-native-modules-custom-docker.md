---
title: "Building Python Functions App that use Native Modules – Custom Docker"
tags:
  - Azure Linux Web App
  - Functions App
  - Python
  - Python Functions App
categories:
  - Azure Function App
  - Python
date: 2018-10-31 14:23:43
author_name: chmald
header:
    teaser: /assets/images/pyfunction.png
toc: true
toc_sticky: true
---

# Prerequisites


To build and test locally, you will need to:

*   Install [Python 3.6](https://www.python.org/downloads/)
*   Install [Docker](https://docs.docker.com/docker-for-windows/install/)
*   Install [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local) version 2.0.3 or later

To install Azure Functions Core tools you will need also these requirements:

2.  Install [.NET Core 2.1 for Windows](https://www.microsoft.com/net/download).
3.  Install [Node.js](https://docs.npmjs.com/getting-started/installing-node#osx-or-windows), which includes npm. For version 2.x of the tools, only Node.js 8.5 and later versions are supported.
4.  Install the Core Tools package: **npm install -g azure-functions-core-tools**

# Create and Activate a Virtual Environment


To create a Functions project, it is required that you work in a Python 3.6 virtual environment. Run the following commands to create and activate a virtual environment named env. # In Bash python3.6 -m venv env source env/bin/activate # In PowerShell py -3.6 -m venv env env\\scripts\\activate # In CMD python -m venv env env\\scripts\\activate

# Create a Local Functions Project


To create a Functions project, it is required that you work in a Python 3.6 virtual environment. Run the following commands to create and activate a virtual environment named env. In the terminal window or from a command prompt, run the following command:

    func init MyFunctionProj --worker-runtime python –-docker 
    func init . --worker-runtime python --docker

You will see something like the following output.

    Installing wheel package 
    Installing azure-functions==1.0.0a5 package 
    Installing azure-functions-worker==1.0.0a6 package 
    Running pip freeze Writing .funcignore 
    Writing .gitignore 
    Writing host.json 
    Writing local.settings.json 
    Writing D:\Documents\WebAppProjects\functions-python-3\.vscode\extensions.json 
    Writing Dockerfile

This generates a Dockerfile with the following content:

    FROM mcr.microsoft.com/azure-functions/python:2.0

    COPY . /home/site/wwwroot

    RUN cd /home/site/wwwroot && \

        pip install -r requirements.txt

# Create a Function


[https://github.com/Azure/azure-functions-python-worker/wiki/Create-your-first-Python-function#create-a-function](https://github.com/Azure/azure-functions-python-worker/wiki/Create-your-first-Python-function#create-a-function)

# Run the Function Locally


[https://github.com/Azure/azure-functions-python-worker/wiki/Create-your-first-Python-function#run-the-function-locally](https://github.com/Azure/azure-functions-python-worker/wiki/Create-your-first-Python-function#run-the-function-locally)

# Run Locally as Docker Container

Using Docker, run the following command. Replace \<imagename\> and \<tag\> with preferred names.

    docker build . --tag <imagename>:<tag> 

    (example) docker build . -- pythonfunction:v1

[![](/media/2018/10/dockerbuild.png)](/media/2018/10/dockerbuild.png) Once image has been build you could run the following command to start the image:

    docker run -p <portexposed>:<portusedinside> <imagename>:<tag> 
    (example) docker run -p 8080:80 pythonfunction:v1

Once started, you could browse to [http://localhost:8080](http://localhost:8080) (using example) to view your function running. [![](/media/2018/10/localtest-1.png)](/media/2018/10/localtest-1.png)

# Deploy Your Function App
------------------------

You could use Docker Hub or Azure Container Registry to deploy your Docker image.

# Push image to Docker Hub

[https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal#push-image-to-acr](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal#push-image-to-acr)

## First Create a container registry[](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal#create-a-container-registry)

[https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal#create-a-container-registry](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal#create-a-container-registry)

## Log in to ACR

[https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal#create-a-container-registry](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal#create-a-container-registry)

## Push image to ACR

[https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal#push-image-to-acr](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal#push-image-to-acr)

## Create function app via Azure Portal

Select the **New** button found on the upper left-hand corner of the Azure portal, then select **Compute > Function App**. [![](/media/2018/10/createnew.png)](/media/2018/10/createnew.png) When configuring the settings, select **Linux (Preview)** for OS and **Docker Image** for Publish. Under Configure Container, select either **Azure container Registry** or **Docker Hub** depending on how you deployed your Docker image. [![](/media/2018/10/functionapp.png)](/media/2018/10/functionapp.png) Once deployed, you will be able to access the Function Apps page [![](/media/2018/10/functionapppage.png)](/media/2018/10/functionapppage.png) Once deployed, you can test your Function App: Be sure to change \<functionappname\> and \<function-name\> with your functions values. https://\<functionappname\>.azurewebsites.com/api/\<function-name\>