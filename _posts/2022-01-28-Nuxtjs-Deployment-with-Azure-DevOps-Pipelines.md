---
title: "Nuxtjs Deployment with Azure DevOps Pipelines"
author_name: "Toan Nguyen"
tags:
    - Node.js
    - Nuxtjs
    - Deploy
    - Azure DevOps
categories:
    - Azure App Service on Linux
    - Nodejs
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/nodelinux.png
toc: true
toc_sticky: true
date: 2022-01-28 12:00:00
---


This section provides information for creating, configuring, and deploying a NuxtJS using Azure DevOps pipelines.  These steps can also be modified to be used with "Nextjs" as well.

## Create a Nuxtjs app

1. npx create-nuxt-app testapp

```bash

λ npx create-nuxt-app testapp

create-nuxt-app v4.0.0
✨  Generating Nuxt.js project in testapp
? Project name: testapp
? Programming language: JavaScript
? Package manager: Npm
? UI framework: None
? Nuxt.js modules: (Press <space> to select, <a> to toggle all, <i> to invert selection)
? Linting tools: (Press <space> to select, <a> to toggle all, <i> to invert selection)
? Testing framework: None
? Rendering mode: Universal (SSR / SSG)
? Deployment target: Server (Node.js hosting)
? Development tools: (Press <space> to select, <a> to toggle all, <i> to invert selection)
? What is your GitHub username? 
? Version control system: Git


| Installing packages with npm

.....

�  Successfully created project test

  To get started:

        cd testapp
        npm run dev

  To build & start for production:

        cd testapp
        npm run build
        npm run start
```
2. Perform the steps provided in the output.

```bash
	cd testapp
	npm run build
	npm run start
```
3. By default, the app will run on localhost:3000

```bash
λ npm run start

> nuxt start

> nuxt start


   ╭──────────────────────────────────────────╮
   │                                          │
   │   Nuxt @ v2.15.8                         │
   │                                          │
   │   ▸ Environment: production              │
   │   ▸ Rendering:   server-side             │
   │   ▸ Target:      server                  │
   │                                          │
   │   Memory usage: 29.1 MB (RSS: 73.1 MB)   │
   │                                          │
   │   Listening: http://localhost:3000/      │
   │                                          │
   ╰──────────────────────────────────────────╯

 ``` 
## Modify the Package.json

We'll be installing all of the Node modules using Azure DevOps and zipping the contents and deploying using "ZipDeploy" directly to the App Service.  We'll need to modify the package.json to use the direct path of nuxt to start the app.

### Original Package.json

```bash
  "scripts": {
    "dev": "nuxt",
    "build": "nuxt build",
    "start": "nuxt start",
    "generate": "nuxt generate",
  },
```
### After Changes

```bash
  "scripts": {
    "dev": "nuxt",
    "build": "nuxt build",
    "start": "node ./node_modules/nuxt/bin/nuxt.js start",
    "generate": "nuxt generate"
  },
```

## Create a New Project on Azure DevOps

1. Go to https://dev.azure.com and sign into your account.
2. If you have multiple Organizations, choose the appropriate organization
3. Select "+ New project", name your project, and specify whether it is public, private, etc.
3. Go to "Repos"
4. Locate "Push an existing repository from command line" to find helpful commands to run locally.  Make note of the commands as you'll be using them later.

## Push to Azure DevOps Repo from Local Git

1. On your local system, go to the directory of your NuxtJS project.
2. Initialize the directory, add files, commit changes, and push to.

```bash
	git init
	git add -A
	git commit -m "Pushing to Azure DevOps"
	git remote add origin https://<account_name>@dev.azure.com/<account_name>/<project_name/_git/<project_name>
	git push -u origin --all
```
	
## Create a Pipeline to your Azure App Service.

1. In your Project on Azure DevOps, select "Pipelines" -> Create Pipeline.
2. Multiple options will be provided.  In this article, we'll be using the "classic editor".
3. Select "Azure Repos Git" then press continue.
4. Select "Starter pipeline".
5. Add a new line at the bottom of the azure-pipelines.yml file.
5. Press "Show assistant" in the upper right hand corner to start adding tasks.

## Adding Tasks

### Node Version

1.  The first task we'll be adding is the Node.js tool installer.  Search for "Node.js tool installer" and press add.
2.  Change the version from "6.x" to "12.x" or version of Node that you are currently using.
3.  Press Add.
4.  Go back to the azure-pipelines.yml file and add a new line.

