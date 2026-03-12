---
title: "Using pack cli and buildpacks to deploy Dockerfile-less apps to Web App for Containers"
author_name: "Anthony Salemo"
tags:
    - Configuration
    - Docker
    - Buildpacks
    - pack cli
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Deployment # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-07-31 12:00:00
---

This post will cover how to use pack cli and CNF buildpacks to deploy Dockerfile-less applications to Web App for Containers.

# Overview
In this post, we'll be using the [pack cli](https://buildpacks.io/docs/tools/pack/) along with [Packeto buildpacks](https://paketo.io/docs/) to create our OCI images. We'll push this to our Azure Container Registry, then for our App Service to pull and use. This will cover local usage - and then examples of using this in GitHub Actions and Azure DevOps.

# Pros and cons
Typically, a project would normally have a `Dockerfile` in the project source code. This would be then built through something like `docker cli` either on a local machine, or through a CI/CD task, ultimately then being pushed to a registry.

The benefit to using buildpacks is the need to do without a `Dockerfile`. You can utilize pack to build your source code into a completely [OCI-spec compliant](https://opencontainers.org/about/overview/) image. This can potentially save a fair amount of development time and get projects off the ground quicker.

However, some cons, notably in relation to App Service and Web Apps for Containers - is that you _dont_ have an actual `Dockerfile` in your project. The issue here is if something like [enabling SSH](https://azureossd.github.io/2022/04/27/2022-Enabling-SSH-on-Linux-Web-App-for-Containers/index.html) needs to be done for certain troubleshooting scenarios. Without this, and/or without control of your `Dockerfile` - can hamper troubleshooting or make certain requirements impossible. This should be taken into serious consideration for down the line.

Buildpacks may not offer the flexibility to configure the runtime image to include such specific requirements.

# Terms
Some quick terms we'll cover before moving forward:
- [Builder](https://buildpacks.io/docs/concepts/components/builder/)
  - _A builder is an image that contains all the components necessary to execute a build. A builder image is created by taking a build image and adding a lifecycle, buildpacks, and files that configure aspects of the build including the buildpack detection order and the location(s) of the run image_
- [Buildpack](https://buildpacks.io/docs/concepts/components/buildpack/)
  - _A buildpack is a set of executables that inspects your app source code and creates a plan to build and run your application._
  - Buildpacks have "phases" that essentially detect the type of language/runtime the application source code has and runs a toolset against it to built it into an appropriate image
- [Stack](https://buildpacks.io/docs/concepts/components/stack/)
  - A stack contains a _build image_ (containerized build environment) and _run image_ (runtime)
- [Lifecycle](https://buildpacks.io/docs/concepts/components/lifecycle/)
  - There are lifecycle events that are ran during an image build process as defined [here](https://github.com/buildpacks/spec/blob/main/buildpack.md)

# Prerequisites
1. Download the pack cli from [here](https://buildpacks.io/docs/tools/pack/)
2. You must also have Docker installed (locally) and/or available in the environment this is being ran

# Quickstart
For the context of this post, we'll be using the example found [here](https://github.com/azureossd/pack-cli-cicd-examples). This can be cloned or forked.

The contents is as follows:

1. (`main.go`)

    ```go
    package main

    import (
        "log"

        "github.com/gofiber/fiber/v2"
    )

    func main() {
        app := fiber.New()

        app.Get("/", func (c *fiber.Ctx) error {
            return c.SendString("Hello, world - from Fiber! (SP)")
        })

        log.Fatal(app.Listen(":3000"))
    }
    ```

2. Run `go mod init yourmodname`
3. Install [Fiber](https://docs.gofiber.io/) with `go get github.com/gofiber/fiber/v2`


You can additionally use your own codebase if not wanting to use the example above.

## Local deployment
1. After installing the pack CLI, confirm it's properly installed by checking the version on your location machine:

    ```
    $ pack --version
    0.29.0+git-95c8060.build-4209
    ```

2. Relative to your codebase, run `pack builder suggest`. Your output may vary, below is the output based on the Go code above:

    ```shell
    $ pack builder suggest
    Suggested builders:
            Google:                gcr.io/buildpacks/builder:v1      Ubuntu 18 base image with buildpacks for .NET, Go, Java, Node.js, and Python
            Heroku:                heroku/builder:22                 Base builder for Heroku-22 stack, based on ubuntu:22.04 base image
            Heroku:                heroku/buildpacks:20              Base builder for Heroku-20 stack, based on ubuntu:20.04 base image
            Paketo Buildpacks:     paketobuildpacks/builder:base     Ubuntu bionic base image with buildpacks for Java, .NET Core, NodeJS, Go, Python, Ruby, Apache HTTPD, NGINX and Procfile
            Paketo Buildpacks:     paketobuildpacks/builder:full     Ubuntu bionic base image with buildpacks for Java, .NET Core, NodeJS, Go, Python, PHP, Ruby, Apache HTTPD, NGINX and Procfile       
            Paketo Buildpacks:     paketobuildpacks/builder:tiny     Tiny base image (bionic build image, distroless-like run image) with buildpacks for Java, Java Native Image and Go

    Tip: Learn more about a specific builder with:
        pack builder inspect <builder-image>
    ```

3. We'll be using Packeto as the builder and their `builder:base` buildpack.
4. Using pack, we can build _and_ publish to a specified container registry in one go. To do this, pack takes the logged in registry credentials. Prior to doing this, log in to your Azure Container Registry from your local machine:

    ```
    docker login myacr.azurecr.io
    ```

5. Run the following command to build our source code and push the resulting image to our registry:

    ```
    pack build --builder paketobuildpacks/builder:base --publish myacr.azurecr.io/someimage:sometag
    ```

    This command will build the source code into a runnable image and then push it to the specified container registry. The image and tag will be what is specified _after_ the registry name in the command

    As it builds, we'll see the lifecycles called out earlier in our terminal output - below is partial output:

    ```
    ===> ANALYZING
    Image with name "myacr.azurecr.io/someimage:sometag" not found
    ===> DETECTING
    4 of 9 buildpacks participating
    paketo-buildpacks/ca-certificates 3.6.3
    paketo-buildpacks/go-dist         2.3.10
    paketo-buildpacks/go-mod-vendor   1.0.21
    paketo-buildpacks/go-build        2.0.22
    ===> RESTORING
    ===> BUILDING

    Paketo Buildpack for CA Certificates 3.6.3
    https://github.com/paketo-buildpacks/ca-certificates
    Launch Helper: Contributing to layer
        Creating /layers/paketo-buildpacks_ca-certificates/helper/exec.d/ca-certificates-helper
    Paketo Buildpack for Go Distribution 2.3.10
    Resolving Go version
        Candidate version sources (in priority order):
        go.mod    -> ">= 1.20"
        <unknown> -> ""

        Selected Go version (using go.mod): 1.20.6

    Executing build process
        Installing Go 1.20.6
        Completed in 17.834s
      ```

6. At the end, we should see `Successfully built image myacr.azurecr.io/someimage:sometag`. If you view your repositories in your Azure Container Registry, this image will now appear.

7. You can now deploy this image to be used by following the [custom container quickstart](https://learn.microsoft.com/en-us/azure/app-service/quickstart-custom-container?tabs=dotnet&pivots=container-linux-azure-portal#3---deploy-to-azure)

## Azure DevOps pipelines
You can use Azure DevOps pipelines to build your code from source into a deployable image. 

If you don't have a Azure DevOps organization, follow this to create one [here](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/create-organization?view=azure-devops). Follow this to create a [Azure DevOps project](https://learn.microsoft.com/en-us/azure/devops/organizations/projects/create-project?view=azure-devops&tabs=browser). Both are requirements.

> The `.yml` file being used here can be found on [GitHub](https://github.com/azureossd/pack-cli-cicd-examples/tree/main/azure-devops)

Below is a `.yml` we can use to do what we did on our local machine above, which was:
1. Log into our registry with the `docker cli`. Here we're using the `Docker@2` task to do this
2. Install the pack CLI to be made available to the environment
3. Build our source code with pack and using Packeto buildpacks
4. Push this build image to our specified registry
5. Configure our Web App for Container to use and run this image

{% raw %}
```yaml
# Docker
# Build and push an image to Azure Container Registry
# https://docs.microsoft.com/azure/devops/pipelines/languages/docker

trigger:
- main

resources:
- repo: self

variables:
  # Container registry service connection established during pipeline creation
  dockerRegistryServiceConnection: '00000000-0000-0000-0000-000000000000'
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
      inputs:
        containerRegistry: 'youracr'
        command: 'login'
      
    - script: |
        sudo add-apt-repository ppa:cncf-buildpacks/pack-cli -yy
        sudo apt-get update -yy
        sudo apt-get install pack-cli -yy
      displayName: 'Install pack CLI'
      
    - script: |
        pack build --builder paketobuildpacks/builder:base --publish youracr.azurecr.io/go-devops-pack-packeto:$(tag)
      displayName: 'Build application with pack and push to Container Registry'

- stage: Deploy
  displayName: Deploy image
  jobs:
  - job: Deploy
    displayName: Deploy
    pool:
      vmImage: $(vmImageName)
    steps:
    - task: AzureRmWebAppDeployment@4
      inputs:
        ConnectionType: 'AzureRM'
        azureSubscription: 'Yoursub(00000000-0000-0000-0000-000000000000)'
        appType: 'webAppContainer'
        WebAppName: 'ado-go-packeto'
        DockerNamespace: 'youracr.azurecr.io'
        DockerRepository: 'go-devops-pack-packeto'
        DockerImageTag: '$(tag)'
        AppSettings: '-WEBSITES_PORT 3000'
```
{% endraw %}

## GitHub Actions
> The `.yml` file being used here can be found on [GitHub](https://github.com/azureossd/pack-cli-cicd-examples/tree/main/github-actions)

Just like above, we can do the same with GitHub Actions. 

All other logic is the same, with only differences in the name of the tasks being used.

{% raw %}
```yaml
name: Trigger auto deployment for containerapp

# When this action will be executed
on:
  # Automatically trigger it when detected changes in repo
  push:
    branches: 
      [ main ]
    paths:
    - '**'
    - '.github/workflows/main.yml'

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
      # Log into ACR so we can push the image we build with pack to this registry
      # Pack uses the logged in registry credentials
      - name: Log in to container registry
        uses: docker/login-action@v1
        with:
          registry: ${{ secrets.AZURE_CONTAINER_REGISTRY_URL }}
          username: ${{ secrets.AZURE_SP_CLIENT_ID }}
          password: ${{ secrets.AZURE_SP_CLIENT_SECRET }}
          

      - name: Install pack cli
        run: |
          sudo add-apt-repository ppa:cncf-buildpacks/pack-cli -yy
          sudo apt-get update -yy
          sudo apt-get install pack-cli -yy

      - name: Build and push container image to registry
        run: |
          pack build --path ./github-actions --builder paketobuildpacks/builder:base --publish ${{ secrets.AZURE_CONTAINER_REGISTRY_URL }}/pack-cli-cicd-examples:${{ github.sha }}
  
  deploy:
    runs-on: ubuntu-latest
    needs: build
    
    steps:
    # You can use this to set App Settings - see here on setting this up - https://github.com/marketplace/actions/azure-app-service-settings
    - uses: azure/login@v1
      with:
        creds: '${{ secrets.AZURE_CREDENTIALS }}'

    - uses: azure/appservice-settings@v1
      with:
        app-name: 'ghactions-go-packeto'
        # For DOCKER_REGISTRY_SERVER_PASSWORD and DOCKER_REGISTRY_SERVER_USERNAME, you can set this to your username/password through ACR Admin Credentials
        # This example is using a Service Principal with the AcrPush role 
        app-settings-json: |
          [
            { 
              "name": "WEBSITES_PORT",
              "value": "3000",
              "slotSetting": false

            },
            {
                "name": "DOCKER_REGISTRY_SERVER_PASSWORD",
                "value": "${{ secrets.AZURE_SP_CLIENT_SECRET }}",
                "slotSetting": false
            },  
            {
                "name": "DOCKER_REGISTRY_SERVER_URL",
                "value": "https://${{ secrets.AZURE_CONTAINER_REGISTRY_URL }}",
                "slotSetting": false
            },
            {
                "name": "DOCKER_REGISTRY_SERVER_USERNAME",
                "value": "${{ secrets.AZURE_SP_CLIENT_ID }}",
                "slotSetting": false
            }
          ]

    - name: Deploy to Azure Web App
      id: deploy-to-webapp
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'ghactions-go-packeto'
        slot-name: 'production'
        images: '${{ secrets.AZURE_CONTAINER_REGISTRY_URL }}/pack-cli-cicd-examples:${{ github.sha }}'
```
{% endraw %}