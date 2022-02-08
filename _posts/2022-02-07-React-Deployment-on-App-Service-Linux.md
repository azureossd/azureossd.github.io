---
title: "React Deployment on App Service Linux"
author_name: "Edison Garcia"
tags:
    - JavaScript
    - React
    - Deploy
    - Azure DevOps
    - GitHub Actions
categories:
    - Azure App Service on Linux
    - Javascript
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/reactjs.png
toc: true
toc_sticky: true
date: 2022-02-07 12:00:00
---

This section provides information for creating, configuring, and deploying a React app on App Service Linux. 

# Local Development 

## Create a React app

1. Setup a local environment starting with the package runner tool:

    `npx create-react-app projectname`

2. Once the creation is done, cd into projectname folder and then start the server using:
    
    `npm start`

    This will start development server:

    ```
    projectname> npm start

    > projectname@0.1.0 start 
    > projectname
    > react-scripts start
    Starting the development server...
        Compiled successfully!

        You can now view projectname in the browser.

        Local:            http://localhost:3000
        On Your Network:  http://172.22.240.1:3000

        Note that the development build is not optimized.
        To create a production build, use npm run build.

        assets by path static/ 1.49 MiB
        asset static/js/bundle.js 1.48 MiB [emitted] (name: main) 1 related asset
        asset static/js/node_modules_web-vitals_dist_web-vitals_js.chunk.js 6.93 KiB [emitted] 1 related asset
        asset static/media/logo.6ce24c58023cc2f8fd88fe9d219db6c6.svg 2.57 KiB [emitted] (auxiliary name: main)
        asset index.html 1.67 KiB [emitted]
        asset asset-manifest.json 546 bytes [emitted]
        runtime modules 31.3 KiB 15 modules
        modules by path ./node_modules/ 1.35 MiB 99 modules
        modules by path ./src/ 18.1 KiB
        modules by path ./src/*.css 8.82 KiB
            ./src/index.css 2.72 KiB [built] [code generated]
            ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].oneOf[5].use[1]!./node_modules/postcss-loader/dist/cjs.js??ruleSet[1].rules[1].oneOf[5].use[2]!./node_modules/source-map-loader/dist/cjs.js!./src/index.css 1.37 KiB [built] [code generated]
            ./src/App.css 2.72 KiB [built] [code generated]
            ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].oneOf[5].use[1]!./node_modules/postcss-loader/dist/cjs.js??ruleSet[1].rules[1].oneOf[5].use[2]!./node_modules/source-map-loader/dist/cjs.js!./src/App.css 2 KiB [built] [code generated]
        modules by path ./src/*.js 5.71 KiB
            ./src/index.js 1.81 KiB [built] [code generated]
            ./src/App.js 2.51 KiB [built] [code generated]
            ./src/reportWebVitals.js 1.39 KiB [built] [code generated]
        ./src/logo.svg 3.61 KiB [built] [code generated]
        webpack 5.68.0 compiled successfully in 63431 ms

    ```

4. Browse the site with `http://localhost:3000` to get the default page. 

    ![React App](/media/2022/01/react-deployment-linux-01.png)

