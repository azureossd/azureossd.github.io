---
title: "Angular Deployment on App Service Linux"
author_name: "Edison Garcia"
tags:
    - JavaScript
    - Angular
    - Deploy
    - Azure DevOps
    - GitHub Actions
categories:
    - Azure App Service on Linux
    - Javascript
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/nodelinux.png
toc: true
toc_sticky: true
date: 2022-01-29 12:00:00
---

This section provides information for creating, configuring, and deploying an Angular on App Service Linux. 

# Local Development 

## Create an Angular app

1. Setup a local environment starting with Angular CLI.

    ```bash
    npm i @angular/cli -g
    ```

2. Create a workspace and initial application.

    ```bash
    ng new <projectname>
    ```

    It will prompt for selecting Angular Routing and stylesheet format.

3. Once the installation is done, cd into projectname folder and then start the server using:
    
    ```bash
    ng serve
    ```

    This will compile and build the site.

    ```
    ✔ Browser application bundle generation complete.

    Initial Chunk Files   | Names         |  Raw Size
    vendor.js             | vendor        |   1.69 MB |
    polyfills.js          | polyfills     | 299.95 kB |
    styles.css, styles.js | styles        | 173.22 kB |
    main.js               | main          |  51.43 kB |
    runtime.js            | runtime       |   6.51 kB |

                        | Initial Total |   2.21 MB

    Build at: 2022-02-04T22:08:15.113Z - Hash: 03e2b16ae88e1a15 - Time: 46345ms

    ** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **


    √ Compiled successfully.
    ```

4. Browse the site with `http://localhost:4200` to get the default page. You can define specific port using ng serve --host 0.0.0.0 --port 8080.

    ![Angular App](/media/2022/01/angular-deployment-linux-01.png)

5. To create a production build you can run:

    ```bash
    ng build
    ```

    This will create a `dist` folder with your project name and static files.

# Deployment Options
There are multiple deployment options in App Service Linux as Continuos Deployment(GitHub/GitHub Actions, Bitbucket, Azure Repos, External Git, Local Git), ZipDeploy, Run from Package, FTP, etc. 

## Local Git 
When using Local Git, you are using `App Service Build Service` also named as ([Oryx](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md)) to build your application.

To setup this option and deploy an angular app follow the next steps:
1. Navigate to your web app and select `Deployment Center` and then click on `Local Git` and then click on `Save`.

    ![Angular App](/media/2022/01/angular-deployment-linux-02.png)
2. Copy the remote git repository from Azure Portal.

    ![Angular App](/media/2022/01/angular-deployment-linux-03.png)
3. In your local terminal run the following commands in order:
    ```bash
    git add .
    git commit -m "Initial Commit"
    git remote add azure https://<sitename>.scm.azurewebsites.net:443/<sitename>.git
    git push azure master
    ```
4. Then Oryx will build your application:
    ```log
    Enumerating objects: 34, done.
    Counting objects: 100% (34/34), done.
    Delta compression using up to 8 threads
    Compressing objects: 100% (32/32), done.
    Writing objects: 100% (34/34), 104.15 KiB | 4.17 MiB/s, done.
    Total 34 (delta 1), reused 0 (delta 0), pack-reused 0
    remote: Deploy Async
    remote: Updating branch 'master'.
    remote: Updating submodules.
    remote: Preparing deployment for commit id 'f5fafa5f67'.
    remote: Repository path is /home/site/repository
    remote: Running oryx build...
    remote: Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
    remote: You can report issues at https://github.com/Microsoft/Oryx/issues
    remote:
    remote: Oryx Version: 0.2.20210826.1, Commit: f8651349d0c78259bb199593b526450568c2f94a, ReleaseTagName: 20210826.1
    remote:
    remote: Build Operation ID: |q9gEkdHAwPA=.1d27a30b_
    remote: Repository Commit : f5fafa5f67b7b0a8becec7c5a815ed25bb5d09db
    remote:
    remote: Detecting platforms...
    remote:
    remote: Using intermediate directory '/tmp/8d9e82eac449761'.
    remote:
    remote: Copying files to the intermediate directory...
    remote: Done in 0 sec(s).
    remote:
    remote: Source directory     : /tmp/8d9e82eac449761
    remote: Destination directory: /home/site/wwwroot
    remote:
    ..........
    remote: Creating directory for command manifest file if it doesnot exist
    .......
    remote:
    remote: Running 'npm install --unsafe-perm'...
    remote:
    ........
    remote:
    remote: Running 'npm run build'...
    remote:
    remote: > projectname@0.0.0 build
    remote: > ng build
    remote:
    remote: - Generating browser application bundles (phase: setup)...
    remote: ............
    remote: ✔ Browser application bundle generation complete.
    remote: ✔ Browser application bundle generation complete.
    remote:
    remote: - Copying assets...
    remote: Initial Chunk Files           | Names         |  Raw Size | Estimated Transfer Size
    remote: ✔ Copying assets complete.
    remote: main.3552c7adcca4fe7b.js      | main          | 131.51 kB |                38.46 kB
    remote: - Generating index html...
    remote: polyfills.6e567874254221f9.js | polyfills     |  36.22 kB |                11.51 kB
    remote: ✔ Index html generation complete.
    remote: runtime.4021e03cf3816e6c.js   | runtime       |   1.04 kB |               598 bytes
    remote: styles.ef46db3751d8e999.css   | styles        |   0 bytes |                       -
    remote:
    remote: | Initial Total | 168.77 kB |                50.55 kB
    remote:
    remote: Build at: 2022-02-04T22:38:02.642Z - Hash: 2aae5ce68b71aaad - Time: 17845ms
    remote:
    remote: Zipping existing node_modules folder...
    remote: ......
    remote: Preparing output...
    remote:
    remote: Copying files to destination directory '/home/site/wwwroot'...
    remote: ....
    remote: Running post deployment command(s)...
    remote: Triggering recycle (preview mode disabled).
    remote: Deployment successful.
    ```
