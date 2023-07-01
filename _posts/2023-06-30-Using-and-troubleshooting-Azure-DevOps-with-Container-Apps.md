---
title: "Using and troubleshooting Azure DevOps with Container Apps"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Troubleshooting
    - Container Apps
categories:
    - Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Deployment
header:
    teaser: "/assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-06-30 12:00:00
---

This post will cover a few different ways to use Azure DevOps with Container Apps, in regards to deployment methods, as well as some general troubleshooting guidance for some of these methods.

# Deployment methods
You can deploy to Azure Container Apps from Azure DevOps in a few ways, below may be more common examples:
- **Azure Container Apps Deploy** - This is a built-in ADO task named `AzureContainerApps@1`
  - This lets you deploy via code with the Oryx++ builder
  - This can also let you build and deploy an image if a `Dockerfile` is found in your project root
  - This can also let you specify an image that is already built and pushed to ACR for the Container App to use
- **Azure CLI** - You can use the Azure CLI to deploy images after building it on the pipeline
- **IaaC** - Templates such as ARM, Bicep, or tools like Terraform or Pulumi, could be invoked in a pipeline to update infrastructure. 
- And others.

Documentation on using Azure DevOps with Container Apps can be found [here](https://learn.microsoft.com/en-us/azure/container-apps/azure-pipelines).

Out of these, we'll cover two, that being the builtin Azure Container Apps task, and using the Azure CLI for deployment - as well as some troubleshooting.

# Deploying with Azure Container App Deploy task
Prior to running the below quickstarts, we'll go through what's needed to create a pipeline for this.

1. Create a Container App Environment and Container App - follow this document [here](https://learn.microsoft.com/en-us/azure/container-apps/quickstart-portal#create-a-container-app).
2. Create an Azure DevOps organization, if one does not exist. See [here](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/create-organization?view=azure-devops).
3. Create an Azure DevOps project. See [here](https://learn.microsoft.com/en-us/azure/devops/organizations/projects/create-project?view=azure-devops&tabs=browser).

## Azure Container App task flow:
a. If no `Dockerfile` is found or provided in the provided application source, the following steps are performed by this task:

- Uses the Oryx++ Builder to build the application source using Oryx to produce a runnable application image
  - Pushes this runnable application image to the provided Azure Container Registry
  - Creates or updates a Container App based on this image

b. If a `Dockerfile` is found or discovered in the application source, the builder won't be used and the image will be built with a call to docker build and the Container App will be created or updated based on this image.

c. If a previously built image has already been pushed to the ACR instance and is provided to this task, no application source is required and the image will be used when creating or updating the Container App.

> **NOTE**: A YAML configuration file can also be provided to modify specific properties on the Container App that is created or updated

## Oryx++
The Azure Container Apps task uses Oryx++, which essentially acts as a **build pack** - using [pack CLI](https://buildpacks.io/docs/tools/pack/) to be able to generate runnable Docker images from source code (without a `Dockerfile` existing in the source).

The runtime's that Oryx++ is able to build follows what is described [here](https://github.com/microsoft/Oryx/blob/main/doc/supportedRuntimeVersions.md), for supported runtime versions. Which is the same as what App Service Linux (Blessed Images) currently supports, as it makes use of Oryx.

All supported platform versions (including runtime) can be found [here](https://github.com/microsoft/Oryx/blob/main/doc/supportedPlatformVersions.md).

Full information on the Azure Container Apps task - which also talks about Oryx++ and it's usage of the pack CLI can be found [here](https://github.com/Azure/container-apps-deploy-pipelines-task/blob/main/README.md).

The concept of what pack does, and what Buildpacks are, can be read here - [pack - concepts](https://buildpacks.io/docs/concepts/). Reading this, shows that Oryx itself essentially acts like a Buildpack of sorts. While "normal" Oryx may not generate an on-the-fly image for runtime, Oryx++ is what does this and takes it a step further with Container Apps.

## Quickstarts
### Using Oryx++ to build source code into a runnable Docker Image
For this example, you need some type of source code - with a language that is a part of what Oryx++ is able to build, which is defined [here](https://github.com/microsoft/Oryx/blob/main/doc/supportedRuntimeVersions.md).

Here, we'll use PHP as an example before starting. Create a folder for the below code, then `cd` into that folder.

1. Create a `index.php` file with the following contents:

```php
<?php

echo "container-apps-cicd-examples";
```

2. Push your code to a repository, such as either one in GitHub, or, enable Azure Repo's in your Azure DevOps project.
3. Click on **Pipelines** on the left hand side - and then **Create new pipeline**:

![ACA - ADO - Project](/media/2023/06/azure-oss-blog-aca-ado-1.png)

4. Select where your source code is located from the list
5. Select the project you created
6. Select **Starter pipeline**

![ACA - ADO - Setup](/media/2023/06/azure-oss-blog-aca-ado-2.png)

7. Add the following into your `azure-pipelines.yaml`:

```
# Starter pipeline
# Start with a minimal pipeline that you can customize to build and deploy your code.
# Add steps that build, run tests, deploy, and more:
# https://aka.ms/yaml

trigger:
- master

variables:
  vmImageName: 'ubuntu-latest'

stages:
- stage: Build
  displayName: Build and push stage
  jobs:
  - job: Build
    displayName: Build
    pool:
      vmImage: $(vmImageName)
    steps:
```

8. Next, click on **Show Assistant** in the top right and search for "Azure Container App"

![ACA - ADO - Show assistant](/media/2023/06/azure-oss-blog-aca-ado-3.png)

![ACA - ADO - Show assistant](/media/2023/06/azure-oss-blog-aca-ado-4.png)

9. In the Azure Container Apps Deploy task, fill out the following details:
- **Application source path**: Set the value to `'$(System.DefaultWorkingDirectory)'`
- **Azure Resource Managed connection**: Choose your Service Connection or Subscription. Click "Authorize" if needed.
- **Azure Container Registry name**: Input your ACR name (eg., myacr)
- **Azure Container Registry username**: Input your ACR username
- **Azure Container Registry password**: Input your ACR password
- **Docker image to build**: Input this in the form of "youracr.azurecr.io/arbitraryname:arbitrarytag"
- **Azure Container App name**: The name of your pre-created Container App. **This will automatically create one if it doesn't already exist**
- **Azure resource group name**: Input your resource group. **This will automatically create one if it doesn't already exist**
- **Application runtime stack**: In this example, we'll use `php:8.2`. Choose the values mimicking Blessed Image values - see [here](https://github.com/microsoft/Oryx/blob/main/doc/supportedRuntimeVersions.md)
- **Application target port**: Input your applications listening port
- **Location of the Container App**: Eg., eastus, westus, etc.
- **Ingress setting**: Values are "external" or "internal". This example will use "external".

10. Click "Add". Then click "View" -> "Permit" to authorize the pipeline to run on the pipeline UI screen.

The full `.yaml` should now look like this:

```yaml
trigger:
- master

variables:
  vmImageName: 'ubuntu-latest'

stages:
- stage: Build
  displayName: Build and push stage
  jobs:
  - job: Build
    displayName: Build
    pool:
      vmImage: $(vmImageName)
    steps:
      - task: AzureContainerApps@1
        inputs:
          appSourcePath: '$(System.DefaultWorkingDirectory)'
          azureSubscription: 'somesub-or-serviceconnection'
          acrName: 'someacr'
          acrUsername: 'someacracr'
          acrPassword: 'someacrpassword'
          imageToBuild: 'someoacr.azurecr.io/some-aca-ado:latest'
          containerAppName: 'some-azure-devops'
          resourceGroup: 'some-rg'
          containerAppEnvironment: 'some-caenv'
          runtimeStack: 'php:8.2'
          targetPort: '8080'
          location: 'eastus'
```

After running this deployment, we can see a few things going on here in pipeline logging for this task now:
- `No Dockerfile was provided or found for the application source; attempting to create a runnable application image using the Oryx++ Builder.`
  - Which confirms Oryx++ is building from source
- `8.2: Pulling from oryx/php`
  - Which confirms our specified image is being downloaded as the runtime image as seen in the command passed to `pack`:
    - `/usr/local/bin/pack build someoacr.azurecr.io/some-aca-ado:latest --path /home/vsts/work/1/s --builder mcr.microsoft.com/oryx/builder:20230208.1 --run-image mcr.microsoft.com/oryx/php:8.2 --env CALLER_ID=azure-pipelines-v1`
- We can now see typical Oryx detection logic being ran (the below will vary based on language):

```
[builder] Detecting platforms...
[builder] Detected following platforms:
[builder]   php: 8.0.28
[builder] Version '8.0.28' of platform 'php' is not installed. Generating script to install it...
...
[builder] No 'composer.json' file found; not running 'composer install'.
```
- `Successfully built image 'someacr.azurecr.io/some-aca-ado:latest'`
  - Which confirms our image was successfully built
- `/usr/bin/docker push someacr.azurecr.io/some-aca-ado:latest` 
  - Which confirms our image was successfully pushed to ACR

If all is successful at this point, you should see a message at the end of the Azure Container App deployment task stating `Your container app some-azure-devops has been created and deployed! Congrats!`.

#### Troubleshooting
##### ERROR: failed to build: invalid run-image 'mcr.microsoft.com/oryx/[image]'
Review the Azure DevOps pipeline task logging for the more descriptive reason this failed.

For example, `image 'mcr.microsoft.com/oryx/[someimage:sometag]' does not exist on the daemon: not found` - this would indicate the value passed to `runtimeStack` does not actually exist.

As a rule of thumb, use the base `mcr.microsoft.com/oryx/[image:tag]` where image:tag is pulled from the runtimes defined [here](https://github.com/microsoft/Oryx/blob/main/doc/supportedRuntimeVersions.md).

##### Error: Unable to determine runtime stack from application source
- Oryx may not be able to determine the source based on the project being used. Review if you are building in the correct location of your project root, relative to what Oryx can determine based off of source code files.
- Or, the project may be using a language that Oryx does not support when building from source.
- If a specific framework is used that has "non standard" project structures, this may affect being able to build the application from source.

##### Unsupported runtimes - building Go applications
Currently, at this time, Go is not a supported platform for Oryx++ where there is a matching image in the `mcr.microsoft.com/oryx` repository.

For direct support - you must use building from a `Dockerfile` or having a `Dockerfile` in ACR already - as supported methods of deployment for Go.

### Using the Azure Container Apps Task to build an existing Dockerfile
You can use almost the same exact task set up above, in the Oryx++ section, to be able to build a `Dockerfile`, deploy it to ACR - and then ultimately have Container Apps use it.

As seen above:

```yaml
- task: AzureContainerApps@1
  inputs:
    appSourcePath: '$(System.DefaultWorkingDirectory)'
    azureSubscription: 'somesub-or-serviceconnection'
    acrName: 'someacr'
    acrUsername: 'someacracr'
    acrPassword: 'someacrpassword'
    imageToBuild: 'someoacr.azurecr.io/some-aca-ado:latest'
    containerAppName: 'some-azure-devops'
    resourceGroup: 'some-rg'
    containerAppEnvironment: 'some-caenv'
    targetPort: '8080'
    location: 'eastus'
```

This task would assume that `appSourcePath`'s location contains a `Dockerfile`. If it does, you'll see this:
- `Found existing Dockerfile in provided application source at path '/home/vsts/work/1/s/Dockerfile'; image will be built from this Dockerfile.`

#### Troubleshooting
##### ERROR: (InvalidParameterValueInContainerTemplate) The following field(s) are either invalid or missing. 
There may be more than one reason why this message appears. For example:

```
ERROR: (InvalidParameterValueInContainerTemplate) The following field(s) are either invalid or missing. Field 'template.containers.someimage.image' is invalid with details: 'Invalid value: "someacr.azurecr.io/somerepo:sometag": GET https:: MANIFEST_UNKNOWN: manifest tagged by "sometag" is not found;
```
This would indicate the image or tag referenced is not found in the configured registry.

- If relying on the `imageToDeploy` property, ensure that it either exists in the Azure Container Registry (if prebuilt), or, the task is properly configured to build a `Dockerfile` in your project

##### Error: Unable to create runnable application image using provided or discovered Dockerfile.
Review the additional error message details as to why this is the case. This may normally be accompanied by an `exit code 1` - and can happen for various reasons. For example:

```
COPY failed: file not found in build context or excluded by .dockerignore: stat init_container.sh: file does not exist
```

The reason why this task failed is normally towards the top out of the output after the task has ran.

##### Unable to build from a nested directory
If the `Dockerfile` is in it's own separate folder, make sure that the `dockerFilePath` is **relative** to `appSourcePath`.

As an example, let's say we have a project directory, and `test` folders our `Dockerfile`. `/test` is in our project.

```yaml
appSourcePath: '$(System.DefaultWorkingDirectory)'
dockerFilePath: '$(System.DefaultWorkingDirectory)/test'
```

The above will fail because `appSourcePath` points to `/home/vsts/work/1/s` (`$(System.DefaultWorkingDirectory)` equates to that directory)

And knowing this, instead of `dockerFilePath` pointing to `/home/vsts/work/1/s/test`, it's actually pointing to `/home/vsts/work/1/s/home/vsts/work/1/s/test`.

This same scenario can happen even if not using a builtin variable for ADO directories like `$(System.DefaultWorkingDirectory)`, but it can also be any other absolute path.

Change these two properties to the following instead:

```yaml
appSourcePath: '$(System.DefaultWorkingDirectory)'
dockerFilePath: './test'
```

You can see the arguments passed to `docker build` in the Azure Container Apps task logging. The above (correct) example would look like this:

```
/usr/bin/docker build --tag someacr.azurecr.io/some-aca-ado-php:v2 --file /home/vsts/work/1/s/test/Dockerfile /home/vsts/work/1/s
```

For troubleshooting, this command can be reviewed. Knowing that `/home/vsts/work/1/s` would be the "root" in this case may help troubleshooting further.

### Using the Azure Container Apps Task to push an already existing image
1. Build the image first - either locally, or prior in the pipeline (assuming the Azure Container Apps Task is not the one to build the image)
2. The image needs to be pushed to Azure Container Registry at some point.
3. At this point, the task can target the image in the registry. Below is an example - which will then set the Container App to use this image:

```yaml
trigger:
  - master
  
variables:
  vmImageName: 'ubuntu-latest'

stages:
- stage: Build
  displayName: Build and push stage
  jobs:
  - job: Build
    displayName: Build
    pool:
      vmImage: $(vmImageName)
    steps:
      - task: AzureContainerApps@1
        inputs:
          azureSubscription: 'some-subscription-or-service-connection'
          acrName: 'someacr'
          acrUsername: 'someacr'
          acrPassword: 'someacrpass'
          imageToDeploy: 'someacr.azurecr.io/someimage:latest'
          containerAppName: 'some-azure-devops'
          resourceGroup: 'some-rg'
          containerAppEnvironment: 'some-caenv'
          targetPort: '8000'
          ingress: 'external'
          location: 'eastus'
```

# Deploying with the Azure CLI
You can deploy to Azure Container Apps with the Azure CLI. This approach does not use the Azure Container App task. This would insinuate that there is a `Dockerfile` in your project.

Using this approach would have us build the Docker image on the pipeline with the builtin Azure DevOps Docker task (`Docker@2`), push it to ACR, and then use the Azure CLI to configure the Container App to use this image.

> **NOTE**: Using the "Task assistant" helps configure these tasks for authenticating with resources much easier and faster.

1. Create a new pipeline
2. From the quickstart templates, choose **Docker - build and push and image to Azure container registry**

![ACA - ADO - Templates](/media/2023/06/azure-oss-blog-aca-ado-5.png)

3. Fill out the next screens by choosing your subscription and selecting your container registry on the next screen.
4. In your pipeline, choose **Show assistant** - search for "azure cli" and fill out the task with your service connection and other details.

![ACA - ADO - Az CLI task](/media/2023/06/azure-oss-blog-aca-ado-6.png)

Below is a full example of this:

```yaml
# Docker
# Build and push an image to Azure Container Registry
# https://docs.microsoft.com/azure/devops/pipelines/languages/docker

trigger:
- master

resources:
- repo: self

variables:
  # Container registry service connection established during pipeline creation
  dockerRegistryServiceConnection: '00000000-0000-0000-0000-000000000000'
  imageRepository: 'someimage'
  containerRegistry: 'someacr.azurecr.io'
  dockerfilePath: '$(Build.SourcesDirectory)/Dockerfile'
  tag: '$(Build.BuildId)'

  # Agent VM image name
  vmImageName: 'ubuntu-latest'

stages:
- stage: Build
  displayName: Build and push stage
  jobs:
  - job: Build
    displayName: Build
    pool:
      vmImage: $(vmImageName)
    steps:
    - task: Docker@2
      displayName: Build and push an image to container registry
      inputs:
        command: buildAndPush
        repository: $(imageRepository)
        dockerfile: $(dockerfilePath)
        containerRegistry: $(dockerRegistryServiceConnection)
        tags: |
          $(tag)
        
- stage: Deploy
  displayName: Deploy
  jobs:
  - job: Deploy
    displayName: Deploy
    pool:
      vmImage: $(vmImageName)
    steps:
    - task: AzureCLI@2
      inputs:
        azureSubscription: '00000000-0000-0000-0000-000000000000'
        scriptType: 'bash'
        scriptLocation: 'inlineScript'
        inlineScript: 'az containerapp up -n some-azure-devops -g some-rg --image $(containerRegistry)/$(imageRepository):$(tag) --ingress external --target-port 80 --environment some-acaenv --registry-username "someacrusername" --registry-password "somepass"'
```

# Further post-deployment troubleshooting
If the deployment itself is successful - but issues are seen afterwards, then this is most likely a post-deployment problem (eg., `crashBackOffLoop`, pod failing to be created, container exiting, etc.). This could be misconfiguration or application-related.

See this post - [Container Apps and Failed Revisions](https://azureossd.github.io/2022/08/01/Container-Apps-and-failed-revisions-Copy/index.html) - for some guidance on where to start looking if post-deployment issues are deemed to the problem.