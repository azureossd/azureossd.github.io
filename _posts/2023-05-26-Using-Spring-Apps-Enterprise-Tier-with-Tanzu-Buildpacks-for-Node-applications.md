---
title: "Using Spring Apps Enterprise Tier with Tanzu Buildpacks for Node applications"
author_name: "Anthony Salemo"
tags:
    - Spring Apps
    - Java
    - Deployments
    - Troubleshooting
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration
    - Java # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Spring Apps
    - Troubleshooting 
header:
    teaser: /assets/images/springapps.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-05-26 12:00:00
---

This post will cover using Spring Apps Enterprise Tier with Tanzu Buildpacks to deploy node-based applications.

# Overview
[Azure Spring Apps (Enterprise Tier)](https://learn.microsoft.com/en-us/azure/spring-apps/quickstart-deploy-apps-enterprise) utilizes Tanzu components to help do more for developers and give more value to deployed applications.

One of these components that can be used is [Tanzu Buildpacks](https://docs.vmware.com/en/VMware-Tanzu-Buildpacks/services/tanzu-buildpacks/GUID-index.html).

The two Buildpack options we'll be focusing on in this post is the [Tanzu Web Servers Buildpack](https://network.tanzu.vmware.com/products/tanzu-web-servers-buildpack/) and [Tanzu Node.js Buildpack](https://network.tanzu.vmware.com/products/tanzu-nodejs-buildpack).

## Prerequisites
A prerequisite to this post is to have an Azure Spring Apps Enterprise Tier instance and **Java/Polyglot** application already created. You can follow this [documentation](https://learn.microsoft.com/en-us/azure/spring-apps/quickstart?tabs=Azure-CLI&pivots=sc-enterprise) on how to create the Spring App Instance. 

![Polyglot application](/media/2023/05/azure-blog-spring-apps-enterprise-polyglot-1.png) 

# Deploying Single Page Applications (SPA's)
## React
There is a few ways you can deploy a React application, and SPA's, to a polyglot application on Spring Apps.

1. First, create a React project - for instance, you can use [Create React App](https://create-react-app.dev/).

2. Next, create a [production build](https://create-react-app.dev/docs/production-build/) to generate the `/build` folder (this is the by-design name of the production build folder). Use either `npm run build` (or `yarn run build`, if using yarn) to create this build.

3. The folder structure will now look something like this:

    ![Folder structure](/media/2023/05/azure-blog-spring-apps-enterprise-polyglot-2.png) 


### Deploying only the production build

> **NOTE**: This method is using the "default" configured buildpack on Azure Spring Apps Enterprise

With this method, you'll deploy the build folder you generated locally. The caveat to this is that to update the production build output - you'll have to run `npm run build` (or `yarn run build`) prior to deployment each time.

**NOTE**: Also, ensure `/build` is removed from your `.gitignore`

The below command will:
- Use **NGINX** as the Web Server to serve our static files 
- Update NGINX to point its site root to the current root directory, which is `workspace`
- Deploy the contents _within_ the build folder

```
az spring app deploy --resource-group "your-rg" --service "your-asa-enterprise" --name "your-app" --source-path "./build" --build-env BP_WEB_SERVER=nginx BP_WEB_SERVER_ROOT=""
```

We can see which other build packs are referenced by the default configured one in the deployment logs during the build:

```
7 of 20 buildpacks participating
paketo-buildpacks/ca-certificates 3.5.1
tanzu-buildpacks/node-engine      1.1.0
tanzu-buildpacks/npm-install      1.0.0
tanzu-buildpacks/node-run-script  1.0.0
tanzu-buildpacks/nginx            0.11.1
tanzu-buildpacks/node-module-bom  0.3.4
tanzu-buildpacks/npm-start        1.0.0
```

After deployment, if we use the [**Connect**](https://learn.microsoft.com/en-us/azure/spring-apps/how-to-connect-to-app-instance-for-troubleshooting?tabs=azure-portal) blade to connect to the container in the pod - we can validate our deployed content:

![Filesystem structure](/media/2023/05/azure-blog-spring-apps-enterprise-polyglot-3.png) 

We can also see our `root` document path change reflected in NGINX - note, that in all examples here - NGINX document root paths are always relative to `workspace` - application content is by default deployed to `/workspace`:


![Filesystem structure](/media/2023/05/azure-blog-spring-apps-enterprise-polyglot-4.png) 

### Build the production folder on each deployment
To be able to deploy a React application that builds the project properly for production, we'll use the [Tanzu Webserver Buildpack](https://docs.vmware.com/en/VMware-Tanzu-Buildpacks/services/tanzu-buildpacks/GUID-web-servers-web-servers-buildpack.html).

Review this documentation for further information on [builders and build packs on Azure Spring Apps Enterprise](https://learn.microsoft.com/en-us/azure/spring-apps/how-to-enterprise-build-service#buildpacks).

When using the **default** builder that is configured for Enterprise Tier, you may notice that if you deploy with the below command, which assumes this is ran from the project root, relative to `package.json` - it will properly run `npm run build`, but will actually run the application against it's **Development Server** - as seen in the message below. This will also show in the builder output after deployment is finished.

We **do not** want to do this - as development servers should _only_ be intended for local development. They are not production stable. 

```
az spring app deploy --resource-group "your-rg" --service "your-asa-enterprise" --name "your-asa-app" --source-path "./" --build-env BP_WEB_SERVER=nginx BP_WEB_SERVER_ROOT="build" BP_NODE_RUN_SCRIPTS=build --verbose
```

```
(node:39) [DEP_WEBPACK_DEV_SERVER_ON_AFTER_SETUP_MIDDLEWARE] DeprecationWarning: 'onAfterSetupMiddleware' option is deprecated. Please use the 'setupMiddlewares' option.
(Use `node --trace-deprecation ...` to show where the warning was created)
(node:39) [DEP_WEBPACK_DEV_SERVER_ON_BEFORE_SETUP_MIDDLEWARE] DeprecationWarning: 'onBeforeSetupMiddleware' option is deprecated. Please use the 'setupMiddlewares' option.
Starting the development server...
```

Instead, we can do the below to add the Webserver build pack:
- Go to the Azure Portal for the Spring App instance and navigate to the **Build Server** blade - then click **Add**

    ![Filesystem structure](/media/2023/05/azure-blog-spring-apps-enterprise-polyglot-5.png)

- Next, give the builder a name, followed by the OS stack, and lastly selecting the `web-servers` build pack.

    ![Filesystem structure](/media/2023/05/azure-blog-spring-apps-enterprise-polyglot-6.png)


Use the below command to deploy the application. This command will:
- Use **NGINX** as the Web Server to serve our static files 
- Update NGINX to point its site root to the `build` directory, which is our production build output
- Deploy from the project root and build for production
- Use the **webserver** buildpack we configured for building

```
az spring app deploy --resource-group "your-rg" --service "your-asa-enterprise" --name "your-asa-app" --source-path "./" --build-env BP_WEB_SERVER=nginx BP_WEB_SERVER_ROOT="build" BP_NODE_RUN_SCRIPTS=build --builder=webserver --verbose
```


## Angular
> **NOTE**: The method is using the "default" configured buildpack on Azure Spring Apps Enterprise

Create an Angular application - you can use the quickstart from the Angular CLI [here](https://angular.io/quick-start#create-a-new-angular-app-from-the-command-line).

### Deploying only the production build
The only difference from the React example is that fact that Angulars production build is output to a folder named `/dist`. 

From the root of your project, run `npm run build` to generate Angulars production build.

In the root of your project, run the below command to deploy the build:

**NOTE**: Also, ensure `/dist` is removed from your `.gitignore`

```
az spring app deploy --resource-group "your-rg" --service "your-asa-enterprise" --name "your-app" --source-path "./dist" --build-env BP_WEB_SERVER=nginx BP_WEB_SERVER_ROOT=""
```

### Build the production folder on each deployment
Following the same approach in the React section for [building the production folder on each deployment](#build-the-production-folder-on-each-deployment), using the **Webserver** Tanzu buildpack, run the following command - we replace the value of `BP_WEB_SERVER_ROOT` to use `dist`:

```
az spring app deploy --resource-group "your-rg" --service "your-asa-enterprise" --name "your-asa-app" --source-path "./" --build-env BP_WEB_SERVER=nginx BP_WEB_SERVER_ROOT="dist" BP_NODE_RUN_SCRIPTS=build --builder=webserver --verbose
```

## Client-side routing
If client side routing is enabled, for example with React and using `react-router-dom` - you may encounter HTTP 404's from NGINX:

![Filesystem structure](/media/2023/05/azure-blog-spring-apps-enterprise-polyglot-7.png)


To resolve this, deploy with the builder argument of `BP_WEB_SERVER_ENABLE_PUSH_STATE` to `true`. This redirects all requests back to index.html where our client-side routing can take over, instead of the browser trying to serve up an actual `.html` page of the route we're requesting.

![Filesystem structure](/media/2023/05/azure-blog-spring-apps-enterprise-polyglot-8.png)



# Deploying server-based applications
You can deploy an application that runs a node server-based framework, such as Express.js - an example of this is found here - [Deploying a SPA served by a Node backend on the same Linux App Service](https://azureossd.github.io/2023/05/17/Deploying-a-SPA-served-by-a-Node-backend-on-the-same-Linux-App-Service/index.html).

Using that same example of a SPA served by Express.js - we can deploy this as a polyglot application to Azure Spring Apps Enterprise.

Using the `package.json` in the above blog post example:

```json
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js",
    "build": "cd ./frontend && npm run build"
  }
```

To deploy and run this, we'll use the [Tanzu Node.js Buildpack](https://docs.vmware.com/en/VMware-Tanzu-Buildpacks/services/tanzu-buildpacks/GUID-nodejs-nodejs-buildpack.html):

- Go to the Azure Portal for the Spring App instance and navigate to the **Build Server** blade - then click **Add**
- Give the buildpack a name, choose the OS, and select the `nodejs` pack

![Filesystem structure](/media/2023/05/azure-blog-spring-apps-enterprise-polyglot-9.png)

Deploy the application with the following command - replace the `--builder` value with the name of your Node Buildpack name configured earlier:

```
az spring app deploy --resource-group "your-rg" --service "your-asa-enterprise" --name "your-asa-e-node-1" --source-path "./" --build-env BP_RUN_NODE_SCRIPTS="build" --builder=node-buildpack --verbose
```

`npm install` is ran by default - but we also include `BP_RUN_NODE_SCRIPTS="build"` to build our Front End to be served by Express.js (based off the example above). 

While the deployment is building - the output should show in your current terminal session.

For example:

```
 of 19 buildpacks participating
paketo-buildpacks/ca-certificates 3.5.1
tanzu-buildpacks/node-engine      1.1.0
tanzu-buildpacks/npm-install      1.0.0
tanzu-buildpacks/node-module-bom  0.3.4
tanzu-buildpacks/node-run-script  1.0.0
tanzu-buildpacks/node-start       1.0.0
tanzu-buildpacks/npm-start        1.0.0

Paketo Buildpack for CA Certificates 3.5.1
  https://github.com/paketo-buildpacks/ca-certificates
  Launch Helper: Contributing to layer
    Creating /layers/paketo-buildpacks_ca-certificates/helper/exec.d/ca-certificates-helper
Tanzu Node Engine Buildpack 1.1.0
  Resolving Node Engine version
    Candidate version sources (in priority order):
                -> ""
      <unknown> -> ""

    Selected Node Engine version (using ): 18.13.0

  Executing build process
    Installing Node Engine 18.13.0
      Completed in 4.509s

  Generating SBOM for /layers/tanzu-buildpacks_node-engine/node
      Completed in 0s

  Configuring build environment
    NODE_ENV     -> "production"
    NODE_HOME    -> "/layers/tanzu-buildpacks_node-engine/node"
    NODE_OPTIONS -> "--use-openssl-ca"
    NODE_VERBOSE -> "false"

  Configuring launch environment
    NODE_ENV     -> "production"
    NODE_HOME    -> "/layers/tanzu-buildpacks_node-engine/node"
    NODE_OPTIONS -> "--use-openssl-ca"
    NODE_VERBOSE -> "false"

    Writing exec.d/0-optimize-memory
      Calculates available memory based on container limits at launch time.
      Made available in the MEMORY_AVAILABLE environment variable.

Tanzu NPM Install Buildpack 1.0.0
  Resolving installation process
    Process inputs:
      node_modules      -> "Not found"
      npm-cache         -> "Not found"
      package-lock.json -> "Found"

    Selected NPM build process: 'npm ci'

  Executing build environment install process
    Running 'npm ci --unsafe-perm --cache /layers/tanzu-buildpacks_npm-install/npm-cache'
      Completed in 2.285s

  Configuring build environment
    NODE_ENV -> "development"
    PATH     -> "$PATH:/layers/tanzu-buildpacks_npm-install/build-modules/node_modules/.bin"

  Generating SBOM for /layers/tanzu-buildpacks_npm-install/build-modules
      Completed in 1.688s

  Executing launch environment install process
    Running 'npm prune'
      Completed in 1.506s

  Configuring launch environment
    NODE_PROJECT_PATH   -> "/workspace"
    NPM_CONFIG_LOGLEVEL -> "error"
    PATH                -> "$PATH:/layers/tanzu-buildpacks_npm-install/launch-modules/node_modules/.bin"

  Generating SBOM for /layers/tanzu-buildpacks_npm-install/launch-modules
      Completed in 1.743s


Tanzu Node Module Bill of Materials Generator Buildpack 0.3.4
  Resolving CycloneDX Node.js Module version
    Selected CycloneDX Node.js Module version: 3.10.4

  Executing build process
    Installing CycloneDX Node.js Module 3.10.4
      Completed in 148ms

  Configuring environment
    Appending CycloneDX Node.js Module onto PATH

  Running CycloneDX Node.js Module
    Running 'cyclonedx-bom -o bom.json'
      Completed in 432ms

[..truncated..]
Tanzu Node Run Script Buildpack 1.0.0
  Executing build process
    Running 'npm run build'
      
      > azure-webapps-linux-node-spafe-nodebe@1.0.0 build
      > cd ./frontend && npm i && npm run build

      [..truncated..]
      
      added 1491 packages, and audited 1492 packages in 46s

      235 packages are looking for funding
        run `npm fund` for details

      6 high severity vulnerabilities

      To address all issues (including breaking changes), run:
        npm audit fix --force

      Run `npm audit` for details.
      
      > frontend@0.1.0 build
      > react-scripts build

      Creating an optimized production build...
      Compiled successfully.

      File sizes after gzip:

        53.27 kB  build/static/js/main.dec2504d.js
        1.78 kB   build/static/js/787.cda612ba.chunk.js
        541 B     build/static/css/main.073c9b0a.css

      The project was built assuming it is hosted at /.
      You can control this with the homepage field in your package.json.

      The build folder is ready to be deployed.
      You may serve it with a static server:

        npm install -g serve
        serve -s build

      Find out more about deployment here:

        https://cra.link/deployment


    Completed in 1m3.798s

Tanzu Node Start Buildpack 1.0.0
  Assigning launch processes:
    web (default): node server.js

Tanzu NPM Start Buildpack 1.0.0
  Assigning launch processes:
    web (default): sh /workspace/start.sh

Adding layer 'paketo-buildpacks/ca-certificates:helper'
Adding layer 'tanzu-buildpacks/node-engine:node'
Adding layer 'tanzu-buildpacks/npm-install:launch-modules'
Adding layer 'launch.sbom'
Adding 1/1 app layer(s)
Adding layer 'launcher'
Adding layer 'config'
Adding layer 'process-types'
Adding label 'io.buildpacks.lifecycle.metadata'
Adding label 'io.buildpacks.build.metadata'
Adding label 'io.buildpacks.project.metadata'
Setting default process type 'web'
Saving acrc9a6a81672a74391a.azurecr.io/test-asa-e-node-1-default:result...
*** Images (sha256:41113f76ca5f1be56eec624e4c1eeb14c55d3fb12505ce31b6c4c5d65b7afa62):
      acrc9a6a81672a74391a.azurecr.io/test-asa-e-node-1-default:result
      acrc9a6a81672a74391a.azurecr.io/test-asa-e-node-1-default:result-1
Adding cache layer 'tanzu-buildpacks/node-engine:node'
Adding cache layer 'tanzu-buildpacks/npm-install:build-modules'
Adding cache layer 'tanzu-buildpacks/npm-install:npm-cache'
Adding cache layer 'tanzu-buildpacks/node-module-bom:cyclonedx-node-module'
Adding cache layer 'cache.sbom'
Build successful
```

At this point, the application should be successfully deployed. We can validate the content through the **Console** option:

![Filesystem structure](/media/2023/05/azure-blog-spring-apps-enterprise-polyglot-10.png)
