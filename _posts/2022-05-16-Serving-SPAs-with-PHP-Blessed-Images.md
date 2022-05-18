---
title: "Serving SPAs with PHP Blessed Images"
author_name: "Anthony Salemo"
tags:
    - PHP
    - Single Page Application
    - Deploy
    - SPA
categories:
    - PHP
    - Configuration
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/azure-containerapps-logo.png
toc: true
toc_sticky: true
date: 2022-05-13 12:00:00
---

This post provides information on how to serve Single Page Applications(SPAs) with Azure App Service on Linux PHP "Blessed" Images.

# Getting started

A question that may be asked is why would one need to do this? 

PHP for Linux App Service Images use Apache (PHP 7.4) and NGINX (PHP 8.0), therefor these Web Servers could be utilized to do things on the server side while still serving static content, such as redirects, rewrites, or other various Web Server configuration, that cannot be done using a regular Node for Linux App Service "Blessed" Image. 

This is because by default neither of these Web Servers run in the container for Node App Service "Blessed" Images and it is up to the developer to bring the server of their choosing (eg, plain Node itself or any number of framework/libraries that can run a 'live' node server).

Another possible reason is not wanting to do any of the above programatically or place another device or product in between the client and the application for the same metioned functionality.

## Create a Linux PHP App Service
We can get started on this by creating a [PHP Linux App Service](https://docs.microsoft.com/en-us/azure/app-service/quickstart-php?pivots=platform-linux).

## Create a Single Page Application
For the SPA itself, use a quickstart for any of the following
- [React](https://create-react-app.dev/docs/getting-started)
- [Angular](https://angular.io/cli#basic-workflow)
- [Vue](https://vuejs.org/guide/quick-start.html#with-build-tools)


**Important information on deployments**:

Depending on how deployment is done, you may run into errors if you attempt to deploy a typical SPA directly to a Linux PHP App Service without any additional configuration. This is because of the logic **[here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/php.md#detect)** in what Oryx (the build agent for certain deployments) looks for.

# PHP 7.4 (Apache)
This will target deployment and configuration for deploying SPA's to a PHP 7.4 Linux App Service which utilizes Apache as its Web Server.

## Configure a startup script to override Apache 
If using this approach for Apache specific configuration, then a startup script will need to be added. 

1. SSH into the Linux PHP App Service you created and run `cp /etc/apache2/apache2.conf /home`.
2. Copy this down with an FTP client of your choice.
3. Make your changes in `apache2.conf`. Upload this back to `/home`. In this example, we'll assume to be removing the `Server` header. In `apache2.conf` the following is added:

```apache
# If the contents of this folder is directly in root then this doesn't have to change
...
..
# Change this to point to your production folder if this is deployed
DocumentRoot /home/site/wwwroot/build
...
..
<IfModule security2_module>
    SecRuleEngine on
    ServerTokens Min
    SecServerSignature " "
</IfModule> 
...
..
```
4. Create your custom startup script, which must be a `.sh` file. We'll add the following:

```bash
#!/bin/bash

echo "Installing mod_security.."
apt-get update -yy && \
    apt-get install libapache2-mod-security2 -yy

APACHE_CONF=/home/apache2.conf

if [ -f "$APACHE_CONF" ]; then
    echo "Removing Apache Server header.."
    cp "$APACHE_CONF" /etc/apache2/apache2.conf
else
    echo "File does not exist, skipping cp."
fi
```

> **NOTE**: `apache2 -D FOREGROUND` is automatically ran and doesn't need to be added into the startup script.

5. Upload the custom startup script to `/home` as well and update the Azure Portal for the PHP Linux App Service under 'Configuration' -> 'General Settings':

  ![Configuration tab](/media/2022/05/azure-php-spa-5.png)

6. Click 'Save'. We can now use this for the below deployment methods.

> **NOTE**: Apache's `DocumentRoot` is set to `/home/site/wwwroot` by default. If needing to point to a specific production folder then update this as needed within the **custom** `apache2.conf`.

## FTP

Before deploying, generate the production build folder for your SPA locally. Depending on what you're using (React, Angular, Vue), this is generally done through either `yarn build` or `npm run build`, depending on your package manager.

React will output a folder named `/build`, Angular will have `/dist` and Vue will also have `/dist`. If you're unfamiliar with what your production build folder should look like for your framework/library - please consult its documentation.

1. Go to the Azure Portal for the PHP App Service you created. Go to Deployment Center and choose the FTPS credentials tab.

    ![FTPS credentials tab](/media/2022/05/azure-php-spa-1.png)

    ![FTPS credentials](/media/2022/05/azure-php-spa-2.png)

2. Using an FTP client of your choosing, connect using the credentials in the portal, as seen above.
3. Copy the contents **within** your production build folder to `/home/site/wwwroot` with your FTP client session. Make sure this is **not** the build folder itself. The directory should look something like the below. The important takeaway is that `index.html` is within `wwwroot`. 

    ![wwwroot contents](/media/2022/05/azure-php-spa-3.png)
**NOTE**: Apaches `DocumentRoot` is set to `/home/site/wwwroot`  


4. Restart the site. Shortly after your SPA should be viewable.
5. If wanting to do further Apache configuration along with serving your static content please refer this the above [section](#configure-a-startup-script-to-override-apache-optional)

> **NOTE**: If you'd rather upload the entire production folder (eg., build, dist) then Apaches `DocumentRoot` will need to be updated in the custom startup script to point to `/home/site/wwwroot/<your_prod_folder>`

## Local Git

**Before doing this an App Setting with the name `SCM_DO_BUILD_DURING_DEPLOYMENT` set to `false` needs to be added.** If this isn't done, deployment will fail since [no PHP project structure](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/php.md#detect) will be detected.

Local Git can be deployed by updating Apache's DocumentRoot to point to `/home/site/wwwroot/build`.

1.  Set your deployment method to Local Git in the portal for the App Service you're deploying to under **Deployment Center**.
2.  Change `DocumentRoot` to `/home/site/wwwroot/build`, `/home/site/wwwroot/dist`, or your revelant build folder using the above [section](#configure-a-startup-script-to-override-apache-optional).
3.  Make sure to remove `/build`, `/dist` or your applicable production folder name from `.gitignore`. Run `yarn build` or `npm run build` to build your production folder locally.
4.  Navigate to your site root and run the below commands:

    ```bash
    git add .
    git commit -m "initial commit"
    git remote add azure https://<sitename>.scm.azurewebsites.net:443/<sitename>.git
    git push azure master
    ```
5.  Something like the below should be shown in your terminal:

    ```bash
    remote: Deploy Async
    remote: Updating branch 'master'.
    remote: Updating submodules.
    remote: Preparing deployment for commit id '5123b996c5'.
    remote: Generating deployment script.
    remote: Generating deployment script for Web Site
    remote: Generated deployment script files
    remote: Running deployment command...
    remote: Handling Basic Web Site deployment.
    remote: Kudu sync from: '/home/site/repository' to: '/home/site/wwwroot'
    remote: Copying file: '.gitignore'
    remote: Copying file: 'apache2.conf'
    remote: Copying file: 'package.json'
    remote: Copying file: 'startup.sh'
    remote: Copying file: 'yarn.lock'
    remote: Deleting file: 'hostingstart.html'
    remote: Ignoring: .git
    remote: Copying file: 'build/asset-manifest.json'
    remote: Copying file: 'build/favicon.ico'
    remote: Copying file: 'build/index.html'
    remote: Copying file: 'build/logo192.png'
    remote: Copying file: 'build/logo512.png'
    remote: Copying file: 'build/manifest.json'
    remote: Copying file: 'build/robots.txt'
    remote: Copying file: 'build/static/css/main.a617e044.chunk.css'
    remote: Copying file: 'build/static/css/main.a617e044.chunk.css.map'
    remote: Copying file: 'build/static/js/2.637c3219.chunk.js'
    remote: Copying file: 'build/static/js/2.637c3219.chunk.js.LICENSE.txt'
    remote: Copying file: 'build/static/js/2.637c3219.chunk.js.map'
    remote: Copying file: 'build/static/js/3.1d7fd63a.chunk.js'
    remote: Copying file: 'build/static/js/3.1d7fd63a.chunk.js.map'
    remote: Copying file: 'build/static/js/main.bf5f35fa.chunk.js'
    remote: Copying file: 'build/static/js/main.bf5f35fa.chunk.js.map'
    remote: Copying file: 'build/static/js/runtime-main.165ea00d.js'
    remote: Copying file: 'build/static/js/runtime-main.165ea00d.js.map'
    remote: Copying file: 'build/static/media/logo.6ce24c58.svg'
    remote: Copying file: 'public/favicon.ico'
    remote: Copying file: 'public/index.html'
    remote: Copying file: 'public/logo192.png'
    remote: Copying file: 'public/logo512.png'
    remote: Copying file: 'public/manifest.json'
    remote: Copying file: 'public/robots.txt'
    remote: Copying file: 'src/App.css'
    remote: Copying file: 'src/App.js'
    remote: Copying file: 'src/App.test.js'
    remote: Copying file: 'src/index.css'
    remote: Copying file: 'src/index.js'
    remote: Copying file: 'src/logo.svg'
    remote: Copying file: 'src/reportWebVitals.js'
    remote: Copying file: 'src/setupTests.js'
    remote: Finished successfully.
    remote: Running post deployment command(s)...
    remote: Triggering recycle (preview mode disabled).
    remote: Deployment successful.
    ```

- Now navigating to the site with the custom startup script for Apache should show the application content.

## GitHub Actions
We can deploy with GitHub Actions however this won't be possible unless we do some changes. 

1. Create a PHP 7.4 Linux App Service. Update Apache's `DocumentRoot` to point to your production folder. Follow [these steps]((#configure-a-startup-script-to-override-apache-optional)) on setting up the custom startup script.

2. Start by going to the portal for the App Service and choose Deployment Center:
    
    ![Deployment Center Blade](/media/2022/05/azure-php-spa-6.png)

3. Choose **GitHub** from the dropdown.

    ![Deployment Center Blade](/media/2022/05/azure-php-spa-7.png)

4. Fill in the required fields below - after this you can preview the file that will be commited.

    ![Deployment Center Blade](/media/2022/05/azure-php-spa-8.png)

**IMPORTANT**: Doing this first will commit a Actions file geared towards PHP. We'll need to change this to build our SPA which will be seen below. You can commit this to your repository now, and change this later, or manually create a GitHub Actions file when then can be found when going through the above flow.

We'll need to change the GitHub Actions .yaml file to something like below:

```yaml
name: Build and deploy PHP app to Azure Web App - yourappname

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

      - name: yarn install, build
        run: |
          yarn install
          yarn run build
      - name: Zip artifact for deployment
        run: zip release.zip ./* -r

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v2
        with:
          name: node-app
          path: release.zip

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v2
        with:
          name: node-app

      - name: 'Deploy to Azure Web App'
        uses: azure/webapps-deploy@v2
        id: deploy-to-webapp
        with:
          app-name: 'yourappname'
          slot-name: 'production'
          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_00000000000000000000000000000 }}
          package: release.zip
```

> **NOTE**: The zipping of files between stages can help improve build time since the size of `node_modules` can impact performance.

The above examples we're build our SPA for production, which will output a `build`, `dist`, or other production folder. 

We can then use the custom startup script mentioned earlier to point Apache's `DocumentRoot` to that folder - eg., `/home/site/wwwroot/dist`.

Although this file is meant for our SPA - ultimately the App Service running is still a PHP based runtime, just using Apache to serve the static contents.


## Azure DevOps
Azure DevOps can be used to build our SPA much like the above with GitHub Actions where the App Service itself is specified as a PHP runtime while the build(pipeline) is node specific.

1. Create a PHP 7.4 Linux App Service. Update Apache's `DocumentRoot` to point to your production folder. Follow [these steps]((#configure-a-startup-script-to-override-apache-optional)) on setting up the custom startup script.
2. Create a new DevOps project then go to `Pipelines` and select `Create Pipeline`. See [this](https://docs.microsoft.com/en-us/azure/devops/organizations/projects/create-project?view=azure-devops&tabs=browser#create-a-project) for more details on creation.
3. Select your code repository.
4. Select the `Node.js Express Web App to Linux on Azure` template.

This will generate a template like the below:

```yaml
# Node.js Express Web App to Linux on Azure
# Build a Node.js Express app and deploy it to Azure as a Linux web app.
# Add steps that analyze code, save build artifacts, deploy, and more:
# https://docs.microsoft.com/azure/devops/pipelines/languages/javascript

trigger:
- main

variables:

  # Azure Resource Manager connection created during pipeline creation
  azureSubscription: '00000000-0000-0000-0000-000000000000'

  # Web app name
  webAppName: 'yourappname'

  # Environment name
  environmentName: 'yourappname'

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
        versionSpec: '10.x'
      displayName: 'Install Node.js'

    - script: |
        npm install
        npm run build --if-present
        npm run test --if-present
      displayName: 'npm install, build and test'

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
            displayName: 'Azure Web App Deploy: yourappname'
            inputs:
              azureSubscription: $(azureSubscription)
              appType: webAppLinux
              appName: $(webAppName)
              runtimeStack: 'NODE|10.10'
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
              startUpCommand: 'npm run start'
```

**We need to change this to the following:**

```yaml
# Node.js Express Web App to Linux on Azure
# Build a Node.js Express app and deploy it to Azure as a Linux web app.
# Add steps that analyze code, save build artifacts, deploy, and more:
# https://docs.microsoft.com/azure/devops/pipelines/languages/javascript

trigger:
- main

variables:

  # Azure Resource Manager connection created during pipeline creation
  azureSubscription: '000000-0000-0000-0000-000000000000'

  # Web app name
  webAppName: 'yourappname'

  # Environment name
  environmentName: 'yourappname'

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
        // Change this to your desired Node version
        // In the format of 'major.x'
        // '.x' denotes latest minor of the specified major
        versionSpec: '16.x'
      displayName: 'Install Node.js'

    // This can be either npm or yarn
    // Change this as desired
    - script: |
        yarn install
        yarn build --if-present
      displayName: 'yarn install and build'

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
            displayName: 'Azure Web App Deploy: yourappname'
            inputs:
              azureSubscription: $(azureSubscription)
              appType: webAppLinux
              appName: $(webAppName)
              runtimeStack: 'PHP|7.4'
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
```

After changing the above - in addition to the custom startup script - the site should now be viewable after deployment

# PHP 8.0 (NGINX)
This will target deployment and configuration for deploying SPA's to a PHP 8.0 Linux App Service which utilizes NGINX as its Web Server.

## Configure a startup script to override NGINX
If using this approach for NGINX specific configuration, then a startup script will need to be added. 

1. SSH into the Linux PHP App Service you created and run `cp /etc/nginx/sites-available/default /home`.
2. Copy this down with an FTP client of your choice.
3. Make your changes in `default`. Upload this back to `/home`. 

Our new custom `default` conf file should look like the below:

```nginx
server {
    #proxy_cache cache;
    #proxy_cache_valid 200 1s;
    listen 8080;
    listen [::]:8080;
    # This is the new change we introduced
    root /home/site/wwwroot/build;
    index  index.php index.html index.htm;
    server_name  example.com www.example.com; 

    location / {            
        index  index.php index.html index.htm hostingstart.html;
    }

    ....
    other code from the default file
    ...
    ..
}
```

Our custom startup script will look like this:

```bash
#!/bin/bash

echo "Copying custom default over to /etc/nginx/sites-available/default"

NGINX_CONF=/home/default

if [ -f "$NGINX_CONF" ]; then
    cp "$NGINX_CONF" /etc/nginx/sites-available/default
    service nginx reload
else
    echo "File does not exist, skipping cp."
fi
```

Upload this to the application and portal with the steps mentioned [earlier.](#configure-a-startup-script-to-override-apache-optional)

## FTP
1. Create a PHP 8 Linux App Service. Apply the custom NGINX startup script above if deciding to upload the entire production build folder.
2. The same steps mentioned earlier apply [here](#ftp).
## Local Git
1. Create a PHP 8 Linux App Service. Apply the custom NGINX startup script above.
2. The same steps mentioned earlier apply [here](#local-git).

## GitHub Actions
1. Create a PHP 8 Linux App Service. Apply the custom NGINX startup script above.
2. The same steps mentioned earlier apply [here](#github-actions).

## Azure DevOps
1. Create a PHP 8 Linux App Service.
2. There is only one change that needs to be made here, which is to the `runtimeStack` option in the `.yaml` file. Set this to: `runtimeStack: PHP|8.0`
3. The rest of the steps mentioned earlier still apply [here](#github-actions).

# Troubleshooting
## Error: Couldn't detect a version for the platform 'php' in the repo.
**Scenario:**

This will happen if deploying with **Local Git** and not setting the App Setting `SCM_DO_BUILD_DURING_DEPLOYMENT` to `false`.

**Resolution:**

Set `SCM_DO_BUILD_DURING_DEPLOYMENT` to `false`.





