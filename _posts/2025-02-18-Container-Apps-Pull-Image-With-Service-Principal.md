---
title: "Container Apps Pull Image using an Azure Service Principal"
author_name: "Keegan D'Souza"
tags:
    - Container Apps
    - Service Principal
    - Authorization
categories:
    - Azure Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: false
toc_sticky: true
date: 2025-02-18 12:00:00
---
This post will go over how to use a service principal to pull an image to your Container App.

## Overview 

In most cases pulling using system or user managed identity is the recommended to authenicate with your ACR.

We suggest you follow the authenication method listed in the documentation below.

[Azure Container Apps image pull from Azure Container Registry with managed identity](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull?tabs=bash&pivots=portal)

This blog details the scenario where you are required to use a service princial by your organization.

## Create a service princial and assign it ACR Pull Cerdentials. 

1. Please follow the instructions from the below documentation.

   [Create a service principal](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-auth-service-principal#create-a-service-principal)

2. Please take notes of the following values, before proceeding to the next steps.
   
   #### Azure Container Registry HostName
   
   Example: `myazcrname.azurecr.io`
   
   #### Service Prinical App ID

   Example: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   
   #### Service Prinical Secret

   Example: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

   #### Image Name and Tag

   Example: `myimagename:latest`

## Configure the Container App to pull using the Service Principal.

1. Naviate to your container app, if you do not have an existing container app please go ahead and follow the below documentation in order to create one.

    [Quickstart: Deploy your first container app using the Azure portal](https://learn.microsoft.com/en-us/azure/container-apps/quickstart-portal)

2. Naviate to the `Revisions and Replica` section, under the `Application` Drop Down menu.

3. Select the `Create a new revision` option.

4. Click on the container image that needs to be updated.

    ![New Revision Blade](/media/2025/02/container-apps-service-principal-1.png)

5. Select the `Docker Hub or other registries` radio button. Then select `private`.

    ![Container Details](/media/2025/02/container-apps-service-principal-3.png)

6. In the `Registry login server` click `Add new`.
   
   ![Registry Login Server](/media/2025/02/container-apps-service-principal-2.png)

   In the `Login server` field enter your Azure Container Registry Host Name. [🔗](#azure-container-registry-hostname)

   In the `Registry user name` enter your Application ID of the service princial.[🔗](#service-prinical-app-id)

   In the `Registry password`, enter your Service Principal Secret.[🔗](#service-prinical-secret)

   Hit the `Add` button.

7. In the `Image and tag` field enter your image name and tag of the image you would like to pull from the contianer registry.[🔗](#image-name-and-tag)

8. Make sure to hit `Save`, to change the container settings. Then hit `Create` when you are ready to create the revision.