### NPM Commands
1. We'll be using one of the task to install the packages and another task to build.  Search for "npm".
2. Make sure the drop-down has "install" selected.
3. Press Add.
4. Search for "npm" again.
5.  Drop-down the command option and choose custom.
6.  Enter "run build" under "Command and arguments".
7.  Add "npm run build" then press Add.  
8.  You should now have the following "Settings" added to bottom of your azure-pipelines.yml.

```yml

- task: NodeTool@0
  inputs:
    versionSpec: '12.x'
- task: Npm@1
  inputs:
    command: 'install'
- task: Npm@1
  inputs:
    command: 'custom'
    customCommand: 'run build'
```

### Archive Files

1. Add a task for "Archive files".
2. Root folder or file to archive: "$(System.DefaultWorkingDirectory)"
3. Uncheck "Prepend root folder name to archive paths"
4. Archive file to create: '$(Build.ArtifactStagingDirectory)/\$(Build.BuildId).zip'

### Copy the Files

1. Add a task for "Copy files".
2. For "Source Folder" enter "$(Build.ArtifactStagingDirectory)"
3. In "Contents", enter "$(Build.BuildId).zip"
4. In "Target Folder" enter "$(Build.ArtifactStagingDirectory)\ArtifactsToBePublished"

### Publish Build Artifacts

1. Add a task for "Publish build artifacts".
2. We'll be using the default settings.
3. Save the build pipeline.
4. Finally, toggle the "Save and run" button and choose "Save".

### Sample azure-pipelines.yml

```yml
# Starter pipeline
# Start with a minimal pipeline that you can customize to build and deploy your code.
# Add steps that build, run tests, deploy, and more:
# https://aka.ms/yaml

trigger:
- master

pool:
  vmImage: ubuntu-latest

steps:
- script: echo Hello, world!
  displayName: 'Run a one-line script'

- script: |
    echo Add other tasks to build, test, and deploy your project.
    echo See https://aka.ms/yaml
  displayName: 'Run a multi-line script'

- task: NodeTool@0
  inputs:
    versionSpec: '12.x'
- task: Npm@1
  inputs:
    command: 'install'
- task: Npm@1
  inputs:
    command: 'custom'
    customCommand: 'run build'
- task: ArchiveFiles@2
  inputs:
    rootFolderOrFile: '$(System.DefaultWorkingDirectory)'
    includeRootFolder: false
    archiveType: 'zip'
    archiveFile: '$(Build.ArtifactStagingDirectory)/\$(Build.BuildId).zip'
    replaceExistingArchive: true
- task: CopyFiles@2
  inputs:
    SourceFolder: '$(Build.ArtifactStagingDirectory)'
    Contents: '$(Build.BuildId).zip'
    TargetFolder: '$(Build.ArtifactStagingDirectory)\ArtifactsToBePublished'
- task: PublishBuildArtifacts@1
  inputs:
    PathtoPublish: '$(Build.ArtifactStagingDirectory)'
    ArtifactName: 'drop'
    publishLocation: 'Container'
```
### Create a Service Connection

1. Select "Project Settings" in the lower left hand corner.
2. Under "Pipelines", select "Service connections".
3. Press "New service connection", select "Azure Resource Manager", "Service principal (automatic)".
4. Chose your Subscription, Resource Group of your Web App, enter a Service Connection name and check Grant account permissions to all pipelines if needed.

### Create a Release Pipeline

1.  Under Pipelines, select Releases and press "New pipeline".
2.  You'll be prompted to choose a template, choose "Azure App Service Deployment" and press Apply.
3.  You can choose to change the "Stage owner" for now, we'll keep the default and close the window.
4.  Click on "Stage 1".
5.  Select "Deploy Azure App Service"
6.  Enter/select the following and press save.

    - Azure Subscription
    - App Type: Web App on Linux
    - App service name: Name of your App Service
    - Application and Configuration Settings
	  - App Settings: -HOST 0.0.0.0

6. Select the "Pipeline" tab to go back to the release.
7. Press "+ Add an artifact".
8. Source type will be "Build".
9. On the "Source (build pipeline)" drop-down, choose your build pipeline and press Add.
10. Press Save.



### Run the Pipeline and Release Pipeline.

