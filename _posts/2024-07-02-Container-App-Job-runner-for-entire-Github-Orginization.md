---
title: "Using a Container App Job as Github Actions Runner for your entire Github Orginization"
author_name: "Keegan D'Souza"
tags:
    - Organization
    - Github Action
    - Container App Jobs
categories:
    - Azure Container App Jobs # Azure App Service on Linux, Azure App Service on Windows,  
    - How To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azure-containerapps-logo.png"
toc: true
toc_sticky: true
date: 2024-07-02 12:00:00
---

## Overview 

You can use Container App Jobs as an Github Actions Runner.
However there are specific steps in case you need to use your Container App Job for Github Action Runners for all repos under your Github Organization.

This blog will detail the specifc changes in order to accomplish this.

## Prerequisite 
Please validate your runner is working with a single repo under your personal account before switching over to a Github Organization, by following the below tutorial. 

**[Tutorial: Deploy self-hosted CI/CD runners and agents with Azure Container Apps jobs](https://learn.microsoft.com/en-us/azure/container-apps/tutorial-ci-cd-runners-jobs?tabs=bash&pivots=container-apps-jobs-self-hosted-ci-cd-github-actions)**



The following blog can help you troubleshooot common issues when settings this up: 
[Troubleshooting Jobs When Using Self Hosted CICD Runners](https://azureossd.github.io/2023/11/29/Troubleshooting-Jobs-when-using-self-hosted-CICD-runners/index.html)

The offical Keda Documentation for the scaler used can be found here: [Github Runner Scaler - KEDA](https://keda.sh/docs/2.14/scalers/github-runner/)


## Modification for Github Organization.

### Generate a new personal access token.
- Naviagate to your Github **Organization** Settings. Make sure Fine-grained personal access tokens are enabled. Under *Third-party Access -> Personal access tokens -> Settings*
![Github-Org-PAT-Permissions](/media/2024/07/github-org-pat-permissions.png)
   
- Generate your personal account token (PAT) by naviating to your Github **Account** settings. Under *Developer Settings -> Personal access tokens -> Fine-Graned Tokens - Generate new token*.
Your token should have the following permissions.

    **Organization Permissions**

    | Setting             | Value                 |
    | --------------------| ----------------------|
    | Self Hosted Runners | Select Read and write.|

    **Repository Permissions**

    | Setting       | Value                 |
    | --------------| ----------------------|
    | Actions       | Select Read-only.     |
    | Administration| Select Read and write.|
    | Meta          | Select Read-only.     |
   

    ![PAT-Permissions](/media/2024/07/pat-permissions.png)

- After your new personal access token is generated save this value.
- Then update your container app secret containing your personal access token value, by navigating to your container app job on the Azure Portal under the *secrets* tab.
  
  ![Pat-ACA-Secret](/media/2024/07/pat-aca-secret.png) 

### Update the Keda Scaling rule MetaData.
   - On the Azure Portal for your Container App Job navigate to the *Event-driven scaling* tab, click on the *github-scaling* to edit it. The only two required values needed in the scale rule Metadata section are listed below.

        **Scale rule Metadata**

        | Name       | Value                           |
        | -----------|---------------------------------|
        | owner      | **the-name-of-your-organization** |
        | runnerScope| org                             |
    
    
    
        ![Scale-Rule-Meta-Data](/media/2024/07/scale-rule-meta-data.png)

### Update your container runner environment variables. 

   - On the Azure Portal for your Container App Job navigate to the *Containers* tab and click on your container to edit it. These are the follow values you for the environment variables you need to edit.

        **Runner Container Environment Variables**

        | Name                      |Source            |  Value                 |
        | --------------------------|------------------|------------------------|
        | GITHUB_PAT                |Reference a secret|personal-access-token
        | REGISTRATION_TOKEN_API_URL|Manual            |https://api.github.com/orgs/**your-organization-name**/actions/runners/registration-token     |
        | GH_URL                    |Manual            |https://github.com/**your-organization-name**      |

   ![runner-container-env-vars](/media/2024/07/runner-container-env-vars.png)



Your Container App Job should now be able to act as a runner for your all repos under your entire Github Organization.