5. To create a production build you can run:

    `npm run build`

    This will create a `build` folder with all javascript and static files.

    If you want to test this production build on your local environment you can use [serve](https://www.npmjs.com/package/serve) or [pm2](https://www.npmjs.com/package/pm2), [http-server](https://www.npmjs.com/package/http-server), among others. Here is one example using serve:

    ```
        npm install -g serve
        serve -s build
    ```

# Deployment Options
There are multiple deployment options in App Service Linux as Continuos Deployment(GitHub/GitHub Actions, Bitbucket, Azure Repos, External Git, Local Git), ZipDeploy, Run from Package, FTP, etc. 

## Local Git 
When using Local Git, you are using `App Service Build Service` also named as ([Oryx](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md)) to build your application.

To setup this option and deploy a react app follow the next steps:
1. Navigate to your web app and select `Deployment Center` and then click on `Local Git` and then click on `Save`.

    ![React App](/media/2022/01/angular-deployment-linux-02.png)
2. Copy the remote git repository from Azure Portal.

    ![React App](/media/2022/01/angular-deployment-linux-03.png)
3. In your local terminal run the following commands in order:
    ```bash
    git add .
    git commit -m "Initial Commit"
    git remote add azure https://<sitename>.scm.azurewebsites.net:443/<sitename>.git
    git push azure master
    ```
4. Then Oryx will build your application:
    ```log
        Enumerating objects: 22, done.
        Counting objects: 100% (22/22), done.
        Delta compression using up to 8 threads
        Compressing objects: 100% (22/22), done.
        Writing objects: 100% (22/22), 149.72 KiB | 7.49 MiB/s, done.
        Total 22 (delta 0), reused 0 (delta 0), pack-reused 0
        remote: Deploy Async
        remote: Updating branch 'master'.
        remote: Updating submodules.
        remote: Preparing deployment for commit id '96708d75ac'.
        remote: Repository path is /home/site/repository
        remote: Running oryx build...
        remote: Source directory     : /tmp/8d9ea6beee02093
        remote: Destination directory: /home/site/wwwroot
        remote:.....
        remote: Running 'npm install --unsafe-perm'...
        remote: ............................................................
        remote: Running 'npm run build'...
        remote: > projectname@0.1.0 build /tmp/8d9ea6beee02093
        remote: > react-scripts build
        remote:
        remote: Creating an optimized production build...
        remote: ....
        remote: Compiled successfully.
        remote:
        remote: File sizes after gzip:
        remote:
        remote:   43.71 kB  build/static/js/main.327a8d8a.js
        remote:   1.78 kB   build/static/js/787.3f6c29fa.chunk.js
        remote:   541 B     build/static/css/main.073c9b0a.css
        remote:
        remote: Copying files to destination directory '/home/site/wwwroot'...
        remote: Done in 1 sec(s).
        remote:
        remote: Removing existing manifest file
        remote: Creating a manifest file...
        remote: Manifest file created.
        remote:
        remote: Done in 89 sec(s).
        remote: Running post deployment command(s)...
        remote: Triggering recycle (preview mode disabled).
        remote: Deployment successful.
    ```
5. Add a startup command: **`pm2 serve /home/site/wwwroot/build --no-daemon --spa`**.

    ![React App](/media/2022/01/react-deployment-linux-02.png)


## GitHub Actions

You can quickly get started with GitHub Actions by using the App Service Deployment Center. This will automatically generate a workflow file based on your application stack and commit it to your GitHub repository in the correct directory. You can deploy a workflow manually using deployment credentials. 

![React App](/media/2022/01/angular-deployment-linux-09.png)

You can find more details about these steps documented here:
 - [Use the Deployment Center](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#use-the-deployment-center)
 - [Set up a workflow manually](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#set-up-a-workflow-manually)


For **React deployments** is recommended to modify the default template with the following changes:

1. Just upload the production build folder.

    ```yaml
        - name: Upload artifact for deployment job
            uses: actions/upload-artifact@v2
            with:
            name: node-app
            path: build/
    ```
2. Remove any npm run test if neccesary.
3. Validate current nodejs version.

    ```yaml
        - name: Set up Node.js version
            uses: actions/setup-node@v1
            with:
            node-version: '14.x'

    ```
4. Use yarn or npm.
    ```yaml
        - name: yarn install, build
            run: |
            yarn install
            yarn run build --if-present
    ```
 5. Implement cache for [Npm](https://github.com/actions/cache/blob/main/examples.md#node---npm) or [Yarn](https://github.com/actions/cache/blob/main/examples.md#node---yarn). This can improve in some scenarios the deployment time. 
  
    > **Note**: It is not recommended to cache node_modules, as it can break across Node versions and won't work with npm ci

    ![React App](/media/2022/01/react-deployment-linux-06.png)


Here is an example with recommendations:

```yaml
name: Build and deploy Node.js app to Azure Web App - sitename

on:
  push:
    branches:
      - master
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Set up Node.js version
        uses: actions/setup-node@v1
        with:
            node-version: '14.x'
            
      - name: npm install, build
        run: |
          npm install
          npm run build --if-present

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v2
        with:
          name: node-app
          path: build/

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
          app-name: 'sitename'
          slot-name: 'Production'
          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_0000000000000 }}
          package: .
````

After the deployment, then add a startup command startup command: **`pm2 serve /home/site/wwwroot --spa --no-daemon`**.

![React App](/media/2022/01/react-deployment-linux-05.png)


## Azure DevOps
You can use Azure Pipelines to build your React application. For React apps, you can use npm or yarn to install application dependencies. You can review more details here: [Implement JavaScript frameworks](https://docs.microsoft.com/en-us/azure/devops/pipelines/ecosystems/javascript?view=azure-devops&tabs=code#react-and-vue).

There are several ways to create Azure Pipeline the most common options are using **Azure Repos Git (YAML)** or using **Classic Editor (without YAML)**.

### Classic Editor
Please review the following blog post to [create a pipeline with classic editor and deploy a React app](https://azureossd.github.io/2021/09/21/Deploying-React.js-application-to-Azure-App-Service-with-Azure-DevOps-rule/index.html).

### Azure Repos Git - YAML

1. Go to `Pipelines` and create `New pipeline`.
2. Select `Azure Repos Git (YAML)`
3. Select your code repository.
4. Select `Node.js Express Web App to Linux on Azure` template.
5. Select the web app where you will deploy.
6. Modify your current YAML and add the following points:
    - Node.js version should match the same of your web app.
    - Validate if you need `npm run test`, if not remove it.
    - Use npm or yarn to build your dependencies.

        ```yaml
            - script: |
                npm install
                npm run build --if-present
            displayName: 'npm install and build'
        ```
    - Just include the production folder in `ArchiveFiles@2` task:

        ```yaml
            - task: ArchiveFiles@2
            displayName: 'Archive files'
            inputs:
                rootFolderOrFile: '$(System.DefaultWorkingDirectory)/build/'
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
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
              startUpCommand: 'pm2 serve /home/site/wwwroot --spa --no-daemon'
        ```

7. Save and `run` the pipeline.

Here is an example with recommendations:

```yaml
trigger:
- master

variables:

  # Azure Resource Manager connection created during pipeline creation
  azureSubscription: 'subscriptionId'

  # Web app name
  webAppName: 'webapp-name'

  # Environment name
  environmentName: 'webapp-name'

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
        versionSpec: '14.x'
      displayName: 'Install Node.js'
      
    - script: |
        npm install
        npm run build --if-present
      displayName: 'npm install and build'

    - task: ArchiveFiles@2
      displayName: 'Archive files'
      inputs:
        rootFolderOrFile: '$(System.DefaultWorkingDirectory)/build/'
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
            displayName: 'Azure Web App Deploy: webapp-name'
            inputs:
              azureSubscription: $(azureSubscription)
              appType: webAppLinux
              appName: $(webAppName)
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
              startUpCommand: 'pm2 serve /home/site/wwwroot --spa --no-daemon'
```

![React App](/media/2022/01/react-deployment-linux-07.png)


# Troubleshooting

## Slow Startup

When you are running npm start it will trigger `react-scripts start` and this will use development server and compile the assets. This can take some time in the startup and also can be consuming memory.

    ```log
        2022-02-07T20:38:33.660837525Z > projectname@0.1.0 start /home/site/wwwroot
        2022-02-07T20:38:33.660844926Z > react-scripts start
        2022-02-07T20:38:33.660849426Z 
        2022-02-07T20:38:36.964131328Z Starting the development server...
        2022-02-07T20:38:36.964162630Z 
        2022-02-07T20:38:44.178924445Z Compiled successfully!
        2022-02-07T20:38:44.178963448Z 
        2022-02-07T20:38:44.178968348Z You can now view projectname in the browser.
        2022-02-07T20:38:44.178972049Z 
        2022-02-07T20:38:44.178975349Z   Local:            http://localhost:8080
        2022-02-07T20:38:44.178978949Z   On Your Network:  http://172.17.252.5:8080
        2022-02-07T20:38:44.178982749Z 
        2022-02-07T20:38:44.179030053Z Note that the development build is not optimized.
        2022-02-07T20:38:44.179038553Z To create a production build, use npm run build.
        2022-02-07T20:38:44.179042254Z 
        2022-02-07T20:38:44.224896919Z assets by path static/ 1.49 MiB
        2022-02-07T20:38:44.224953323Z   asset static/js/bundle.js 1.48 MiB [emitted] (name: main) 1 related asset
        2022-02-07T20:38:44.224960423Z   asset static/js/node_modules_web-vitals_dist_web-vitals_js.chunk.js 6.96 KiB [emitted] 1 related asset
        2022-02-07T20:38:44.224982425Z   asset static/media/logo.6ce24c58023cc2f8fd88fe9d219db6c6.svg 2.57 KiB [emitted] (auxiliary name: main)
        2022-02-07T20:38:44.224988225Z asset index.html 1.67 KiB [emitted]
        2022-02-07T20:38:44.224992425Z asset asset-manifest.json 546 bytes [emitted]
        2022-02-07T20:38:44.224996526Z runtime modules 31.3 KiB 15 modules
        2022-02-07T20:38:44.225000526Z modules by path ../../../node_modules/ 1.35 MiB 99 modules
        2022-02-07T20:38:44.225004826Z modules by path ./src/ 18.3 KiB
        2022-02-07T20:38:44.225008926Z   modules by path ./src/*.css 9.12 KiB
        2022-02-07T20:38:44.225013027Z     ./src/index.css 2.85 KiB [built] [code generated]
        2022-02-07T20:38:44.225018527Z     ../../../node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].oneOf[5].use[1]!../../../node_modules/postcss-loader/dist/cjs.js??ruleSet[1].rules[1].oneOf[5].use[2]!../../../node_modules/source-map-loader/dist/cjs.js!./src/index.css 1.39 KiB [built] [code generated]
        2022-02-07T20:38:44.225026428Z     ./src/App.css 2.85 KiB [built] [code generated]
        2022-02-07T20:38:44.225030628Z     ../../../node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].oneOf[5].use[1]!../../../node_modules/postcss-loader/dist/cjs.js??ruleSet[1].rules[1].oneOf[5].use[2]!../../../node_modules/source-map-loader/dist/cjs.js!./src/App.css 2.02 KiB [built] [code generated]
        2022-02-07T20:38:44.225035328Z   modules by path ./src/*.js 5.53 KiB
        2022-02-07T20:38:44.225039428Z     ./src/index.js 1.74 KiB [built] [code generated]
        2022-02-07T20:38:44.225044029Z     ./src/App.js 2.44 KiB [built] [code generated]
        2022-02-07T20:38:44.225050029Z     ./src/reportWebVitals.js 1.35 KiB [built] [code generated]
        2022-02-07T20:38:44.225054330Z   ./src/logo.svg 3.61 KiB [built] [code generated]
        2022-02-07T20:38:44.225058530Z webpack 5.68.0 compiled successfully in 7843 ms
    ```

- **Resolution**:  Use PM2 to serve the production build `build` folder already built in Oryx deployment process using this startup command **`pm2 serve /home/site/wwwroot/build --no-daemon --spa`** this will avoid running React development mode. You can find more details in this [reference](https://azureossd.github.io/2020/04/30/run-production-build-on-app-service-linux/index.html).
    
## 404 Not Found

Since React is a SPA (Single Page Application) you will probably get a 404 trying to browse the site in certain routes. You need to redirect all queries to the index.html.

**Resolution**: Use a startup command passing `--spa` argument to PM2 as followed: **`pm2 serve /home/site/wwwroot/build --no-daemon --spa`** or using a [process file](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/#serving-spa-redirect-all-to-indexhtml).

## GitHub Actions Timeout and slow deployments

A normal deployment doesn't need to take more than 5-15 mins. If the workflow is taking more than that then you might need to review current implementation. Here is a list of things to check:

- **Running tests**. There are scenarios where GitHub Actions Agent takes more than 360 minutes (6 hrs) to give you a status and fails with: **`The job running on runner Hosted Agent has exceeded the maximum execution time of 360 minutes.`**. If you have `npm run test` defined in your `package.json`, this will be triggered by the workflow created from Azure App Service. The best option is to evaluate if this is required to be executed in the workflow since the majority of these tests will run Chrome browser, if this is not needed then it is better to remove it.

- **Too many files and slow deployments**. Using `actions/upload-artifact@v2` to allow sharing data between jobs and store data once the a workflow is complete, it will depend on the JavaScript framework but Angular/React applications tends to have more than 10,000 files when it is compiled including node_modules folder, when this condition is met, it will trigger the following warning `There are over 10,000 files in this artifact, consider creating an archive before upload to improve the upload performance.`, this will delay your deployment by several mins or hrs. 

    ![React App](/media/2022/01/react-deployment-linux-03.png)

    For those scenarios, you can implement the following alternatives:

    1. (*Recommended*) Upload just production build folder in `actions/upload-artifact@v2` action:

        ```yaml
            - name: Upload artifact for deployment job
                uses: actions/upload-artifact@v2
                with:
                name: node-app
                path: build/
        ```
        ![React App](/media/2022/01/react-deployment-linux-04.png)

    2. Or Zip/unzip your application files between jobs.

        **build job**:

        ```yaml
        - name: Zip all files for upload between jobs
            run: zip react.zip ./* 
            
        - name: Upload artifact for deployment job
            uses: actions/upload-artifact@v2
            with:
            name: node-app
            path: react.zip
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
                
            - name: Unzip files for App Service Deploy
                run: unzip react.zip

            - name: Delete zip file
                run: rm react.zip

            - name: 'Deploy to Azure Web App'
                id: deploy-to-webapp
                uses: azure/webapps-deploy@v2
                with:
                app-name: 'sitename'
                slot-name: 'Production'
                publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_00000000000000000000 }}
                package: .
        ```

        ![React App](/media/2022/01/react-deployment-linux-08.png)


## Environment variables are missing after deployment
If the application does not have access to the environment variables during build time **or** if the environment variable is not prefixed with `REACT_APP_` they will appear as `undefined`.

**Resolution**:

- **Syntax**: Ensure the variable is prefixed with `REACT_APP_`. Such as `REACT_APP_MY_ENV_VAR` and not just `MY_ENV_VAR`. The variable can be accessed using `process.env.REACT_APP_MY_ENV_VAR`. The `REACT_APP_` prefix is specific to React.
- **Oryx Build**: If building the application with Oryx make sure to add the AppSetting for the environment variable **first**. This will make sure the environment variable is available during the build. If the application is deployed first without adding the AppSetting, add the AppSetting and then redeploy the application.
- **GitHub Actions**: All the build process will happen on the GitHub Agent, so the environment variables will need to be added in the workflow.

    You can add custom environment variables in the first level before jobs:

    ![React App](/media/2022/01/react-deployment-linux-09.png)

    And then add these secrets in GitHub. *This can be done going to your project -> Settings -> Secrets -> Actions*.

    **Note**: Since the build is done on the GitHub agent with the variables scoped to the Agent you do not need to re-add those AppSettings in the Azure Web App Portal.

- **Azure DevOps**: Since the build will happen on the DevOps Agent, so the environment variables will need to be added in the pipeline. 

    *This can be done by going to Pipeline -> Click on the Pipeline again -> Edit -> Variables*. 

    After adding the needed environment variables in the pipeline trigger a build. The variables will now be replaced during the build. 
    
    **Note**: Since the build is done on the DevOps agent with the variables scoped to the Agent you do not need to re-add those AppSettings in the Azure Web App Portal.

> **Note**: For more information on how React uses and expects environment variables click [here](https://create-react-app.dev/docs/adding-custom-environment-variables/).