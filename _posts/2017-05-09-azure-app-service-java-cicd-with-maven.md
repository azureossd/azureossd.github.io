---
title: " Azure App Service Java CI/CD with Maven"
author_name: Prasad K.
categories:
  - Azure App Service on Windows
  - Java
  - Maven
  - Deployment
date: 2017-05-09 10:37:52
tags:
  - Azure App Service Web App
  - Java
  - Maven
header:
    teaser: /assets/images/maven_logo.svg
---

  

Azure App Service provides integration with Github, Bitbucket, etc however, for Java webapps, it does not provide a default way to build and deploy the webapp directly from github. But the good news is, it does provide hooks by which you can modify the Kudu deployment script to achieve the continuous integration and continuous build functionality.

## Steps to achieve CI/CD

1. Copy the required Apache Maven directory in your repo.

2. Create 2 files – .deployment and deploy.cmd

.deployment contents:

      [config]

      command = deploy.cmd



deploy.cmd contents:

      set MAVEN_OPTS=-Djava.net.preferIPv4Stack=true -Djava.net.preferIPv6Addresses=false

      .\apache-maven-3.3.9\bin\mvn clean install -Ddir=D:\home\site\wwwroot\webapps


3. After this setup a continuous integration point with your Java app service on Azure. Next time onwards, whenever you push something to your repo, it’ll trigger the build and deploy the changes in your webapp.



For each deployment, it’ll rebuild the project. Please refer the Github link - <https://github.com/pker/AzureJavaWebapp-CICDwithMaven> for sample Java webapp project with CICD configured.
