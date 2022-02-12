---
title: "Nest Deployment on App Service Linux"
author_name: "Edison Garcia"
tags:
    - Nest
    - Nodejs
    - Deploy
    - Azure DevOps
    - GitHub Actions
categories:
    - Azure App Service on Linux
    - Nest
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/nest.png
toc: true
toc_sticky: true
date: 2022-02-11 12:00:00
---

This section provides information for creating, configuring, and deploying an Nest app on App Service Linux. 

# Local Development 

## Create a Nest app

1. Setup a local environment starting with Nest CLI:

    `npm i -g @nestjs/cli`

2. Create a workspace and initial application with:
    
    `nest new projectname`

    It will prompt for selecting which package manager would you use (npm, yarn, pnpm). For this scenario npm was selected.

3. Once the installation is done, cd into projectname folder and then start the server using:
    
    `npm run start`

4. Browse the site with `http://localhost:3000` to get the default page. 

    ![Nest App](/media/2022/02/nest-deployment-linux-01.png)

5. Edit `src/main.ts` and add `process.env.PORT` in `app.listen()` function to avoid having a hardcoded port for Azure App Service.
    
    ```javascript
    await app.listen(process.env.PORT || 3000);
    ```

# Deployment Options
There are multiple deployment options in App Service Linux as Continuos Deployment(GitHub/GitHub Actions, Bitbucket, Azure Repos, External Git, Local Git), ZipDeploy, Run from Package, FTP, etc. 

## Local Git 
When using Local Git, you are using `App Service Build Service` also named as ([Oryx](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md)) to build your application.

To setup this option and deploy an angular app follow the next steps:
1. Navigate to your web app and select `Deployment Center` and then click on `Local Git` and then click on `Save`.

    ![Nest App](/media/2022/01/angular-deployment-linux-02.png)
2. Copy the remote git repository from Azure Portal.

    ![Nest App](/media/2022/01/angular-deployment-linux-03.png)
3. In your local terminal run the following commands in order:
    ```bash
    git add .
    git commit -m "Initial Commit"
    git remote add azure https://<sitename>.scm.azurewebsites.net:443/<sitename>.git
    git push azure master
    ```
4. Then Oryx will build your application:
    ```log
        Enumerating objects: 23, done.
        Counting objects: 100% (23/23), done.
        Delta compression using up to 8 threads
        Compressing objects: 100% (23/23), done.
        Writing objects: 100% (23/23), 76.12 KiB | 1.49 MiB/s, done.
        Total 23 (delta 0), reused 0 (delta 0), pack-reused 0
        remote: Deploy Async
        remote: Updating branch 'master'.
        remote: Updating submodules.
        remote: Preparing deployment for commit id '6325b7d13d'.
        remote: Repository path is /home/site/repository
        remote: Running oryx build...
        remote: Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
        remote: You can report issues at https://github.com/Microsoft/Oryx/issues
        remote:
        remote: Source directory     : /tmp/8d9ed96dbc8714f
        remote: Destination directory: /home/site/wwwroot
        remote:
        remote: Running 'npm install --unsafe-perm'...
        remote: npm notice
        remote: added 734 packages, and audited 735 packages in 2m
        remote: npm notice New minor version of npm available! 8.1.2 -> 8.5.0
        remote:
        remote: Running 'npm run build'...
        remote:
        remote:
        remote: > helloworld@0.0.1 prebuild
        remote: > rimraf dist
        remote:
        remote:
        remote: > helloworld@0.0.1 build
        remote: > nest build
        remote:
        remote:
        remote: Zipping existing node_modules folder...
        remote: .........
        remote: Done in 13 sec(s).
        remote: Preparing output...
        remote:
        remote: Copying files to destination directory '/home/site/wwwroot'...
        remote: Done in 2 sec(s).
        remote:
        remote: Removing existing manifest file
        remote: Creating a manifest file...
        remote: Manifest file created.
        remote:
        remote: Done in 123 sec(s).
        remote: Running post deployment command(s)...
        remote: Triggering recycle (preview mode disabled).
        remote: Deployment successful.
    ```
