---
title: "Vue Deployment on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - JavaScript
    - Vue
    - Deploy
    - Azure DevOps
    - GitHub Actions
categories:
    - Azure App Service on Linux
    - Javascript
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/vuejs.png
toc: true
toc_sticky: true
date: 2022-02-11 12:00:00
---

This section provides information for creating, configuring, and deploying a Vue application on App Service Linux. 

# Local Development 

## Create an Vue app

1. Setup a local environment starting with the [Vue CLI](https://cli.vuejs.org/guide/installation.html):

    `npm install -g @vue/cli`

2. Create a new folder if desired, navigate to the created folder, then run:
    
    `vue create newproject`

    It will prompt for either Vue 2 or 3, choose your preference.

3. Once the installation is done, cd into projectname folder and then start the server using:
    
    `yarn serve` (alternatively you can use `npm` instead of `yarn` as your package manager, later in this post `npm` is used - but either can be chosen)

    This will compile and build the site:

```
    $ yarn serve
    yarn run v1.22.15
    $ vue-cli-service serve
    INFO  Starting development server...
    98% after emitting CopyPlugin

    DONE  Compiled successfully in 21351ms                                                                                                                                                                          8:28:47 PM


    App running at:
    - Local:   http://localhost:8080/
    - Network: http://192.168.86.97:8080/

    Note that the development build is not optimized.
    To create a production build, run yarn build.
```

4. Browse the site by navigating to `http://localhost:8080`.

    ![Vue App](/media/2022/02/vue-deployment-linux-01.png)

5. To create a production build you can run:

    `yarn build` (or `npm run build` if using `npm`)

    This will create a `dist` folder with your static files.


# Deployment Options
There are multiple deployment options in App Service Linux as Continuous Deployment(GitHub/GitHub Actions, Bitbucket, Azure Repos, External Git, Local Git), ZipDeploy, Run from Package, FTP, etc. We'll be covering 3 of these methods below.

## Local Git 
When using Local Git, you are using `App Service Build Service` also named as ([Oryx](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md)) to build your application.

To setup this option and deploy a Vue application follow the below:
> **NOTE**: Deploying from Local Git will likely prompt you for your Git credentials for the Azure Application. You can find it under the FTPS Credentials tab in the screenshot below. 


1. Navigate to your Web App and select `Deployment Center` and then click on `Local Git` and then click on `Save`.

    ![Vue App](/media/2022/02/vue-deployment-linux-02.png)
2. Copy the remote git repository from Azure Portal.

    ![Vue App](/media/2022/02/vue-deployment-linux-03.png)
3. In your local terminal run the following commands in order:
    ```bash
    git add .
    git commit -m "initial commit"
    git remote add azure https://<sitename>.scm.azurewebsites.net:443/<sitename>.git
    git push azure master
    ```
4. Then Oryx will build the application:
```
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 8 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 248.13 KiB | 7.30 MiB/s, done.
Total 3 (delta 1), reused 0 (delta 0), pack-reused 0
remote: Deploy Async
remote: Updating branch 'master'.
remote: Updating submodules.
remote: Preparing deployment for commit id '9581478599'.
remote: Repository path is /home/site/repository
remote: Running oryx build...
remote: .
remote: Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
remote: You can report issues at https://github.com/Microsoft/Oryx/issues
remote: 
remote: Oryx Version: 0.2.20210826.1, Commit: f8651349d0c78259bb199593b526450568c2f94a, ReleaseTagName: 20210826.1
remote: 
remote: Build Operation ID: |1x/pFDEehL8=.9dacccf1_
remote: Repository Commit : 958147859957fbb7b52165a29bbfe9e535149bd6
remote: 
remote: Detecting platforms...
remote: Detected following platforms:
remote:   nodejs: 16.13.2
remote: 
remote: Using intermediate directory '/tmp/8d9ebe42a41a06a'.
remote: 
remote: Copying files to the intermediate directory...
remote: Done in 1 sec(s).
remote: 
remote: Source directory     : /tmp/8d9ebe42a41a06a
remote: Destination directory: /home/site/wwwroot
remote: 
remote: Removing existing manifest file
remote: Creating directory for command manifest file if it doesnot exist
remote: Creating a manifest file...
remote: Node Build Command Manifest file created.
remote: 
remote: Using Node version:
remote: v16.13.2
remote: 
remote: Using Npm version:
remote: 8.1.2
remote: 
remote: Running 'npm install --unsafe-perm'...
remote: 
remote: ........................................
remote: npm WARN deprecated source-map-url@0.4.1: See https://github.com/lydell/source-map-url#deprecated
remote: npm WARN deprecated @hapi/topo@3.1.6: This version has been deprecated and is no longer supported or maintained
remote: npm WARN deprecated @hapi/bourne@1.3.2: This version has been deprecated and is no longer supported or maintained
remote: npm WARN deprecated urix@0.1.0: Please see https://github.com/lydell/urix#deprecated
remote: npm WARN deprecated har-validator@5.1.5: this library is no longer supported
remote: npm WARN deprecated eslint-loader@2.2.1: This loader has been deprecated. Please use eslint-webpack-plugin
remote: npm WARN deprecated resolve-url@0.2.1: https://github.com/lydell/resolve-url#deprecated
remote: npm WARN deprecated source-map-resolve@0.5.3: See https://github.com/lydell/source-map-resolve#deprecated
remote: npm WARN deprecated chokidar@2.1.8: Chokidar 2 does not receive security updates since 2019. Upgrade to chokidar 3 with 15x fewer dependencies
remote: npm WARN deprecated chokidar@2.1.8: Chokidar 2 does not receive security updates since 2019. Upgrade to chokidar 3 with 15x fewer dependencies
remote: npm WARN deprecated querystring@0.2.0: The querystring API is considered Legacy. new code should use the URLSearchParams API instead.
remote: npm WARN deprecated html-webpack-plugin@3.2.0: 3.x is no longer supported
remote: npm WARN deprecated babel-eslint@10.1.0: babel-eslint is now @babel/eslint-parser. This package will no longer receive updates.
remote: npm WARN deprecated @hapi/address@2.1.4: Moved to 'npm install @sideway/address'
remote: npm WARN deprecated uuid@3.4.0: Please upgrade  to version 7 or higher.  Older versions may use Math.random() in certain circumstances, which is known to be problematic.  See https://v8.dev/blog/math-random for details.
remote: npm WARN deprecated request@2.88.2: request has been deprecated, see https://github.com/request/request/issues/3142
remote: npm WARN deprecated @hapi/hoek@8.5.1: This version has been deprecated and is no longer supported or maintained
remote: npm WARN deprecated @hapi/joi@15.1.1: Switch to 'npm install joi'
remote: npm WARN deprecated svgo@1.3.2: This SVGO version is no longer supported. Upgrade to v2.x.x.
remote: .............................
remote:
remote: added 1354 packages, and audited 1355 packages in 2m
remote: 
remote: 93 packages are looking for funding
remote:   run `npm fund` for details
remote: 
remote: 72 vulnerabilities (61 moderate, 11 high)
remote:
remote: To address issues that do not require attention, run:
remote:   npm audit fix
remote: 
remote: To address all issues (including breaking changes), run:
remote:   npm audit fix --force
remote: 
remote: Run `npm audit` for details.
remote:
remote: Running 'npm run build'...
remote: 
remote: 
remote: > azure-webapps-linux-node-vue-blogpost@0.1.0 build
remote: > vue-cli-service build
remote: 
remote: ......
remote:
remote: -  Building for production...
remote: ..................................................
remote:  DONE  Compiled successfully in 41959ms3:55:29 PM
remote: 
remote:   File                                 Size               Gzipped
remote: 
remote:   dist/js/chunk-vendors.584be8e5.js    89.85 KiB          33.54 KiB
remote:   dist/js/app.3660a455.js              4.48 KiB           1.63 KiB
remote:   dist/css/app.fb0c6e1c.css            0.33 KiB           0.23 KiB
remote: 
remote:   Images and other types of assets omitted.
remote: 
remote:  DONE  Build complete. The dist directory is ready to be deployed.
remote:  INFO  Check out deployment instructions at https://cli.vuejs.org/guide/deployment.html
remote:       
remote: 
remote: Zipping existing node_modules folder...
remote: ..............................................................................
remote: Done in 83 sec(s).
remote: Preparing output...
remote: 
remote: Copying files to destination directory '/home/site/wwwroot'...
remote: Done in 2 sec(s).
remote: 
remote: Removing existing manifest file
remote: Creating a manifest file...
remote: Manifest file created.
remote: 
remote: Done in 263 sec(s).
remote: Running post deployment command(s)...
remote: Triggering recycle (preview mode disabled).
remote: Deployment successful.
```
5. Add a startup command: **`pm2 serve /home/site/wwwroot/dist --no-daemon --spa`** where `projectname` is the name of your project.

    ![Vue App](/media/2022/02/vue-deployment-linux-04.png)

> **NOTE**: This method of serving static files from the build folder produced named 'dist' is the **recommended** approach for Vue. Most SPA's follow this same approach. Read more [here](https://cli.vuejs.org/guide/deployment.html#general-guidelines) for Vue.


## GitHub Actions

You can quickly get started with GitHub Actions by using the App Service Deployment Center. This will automatically generate a workflow file based on your application stack and commit it to your GitHub repository in the correct directory. You can deploy a workflow manually using deployment credentials. 

![Vue App](/media/2022/02/vue-deployment-linux-05.png)

> **NOTE**: If you have numerious repositories that appear in the dropdown, you can search by typing within the text field/dropdown.

You can find more details about these steps documented here:
 - [Use the Deployment Center](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#use-the-deployment-center)
 - [Set up a workflow manually](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#set-up-a-workflow-manually)


For **Vue deployments** it is recommended to modify the default template with the following changes:

1. Just upload the production build folder.
2. Remove any npm or yarn run test if neccesary.
3. Validate current nodejs version.
    
Here is an example with recommendations:
> **NOTE** The below .yaml is used from the default generated template when selecting Github Actions, however - some slight changes have been made for recommendations

```yaml
name: Build and deploy Node.js app to Azure Web App - ansalemo-vue-blog-test

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

      - name: Set up Node.js version
        uses: actions/setup-node@v1
        with:
          node-version: '16.x'

      - name: npm install, build, and test
        run: |
          npm install
          npm run build --if-present

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v2
        with:
          name: node-app
          path: dist/

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
          name: node-app

      - name: 'Deploy to Azure Web App'
        id: deploy-to-webapp
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'replacewithyourappservicename'
          slot-name: 'Production'
          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_000000000000000000000000000 }}
          package: .
````

After the deployment, then add a startup command startup command: **`pm2 serve /home/site/wwwroot --spa --no-daemon`**.

![Vue App](/media/2022/02/vue-deployment-linux-06.png)

> **NOTE**: This is done since we changed to deploy everything **within** the `dist` folder and **not** the `dist` folder itself.


## Azure DevOps
You can use Azure Pipelines to build your Vue application. For Vue apps, you can still use your typical `npm` or `yarn` based commands. You can review more details here: [Implement JavaScript frameworks](https://docs.microsoft.com/en-us/azure/devops/pipelines/ecosystems/javascript?view=azure-devops&tabs=code#react-and-vue).

Here is an example in how to implement Azure Pipelines with App Service Linux.

1. Go to `Pipelines` and create `New pipeline`.
2. Select `Azure Repos Git (YAML)`, there are other options as classic editor without YAML.
3. Select your code repository.
4. Select `Node.js Express Web App to Linux on Azure` template.
5. Select the web app where you will deploy.
6. Modify your current YAML and add the following points:
    - Node.js version should match the same of your web app.
    - Validate if you need `npm run test`, if not remove it.
    - Use npm or yarn commands to install needed packages and build for production

        ```yaml
            - script: |
                npm install
                npm run build
            displayName: 'npm install, build'
        ```

    - Just include the production folder in `ArchiveFiles@2` task:

        ```yaml
            - task: ArchiveFiles@2
            displayName: 'Archive files'
            inputs:
                rootFolderOrFile: '$(System.DefaultWorkingDirectory)/dist/'
                includeRootFolder: false
                archiveType: zip
                archiveFile: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
                replaceExistingArchive: true
        ```
    - Add a startup command in the `AzureWebApp@1` task and validate current nodejs version:

        ```yaml
          - task: AzureWebApp@1
            displayName: 'Azure Web App Deploy: sitename'
            inputs:
              azureSubscription: $(azureSubscription)
              appType: webAppLinux
              appName: $(webAppName)
              runtimeStack: 'NODE|16-lts'
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
              startUpCommand: 'pm2 serve /home/site/wwwroot --spa --no-daemon'
        ```

7. Save and `run` the pipeline.

Here is an example with recommendations:

```yaml
trigger:
- main

variables:

  # Azure Resource Manager connection created during pipeline creation
  azureSubscription: 'replacewithsubscription'

  # Web app name
  webAppName: 'replacewithsitename'

  # Environment name
  environmentName: 'replacewithsitename'

  # Agent VM image name
  vmImageName: 'ubuntu-latest'

stages:
- stage: Build
  displayName: Build stage
  jobs:
  - job: Build
    displayName: Build
    pool:
      vmImage: $(vmImageName)

    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '16.x'
      displayName: 'Install Node.js'

    - script: |
        npm install
        npm run build 
      displayName: 'npm install, build'


    - task: ArchiveFiles@2
      displayName: 'Archive files'
      inputs:
        rootFolderOrFile: '$(System.DefaultWorkingDirectory)/dist/'
        includeRootFolder: false
        archiveType: zip
        archiveFile: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
        replaceExistingArchive: true

    - upload: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
      artifact: drop

- stage: Deploy
  displayName: Deploy stage
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: Deploy
    displayName: Deploy
    environment: $(environmentName)
    pool:
      vmImage: $(vmImageName)
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            displayName: 'Azure Web App Deploy: replacewithsitename'
            inputs:
              azureSubscription: $(azureSubscription)
              appType: webAppLinux
              appName: $(webAppName)
              runtimeStack: 'NODE|16-lts'
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
              startUpCommand: 'pm2 serve /home/site/wwwroot --spa --no-daemon'
```
> **NOTE**: Depending on how you set up your pipeline, you may have to authorize permission for deployment. This is a one-time task, below is a screenshot of what you may see:

![Vue App](/media/2022/02/vue-deployment-linux-07.png)

![Vue App](/media/2022/02/vue-deployment-linux-08.png)


# Troubleshooting

## Container Doesn't Start
- **Attempting to start the application via Development Server**. 
<br>
By default Vue has the following `package.json`: 
    ```
      "scripts": {
        "serve": "vue-cli-service serve",
        "build": "vue-cli-service build",
        "lint": "vue-cli-service lint"
      },
    ```
    `serve` would start the Development Server. However, unknowingly one may change this to `start` and try to run their application this way, based off of [Oryx's](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/nodejs.md#run) start logic. Doing this could lead to a few different issues such as:

    ```
      Error: Cannot find module '../package.json'
      Require stack:
       - /home/site/wwwroot/node_modules/.bin/vue-cli-service
    ``` 
    Or could cause issues such as slow startup, poor performance, or possibly `ENOSPC: System Limit for Number of File Watchers Reached`. 

    - **Resolution**:  Use PM2 to serve the production build `dist` folder already built during the deployment process (ex. Oryx, Github Actions, DevOps, etc.). Since purely static files are being served, this would improve performance since the Development Server is not being used - a reminder that the Development Server is **not** recommended for production.

      This additionally would remove any possible `ENOSPC: System Limit for Number of File Watchers Reached.` issues since the Development Server isn't running.

      > **NOTE**: Remember to take note of how you're deploying your static content, if you're deploying the entire `dist` folder - use `pm2 serve /home/site/wwwroot/dist --no-daemon --spa`, or if you're deploying what's **within** dist and not the whole folder itself, use `pm2 serve /home/site/wwwroot --no-daemon --spa`


## 404 Not Found

Since Vue is a SPA (Single Page Application) you may possible get 404's for certain routes, such as if you're using Client Side routing through Vue. You need to redirect all queries to the index.html.

**Resolution**: Use a startup command passing `--spa` argument to PM2 as followed: **`pm2 serve /home/site/wwwroot/dist --no-daemon --spa`** or using a [process file](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/#serving-spa-redirect-all-to-indexhtml). Remember, if deploying the entire `dist` folder or just the content within, update the `pm2` command appropriately

## GitHub Actions Timeout and slow deployments

A normal deployment doesn't need to take more than 5-15 mins. If the workflow is taking more than that then you might need to review current implementation. Here is a list of things to check:

- **Running tests**. There are scenarios where GitHub Actions Agent takes more than 360 minutes (6 hrs) to give you a status and fails with: **`The job running on runner Hosted Agent has exceeded the maximum execution time of 360 minutes.`**. If you have `npm run test` defined in your `package.json`, this will be triggered by the workflow created from Azure App Service. The best option is to evaluate if this is required to be executed in the workflow since the majority of these tests will run Chrome browser, if this is not needed then it is better to remove it.

    ![Vue App](/media/2022/01/angular-deployment-linux-05.png)

- **Too many files and slow deployments**. Using `actions/upload-artifact@v2` to allow sharing data between jobs and store data once the a workflow is complete, it will depend on the JavaScript framework but Angular/React/Vue applications tends to have more than 10,000 files when it is compiled including the node_modules folder, when this condition is met, it will trigger the following warning `There are over 10,000 files in this artifact, consider creating an archive before upload to improve the upload performance.`, this will delay your deployment by several mins or hours. 

    ![Vue App](/media/2022/02/vue-deployment-linux-09.png)

    For those scenarios, you can implement the following alternatives:

    1. Upload just production dist folder in `actions/upload-artifact@v2` action:

        ```yaml
        # Depending on JavaScript framework you can use dist or build.
        
        - name: Upload artifact for deployment job
            uses: actions/upload-artifact@v2
            with:
            name: node-app
            path: dist/
        ```
        ![Vue App](/media/2022/02/vue-deployment-linux-10.png)

    2. Or Zip/unzip your application files between jobs.

        **build job**:

        ```yaml
        - name: Zip artifact for deployment
          run: zip release.zip ./* -qr

        - name: Upload artifact for deployment job
          uses: actions/upload-artifact@v2
          with:
            name: node-app
            path: release.zip
        ```
        **deploy job**: 

        ```yaml
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
                    name: node-app

                - name: 'Deploy to Azure Web App'
                  id: deploy-to-webapp
                  uses: azure/webapps-deploy@v2
                  with:
                    app-name: 'yoursitename'
                    slot-name: 'Production'
                    publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_00000000000000000000  }}
                    package: release.zip        
          ```
          You could additionally extract the .zip, delete it and then deploy the files as normal:

          ```yaml
                      steps:
                      - name: Download artifact from build job
                          uses: actions/download-artifact@v2
                          with:
                          name: node-app
                          
                      - name: Unzip files for App Service Deploy
                          run: unzip release.zip

                      - name: Delete zip file
                          run: rm release.zip

                      - name: 'Deploy to Azure Web App'
                          id: deploy-to-webapp
                          uses: azure/webapps-deploy@v2
                          with:
                          app-name: 'sitename'
                          slot-name: 'Production'
                          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_00000000000000000000 }}
                          package: .
          ```

        ![Vue App](/media/2022/02/vue-deployment-linux-11.png)


