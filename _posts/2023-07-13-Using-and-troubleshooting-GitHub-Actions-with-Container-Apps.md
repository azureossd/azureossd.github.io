---
title: "Using and troubleshooting GitHub Actions with Container Apps"
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
date: 2023-07-13 12:00:00
---

This post will cover a few different ways to use GitHub Actions with Container Apps, in regards to deployment methods, as well as some general troubleshooting guidance for some of these methods.

Public information on using GitHub Actions with Container Apps can be found [here](https://docs.microsoft.com/en-us/azure/container-apps/github-actions-cli?tabs=bash) and [here](https://learn.microsoft.com/en-us/azure/container-apps/github-actions).

# Deployment methods
You can deploy to Azure Container Apps from GitHub Actions in a few ways, below may be more common examples:
- **azure/container-apps-deploy-action@v1** - GitHub Action
  - This lets you deploy via code with the Oryx++ builder
  - This can also let you build and deploy an image if a `Dockerfile` is found in your project root
  - This can also let you specify an image that is already built and pushed to ACR for the Container App to use
- **Azure Portal** - You can use the "Continuous Deployment" blade to set up CI/CD with GitHub Actions. This follows the same above logic with Oryx++ and determining if a `Dockerfile` exists or proper source code is present to use Oryx++ as a builder. This doesn't let you select a pre-existing image in a registry to use.
  - **NOTE**: Adding CI/CD via this option will create a file named `someapp-AutoDeployTrigger-00000000-0000-0000-0000-00000000000.yml` to your repository under the `.github/workflows` directory
  - If you "Disconnect" CI/CD via the Azure Portal - it will **delete** this file from that directory.
- **Azure CLI** - You can use the Azure CLI to deploy their images after building it on the pipeline
- **IaaC** - Templates such as ARM, Bicep, or tools like Terraform or Pulumi, could be invoked in a pipeline to update infrastructure. 
- And others.

## azure/container-apps-deploy-action@v1 action flow
a. If no `Dockerfile` is found or provided in the provided application source, the following steps are performed by this task:

- Uses the Oryx++ Builder to build the application source using Oryx to produce a runnable application image
  - Pushes this runnable application image to the provided Azure Container Registry
  - Creates or updates a Container App based on this image

b. If a `Dockerfile` is found or discovered in the application source, the builder won't be used and the image will be built with a call to docker build and the Container App will be created or updated based on this image.

c. If a previously built image has already been pushed to the ACR instance and is provided to this task, no application source is required and the image will be used when creating or updating the Container App.

> **NOTE**: A YAML configuration file can also be provided to modify specific properties on the Container App that is created or updated

# Oryx++
The `container-apps-deploy-action@v1` action uses Oryx++, which essentially acts as a **build pack** - using [pack CLI](https://buildpacks.io/docs/tools/pack/) to be able to generate runnable Docker images from source code (without a `Dockerfile` existing in the source).

The runtime's that Oryx++ is able to build follows what is described [here](https://github.com/microsoft/Oryx/blob/main/doc/supportedRuntimeVersions.md), for supported runtime versions. Which is the same as what App Service Linux (Blessed Images) currently supports, as it makes use of Oryx.

All supported platform versions (including runtime) can be found [here](https://github.com/microsoft/Oryx/blob/main/doc/supportedPlatformVersions.md).

Full information on the `container-apps-deploy-action@v1` action - which also talks about Oryx++ and it's usage of the pack CLI can be found [here](https://github.com/marketplace/actions/azure-container-apps-build-and-deploy#pack-cli).

Main documentation on the task can be found [here](https://github.com/marketplace/actions/azure-container-apps-build-and-deploy).

# Quickstarts
Prior to running the below quick starts, we'll go through what's needed to a GitHub Actions workflow for the application. It's not required to create these Container App-based resources beforehand, but can speed up deployment time overall. It _is_ required to have a GitHub account.

1. Create a Container App Environment and Container App - follow this document [here](https://learn.microsoft.com/en-us/azure/container-apps/quickstart-portal#create-a-container-app).
2. Have an existing GitHub account and GitHub repository with the source code we want to deploy. If this is intended to use Oryx++, the source code should be one of the [Oryx supported runtimes](https://github.com/microsoft/Oryx/blob/main/doc/supportedRuntimeVersions.md).

## Deploying with the Azure Portal
This portal method now uses `container-apps-deploy-action@v1` action. This means that the above logic, where Oryx++ will be used if there is _no_ `Dockerfile` present - or - build an image _if_ a `Dockerfile` is present, will be done.

At this time, you cannot specify an existing/pre-existing image in Azure Container Registry through the Azure Portal.

Portal CI/CD logic follows what is defined above in [azure/container-apps-deploy-action@v1 action documentation](https://github.com/marketplace/actions/azure-container-apps-build-and-deploy)).

1. Go to the Container App and select the **Continuous Deployment** blade

    ![ACA GitHub CI/CD blade](/media/2023/07/azure-oss-blog-aca-cicd-2.png)

2. Fill out the below information in the blade:
   - **Signed in as**: (GitHub account to sign in with)
   - **Organization** - The GitHub organization
   - **Repository** - The repository that contains the source code
   - **Repository Source** - The container registry location, either ACR or non-ACR
     - The image options will depend on the repository source. Fill these out as needed.
   - **Dockerfile location**: Location of the `Dockerfile`. If empty, this expects `Dockerfile` to be in root
   - **Service principal settings**: Create a new Service Principal or use an existing on for authentcation
3. After, review the **Actions** tab on the GitHub Action side. You should now see the following, regardless if Oryx++ is being used or if building a Docker image"
   - A new directory named `.github/workflows` with the file `someapp-AutoDeployTrigger-00000000-0000-0000-0000-00000000000.yml` created inside this
   - A GitHub Actions workflow will automatically kick off. You'll see this commit message:
      - ![GitHub Action kickoff](/media/2023/07/azure-oss-blog-aca-cicd-1.png)

   - If a `Dockerfile` does not exist in the project, Oryx++ will look for buildable source code
   - If a `Dockerfile` does exist in the project root (or was specified in the portal) the `Dockerfile` will be built
   - Because of this, the `.yaml` will vary slightly for the `container-apps-deploy-action@v1` and its properties of the task

## Deploying with the container-apps-deploy-action@v1 task
This section implies this is either using a "manual" deployment method by manually creating a `.yaml` under `.github/workflows` in your GitHub repo and creating the code - or - by setting up CI/CD via Azure Portal and then changing logic in the `.yaml` later on.

### Using Oryx++ to build source code into a runnable Docker Image
Below is a full example of using Oryx++ to create a runnable image of our application:

{% raw %}
```yaml
name: Build and deploy an aplication to Container Apps

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # Use `actions/checkout@v3` to prevent `${{ github.workspace }}` from being empty
      - uses: actions/checkout@v3

      - name: Log in to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build and deploy Container App
        uses: azure/container-apps-deploy-action@v1
        with:
          appSourcePath: ${{ github.workspace }}
          acrName: ${{ secrets.AZURE_CONTAINER_REGISTRY_URL }}
          acrUsername: ${{ secrets.AZURE_CONTAINER_REGISTRY_USERNAME }}
          acrPassword: ${{ secrets.AZURE_CONTAINER_REGISTRY_PASSWORD }}
          containerAppName: some-app
          resourceGroup: some-rg
          runtimeStack: 'php:8.2'
```
{% endraw %}

The above example uses a Service Principal via `azure/login@v1` with an assigned role of `AcrPush` to push the image Oryx++ built, and then, uses Admin Credentials (implied by `acrUsername, acrPassword`) to have the Container App pull the image. This can also be changed out to use [Managed Identity](https://learn.microsoft.com/en-us/azure/container-apps/github-actions#create-a-container-app-with-managed-identity-enabled) instead, to pull the image.

This example implies it's specifying a PHP runtime (php 8.2) for our target image. Change this based on your source code.

#### Troubleshooting
##### ERROR: Unable to authenticate using AAD or admin login credentials. Please specify both username and password in non-interactive mode.

The main reason for this error will show earlier on in GitHub Action task logging. For example:

```
Access to registry '***' was denied. Response code: 401. Please try running 'az login' again to refresh permissions.
WARNING: Unable to get admin user credentials with message: The resource with name 'someacr' and type 'Microsoft.ContainerRegistry/registries' could not be found in subscription '***'.
```

- Review that the `acrName` is being passed the appropriate Azure Container Registry name
- If using Service Principals to authenticate via `azure/login` - ensure the principal has appropriate roles on the ACR. Eg., `acrpush`. View Azure Container Registry roles [here](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-roles?tabs=azure-cli).
- If using Admin Credential authentication, ensure the values for `acrUsername` and `acrPassword` is correct.

##### Error: Could not detect the language from repo.
This can surface if `runtimeStack` is not provided in the `container-apps-deploy-action@v1` action, and/or, Oryx is unable to determine the stack type.

For example, if relevant source code that Oryx would use to determine the project type lives under project root, but `appSourcePath` is set to `${{ github.workspace }}/src`, this will fail because it can't find relevant files

Additionally, if you are using `${{ github.workspace }} as the `appSourcePath`, but not using `actions/checkout@v3`, this directory may be empty.

Add the following, if needed:

```yaml
steps:
 - uses: actions/checkout@v3
```

##### ERROR: failed to build: invalid run-image 'mcr.microsoft.com/oryx/': invalid reference format
`runtimeStack` is not provided or `runtimeStack` is set to an invalid option. See [here](https://github.com/marketplace/actions/azure-container-apps-build-and-deploy) for support runtime options.

##### Error: Platform 'php' version '^7.3|^8.0' is unsupported. Supported versions:
This may show `Error: Platform 'php' version '^7.3|^8.0' is unsupported. Supported versions:` followed by a list of supported versions.

This is due to Oryx looking at `composer.json` - and the `require` object with the `php` property. Although this may be an edgecase, it can be worked around by changing this to a PHP version in the list.

##### ERROR: (InvalidParameterValueInContainerTemplate) The following field(s) are either invalid or missing. .. UNAUTHORIZED: authentication required
Review the full message, for instance:

```
ERROR: (InvalidParameterValueInContainerTemplate) The following field(s) are either invalid or missing. Field 'template.containers.simple-hello-world-container.image' is invalid with details: 'Invalid value: "***.azurecr.io/github-action/container-app:00000000.0": GET https:?scope=repository%3Agithub-action%2Fcontainer-app%3Apull&service=***.azurecr.io: UNAUTHORIZED: authentication required, visit https://aka.ms/acr/authorization for more information.';.
```

In the GET request we can see the scope of "pull" - indicating pulling the image. This can infer a few things:
- You are forgetting `acrUsername` and/or `acrPassword`, or, these values are incorrect
- The Managed Identity does not have `AcrPull` assigned to it

Review these points to resolve the issue.

##### Client does not have permission to perform action 'Microsoft.App/managedEnvironments/join/action' on linked scope(s)
During deployment on the Github Action side, you may see a message like this:

```
The client 'a' with object id 'a' has permission to perform action 'someaction' on scope '/subscriptions/1234/resourcegroups/some-rg/providers/Microsoft.App/managedEnvironments/someAcaEnv' but does not have permission to perform action 'Microsoft.App/managedEnvironments/join/action' on the linked scope(s) '....' or the linked scope(s) are invalid."
```

Review if the Service Principal being used needs additional permissions. For example, this can be tested with a **Contributor Role** for the principal by adding it on the Managed Environment (in the case above). 

##### Unsupported runtimes
Currently, at this time, Go is not a supported platform for Oryx++ where there is a matching image in the mcr.microsoft.com/oryx repository.

You must use building from a `Dockerfile` or having a `Dockerfile` in ACR already - as supported methods of deployment for Go.

### Using the Azure Container Apps Task to build an existing Dockerfile
You can use almost the same exact task set up above, in the Oryx++ section, to be able to build a Dockerfile, deploy it to ACR - and then ultimately have Container Apps use it.

Below is an example using Admin Credentials for the Azure Container Registry:

{% raw %}
```yaml
name: Trigger auto deployment for some-app

# When this action will be executed
on:
  # Automatically trigger it when detected changes in repo
  push:
    branches: 
      [ main ]
    paths:
    - '**'
    - '.github/workflows/someapp-AutoDeployTrigger-00000000-0000-0000-0000-000000000000.yml'

  # Allow mannually trigger 
  workflow_dispatch:
      
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout to the branch
        uses: actions/checkout@v2

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build and push container image to registry
        uses: azure/container-apps-deploy-action@v1
        with:
          appSourcePath: ${{ github.workspace }} 
          registryUrl: someacr.azurecr.io
          registryUsername: ${{ secrets.ACR_REGISTRY_USERNAME }}
          registryPassword: ${{ secrets.ACR_REGISTRY_PASSWORD }}
          containerAppName: some-app
          resourceGroup: some-rg
          imageToBuild: someacr.azurecr.io/some-app:${{ github.sha }}
          dockerfilePath: Dockerfile
```
{% endraw %}

This task would assume that `appSourcePath`'s location contains a `Dockerfile`. If it does, you'll something like the below followed by the begining of the build output from the supplied `Dockerfile`:

```
Run docker build \
Sending build context to Docker daemon
```

#### Troubleshooting
Some of the troubleshooting topics in the [Oryx++ troubleshooting section can apply here as well](#troubleshooting).

##### unable to evaluate symlinks in Dockerfile path: .. no such file or directory
You may see the following error and message:

```
Run docker build \
unable to prepare context: unable to evaluate symlinks in Dockerfile path: lstat /home/runner/work/your-repo/your-repo/github: no such file or directory
Error: Process completed with exit code 1.
```

This is usually indicative that `dockerfilePath` and pointing to a location that a `Dockerfile` does **not** exist at. The recomendation here is to ensure the `Dockerfile` is at the path specified.

##### dial tcp: lookup ***1.azurecr.io: no such host
The full message may look like:

```
Get "https://***1.azurecr.io/v2/": dial tcp: lookup ***1.azurecr.io: no such host
```
This can be for a few reasons:
- The registry name is incorrect, doesn't exist, or was deleted
- The GitHub Action client is unable to access the registry.
  - For example, if the client is public but the registry is behind a secure network
  - If the client is _within_ the network, possibly other networking environment considerations would need to be looked at - such as failure to resolve DNS from the client or that specific registry address

### Using the Azure Container Apps Task to build an existing image in Azure Container Registry
You can deploy images to Container Apps that are already prebuilt and existing. For instance:

{% raw %}
```yaml
name: Trigger auto deployment for some-app

# When this action will be executed
on:
  # Automatically trigger it when detected changes in repo
  push:
    branches: 
      [ main ]
    paths:
    - '**'
    - '.github/workflows/someapp-AutoDeployTrigger-00000000-0000-0000-0000-000000000000.yml'

  # Allow mannually trigger 
  workflow_dispatch:
      
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout to the branch
        uses: actions/checkout@v2

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build and push container image to registry
        uses: azure/container-apps-deploy-action@v1
        with: 
          registryUrl: someacr.azurecr.io
          registryUsername: ${{ secrets.ACR_REGISTRY_USERNAME }}
          registryPassword: ${{ secrets.ACR_REGISTRY_PASSWORD }}
          containerAppName: some-app
          resourceGroup: some-rg
          imageToDeploy: someacr.azurecr.io/some-app:some-tag
```
{% endraw %}

Note the change to **imageToDeploy**. This is targeting Azure Container Registry, where said image _should_ already exist. It then uses that image to have the Azure Container App pull and run it.

#### Troubleshooting
Some of the topics in the **"Using the Azure Container Apps Task to build an existing Dockerfile"** and **"Using Oryx++ to build source code into a runnable Docker Image"** will apply here as well.

##### ERROR: (InvalidParameterValueInContainerTemplate) The following field(s) are either invalid or missing.
There may be more than one reason why this message appears. For example:

```
ERROR: (InvalidParameterValueInContainerTemplate) The following field(s) are either invalid or missing. Field 'template.containers.someimage.image' is invalid with details: 'Invalid value: "someacr.azurecr.io/somerepo:sometag": GET https:: MANIFEST_UNKNOWN: manifest tagged by "sometag" is not found;
```
This would indicate the image or tag referenced is not found in the configured registry.
- If relying on the `imageToDeploy` property, ensure that it either exists in the Azure Container Registry (if prebuilt), or, the task is properly configured to build a Dockerfile in your project

## Using the Azure CLI to deploy
The below method to deploy was originally what would be created when setting up CI/CD from the Azure Portal in Container Apps. With the introduction of the `azure/container-apps-deploy-action@v1` action - the below is no longer used on creation.

However, if you did not want to use that action for some reason, you could still use the below approach which effectively does the same work as `azure/container-apps-deploy-action@v1`, minus the Oryx++ builder usage.

{% raw %}
```yaml
name: Trigger auto deployment for containerapp app

# When this action will be executed
on:
  # Automatically trigger it when detected changes in repo
  push:
    branches: 
      [ main ]
    paths:
    - '**'
    - '.github/workflows/someapp-AutoDeployTrigger-00000000-0000-0000-0000-000000000000.yml'

  # Allow mannually trigger 
  workflow_dispatch:      

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout to the branch
        uses: actions/checkout@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1

      - name: Log in to container registry
        uses: docker/login-action@v1
        with:
          registry: yourcontainerregistry.azurecr.io
          username: ${{ secrets.YOURCONTAINERAPPNAME_REGISTRY_USERNAME }}
          password: ${{ secrets.YOURCONTAINERAPPNAME_REGISTRY_PASSWORD }}

      - name: Build and push container image to registry
        uses: docker/build-push-action@v2
        with:
          push: true
          tags: yourcontainerregistry.azurecr.io/yourContainerAppName:${{ github.sha }}
          file: ./Dockerfile
          context: ./


  deploy:
    runs-on: ubuntu-latest
    needs: build
    
    steps:
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.YOURCONTAINERAPPNAME_REGISTRY_USERNAME }}


      - name: Deploy to containerapp
        uses: azure/CLI@v1
        with:
          inlineScript: |
            echo "Installing containerapp extension"
            az config set extension.use_dynamic_install=yes_without_prompt
            echo "Starting Deploying"
            az containerapp registry set -n yourContainerAppName -g yourResourceGroup --server yourcontainerregistry.azurecr.io --username  ${{ secrets.YOURCONTAINERAPPNAME_REGISTRY_USERNAME }} --password ${{ secrets.YOURCONTAINERAPPNAME_REGISTRY_PASSWORD }}
            az containerapp update -n yourContainerAppName -g yourResourceGroup --image yourcontainerregistry.azurecr.io/yourContainerAppName :${{ github.sha }}
```
{% endraw %}
  
In this example, we add three secrets to the GitHub repository - `YOURCONTAINERAPPNAME_REGISTRY_USERNAME`, `YOURCONTAINERAPPNAME_REGISTRY_PASSWORD` and `YOURCONTAINERAPPNAME_AZURE_CREDENTIALS` to be referenced in our `.yaml`.
