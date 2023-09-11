---
title: "Deploying Python Applications using Github Actions"
author_name: "Keegan D'Souza"
tags:
    - Python
    - App Service
    - Github Actions
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Python # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/pylinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-08-09 12:00:00
---

## In this blog post we will cover Github Actions Deployment to a Python App Service.


By default when you configure your workflow file using the Deployment Center the build happens still happens using the [app service build system (oryx)](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md).

The goal of this blog, is to demonstration how to switch the build process to only occur on Github Actions.

## Reasoning / Possible Use Cases
 > Note - If you are not facing any issue when the default configuration (Leaving SCM_DO_BUILD_DURING_DEPLOYMENT=true and using the default pregenerated github action file) we recommend leaving the default configuration. 

Deploying this way can also potentially lead to file locking issues during depolyment. 

Please only consider following this blog if you run into the following scenearios. 

-  The app service your are deploying to is networking restricted to block all outbound requests, which would prevent the app service build system (oryx) from downloading the necessary pip packages.

- You are incountering an ackownledgded bug or limitation with the app serivce oryx build system. 

- Your team can *potentially* speed up your deployment time by take of Advantage of Github Actions Features, such as a build cache to possibly improve deployment times. 

    More information here: [Caching dependencies to speed up workflows](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)


You can follow along by viewing this sample repo: [appsvc-python-githubactions](https://github.com/kedsouza/appsvc-python-githubactions)

This repo is a simple python flask application that requires the [numpy](https://numpy.org/doc/stable/user/quickstart.html) package in order to responed. 

## Set Up Initial Deployment:

Sync your Github Repository to the app service deployment center.

![Deployment Center](/media/2022/12/azure-blog-python-github-actions-2.png)

## Add needed app settings.
 We are adding two [app settings](https://learn.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal) to this app service.

-   
    ```json
    SCM_DO_BUILD_DURING_DEPLOYMENT = false
    ```
    This will disable the app serivce build system (oryx). We are disabling this because the build will be taking place on github actions there is no need to rerun the oryx build process. 

- 
    ```json
    PYTHONPATH = /home/site/wwwroot/***{your-virtual-environment-name}***/lib/***{your-python-version}***/site-packages* 
    ``` 
            
    This will allow for the python interperter on the app service to look for the python packages we built for your virtual environment.
        
    More information here: [Python - PythonPath](https://docs.python.org/3/using/cmdline.html#envvar-PYTHONPATH)

    The virtual environment name should by the name of the virutal environment githubactions uses. 
    For this example the virtual environment is called venv and the python version is 3.9 so we set the value of this app setting to the value list below. 
    ```json
    PYTHONPATH = home/site/wwwroot/venv/lib/python3.9/site-packages
    ```



## Modify Workflow file
You can view the completed workflow file for this project here: [Complete Workflow File](https://github.com/kedsouza/appsvc-python-githubactions/blob/main/.github/workflows/main_kedsouza-python-githubactions.yml)


1. Navigate to your Github Actions Repository and open your generated github actions .yml file. It will be located under *.github/workflows/{branch_name}_{app service name}.yml.*
2. Modify the following sections in your workflow file.
    
    - Add the command installation command to install the packages
    
        Before:
        ```yaml
        - name: Create and start virtual environment
            run: |
              python -m venv venv
              source venv/bin/activate
        ```
        
        After: 
        ```yaml
        - name: Create and start virtual environment
            run: |
              python -m venv venv
              source venv/bin/activate
              pip install -r requirements.txt
        ```
    - Tar generated artificats to increase upload / download speed on Github Actions. This needs to be added in between the *'Create and start virtual environment task'  and the 'Upload artifacts for deployment jobs'* artifacts task.
        
        New Task 
        ```yaml
        - name: Tar Artifacts to increase upload time
            run: |
              touch app.tar.gz
              tar -czf app.tar.gz --exclude=app.tar.gz .
        ```


    - Upload the previously generated tar file.

        Before:
        ```yaml
        - name: Upload artifact for deployment jobs
            uses: actions/upload-artifact@v2
            with:
            name: python-app
            path: |
                . 
                !venv/
        ```
        After: 
        ```yaml
        - name: Upload artifact for deployment jobs
            uses: actions/upload-artifact@v2
            with:
            name: python-app
            path: app.tar.gz
        ```   

    - Extract the previous compressed tar file before the deployment task. This should happen right after the *'Download artifact from build job'* step.

        New Task
        ```yaml
            - name: Extract Tar
              run: |
                tar -xf app.tar.gz
                rm app.tar.gz
        ```

   
       


## Commit your changes and test.
1. Commit your changes and monitor your deployment.
2. Your app service should be able to startup successfully with the the python packages created with and transferred from Github Actions.  

![Sucessful Response](/media/2022/12/azure-blog-python-github-actions-4.png)


Depending on your project structure you may need to modify your startup command. 
    
More information here: [Configure a Linux Python app for Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-language-python#customize-startup-command )

   