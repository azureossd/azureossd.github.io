---
title: "NextJS Deployment on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Next
    - Nodejs
    - Deploy
    - Azure DevOps
    - GitHub Actions
categories:
    - Azure App Service on Linux
    - Next
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/nextjs.png
toc: true
toc_sticky: true
date: 2022-10-18 12:00:00
---

This section provides information for creating, configuring, and deploying an Next.js app on App Service Linux. 

# Local Development 

## Create a Next app

1. Setup a local environment starting with **[NPX](https://docs.npmjs.com/cli/v7/commands/npx)**:

    `npx create-next-app@latest`

2. This will prompt you for an application name - which will create a new directory for the application with the name you choose:
    
    `√ What is your project named? ... local`

    After this it will install all needed dependencies into said folder.

3. Once the installation is done, cd into the new folder and then start the server using:
    
    `yarn dev`

4. Browse the site with `http://localhost:3000` to get the default page. 

    ![Next App](/media/2022/10/azure-oss-nextjs-1.png)

    ```javascript
    $ yarn dev
    yarn run v1.22.15
    $ next dev
    ready - started server on 0.0.0.0:3000, url: http://localhost:3000
    event - compiled client and server successfully in 13.8s (173 modules)
    wait  - compiling / (client and server)...
    event - compiled client and server successfully in 1680 ms (206 modules)
    ```

# Deployment Options
There are multiple deployment options in App Service Linux as Continuous Deployment (GitHub/GitHub Actions, Bitbucket, Azure Repos, External Git, Local Git), ZipDeploy, Run from Package, FTP, etc. 

## Local Git 
When using Local Git, you are using `App Service Build Service` also named as ([Oryx](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md)) to build your application.

To setup this option and deploy an Next.js application with this, follow the below:
1. Navigate to your web app and select `Deployment Center`; then click on `Local Git` and then click on `Save`.

    ![Next App Local Git](/media/2022/10/azure-oss-nextjs-2.png)
2. Copy the remote git repository from Azure Portal.

    ![Next App Git Remote](/media/2022/10/azure-oss-nextjs-3.png)
3. In your local terminal run the following commands in order:
    ```bash
    git add .
    git commit -m "Initial Commit"
    git remote add azure https://<sitename>.scm.azurewebsites.net:443/<sitename>.git
    git push azure master
    ```
4. Then Oryx will build your application:
    ```log
        remote: Deploy Async
        remote: Updating branch 'master'.
        remote: Updating submodules.
        remote: Preparing deployment for commit id 'f055eb5b55'.
        remote: PreDeployment: context.CleanOutputPath False
        remote: PreDeployment: context.OutputPath /home/site/wwwroot
        remote: Repository path is /home/site/repository
        remote: Running oryx build...
        remote: Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
        remote: You can report issues at https://github.com/Microsoft/Oryx/issues
        remote:
        remote: Oryx Version: 0.2.20220825.1, Commit: 24032445dbf7bf6ef068688f1b123a7144453b7f, ReleaseTagName: 20220825.1
        remote: 
        remote: Build Operation ID: |Ul5y+2iwugw=.c1c02217_
        remote: Repository Commit : f055eb5b550d1d2c24cc96dc44b5edf0467a1093
        remote: 
        remote: Detecting platforms...
        remote: .
        remote: Detected following platforms:
        remote:   nodejs: 18.2.0
        remote: Version '18.2.0' of platform 'nodejs' is not installed. Generating script to install it...
        remote: Detected the following frameworks: Next.js
        remote: 
        remote: Using intermediate directory '/tmp/8dab090627a0ac0'.
        remote: 
        remote: Copying files to the intermediate directory...
        remote: Done in 1 sec(s).
        remote: 
        remote: Source directory     : /tmp/8dab090627a0ac0
        remote: Destination directory: /home/site/wwwroot
        remote:
        remote:
        remote: Downloading and extracting 'nodejs' version '18.2.0' to '/tmp/oryx/platforms/nodejs/18.2.0'...
        remote: Detected image debian flavor: bullseye.
        remote: Downloaded in 2 sec(s).
        remote: Verifying checksum...
        remote: Extracting contents...
        remote: ..............
        remote: performing sha512 checksum for: nodejs...
        remote: Done in 26 sec(s).
        remote: 
        remote: Removing existing manifest file
        remote: Creating directory for command manifest file if it does not exist
        remote: Creating a manifest file...
        remote: Node Build Command Manifest file created.
        remote: 
        remote: Using Node version:
        remote: v18.2.0
        remote: 
        remote: Using Yarn version:
        remote: 1.22.15
        remote: 
        remote: Running 'yarn install --prefer-offline'...
        remote: 
        remote: yarn install v1.22.15
        remote: [1/4] Resolving packages...
        remote: [2/4] Fetching packages...
        remote: ..................................................
        <remmoving lines for readability>
        remote: ..................................................
        remote: info "@next/swc-win32-ia32-msvc@12.3.1" is an optional dependency and failed compatibility check. Excluding it from installation.
        remote: info @next/swc-win32-ia32-msvc@12.3.1: The CPU architecture "x64" is incompatible with this module.
        remote: info @next/swc-win32-x64-msvc@12.3.1: The platform "linux" is incompatible with this module.
        remote: info "@next/swc-win32-x64-msvc@12.3.1" is an optional dependency and failed compatibility check. Excluding it from installation.
        remote: [3/4] Linking dependencies...
        remote: ................................................................................................................................................
        remote: [4/4] Building fresh packages...
        remote: Done in 427.08s.
        remote: 
        remote: Running 'yarn run build'...
        remote: 
        remote: yarn run v1.22.15
        remote: $ next build
        remote: Attention: Next.js now collects completely anonymous telemetry regarding usage.
        remote: This information is used to shape Next.js' roadmap and prioritize features.
        remote: You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
        remote: https://nextjs.org/telemetry
        remote: 
        remote: info  - Linting and checking validity of types...
        remote: .......
        remote: info  - Creating an optimized production build...
        remote: ...................
        remote: info  - Compiled successfully
        remote: info  - Collecting page data...
        remote: ......................
        remote: info  - Generating static pages (0/3)
        remote: info  - Generating static pages (3/3)
        remote: info  - Finalizing page optimization...
        remote:
        remote: Route (pages)                              Size     First Load JS
        remote: ┌ ○ / (306 ms)                             5.35 kB        83.1 kB
        remote: ├   └ css/ae0e3e027412e072.css             707 B
        remote: ├   /_app                                  0 B            77.7 kB
        remote: ├ ○ /404                                   182 B          77.9 kB
        remote: └ λ /api/hello                             0 B            77.7 kB
        remote: + First Load JS shared by all              78 kB
        remote:   ├ chunks/framework-ed075df0e0b45174.js   45.5 kB
        remote:   ├ chunks/main-e7a7892cb0edc024.js        31 kB
        remote:   ├ chunks/pages/_app-1a336683ff51f334.js  497 B
        remote:   ├ chunks/webpack-8fa1640cc84ba8fe.js     750 B
        remote:   └ css/ab44ce7add5c3d11.css               247 B
        remote:
        remote: λ  (Server)  server-side renders at runtime (uses getInitialProps or getServerSideProps)
        remote: ○  (Static)  automatically rendered as static HTML (uses no initial props)
        remote:
        remote: Done in 68.70s.
        remote: 
        remote: Zipping existing node_modules folder...
        remote: .........................................
        remote: Done in 46 sec(s).
        remote: Preparing output...
        remote: 
        remote: Copying files to destination directory '/home/site/wwwroot'...
        remote: Done in 4 sec(s).
        remote: 
        remote: Removing existing manifest file
        remote: Creating a manifest file...
        remote: Manifest file created.
        remote: Copying .ostype to manifest output directory.
        remote: 
        remote: Done in 587 sec(s).
        remote: Running post deployment command(s)...
        remote: 
        remote: Generating summary of Oryx build
        remote: Parsing the build logs
        remote: Found 0 issue(s)
        remote: 
        remote: Build Summary :
        remote: ===============
        remote: Errors (0)
        remote: Warnings (0)
        remote: 
        remote: Triggering recycle (preview mode disabled).
        remote: Deployment successful. deployer =  deploymentPath =
        remote: Deployment Logs : 'https://ansalemo-nextjs-blog.scm.azurewebsites.net/newui/jsonviewer?view_url=/api/deployments/f055eb5b550d1d2c24cc96dc44b5edf0467a1093/log'
        To https://ansalemo-nextjs-blog.scm.azurewebsites.net:443/ansalemo-nextjs-blog.git
        * [new branch]      master -> master
    ```
5. Browse the application at https://yoursite.azurewebsites.net. You should see the same page as above when running this locally.

> **NOTE**: Port 8080 is the default value set for Node applications to listen to on Azure and is inferred when ran with Next in this set up.

    ```
    $ next start
    ready - started server on 0.0.0.0:8080, url: http://localhost:8080
    ```


## GitHub Actions

You can quickly get started with GitHub Actions by using the App Service Deployment Center. This will automatically generate a workflow file based on your application stack and commit it to your GitHub repository in the root directory in the folder `.github`. You can deploy a workflow manually using deployment credentials. 

![NextJS GitHub Actions](/media/2022/10/azure-oss-nextjs-4.png)

You can find more details about these steps documented here:
 - [Use the Deployment Center](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#use-the-deployment-center)
 - [Set up a workflow manually](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#set-up-a-workflow-manually)


For **Next deployments** is recommended to modify the default template with the following recommendations:

1. Compress and archive artifacts into a single zip file since Next node_modules may be large. This is especially true for more mature projects with numerous pages needing compilation.  
2. Remove tests suites with using `npm run test`, if possible.
3. Validate the current nodejs version.
    
Here is an example with recommendations:

**IMPORTANT**:
You may run into an issue where `next start` is not found at **runtime** when using GitHub Actions (or other ZipDeploy methods, like DevOps pipelines). If that is the case, change your `package.json` start command to use **`node_modules/next/dist/bin/next start`**. This targets `next` directly through `node_modules` and will avoid this issue if attempting to start through NPM. **See the section "note on symlinks" for more details**.


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
            node-version: '18.x'

        - name: npm install and build
            run: |
            npm install
            npm run build --if-present

        - name: Zip all files for upload between jobs
            # IMPORTANT: .next is a hidden folder and will NOT be included in the zip unless we specify it
            run: zip next.zip ./* .next -qr
                
        - name: Upload artifact for deployment job
            uses: actions/upload-artifact@v2
            with:
            name: node-app
            path: next.zip

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
            package: next.zip

        - name: Delete zip file
            run: rm next.zip

````

![Next App with GitHub Actions](/media/2022/10/azure-oss-nextjs-5.png)


After the deployment, the application should now be available to browse.

> **NOTE**: To use `yarn`, simply switch out `npm` for it in the workflow file.

## Azure DevOps
You can use Azure Pipelines to build your Next application. You can use npm/yarn to install/build the artifacts. You can review more details here: [Manage dependencies](https://docs.microsoft.com/en-us/azure/devops/pipelines/ecosystems/javascript?view=azure-devops&tabs=code#manage-dependencies).

Here is an example on how to implement Azure Pipelines with App Service Linux.

1. Go to `Pipelines` and create `New pipeline`.
2. Select `Azure Repos Git (YAML)`, there are other options as classic editor without YAML.
3. Select your code repository.
4. Select `Node.js Express Web App to Linux on Azure` template or create one from scratch. 
5. Select the web app where you will deploy.
6. Modify your current YAML and add the following points:
    - Node.js version should match the same of your web app.

        ```yaml
            - task: AzureWebApp@1
                displayName: 'Azure Web App Deploy: sitename'
                inputs:
                azureSubscription: $(azureSubscription)
                appType: webAppLinux
                appName: $(webAppName)
                package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
        ```

7. Save and `run` the pipeline.


**IMPORTANT**:
You may run into an issue where `next start` is not found at **runtime** when using DevOps pipelines (or other ZipDeploy methods, like GitHub Actions). If that is the case, change your `package.json` start command to use **`node_modules/next/dist/bin/next start`**. This targets `next` directly through `node_modules` and will avoid this issue if attempting to start through NPM. **See the section "note on symlinks" for more details**.

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
            versionSpec: '18.x'
        displayName: 'Install Node.js'

        - script: |
            npm install
            npm run build --if-present
        displayName: 'npm install and build'

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
```

![Next App with DevOps pipelines](/media/2022/10/azure-oss-nextjs-6.png)

> **NOTE**: To use `yarn`, simply switch out `npm` for it in the pipeline .yaml file.

## Note about symlinks (Why `next start` may fail in certain deployment scenarios)

A cause of pain sometimes is when trying to deploy a Node framework (like Next.js, in this case)
and having **NPM** start the application through the `package.json` `start` script (eg., `next start`) - it may actually fail with `MODULE_NOT_FOUND` in some deployment scenarios. This will look like the following:

```javascript
Require stack:
    - /home/site/wwwroot/node_modules/.bin/next
    at Module._resolveFilename (node:internal/modules/cjs/loader:939:15)
    at Module._load (node:internal/modules/cjs/loader:780:27)
    at Module.require (node:internal/modules/cjs/loader:1005:19)
    at require (node:internal/modules/cjs/helpers:102:18)
    at Object.<anonymous> (/home/site/wwwroot/node_modules/.bin/next:3:35)
    at Module._compile (node:internal/modules/cjs/loader:1105:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1159:10)
    at Module.load (node:internal/modules/cjs/loader:981:32)
    at Module._load (node:internal/modules/cjs/loader:827:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:77:12) {
        code: 'MODULE_NOT_FOUND',
        requireStack: [ '/home/site/wwwroot/node_modules/.bin/next' ]
    }
```

These scenarios are generally ZipDeploy scenarios, such as GitHub Actions (using GitHub as the builder), or DevOps pipelines which deploy via ZipDeploy ultimately, as opposed to building directly against Oryx (local git, or ZipDeploy **with** Oryx Builder, for example). This is **NOT** to be confused with your typical `Error: Cannot find module 'foobar'` error.

This is because when using Oryx as the builder, symlinks are preserved during the build. Next.js (and other like-frameworks) use `node_modules/.bin` which is symlinked to `node_modules/next/dist/bin/next`. The `.bin` folder is what helps make these commands like `next start` available to NPM. Below is an example of symlinks we'd see - the below example was deployed with Local Git, which uses Oryx:

```bash
root@8592e8087d09:/home/site/wwwroot# ls node_modules/.bin/next -lrta
lrwxrwxrwx 1 1005 1005 21 Oct 17 22:46 node_modules/.bin/next -> ../next/dist/bin/next
```

The below example was deployed with GitHub Actions (GitHub as the builder): 

```bash
root@02000a7fefd4:/home/site/wwwroot# ls node_modules/.bin/next -lrta
-rwxrwxrwx 1 nobody nogroup 5347 Oct 18 21:34 node_modules/.bin/next
```

We can clearly see the symlink is missing. Setting the start command in your `package.json` to `node_modules/next/dist/bin/next start` instead of just `next start` would a the resolution to this.

This would look like:

```json
"scripts": {
    "dev": "next dev",
    "build": "next build && next export",
    "start": "node_modules/next/dist/bin/next start",
    "test": "jest"
  },
```


# Troubleshooting

## Container Doesn't Start

- **Application is timing out at 230 seconds on Container start up**:

    **Resolution**: Review the `start` script in `package.json` to see if a port other than 8080 is being referenced by being hardcoded. For Node Blessed Images on App Service, port 8080 is the default port. If the `-p` argument is left out of the command, this will infer port 8080 through the $PORT environment variable.

- **Container is crashing on startup because can't find next npm executables**

    This appears to happen with GitHub Action deployments and DevOps deployments if using `next start` (both of which use ZipDeploy not using Oryx builder) as a command to be executed by NPM.

    This may present itself as well in the following manner:

    ```javascript
    /home/site/wwwroot/node_modules/.bin/next: 1: /home/site/wwwroot/node_modules/.bin/next: ../next/dist/bin/next: not found
    ```

    **Resolution**: The above section **"notes on symlinks"** covers this in further detail.

- **Error: Could not find a production build in the '/home/site/wwwroot/.next' directory**

    When deploying, you may see this message if you forget to include the `.next` folder that is output during `build && export`:
    
    ```
    Error: Could not find a production build in the '/home/site/wwwroot/.next' directory. Try building your app with 'next build' before starting the production server. https://nextjs.org/docs/messages/production-start-no-build-id
    ```

    **Resolution**: Ensure that if zipping the source files during the GitHub Actions workflow, `.next` is included, like this:

    ```
    zip next.zip ./* .next -qr
    ```

    If using Oryx, ensure that a `build` script is included in your `package.json` with `next build && next export`. This same approach will apply to DevOps pipelines as well.

## GitHub Actions 

- **Too many files and slow deployments**: When using `actions/upload-artifact@v2` to allow sharing data between jobs and store data once the a workflow is complete, it may take minutes to a few hours to transfer these files in between flows, as they are not zipped. 

    ![Next App Deployment Log Files](/media/2022/10/azure-oss-nextjs-8.png)

    ![Next App Slow Deployment](/media/2022/10/azure-oss-nextjs-7.png)

    >From [Official Documentation](https://github.com/actions/toolkit/blob/master/packages/artifact/docs/additional-information.md#considerations): During upload, each file is uploaded concurrently in 4MB chunks using a separate HTTPS connection per file. Chunked uploads are used so that in the event of a failure, the upload can be retried. If there is an error, a retry will be attempted after a certain period of time.
    >
    >Uploading will be generally be faster if there are fewer files that are larger in size vs if there are lots of smaller files. Depending on the types and quantities of files being uploaded, it might be beneficial to separately compress and archive everything into a single archive (using something like tar or zip) before starting and artifact upload to speed things up. 

    
    For those scenarios, you can implement the following alternative:

    1. Zip all artifacts in build job.
    
        ```yaml
            - name: Zip all files for upload between jobs
            run: zip next.zip ./* .next -qr
                
            - name: Upload artifact for deployment job
            uses: actions/upload-artifact@v2
            with:
            name: node-app
            path: next.zip
        ```
    2. Deploy that zip file to Azure Web App and later remove the zip file from the Actions workflow after it is complete.

        ```yaml
        - name: 'Deploy to Azure Web App'
          id: deploy-to-webapp
          uses: azure/webapps-deploy@v2
          with:
            app-name: 'sampleapp'
            slot-name: 'Production'
            publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_0000000000000000 }}
            package: next.zip

        - name: Delete zip file
          run: rm next.zip
        ```
