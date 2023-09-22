---
title: "Deploying Drupal Applications on App Service Linux with App Cache"
author_name: "Keegan D'Souza"
tags:
    - php
    - Drupal
    - preformance
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - PHP # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Drupal # Django, Spring Boot, CodeIgnitor, ExpressJS
    - How To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/appsvclinux-drupal.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-09-20 12:00:00
---

## Overview

This blog will show you have to deploy your Drupal Site to an Linux PHP App Service.

Since Durpal is a CMS customers following a standard deployment pattern might run into the certain pitfalls such as slow preformance under load and long deployment times.

This is due to the underlying app service architecture, Azure App Service uses a [networked mapped](https://learn.microsoft.com/en-us/archive/msdn-magazine/2017/february/azure-inside-the-azure-app-service-architecture#file-servers) storage account to persist files and sync them between instances. However CMS frameworks rely heavily on I/O operations for every request, which will result in slow preformance on most sites.

We will cover the following topics in this blog. 
- Quicker Preformance by enabling the app setting WEBSITES_ENABLE_APP_CACHE.
- References on how to create your modify the Drupal Nginx configuration. 
- Quicker deployment times using either Azure DevOps or Github Actions Build Pipelines.

## Prerequisites
This guide assumes that you already have a working Drupal Site synced to source control. 

For this demo we are using the pre-made unami, food blog provided by Drupal- [Drupal Quickstart](https://www.drupal.org/docs/installing-drupal/drupal-quick-start-command#s-download-with-git-and-run-drupal)  

Will be using the Drupal 'Unami' demo connected to an [Azure Database for MySQL](https://learn.microsoft.com/en-us/azure/mysql/flexible-server/overview)

Here is my repo that containers the code for this demo and all the sample config files: https://github.com/kedsouza/Umami-Demo 

![Drupal Profile](/media/2023/09/appcache-drupal-1.png)

<!-- 
 In is not recommended to use a sqlite-lite database stored on the same file system for production scenarios. Please consider a hosting your database on [Azure Database for MySQL](https://learn.microsoft.com/en-us/azure/mysql/flexible-server/overview) -->


## Enabling App Cache - [Read Only]
For ease of instructions we will first proceed with enabling the app cache to improve preformance and deployment times.

> While enabling app cache will make your Drupal App Perform faster this will not allow you to save or write content to be persited to the app service files system. Meaning if your team is making change / adding content these changes will not be presisted. You will lose content when the app service preforms a restart operation.

We will explore possiblities on how to presit Drupal Content in subsquence sections in this blog. However we are seperating these steps because some organization choose not to add  /edit content directly to their production durpal site. They instead devolop / test  on a dev site and push the changes to production. In this sceneario making Drupal 'Read Only' can work and can aid in simplicity. 

1. Enable the [app setting](https://learn.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal) *WEBSITES_ENABLE_APP_CACHE*.
    ```json
        WEBSITES_ENABLE_APP_CACHE=true
    ```
     This setting will remove the networked mapped storage from the app service and create a docker volume to host your code base.
     
     More information here: [App Cache](https://github.com/Azure-App-Service/KuduLite/wiki/App-Cache)

    Once you add this setting you may see the standard Azure hosting start page being returned by your app service. This is because app cache needs a new deployment once enabled.

2. Add nginx configuration to your repo. 
   The nginx configuration in the default linux app service php image needs to be modified in order to serve Drupal content correctly.

   We need to create two files, the custom nginx configuration file and a script to copy over the file on container startup.

   We are creating the nginx configuration based on this example from nginx: [Drupal - Nginx](https://www.nginx.com/resources/wiki/start/topics/recipes/drupal)

   The below file is a sample of our standard nginx configuration, which can be find by using the ssh feature and naviagting to ```/etc/nginx/sites-available/default``` and the above Drupal configuration.

   For this example I named this configuraiton *nginx-default* 

   ``` config
   server {
    
    listen 8080;
    listen [::]:8080;
    root /home/site/wwwroot/web;
    index  index.php index.html index.htm;
    server_name  example.com www.example.com; 
    port_in_redirect off;


    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }

    location = /robots.txt {
        allow all;
        log_not_found off;
        access_log off;
    }


    # Very rarely should these ever be accessed outside of your lan
    location ~* \.(txt|log)$ {
        allow 192.168.0.0/16;
        deny all;
    }

    location ~ \..*/.*\.php$ {
        return 403;
    }

    location ~ ^/sites/.*/private/ {
        return 403;
    }

    # Block access to scripts in site files directory
    location ~ ^/sites/[^/]+/files/.*\.php$ {
        deny all;
    }

    # Allow "Well-Known URIs" as per RFC 5785
    location ~* ^/.well-known/ {
        allow all;
    }

    # Block access to "hidden" files and directories whose names begin with a
    # period. This includes directories used by version control systems such
    # as Subversion or Git to store control files.
    location ~ (^|/)\. {
        return 403;
    }

    location / {
        # try_files $uri @rewrite; # For Drupal <= 6
        try_files $uri /index.php?$query_string; # For Drupal >= 7
    }

    location @rewrite {
        #rewrite ^/(.*)$ /index.php?q=$1; # For Drupal <= 6
        rewrite ^ /index.php; # For Drupal >= 7
    }

    # Don't allow direct access to PHP files in the vendor directory.
    location ~ /vendor/.*\.php$ {
        deny all;
        return 404;
    }

    # Protect files and directories from prying eyes.
    location ~* \.(engine|inc|install|make|module|profile|po|sh|.*sql|theme|twig|tpl(\.php)?|xtmpl|yml)(~|\.sw[op]|\.bak|\.orig|\.save)?$|^(\.(?!well-known).*|Entries.*|Repository|Root|Tag|Template|composer\.(json|lock)|web\.config)$|^#.*#$|\.php(~|\.sw[op]|\.bak|\.orig|\.save)$ {
        deny all;
        return 404;
    }


    # Add locations of phpmyadmin here.
    location ~* [^/]\.php(/|$) {
        fastcgi_split_path_info ^(.+?\.[Pp][Hh][Pp])(|/.*)$;
        fastcgi_pass 127.0.0.1:9000;
        include fastcgi_params;
        fastcgi_param HTTP_PROXY "";
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
        fastcgi_param QUERY_STRING $query_string;
        fastcgi_intercept_errors on;
        fastcgi_connect_timeout         300; 
        fastcgi_send_timeout           3600; 
        fastcgi_read_timeout           3600;
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
        fastcgi_busy_buffers_size 256k;
        fastcgi_temp_file_write_size 256k;
    }
   }
   ```

   The startup script will copy this configuration to the nginx config directory on the container.
   You can find other blogs about this topic here: [NGINX Rewrite Rules for Azure App Service Linux PHP 8.x](https://azureossd.github.io/2021/09/02/php-8-rewrite-rule/index.html)

    ```sh
    #!/bin/bash

    cp /home/site/wwwroot/nginx-default /etc/nginx/sites-enabled/default

    service nginx reload

    ```

    Reference this startup script within the app service startup command.

    ![StartupCommand](/media/2023/09/appcache-drupal-3.png)

3. Retry a deployment, if you are using the Oryx build system this. *Depending on your Drupal Site* this might take a while 15 - 20 minutes, however the deployment should still work. This is because most Drupal Repos contain a lot of files in which the app service networked mapped file system takes a while to transfer.  

Afte a deployment a read only version of your Drupal site should be working as expected and preforming a magtidude faster.

![Drupal-Home-Page](/media/2023/09/appcache-drupal-5.png)


## Improve Deployment Times.
Due to the number of files and content a Standard Drupal Repo, deploying can sometimes be slow, for this reason if your team notices longer then desired deployment times please disable the oryx deployment and follow the below steps.

> To disable this please add the below app setting before choosing one of the below deployment methods.
```json
SCM_DO_BUILD_DURING_DEPLOYMENT = false
```

### Azure Devops
  
  Create your default Azure DevOps Pipeline the pregenerated App Service Linux PHP Template should work.
  ![DevOps Starter](/media/2023/09/appcache-drupal-4.png)

  Below is my sample pipeline, your should look similar.
  ```
  # PHP as Linux Web App on Azure
    # Build, package and deploy your PHP project to Azure Linux Web App.
    # Add steps that run tests and more:
    # https://docs.microsoft.com/azure/devops/pipelines/languages/php

    trigger:
    - main

    variables:
    # Azure Resource Manager connection created during pipeline creation
    azureSubscription: '{Your Subscription ID}'

    # Web app name
    webAppName: '{Your App Service Name}'

    # Agent VM image name
    vmImageName: 'ubuntu-latest'

    # Environment name
    environmentName: '{Your App Service Name}'

    # Root folder under which your composer.json file is available.
    rootFolder: $(System.DefaultWorkingDirectory)

    stages:
    - stage: Build
    displayName: Build stage
    variables:
        phpVersion: '8.2'
    jobs:
    - job: BuildJob
        pool:
        vmImage: $(vmImageName)
        steps:
        - script: |
            sudo update-alternatives --set php /usr/bin/php$(phpVersion)
            sudo update-alternatives --set phar /usr/bin/phar$(phpVersion)
            sudo update-alternatives --set phpdbg /usr/bin/phpdbg$(phpVersion)
            sudo update-alternatives --set php-cgi /usr/bin/php-cgi$(phpVersion)
            sudo update-alternatives --set phar.phar /usr/bin/phar.phar$(phpVersion)
            php -version
        workingDirectory: $(rootFolder)
        displayName: 'Use PHP version $(phpVersion)'

        - script: composer install --no-interaction --prefer-dist
        workingDirectory: $(rootFolder)
        displayName: 'Composer install'

        - task: ArchiveFiles@2
        displayName: 'Archive files'
        inputs:
            rootFolderOrFile: '$(rootFolder)'
            includeRootFolder: false
            archiveType: zip
            archiveFile: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
            replaceExistingArchive: true

        - upload: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
        displayName: 'Upload package'
        artifact: drop

    - stage: Deploy
    displayName: 'Deploy Web App'
    dependsOn: Build
    condition: succeeded()
    jobs:
    - deployment: DeploymentJob
        pool:
        vmImage: $(vmImageName)
        environment: $(environmentName)
        strategy:
        runOnce:
            deploy:
            steps:
            - task: AzureWebApp@1
                displayName: 'Deploy Azure Web App '
                inputs:
                azureSubscription: $(azureSubscription)
                appName: $(webAppName)
                package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
  ```

### Github Actions
  With Github Actions you can base workflow file off the pregenerated template from the app service deployment center.
  
  However you may notice slow transfers between the build / deploy jobs. 

  We had to tar the artifacts up before transferring between these tasks, below is my Github Actions Workflow file, yours should be similar. 
  ```yml
    # Docs for the Azure Web Apps Deploy action: https://github.com/Azure/webapps-deploy
    # More GitHub Actions for Azure: https://github.com/Azure/actions

    name: Build and deploy PHP app to Azure Web App - kedsouza-php

    on:
    push:
        branches:
        - main
    workflow_dispatch:

    jobs:
    build:
        runs-on: ubuntu-latest

        steps:
        - uses: actions/checkout@v2

        - name: Setup PHP
            uses: shivammathur/setup-php@v2
            with:
            php-version: '8.2'

        - name: Check if composer.json exists
            id: check_files
            uses: andstor/file-existence-action@v1
            with:
            files: 'composer.json'

        - name: Run composer install if composer.json exists
            if: steps.check_files.outputs.files_exists == 'true'
            run: composer validate --no-check-publish && composer install --prefer-dist --no-progress

        - name: Tar Artifacts to increase upload time
            run: |
            touch app.tar.gz
            tar -czf app.tar.gz --exclude=app.tar.gz .

        - name: Upload artifact for deployment job
            uses: actions/upload-artifact@v2
            with:
            name: php-app
            path: app.tar.gz
            
    deploy:
        runs-on: ubuntu-latest
        needs: build
        environment:
        name: 'Production'
        url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

        steps:
        - name: Download artifact from build job
            uses: actions/download-artifact@v2
            with:
            name: php-app

        - name: Extract Tar
            run: |
            tar -xf app.tar.gz
            rm app.tar.gz

        - name: 'Deploy to Azure Web App'
            uses: azure/webapps-deploy@v2
            id: deploy-to-webapp
            with:
            app-name: '{Your App Service Name}'
            slot-name: 'Production'
            publish-profile: ${ Your Publish Profile Secert Rerfence }
            package: .
    
  ```

## Adding Drupal Write / Presistantance

It is possible to mount [Azure File Storage](https://learn.microsoft.com/en-us/azure/app-service/configure-connect-to-azure-storage?tabs=basic%2Ccli&pivots=container-linux) with App Cache Enabled.
With this way your team can presist contents by only writing to your Azure File Share

> Full Content Comming Soon.




