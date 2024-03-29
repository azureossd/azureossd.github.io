---
permalink: "/appservice/"
layout: single
toc: true
title: "App Service Linux and Web App for Containers"
sidebar: 
    nav: "links"
---
App Service on Linux supports a number of language specific built-in images and you can dockerize your app and host a custom Windows or Linux container in App Service.

>Check for [Azure App Service on Linux/WafC FAQ](https://learn.microsoft.com/en-us/troubleshoot/azure/app-service/faqs-app-service-linux)

> Find additional Azure App Service articles on [Technet/TechCommunity - Apps on Azure Blog](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/bg-p/AppsonAzureBlog).


Here is a compilation of resources by categories:

# App Service Linux

## General
- [Default exposed ports of Azure App Service Linux Blessed Images](https://azureossd.github.io/2023/03/24/Default-exposed-ports-of-Azure-App-Service-Linux-Blessed-Images/index.html)
- [Whats the difference between PORT and WEBSITES_PORT](https://azureossd.github.io/2023/02/15/Whats-the-difference-between-PORT-and-WEBSITES_PORT/index.html)
- [Why you may see Docker Containers that are not yours on App Service Linux](https://azureossd.github.io/2023/03/15/Why-you-may-see-Docker-Containers-that-are-not-yours-on-App-Service-Linux/index.html)
- [App Service Linux security FAQs](https://azureossd.github.io/2023/02/28/security-faqs-app-service-linux/index.html)


## Configuration
- [Using custom startup commands with Web App for Containers](https://azureossd.github.io/2023/04/13/Using-custom-startup-commands-with-Web-App-for-Containers/index.html)
- [Manage Timezones in App Service Linux](https://azureossd.github.io/2023/03/13/managing-timezones-appservice-linux/index.html)
- [Increasing Request Header sizes on Linux App Services](https://azureossd.github.io/2022/06/08/Increasing-Request-Header-sizes-on-Linux-App-Services/index.html)
- [Editing Response Headers on Linux App Service](https://azureossd.github.io/2022/05/25/Editing-Response-Headers-on-Linux-App-Service/index.html)
- [Installing TcpPing on Azure App Service Linux](https://azureossd.github.io/2021/06/17/installing-tcpping-linux/index.html)
- [Troubleshooting Bring Back SSH for App Service (Blessed) Images](https://azureossd.github.io/2023/06/27/Troubleshooting-Bring-Back-SSH-for-App-Service-(Blessed)-Images/index.html)
- [Logging with supervisord on Web Apps for Containers](https://azureossd.github.io/2023/11/03/Logging-with-supervisord-on-Web-Apps-for-Containers/index.html)

## Deployment
- [Troubleshooting HTTP 409’s when deploying to Azure App Service](https://azureossd.github.io/2023/08/14/Troubleshooting-HTTP-409s-when-deploying-to-App-Service/index.html)


## Availability and Startup issues
- [Troubleshooting failed slot swaps on App Service Linux](https://azureossd.github.io/2023/03/15/Troubleshooting-Failed-Slot-Swaps-on-App-Service-Linux/index.html)
- [Troubleshooting No space left on device](https://azureossd.github.io/2023/04/11/troubleshooting-no-space-left-on-device/index.html)
- [Troubleshooting Bring Back SSH for App Service (Blessed) Images](https://azureossd.github.io/2023/06/27/Troubleshooting-Bring-Back-SSH-for-App-Service-(Blessed)-Images/index.html)
- [Middleware containers - Why you may see "Failed to forward request messages" for your application on App Service Linux](https://azureossd.github.io/2023/04/05/Why-you-may-see-Failed-to-forward-request-messages-for-your-application-on-App-Service-Linux/index.html)
- [Troubleshooting Container didnt respond to HTTP pings on port, failing site start](https://azureossd.github.io/2023/04/18/Troubleshooting-Container-didnt-respond-to-HTTP-pings-failing-to-start-site/index.html)
- [Troubleshooting Bring Your Own Storage (BYOS) issues on App Service Linux](https://azureossd.github.io/2023/04/20/How-to-troubleshoot-Bring-Your-Own-Storage-(BYOS)-Issues-on-App-Service-Linux/index.html)

# Web app for Containers

## Availability and Startup issues
- [Troubleshooting common Docker Pull errors on Linux Web App for Containers](https://azureossd.github.io/2023/02/28/Troubleshooting-common-Docker-Pull-errors-on-Linux-Web-App-for-Containers/index.html)
- [Docker User Namespace remapping issues](https://azureossd.github.io/2022/06/30/Docker-User-Namespace-remapping-issues/index.html)
- [Troubleshooting OCI runtime create errors](https://azureossd.github.io/2023/07/17/Troubleshooting-OCI-Runtime-Create-errors/index.html)

## Configuration
- [Enabling SSH on Linux Web App for Containers](https://azureossd.github.io/2022/04/27/2022-Enabling-SSH-on-Linux-Web-App-for-Containers/index.html)
- [How to download files from a custom container](https://azureossd.github.io/2023/07/20/How-to-download-files-from-a-custom-container/index.html)
- [Using MySQL clients to connect to a MySQL database from App Service Linux](https://azureossd.github.io/2024/01/24/Using-mysql-client-to-connect-to-a-MySQL-db-from-App-Service-Linux/index.html)
- [Installing Oracle database instant client for Nodejs on Linux and Widows apps service](https://azureossd.github.io/2024/01/18/Installing-Oracle-database-instant-client-for-nodejs-on-Linux-and-Widows-apps-service/index.html)

## Deployment
- [Deploying Web App for Containers with CI/CD pipelines](https://azureossd.github.io/2023/02/06/Deploying-Web-App-for-Containers-with-CI-CD-pipelines/index.html)
- [How to deploy Custom Docker containers using Azure DevOps public and self-host agent](https://azureossd.github.io/2023/03/20/how-to-deploy-azure-functions-as-custom-container-using-azure-devops/index.html)
- [Using pack cli and buildpacks to deploy Dockerfile-less apps to Web App for Containers](https://azureossd.github.io/2023/07/31/Using-pack-cli-and-buildpacks-to-deploy-Dockerfile-less-apps-to-Web-App-for-Containers/index.html)