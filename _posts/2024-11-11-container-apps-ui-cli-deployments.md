---
title: "Container Apps - Deployments through UI and CLI"
author_name: "Prakash Matte"
tags:
    - Container Apps
    - Kubernetes
    - Deploy
    - UI
    - CLI
categories:
    - Container Apps
    - Kubernetes
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/azure-containerapps-logo.png
toc: true
toc_sticky: true
date: 2024-11-11 12:00:00
---

This post will cover a few different ways to use CLI / UI with Container Apps, in regards to deployment methods, as well as some general troubleshooting guidance for these methods.

# Getting started

[Azure Container Apps](https://docs.microsoft.com/en-us/azure/container-apps/overview) enables you to run microservices and containerized applications on a serverless platform. There is a few ways currently to deploy your applications to it, either from [Bicep](https://docs.microsoft.com/en-us/azure/container-apps/microservices-dapr-azure-resource-manager?tabs=bash&pivots=container-apps-bicep) and [ARM templates](https://docs.microsoft.com/en-us/azure/container-apps/microservices-dapr-azure-resource-manager?tabs=bash&pivots=container-apps-arm), GitHub Actions, [Azure Portal](https://docs.microsoft.com/en-us/azure/container-apps/get-started-existing-container-image-portal?pivots=container-apps-private-registry), [Azure CLI](https://docs.microsoft.com/en-us/azure/container-apps/get-started-existing-container-image?tabs=bash&pivots=container-apps-private-registry), [Visual Studio](https://docs.microsoft.com/en-us/azure/container-apps/deploy-visual-studio), and [Visual Studio Code](https://docs.microsoft.com/en-us/azure/container-apps/deploy-visual-studio).

**Prerequesites**:

1. An Azure account with an active subscription. If you don't have one, [you can create one for free](https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account?icid=azurefreeaccount)
2. Existing container app. If it was not created ealier, you could create a Container App from portal.azure.com using "Quickstart image: Simple hello world container"

<div style="border: 1px solid black;"><img src="/media/2024/11/upload-artifact-create-quick-start-app.png" /></div>

3. Install the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli), if you decide to use CLI instead of UI.

4. Once the environment and/or app is created, you may browse the Application URL from Container App -> Overview page to see if the app was created properly.

<div style="border: 1px solid black;"><img src="/media/2024/11/upload-artifact-quick-start-app-output.png" /></div>

5. Grab the Container App Name, Container Environment Name, Location, Resource Group and the Subscription ID from Container App -> Overview page

# Deployment

## Upload artifact from Portal UI

1. Go to Container App -> Deployment -> Artifact (Preview)
2. Browse .jar / .war / .zip / .tar.gz file from "Upload Artifact" section.

<div style="border: 1px solid black;"><img src="/media/2024/11/upload-artifact-from-ui.png" /></div>

3. If the upload is successful, you will see the succesful message in the top right corner. 

<div style="border: 1px solid black;"><img src="/media/2024/11/upload-artifact-from-ui-success.png" /></div>

4. Browsing Application URL should show the output as expected. Sample output is below.

<div style="border: 1px solid black;"><img src="/media/2024/11/upload-artifact-from-ui-success-output.png" /></div>

**NOTE**: I developed a RESTful API using Java Spring Boot. Hence it shows as a JSON array / string instead of a web page.

5. If you still see the default parking page, check the logs from ContainerAppSystemLogs_CL. You may refer [Port mismatch error](#the-targetport-80-does-not-match-the-listening-port-8080) for the complete details. 

## Upload artifact from CLI

1. Run 'az containerapp up' with --artifact parameter pointing to the jar file
```shell
az containerapp up `
    --name $API_NAME `
    --resource-group $RESOURCE_GROUP `
    --location $LOCATION `
    --environment $ENVIRONMENT `
    --artifact ./target/containerapps-albumapi-java-0.0.1-SNAPSHOT.jar `
    --ingress external `
    --target-port 8080 `
    --subscription $SUBSCRIPTION
```

Sample logs from local machine.

<img src="/media/2024/11/containerappup-upload-artifact-cli-logs.png" />

This is the sample output

<div style="border: 1px solid black;"><img src="/media/2024/11/containerappup-upload-artifact-cli-output.png" /></div>

2. To know more about other parameters, you may refer [Deploy the Artifact](https://learn.microsoft.com/en-us/azure/container-apps/deploy-artifact?tabs=azure-powershell#deploy-the-artifact).

## Upload source code from CLI

1. Run 'az containerapp up' with --source parameter pointing to the current directory
```shell
az containerapp up `
    --name $API_NAME `
    --resource-group $RESOURCE_GROUP `
    --location $LOCATION `
    --environment $ENVIRONMENT `
    --source .
```

Sample logs from local machine.

<img src="/media/2024/11/containerappup-upload-artifact-cli-source-build-logs.png" />

This is the sample output

<div style="border: 1px solid black;"><img src="/media/2024/11/containerappup-upload-artifact-cli-source-output.png" /></div>

2. To know more about other parameters, you may refer [Deploy the Source Code](https://learn.microsoft.com/en-us/azure/container-apps/quickstart-code-to-cloud?tabs=powershell%2Ccsharp#build-and-deploy-the-container-app)

# Troubleshooting

## The TargetPort 80 does not match the listening port 8080

Go to Ingress Settings and change Target Port to match with the port your container is exposing at. 

Eg: Change from 80 to 8080. Here 8080 is the port your app is running at or the app is exposing at. 

<div style="border: 1px solid black;"><img src="/media/2024/11/containerappup-update-target-port-ingress.png" /></div>

If the error does not show up on the UI, you could check the logs from ContainerAppSystemLogs_CL table. The column name to check is Log_s.

If there are multiple Container Apps in the Container App Environment, better to filter by the Container App Name. 

Sample Query:

```sql
ContainerAppSystemLogs_CL
| where ContainerAppName_s == 'album-api'
| project Time=TimeGenerated, EnvName=EnvironmentName_s, AppName=ContainerAppName_s, Revision=RevisionName_s, Message=Log_s
| take 100
```

The complete details of the query is available at [Kusto Queries](https://learn.microsoft.com/en-us/azure/container-apps/log-monitoring?tabs=bash#azure-portal)

To troubleshoot the issue further, you may refer - [Container Apps - Target port does not match the listening port ](https://azureossd.github.io/2024/10/08/Container-Apps-'Target-port-does-not-match-the-listening-port'/index.html)

## Why do I get "Impossible to build the artifact file" error
When you run the "containerappup" command from your local machine and it returns the following error, check if Docker Desktop is running in your computer. If not, start running and execute the command again. 

"Impossible to build the artifact file .\target\app.jar with ACR Task. Please make sure that you use --source and target a directory, or if you want to build your artifact locally, please make sure Docker is running on your machine."

## Why do I get "Java not supported" error

1. Run 'az upgrade'
2. Once it is completed, you may get the following message. 

Argument '--artifact' is in preview and under development. Reference and support levels: https://aka.ms/CLI_refstatus