5. Add a startup command: **`pm2 serve /home/site/wwwroot/dist/projectname --no-daemon --spa`** where `projectname` is the name of your project.

    ![Angular App](/media/2022/01/angular-deployment-linux-04.png)


## GitHub Actions

You can quickly get started with GitHub Actions by using the App Service Deployment Center. This will automatically generate a workflow file based on your application stack and commit it to your GitHub repository in the correct directory. You can deploy a workflow manually using deployment credentials. 

![Angular App](/media/2022/01/angular-deployment-linux-09.png)

You can find more details about these steps documented here:
 - [Use the Deployment Center](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#use-the-deployment-center)
 - [Set up a workflow manually](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#set-up-a-workflow-manually)


For **Angular deployments** is recommended to modify the default template with the following changes:

1. Just upload the production build folder.
2. Remove any npm run test if neccesary.
3. Validate current nodejs version.
    
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

      - name: npm install, build, and test
        run: |
          npm install
          npm run build --if-present

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v2
        with:
          name: node-app
          path: dist/projectname/

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
          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_00000000000000000 }}
          package: .
````

After the deployment, then add a startup command startup command: `pm2 serve /home/site/wwwroot --spa --no-daemon`

![Angular App](/media/2022/01/angular-deployment-linux-10.png)


## Azure DevOps
You can use Azure Pipelines to build your Angular application. For Angular apps, you can include Angular-specific commands such as ng test, ng build, and ng e2e. To use Angular CLI commands in your pipeline, install the angular/cli npm package on the build agent. You can review more details here: [Implement JavaScript frameworks](https://docs.microsoft.com/en-us/azure/devops/pipelines/ecosystems/javascript?view=azure-devops&tabs=code#implement-javascript-frameworks).

Here is an example in how to implement Azure Pipelines with App Service Linux.

1. Go to `Pipelines` and create `New pipeline`.
2. Select `Azure Repos Git (YAML)`, there are other options as classic editor without YAML.
3. Select your code repository.
4. Select `Node.js Express Web App to Linux on Azure` template.
5. Select the web app where you will deploy.
6. Modify your current YAML and add the following points:
    - Node.js version should match the same of your web app.
    - Validate if you need `npm run test`, if not remove it.
    - Use `ng build` or `npm run build`. It has the same result. If you decide to use `ng build`, you need to install angular cli.
        ```yaml
        - script: |
            npm install -g @angular/cli
            npm install
            ng build --prod
          displayName: 'npm install, build'
        ```
    - Just include the production folder in ` ArchiveFiles@2` task:
        ```yaml
        - task: ArchiveFiles@2
        displayName: 'Archive files'
        inputs:
            rootFolderOrFile: '$(System.DefaultWorkingDirectory)/dist/projectname/'
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
  azureSubscription: 'subscription'

  # Web app name
  webAppName: 'sitename'

  # Environment name
  environmentName: 'sitename'

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
         npm install -g @angular/cli
         npm install
         ng build --prod
      displayName: 'npm install, build'


    - task: ArchiveFiles@2
      displayName: 'Archive files'
      inputs:
        rootFolderOrFile: '$(System.DefaultWorkingDirectory)/dist/projectname/'
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
            displayName: 'Azure Web App Deploy: angular2-devops'
            inputs:
              azureSubscription: $(azureSubscription)
              appType: webAppLinux
              appName: $(webAppName)
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
              startUpCommand: 'pm2 serve /home/site/wwwroot --spa --no-daemon'
```

![Angular App](/media/2022/01/angular-deployment-linux-11.png)

----


# Troubleshooting
### Container Doesn't Start

- **Starting Development environment and Nodejs version is not matching the Angular CLI requirements**: (As this moment) The Angular CLI requires a minimum Node.js version of either v12.20, v14.15, or v16.10. In scenarios where you pick any Node.js version different from angular cli requirements  will fail since by default `npm start` will call `ng serve`.

    ```bash
    2022-02-04T22:44:25.862767811Z > projectname@0.0.0 start /home/site/wwwroot
    2022-02-04T22:44:25.862773611Z > ng serve
    2022-02-04T22:44:25.862778012Z 
    2022-02-04T22:44:25.936520409Z Node.js version v16.6.1 detected.
    2022-02-04T22:44:25.936558511Z The Angular CLI requires a minimum Node.js version of either v12.20, v14.15, or v16.10.
    2022-02-04T22:44:25.936564112Z 
    2022-02-04T22:44:25.936568312Z Please update your Node.js version or visit https://nodejs.org/ for additional instructions.
    2022-02-04T22:44:25.936573312Z 
    2022-02-04T22:44:25.941591359Z npm info lifecycle projectname@0.0.0~start: Failed to exec start script
    2022-02-04T22:44:25.943842415Z npm ERR! code ELIFECYCLE
    2022-02-04T22:44:25.943864616Z npm ERR! errno 3
    2022-02-04T22:44:25.945539632Z npm ERR! projectname@0.0.0 start: `ng serve`
    2022-02-04T22:44:25.945594636Z npm ERR! Exit status 3
    2022-02-04T22:44:25.947691681Z npm ERR! 
    2022-02-04T22:44:25.948522438Z npm ERR! Failed at the projectname@0.0.0 start script.
    2022-02-04T22:44:25.948529439Z npm ERR! This is probably not a problem with npm. There is likely additional logging output above.
    2022-02-04T22:44:25.951048313Z npm timing npm Completed in 367ms
    2022-02-04T22:44:25.951111817Z 
    2022-02-04T22:44:25.951145019Z npm ERR! A complete log of this run can be found in:
    2022-02-04T22:44:25.951159020Z npm ERR!     /root/.npm/_logs/2022-02-04T22_44_25_946Z-debug.log
    ```
    - **Resolution**:  Use PM2 to serve the production build `dist` folder already built in Oryx deployment process using this startup command **`pm2 serve /home/site/wwwroot/dist/projectname --no-daemon --spa`** this will avoid running Angular development mode. You can find more details in this [reference](https://azureossd.github.io/2020/04/30/run-production-build-on-app-service-linux/index.html).

- **Starting Development environment and timing out for incorrect port and localhost bind**. By default Node.js blessed images will be listening in port 8080, since a regular Angular app contains a `package.json` with `npm start` script defined as 
followed: 
    ```
    "scripts": {
        "ng": "ng",
        "start": "ng serve",
        "build": "ng build",
        "watch": "ng build --watch --configuration development",
        "test": "ng test"
    },
    ```
    Oryx will pick this script and run `npm start`. This will trigger [ng serve](https://angular.io/cli/serve) starting the development mode and just binding it to localhost. 

    ```bash
    2022-02-04T23:15:23.757040404Z > projectname@0.0.0 start /home/site/wwwroot
    2022-02-04T23:15:23.757046905Z > ng serve
    2022-02-04T23:15:23.757052705Z 
    2022-02-04T23:15:27.188024253Z - Generating browser application bundles (phase: setup)...
    2022-02-04T23:15:37.285420673Z âœ” Browser application bundle generation complete.
    2022-02-04T23:15:37.348097477Z 
    2022-02-04T23:15:37.348131880Z Initial Chunk Files   | Names         |  Raw Size
    2022-02-04T23:15:37.348138280Z vendor.js             | vendor        |   1.69 MB |
    2022-02-04T23:15:37.348144181Z polyfills.js          | polyfills     | 300.34 kB |
    2022-02-04T23:15:37.348150281Z styles.css, styles.js | styles        | 173.67 kB |
    2022-02-04T23:15:37.348155981Z main.js               | main          |  51.07 kB |
    2022-02-04T23:15:37.348160682Z runtime.js            | runtime       |   6.51 kB |
    2022-02-04T23:15:37.348165282Z 
    2022-02-04T23:15:37.348169682Z | Initial Total |   2.21 MB
    2022-02-04T23:15:37.348174083Z 
    2022-02-04T23:15:37.348178483Z Build at: 2022-02-04T23:15:37.280Z - Hash: 9a72a3f82de64324 - Time: 9665ms
    2022-02-04T23:15:37.348979638Z 
    2022-02-04T23:15:37.349001039Z ** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **
    2022-02-04T23:15:37.349007040Z 
    2022-02-04T23:15:37.349015040Z 
    2022-02-04T23:15:37.349019541Z âœ” Compiled successfully.
    ```
    - **Resolution**:  Use PM2 to serve the production build `dist` folder already built in Oryx deployment process using this startup command **`pm2 serve /home/site/wwwroot/dist/projectname --no-daemon --spa`** to avoid running Angular development mode. You can find more details in this [reference](https://azureossd.github.io/2020/04/30/run-production-build-on-app-service-linux/index.html).


### 404 Not Found
Since Angular is a SPA (Single Page Application) you will probably get a 404 trying to browse the site in certain routes. You need to redirect all queries to the index.html.

**Resolution**: Use a startup command passing `--spa` argument to PM2 as followed: `pm2 serve /home/site/wwwroot/dist/angularfrontend --no-daemon --spa` or using a [process file](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/#serving-spa-redirect-all-to-indexhtml).

### GitHub Actions Timeout and slow deployments
A normal deployment doesn't need to take more than 5-15 mins. If the workflow is taking more than that then you might need to review current implementation. Here is a list of things to check:

- **Running tests**. There are scenarios where GitHub Actions Agent takes more than 360 minutes (6 hrs) to give you a status and fails with: **`The job running on runner Hosted Agent has exceeded the maximum execution time of 360 minutes.`**. If you have `npm run test` defined in your `package.json`, this will be triggered by the workflow created from Azure App Service. The best option is to evaluate if this is required to be executed in the workflow since the majority of these tests will run Chrome browser, if this is not needed then it is better to remove it.

    ![Angular App](/media/2022/01/angular-deployment-linux-05.png)

- **Too many files and slow deployments**. Using `actions/upload-artifact@v2` to allow sharing data between jobs and store data once the a workflow is complete, it will depend on the JavaScript framework but Angular/React applications tends to have more than 10,000 files when it is compiled including node_modules folder, when this condition is met, it will trigger the following warning `There are over 10,000 files in this artifact, consider creating an archive before upload to improve the upload performance.`, this will delay your deployment by several mins or hrs. 

    ![Angular App](/media/2022/01/angular-deployment-linux-06.png)

    For those scenarios, you can implement the following alternatives:

    1. Upload just production dist folder in `actions/upload-artifact@v2` action:

        ```yaml
        # Depending on JavaScript framework you can use dist or build.
        
        - name: Upload artifact for deployment job
            uses: actions/upload-artifact@v2
            with:
            name: node-app
            path: dist/projectname/
        ```

        Result: 

        ![Angular App](/media/2022/01/angular-deployment-linux-07.png)

    2. Or Zip/unzip your application files between jobs.

        **build job**:

        ```yaml
        - name: Zip all files for upload between jobs
            run: zip angular.zip ./* .env .angular -r 
            
        - name: Upload artifact for deployment job
            uses: actions/upload-artifact@v2
            with:
            name: node-app
            path: angular.zip
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
                run: unzip angular.zip

            - name: Delete zip file
                run: rm angular.zip

            - name: 'Deploy to Azure Web App'
                id: deploy-to-webapp
                uses: azure/webapps-deploy@v2
                with:
                app-name: 'sitename'
                slot-name: 'Production'
                publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_00000000000000000000 }}
                package: .
        ```

        ![Angular App](/media/2022/01/angular-deployment-linux-071.png)
------