5. Add a startup command to avoid having the container recompile Typescript before starting: 
    - *(Recommended)* **`pm2 start dist/main.js --no-daemon`** 
    - **`npm run start:prod`**
    - **`node dist/main`** 
    
    ![Nest App](/media/2022/02/nest-deployment-linux-02.png)


## GitHub Actions

You can quickly get started with GitHub Actions by using the App Service Deployment Center. This will automatically generate a workflow file based on your application stack and commit it to your GitHub repository in the correct directory. You can deploy a workflow manually using deployment credentials. 

![Angular App](/media/2022/01/angular-deployment-linux-09.png)

You can find more details about these steps documented here:
 - [Use the Deployment Center](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#use-the-deployment-center)
 - [Set up a workflow manually](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#set-up-a-workflow-manually)


For **Nest deployments** is recommended to modify the default template with the following recommendations:

1. Nest can create symbolic links to npm executables, you can include the symlinks when uploading the artifacts between jobs in the GitHub Agent.
2. Compress and archive artifacts into a single zip file since Nest node_modules are big.  
2. Remove any npm run test if neccesary.
3. Validate current nodejs version.
    
Here is an example with recommendations:

```yaml
    name: Build and deploy Node.js app to Azure Web App - sampleapp

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
            node-version: '16.x'

        - name: npm install, build, and test
            run: |
            npm install
            npm run build --if-present

        - name: Zip all files for upload between jobs
            run: zip --symlinks -r nest.zip ./*
                
        - name: Upload artifact for deployment job
            uses: actions/upload-artifact@v2
            with:
            name: node-app
            path: nest.zip

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
            app-name: 'sampleapp'
            slot-name: 'Production'
            publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_00000000000000000000000 }}
            package: nest.zip

        - name: Delete zip file
            run: rm nest.zip

````

After the deployment, add a startup command to avoid having the container recompile Typescript before starting: 

- *(Recommended)* **`pm2 start dist/main.js --no-daemon`** 
- **`npm run start:prod`**
- **`node dist/main`** 
    
![Nest App](/media/2022/02/nest-deployment-linux-02.png)



## Azure DevOps
You can use Azure Pipelines to build your Nest application. You can use npm/yarn to install/build the artifacts. You can review more details here: [Manage dependencies](https://docs.microsoft.com/en-us/azure/devops/pipelines/ecosystems/javascript?view=azure-devops&tabs=code#manage-dependencies).

Here is an example in how to implement Azure Pipelines with App Service Linux.

1. Go to `Pipelines` and create `New pipeline`.
2. Select `Azure Repos Git (YAML)`, there are other options as classic editor without YAML.
3. Select your code repository.
4. Select `Node.js Express Web App to Linux on Azure` template or create one from scratch. 
5. Select the web app where you will deploy.
6. Modify your current YAML and add the following points:
    - Node.js version should match the same of your web app.
    - Add a startup command in the `AzureWebApp@1` task and validate current nodejs version. 
        - *(Recommended)* **`pm2 start dist/main.js --no-daemon`** 
        - **`npm run start:prod`**
        - **`node dist/main`** 

        ```yaml
            - task: AzureWebApp@1
                displayName: 'Azure Web App Deploy: sitename'
                inputs:
                azureSubscription: $(azureSubscription)
                appType: webAppLinux
                appName: $(webAppName)
                package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
                startUpCommand: 'pm2 start dist/main.js --no-daemon'
        ```

7. Save and `run` the pipeline.

Here is an example:

```yaml
    trigger:
    - master

    variables:

    # Azure Resource Manager connection created during pipeline creation
    azureSubscription: 'subscriptionId'

    # Web app name
    webAppName: 'sampleapp'

    # Environment name
    environmentName: 'sampleapp'

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
            npm run build --if-present
        displayName: 'npm install, build'

        - task: ArchiveFiles@2
        displayName: 'Archive files'
        inputs:
            rootFolderOrFile: '$(System.DefaultWorkingDirectory)'
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
                displayName: 'Azure Web App Deploy: sitename'
                inputs:
                azureSubscription: $(azureSubscription)
                appType: webAppLinux
                appName: $(webAppName)
                package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
                startUpCommand: 'pm2 start dist/main.js --no-daemon'
```

![Nest App](/media/2022/02/nest-deployment-linux-06.png)


# Troubleshooting

## Container Doesn't Start

- **Application is timing out at 230 seconds on Container start up**:

    **Resolution**. Review `main.ts` to see if `app.listen()` is using a hardcoded port value. If it is, change this to use `process.env.PORT`. Another way is to use `process.env.PORT || 3000`. 

    > Note: Azure App Service Linux Nodejs blessed images are setting 8080 to `PORT` environment variable.

    ```javascript
        import { NestFactory } from '@nestjs/core';
        import { NestExpressApplication } from '@nestjs/platform-express';
        import { AppModule } from './app.module';

        async function bootstrap() {
            const app = await NestFactory.create<NestExpressApplication>(AppModule);
            await app.listen(process.env.PORT || 3000);
        }

        bootstrap();
    ```

- **Container is crashing on startup due to Typescript compilation errors**. 
    
    **Resolution**: First, ensure this runs locally using `next start`. Alternatively change the Startup command on Azure to use any of these options to avoid having the container recompile Typescript before starting:
        
    - *(Recommended)* **`pm2 start dist/main.js --no-daemon`** 
    - **`npm run start:prod`**
    - **`node dist/main`** 

- **Container is crashing on startup because can't read nest npm executables**

    You can find these errors frequently when using *GitHub Actions*. This can be related to node_modules are missing symbolic links when zipping the artifacts across different stages/jobs in the Agent. 
    
    *ENODEV: no such device*:
    ```
        2022-02-11T22:34:32.345773507Z > helloworld@0.0.1 start:prod /home/site/wwwroot
        2022-02-11T22:34:32.345779208Z > node dist/main
        2022-02-11T22:34:32.345783508Z 
        2022-02-11T22:34:39.028856705Z node:internal/fs/utils:343
        2022-02-11T22:34:39.028928910Z     throw err;
        2022-02-11T22:34:39.028935411Z     ^
        2022-02-11T22:34:39.028939511Z 
        2022-02-11T22:34:39.028943311Z Error: ENODEV: no such device, read
        2022-02-11T22:34:39.028947212Z     at Object.readSync (node:fs:720:3)
        2022-02-11T22:34:39.028951312Z     at tryReadSync (node:fs:430:20)
        2022-02-11T22:34:39.028955112Z     at Object.readFileSync (node:fs:468:19)
        2022-02-11T22:34:39.028959012Z     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1118:18)
        2022-02-11T22:34:39.028963013Z     at Module.load (node:internal/modules/cjs/loader:981:32)
        2022-02-11T22:34:39.028966813Z     at Function.Module._load (node:internal/modules/cjs/loader:822:12)
        2022-02-11T22:34:39.028970713Z     at Module.require (node:internal/modules/cjs/loader:1005:19)
        2022-02-11T22:34:39.028974614Z     at require (node:internal/modules/cjs/helpers:94:18)
        2022-02-11T22:34:39.028978514Z     at Object.<anonymous> (/home/site/wwwroot/node_modules/@nestjs/core/index.js:25:22)
        2022-02-11T22:34:39.028983214Z     at Module._compile (node:internal/modules/cjs/loader:1101:14) {
        2022-02-11T22:34:39.028987414Z   errno: -19,
        2022-02-11T22:34:39.028991415Z   syscall: 'read',
        2022-02-11T22:34:39.028995215Z   code: 'ENODEV'
        2022-02-11T22:34:39.028998915Z }
    ```

    *Error: Cannot find module '../commands'*:
    ```
        2022-02-11T22:04:00.601563398Z Error: Cannot find module '../commands'
        2022-02-11T22:04:00.601567298Z Require stack:
        2022-02-11T22:04:00.601572699Z - /home/site/wwwroot/node_modules/.bin/nest
        2022-02-11T22:04:00.601576799Z     at Function.Module._resolveFilename (node:internal/modules/cjs/loader:933:15)
        2022-02-11T22:04:00.601580799Z     at Function.Module._load (node:internal/modules/cjs/loader:778:27)
        2022-02-11T22:04:00.601584700Z     at Module.require (node:internal/modules/cjs/loader:1005:19)
        2022-02-11T22:04:00.601588700Z     at require (node:internal/modules/cjs/helpers:94:18)
        2022-02-11T22:04:00.601592500Z     at Object.<anonymous> (/home/site/wwwroot/node_modules/.bin/nest:5:20)
        2022-02-11T22:04:00.601597201Z     at Module._compile (node:internal/modules/cjs/loader:1101:14)
        2022-02-11T22:04:00.601601101Z     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1153:10)
        2022-02-11T22:04:00.601604901Z     at Module.load (node:internal/modules/cjs/loader:981:32)
        2022-02-11T22:04:00.601608901Z     at Function.Module._load (node:internal/modules/cjs/loader:822:12)
        2022-02-11T22:04:00.601612902Z     at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:79:12) {
        2022-02-11T22:04:00.601616902Z   code: 'MODULE_NOT_FOUND',
        2022-02-11T22:04:00.601620702Z   requireStack: [ '/home/site/wwwroot/node_modules/.bin/nest' ]
        2022-02-11T22:04:00.601624602Z }
        2022-02-11T22:04:00.607466412Z npm info lifecycle helloworld@0.0.1~start: Failed to exec start script
        2022-02-11T22:04:00.610493424Z npm ERR! code ELIFECYCLE
        2022-02-11T22:04:00.610736541Z npm ERR! errno 1
        2022-02-11T22:04:00.615116648Z npm ERR! helloworld@0.0.1 start: `nest start`
        2022-02-11T22:04:00.615171552Z npm ERR! Exit status 1
    ```
    
    **Resolution**: You can preserve these symbolic links when zipping artifacts. Check complete example above.
    ```yaml
            - name: Zip all files for upload between jobs
            run: zip --symlinks -r nest.zip ./*
                
            - name: Upload artifact for deployment job
            uses: actions/upload-artifact@v2
            with:
            name: node-app
            path: nest.zip
    ```

## GitHub Actions 

- **Too many files and slow deployments**. Using `actions/upload-artifact@v2` to allow sharing data between jobs and store data once the a workflow is complete, it will depend on the Nodejs/JavaScript framework but Nest applications tends to have a lot of node_modules files, this will delay your deployment by several mins or hrs. 

    ![Nest App](/media/2022/02/nest-deployment-linux-03.png)

    ![Nest App](/media/2022/02/nest-deployment-linux-04.png)

    >From [Official Documentation](https://github.com/actions/toolkit/blob/master/packages/artifact/docs/additional-information.md#considerations): During upload, each file is uploaded concurrently in 4MB chunks using a separate HTTPS connection per file. Chunked uploads are used so that in the event of a failure, the upload can be retried. If there is an error, a retry will be attempted after a certain period of time.
    >
    >Uploading will be generally be faster if there are fewer files that are larger in size vs if there are lots of smaller files. Depending on the types and quantities of files being uploaded, it might be beneficial to separately compress and archive everything into a single archive (using something like tar or zip) before starting and artifact upload to speed things up. 

    
    For those scenarios, you can implement the following alternative:

    1. Zip all artifacts in build job.
    
        ```yaml
            - name: Zip all files for upload between jobs
            run: zip --symlinks -r nest.zip ./*
                
            - name: Upload artifact for deployment job
            uses: actions/upload-artifact@v2
            with:
            name: node-app
            path: nest.zip
        ```
    2. Deploy that zip file to Azure Web App and remove the zip file in deploy job.

        ```yaml
        - name: 'Deploy to Azure Web App'
          id: deploy-to-webapp
          uses: azure/webapps-deploy@v2
          with:
            app-name: 'sampleapp'
            slot-name: 'Production'
            publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_0000000000000000 }}
            package: nest.zip

        - name: Delete zip file
          run: rm nest.zip
        ```

    ![Nest App](/media/2022/02/nest-deployment-linux-05.png)