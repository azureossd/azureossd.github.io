---
title: "NodeJs GitHub Action Deployment on App Service Linux Using Publish Profile"
author_name: "Kaliprasad Sahoo"
tags:
    - Nodejs
    - Deployment
    - Azure DevOps Pipelines
    - GitHubAction
categories:
    - Azure App Service on Linux
    - Deployment
    - Azure DevOps
header:
    teaser: /assets/images/azure-devops-logo.png
toc: true
toc_sticky: true
date: 2025-04-16 12:00:00
---

# Overview

This section provides information for creating, configuring, and deploying an NodeJs app on App Service Linux using GitHub action.

# Prerequisites:
 
•	An Azure account with an active subscription.
•	A GitHub account.

# Steps1:
 
Create a sample NodeJs web app(Linux with version 18 or above) in azure portal.
 
As we will be deploying using the publish profile, please download the publish profile by clicking on "Download publish profile" as shown below:
 
 ![](/media/2025/04/img1.PNG)

When you click on download publish profile, you may receive an alert stating that Basic authentication is disabled. 
 
 ![](/media/2025/04/img2.PNG)
 
To resolve this, you need to enable basic authentication by going to the configuration>>General settings blade and following the steps provided:
 
 ![](/media/2025/04/img3.PNG)
 
Click now on "Download publish profile" option to download the publish profile.
 
 ![](/media/2025/04/img4.PNG)
The downloaded "githubActionpublish.PublishSettings" file contains all the publish profile details like profileName, publishUrl,username, userPWD and publishMethod.
 
# Step-2:
 
Create or fork a sample Node.js hello world repository in your GitHub using the link below
https://github.com/kpsahooMS/sampleNodeJs
 
Now add the same publish profile content to your GitHub repository. Go to Settings > Security > Secrets and variables > Actions > New repository secret.
 
Create a new repository secret named AZURE_WEBAPP_PUBLISH_PROFILE and add all publish profile data to it.
 
 ![](../media/2025/04/img5.PNG)
 
# Step-3:
 
Please create a workflow file  A YAML (.yml) file in the /.github/workflows/ path in your GitHub repository that includes all the steps such as environment setup, build, and deployment as outlined below:
 
 ![](../media/2025/04/img6.PNG)
 
 
# Use the following sample WorkFlow.yml file for the setup.
 
WorkFlow.yml :
------------------------------------------------------------------------------------------------------
 
# File: .github/workflows/workflow.yml
name: JavaScript CI
 
on: [push]
 
env:
  AZURE_WEBAPP_NAME: 'githubActionpublish'   # set this to your application's name
  AZURE_WEBAPP_PACKAGE_PATH: 'my-app-path'      # set this to the path to your web app project, defaults to the repository root
  NODE_VERSION: '18.x'                # set this to the node version to use
 
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read #This is required for actions/checkout
 
    steps:
      - uses: actions/checkout@v4
 
      - name: Set up Node.js version
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
 
      - name: npm install, build, and test
        run: |
          npm install
          npm run build --if-present
          npm run test --if-present
 
      - name: Zip artifact for deployment
        run: zip release.zip ./* -r
 
      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v4
        with:
          name: node-app
          path: release.zip          
  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}
    permissions:
      id-token: write #This is required for requesting the JWT
      contents: read #This is required for actions/checkout
 
    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v4
        with:
          name: node-app
 
      - name: Unzip artifact for deployment
        run: unzip release.zip
      
      - name: deploy to Azure
        uses: azure/webapps-deploy@v3
        with:
            app-name: ${{ env.AZURE_WEBAPP_NAME }}
            publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
            package: '.'
    
--------------------------------------------------------------------------------------------------------------------------------
 
# Step-4
 
Now, run the workflow.yml file, and the following will be the successful logs:
 
 ![](../media/2025/04/img7.PNG)
 
 ![](../media/2025/04/img8.PNG)
 
 ![](../media/2025/04/img9.PNG)

# Step-5:
 
Now try accessing the application in the Azure portal as it has been successfully deployed to the web app:
 
 ![](../media/2025/04/img10.PNG)
 
 
 