1. Select Pipelines, click on your new Pipeline and press the "Run pipeline" button.
2. Once it's complete, select "Releases", press "Create Release".
3. Select the drop-down for "Stages for a trigger change from automated to manual" and choose "Stage 1".
4. The "Artifact" should contain the artifact and version number.
5. Press Create.
6.  Select the new Release to Deploy the app.

## Troubleshooting

To help troubleshoot any issues, you'll need to enable the following.

- Enable App Service Logs for the app.

### Container Doesn't Start

Check the application logs to see if there are any errors reported.  In the example below, "nuxt start" is unable to run properly.

#### Incorrect Startup Command
```bash

   _____                               
   /  _  \ __________ _________   ____  
  /  /_\  \___   /  |  \_  __ \_/ __ \ 
 /    |    \/    /|  |  /|  | \/\  ___/ 
 \____|__  /_____ \____/ |__|    \___  >
         \/      \/                  \/ 
 A P P   S E R V I C E   O N   L I N U X
 
 Documentation: http://aka.ms/webapp-linux
 NodeJS quickstart: https://aka.ms/node-qs
 NodeJS Version : v12.22.4
 Note: Any data outside '/home' is not persisted
 
 Cound not find build manifest file at '/home/site/wwwroot/oryx-manifest.toml'
 Could not find operation ID in manifest. Generating an operation id...
 Build Operation ID: 3ace0066-8042-4e45-83e4-16d86af13b5b
 Environment Variables for Application Insight's IPA Codeless Configuration exists..
 Writing output script to '/opt/startup/startup.sh'
 Running #!/bin/sh
 
 # Enter the source directory to make sure the script runs where the user expects
 cd "/home/site/wwwroot"
 
 export NODE_PATH=/usr/local/lib/node_modules:$NODE_PATH
 if [ -z "$PORT" ]; then
 		export PORT=8080
 fi
 
 npm start
 npm info it worked if it ends with ok
 npm info using npm@6.14.14
 npm info using node@v12.22.4
 npm info lifecycle testapp@1.0.0~prestart: testapp@1.0.0
 npm info lifecycle testapp@1.0.0~start: testapp@1.0.0
 
 > testapp@1.0.0 start /home/site/wwwroot
 > nuxt start
 
 internal/modules/cjs/loader.js:638
     throw err;
     ^
 
 Error: Cannot find module '../package.json'
     at Function.Module._resolveFilename (internal/modules/cjs/loader.js:636:15)
     at Function.Module._load (internal/modules/cjs/loader.js:562:25)
     at Module.require (internal/modules/cjs/loader.js:692:17)
     at require (internal/modules/cjs/helpers.js:25:18)
     at Object.<anonymous> (/home/site/wwwroot/node_modules/.bin/nuxt:3:16)
     at Module._compile (internal/modules/cjs/loader.js:778:30)
     at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)
     at Module.load (internal/modules/cjs/loader.js:653:32)
     at tryModuleLoad (internal/modules/cjs/loader.js:593:12)
     at Function.Module._load (internal/modules/cjs/loader.js:585:3)
 npm ERR! code ELIFECYCLE
 npm ERR! errno 1
 npm ERR! testapp@1.0.0 start: `nuxt start`
```
To resolve this issue, ensure that the package.json contains the correct start command mentioned [After Changes](#after-changes).

#### Incorrect Host

During the deployment step in Azure DevOps, we specified the HOST to be "0.0.0.0" in the Application Settings, if this is not applied, the app will try to run on "localhost" by default.  This will not respond to HTTP pings when the container starts up and will cause the startup to fail.

```bash
 npm start
 
 > nonbuildtest@1.0.0 start /home/site/wwwroot
 > node ./node_modules/nuxt/bin/nuxt.js start
 
 â„¹ Listening on: http://localhost:8080/
```
You can update the Application Settings in the [Azure Portal](https://portal.azure.com) or update the deployment process and redeploy.

#### Nuxtjs Configuration File

There may also be configurations within the Nuxtjs configuration file (nuxt.config.js).  Check the configuration file to ensure that there are no conflicts. Sample with port & host settings applied to the nuxt.config.js file below.

```javascript

export default {
server: {
      port: 8080, // default: 3000
      host: '0.0.0.0', // default: localhost,
      timing: false
     },
mode: 'spa',
  /*
  ** Headers of the page
  */
  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

```

------
