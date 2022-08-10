---
title: "Using modern Yarn for deployment with Node.js on Azure App Service"
author_name: "Anthony Salemo"
tags:
    - Azure App Service
    - Node
    - Yarn
    - Deployment
    - Configuration
    - Troubleshooting
categories:
    - Azure App Service
    - Node
    - Deployment
    - Configuration
    - Troubleshooting
header:
    teaser: "/assets/images/yarnlogo.png" 
toc: true
toc_sticky: true
date: 2022-08-10 12:00:00
---

This blog post covers how to use Yarn versions 3.x for deployment on Azure App Services with Node.js.

Azure App Services currently uses [Yarn 'classic' (1.x)](https://github.com/yarnpkg/yarn). This is still widely used in the ecosystem. With Yarn 2.x and greater (called [Yarn 'Berry'](https://github.com/yarnpkg/berry)) is what is now billed as 'modern' Yarn, with version 3.x being the latest version.

One of the major differences between classic and modern is that classic, by default, still creates and uses `node_modules` for package depedency management. While modern does **not** use or create `node_modules` anymore - if using the default 'Zero Installs' approach, but rather just a `.yarn/cache` directory with it's [Plug'n'Play](https://yarnpkg.com/features/pnp) functionality.

This can save time and size with the application, furthermore the `.yarn/cache` folder can (and should) be commited to source, as opposed to not commiting `node_modules`. More of this can be read [here](https://yarnpkg.com/features/pnp#the-node_modules-problem).

<br>
<br>

**To find the source code for these files, visit [this GitHub repo](https://github.com/azureossd/azure-node-yarn-berry-examples)**.

## Getting started
### Installation
Follow the steps on installing Yarn [here](https://yarnpkg.com/getting-started/install#install-corepack).

### Initialize a project
You can create a new project or use an existing one. If using an existing one, delete any `node_modules`, `package-lock.json` and `yarn.lock` files before hand. You can also reference [this project](https://github.com/Ajsalemo/azure-node-windows-yarn-berry) as an example.

Create a new directory for your application. Within this new directory, run the following commands:

1. If on Node >= 16.20, run `corepack enable`. Else, run `npm i -g corepack`.
2. Next, run `yarn init -2`. You should now see 5 files and a directory get created:
    - `yarn.lock`
    - `.editorconfig`
    - `.yarnrc.yml`
    - `package.json`
    - `.pnp.cjs`
    - `.yarn/releases`

`.yarnrc.yml` points to the Yarn version it will be using under `.yarn/releases`.

3. Create a file named `server.js` in the directory you created for the project:

```javascript
// IMPORTANT: This require() statement is needed!
require("./.pnp.cjs").setup();
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (_req, res) => {
  res.json({ msg: "azure-node-windows-yarn-berry" });
});

app.listen(port, () => console.log(`Application is listening on port: ${port}`));
```

**IMPORTANT**: Note the addition of the `require` statement. This is needed for running with `iisNode` and simplifies the approach of having to configure a startup command with `yarn start` on Windows App Service. To configure a custom startup command would require `HttpPlatformHandler`, this would lose benefits that `iisNode` provides and is **not** recommended. 

See [this](https://yarnpkg.com/features/pnp#initializing-pnp) for more information.

4. In your `package.json`, add the following `scripts` property:

```json
{
  ...
  "scripts": {
    "start": "node server.js"
  }
}
```

5. Lastly, install `express` with `yarn add express`. You should see something like the following:

```yaml
$ yarn add express
➤ YN0000: ┌ Resolution step
➤ YN0000: └ Completed in 1s 124ms
➤ YN0000: ┌ Fetch step
```

A `.yarn/cache` folder will now be generated. In this are .zip files related to the installed dependency.

Notice how **no** `node_modules` where created. This is by design and a part of the [default "Zero Installs" approach](https://yarnpkg.com/features/zero-installs).

6. Run the application with `yarn start`:

```yaml
$ yarn start
Application is listening on port: 3000
```

The project structure at this time should look like the following:

![Project Structure](/media/2022/08/azure-ossd-yarn-node-blog-post-1.png)

## Deployment - Windows
For Windows App Services, a `web.config` is required. Create a file named `web.config` in the root of your project with the following content:

```
<?xml version="1.0" encoding="utf-8"?>
<!--
     This configuration file is required if iisnode is used to run node processes behind
     IIS or IIS Express.  For more information, visit:

     https://github.com/tjanczuk/iisnode/blob/master/src/samples/configuration/web.config
-->

<configuration>
  <system.webServer>
    <!-- Visit http://blogs.msdn.com/b/windowsazure/archive/2013/11/14/introduction-to-websockets-on-windows-azure-web-sites.aspx for more information on WebSocket support -->
    <webSocket enabled="false" />
    <handlers>
      <!-- Indicates that the server.js file is a node.js site to be handled by the iisnode module -->
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <!-- Do not interfere with requests for node-inspector debugging -->
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>

        <!-- First we consider whether the incoming URL matches a physical file in the /public folder -->
        <rule name="StaticContent">
          <action type="Rewrite" url="public{PATH_INFO}"/>
        </rule>

        <!-- All other URLs are mapped to the node.js site entry point -->
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    
    <!-- 'bin' directory has no special meaning in node.js and apps can be placed in it -->
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>

    <!-- Make sure error responses are left untouched -->
    <httpErrors existingResponse="PassThrough" />

    <!--
      You can control how Node is hosted within IIS using the following options:
        * watchedFiles: semi-colon separated list of files that will be watched for changes to restart the server
        * node_env: will be propagated to node as NODE_ENV environment variable
        * debuggingEnabled - controls whether the built-in debugger is enabled

      See https://github.com/tjanczuk/iisnode/blob/master/src/samples/configuration/web.config for a full list of options
    -->
    <!--<iisnode watchedFiles="web.config;*.js"/>-->
  </system.webServer>
</configuration>
```

### Local Git - Windows
**The source code for this can be found [here](https://github.com/azureossd/azure-node-yarn-berry-examples/tree/main/windows-localgit).**

If wanting to deploy a project using Yarn 2.x or greater on Azure App Service Windows Node, there is two general approaches:

1. Install dependencies as normal on the local machine, and make sure that `.gitignore` does **NOT** have `.yarn/` or `.yarn/cache` in it. This will make sure this folder is commited, which is recommended.

2. Or, do not commit `.yarn/cache` but instead build on the remote host (Kudu).

Option number 1 is preferred, as for as long as `.yarn/cache` has the nessecary dependencies installed in it, there is no installation that needs to be done again on the remote host or during the build.

To use either approach, a custom deployment script is needed. Install the [**kuduScript**](https://www.npmjs.com/package/kuduscript) package with `npm` on your local machine. 

Next, run the command `kuduScript -y --node`. This will show the following:

```
Generating deployment script for node.js Web Site
Generated deployment script files
```

A `.deployment` and `deploy.cmd` file will be created. 

Let's now edit this file:
- On lines 55 and 98, remove both instances of `:SelectNodeVersion` and `call ::SelectNodeVersion`.
- Around lines 100, Replace the following of:

    ```cmd
    IF EXIST "%DEPLOYMENT_TARGET%\package.json" (
        pushd "%DEPLOYMENT_TARGET%"
        call :ExecuteCmd !NPM_CMD! install --production
        IF !ERRORLEVEL! NEQ 0 goto error
        popd
    )
    ```

    with this:

    ```cmd
        echo "Installing corepack.."
        call :ExecuteCmd npm i -g corepack
        echo "Setting yarn to path.."
        SET PATH=%PATH%;D:\local\AppData\npm

        IF EXIST "%DEPLOYMENT_TARGET%\package.json" (
            IF EXIST "%DEPLOYMENT_TARGET%\.yarn\cache\" (
                pushd "%DEPLOYMENT_TARGET%"  
                echo ".yarn/cache checked in for 'Zero Installs', pushing cache and not running install.."
                IF !ERRORLEVEL! NEQ 0 goto error
                popd
            )
        )

        IF EXIST "%DEPLOYMENT_TARGET%\package.json" (
            IF NOT EXIST "%DEPLOYMENT_TARGET%\.yarn\cache\" (
                pushd "%DEPLOYMENT_TARGET%"  
                echo ".yarn/cache not found, configuring yarn.."
                echo "Setting yarn version to stable.."
                call :ExecuteCmd yarn set version stable
                echo "Checking yarn version.."
                call :ExecuteCmd yarn -v
                echo "Running yarn install.."
                call :ExecuteCmd yarn install 
                IF !ERRORLEVEL! NEQ 0 goto error
                popd
            )
        )
    ```


The above does the following:

- Installs `corepack`
- Updates `%PATH%` so we can call yarn from the deployment script location
- Checks for `package.json` and `.yarn\cache`. If the cache already exists, just push the content since we do not need to install anything now.
- Or, if `.yarn\cache` does **not** exist, set yarn to the latest version (3.x) and install.

Both scenarios should produce no `node_modules`. Deploy the application with [Local Git](https://docs.microsoft.com/en-us/azure/app-service/deploy-local-git?tabs=cli). You should see a running application that only uses `.yarn\cache` for its dependencies.

> **NOTE**: The deployment script above and in other methods below is just an example of how to do this. This can be changed as desired.

During deployment, you should see output in your terminal like the following - this assuming `.yarn/cache` was commited (recommended). Otherwise you would see packages being installed by yarn 3.x:

```cmd
[master 516671d] initial commit
 1 file changed, 3 insertions(+), 3 deletions(-)
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 8 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 326 bytes | 163.00 KiB/s, done.
Total 3 (delta 2), reused 0 (delta 0), pack-reused 0
remote: Updating branch 'master'.
remote: Updating submodules.
remote: Preparing deployment for commit id '516671d675'.
remote: Running custom deployment command...
remote: Running deployment command...
remote: Handling node.js deployment.
remote: Creating app_offline.htm
remote: KuduSync.NET from: 'C:\home\site\repository' to: 'C:\home\site\wwwroot'
remote: Copying file: 'web.config'
remote: Deleting app_offline.htm
remote: "Installing corepack.."
remote: ..
remote:
remote: changed 1 package, and audited 2 packages in 3s
remote:
remote: found 0 vulnerabilities
remote: "Setting yarn to path.."
remote: ".yarn/cache checked in for 'Zero Installs', pushing cache and not running install.."
remote: Finished successfully.
remote: Running post deployment command(s)...
remote: Triggering recycle (preview mode disabled).
remote: Deployment successful.
```

<br>
<br>

After a successfull deployment, you should see a directory structure like the below:

![Deployed Directory Structure](/media/2022/08/azure-ossd-yarn-node-blog-post-2.png)

### DevOps - Windows
**The source code for this can be found [here](https://github.com/azureossd/azure-node-yarn-berry-examples/tree/main/windows-devops).**

We can use Yarn 2.x or greater within a Azure DevOps pipeline for our node application.

In your **build** stage, add the **NodeTool@0** task, followed by a script that we'll execute to set the yarn version. Just as above, this script is written to push just the `.yarn/cache` if it exists. This only installs if it finds no `.yarn/cache` in the repo.

As mentioned above, this logic can be changed as desired:

```yaml
- task: NodeTool@0
  inputs:
    versionSpec: '16.x'
  displayName: 'Install Node.js'

  # NOTE: Do not set environment variables like YARN_xxx or else you may encounter errors
  # ex: Usage Error: Unrecognized or legacy configuration settings found: <someName> - run "yarn config -v" to see the list of settings supported in Yarn
- script: |
    IF EXIST ".yarn/cache/" (
      echo ".yarn/cache checked in for 'Zero Installs', pushing cache and not running install.."
    ) ELSE IF NOT EXIST ".yarn/cache/" (
      echo ".yarn/cache doesn't exist, running yarn set version and install.."
      echo "Setting yarn version to latest (3.x).."
      yarn set version stable
      echo "Checking yarn version.."
      yarn -v
      echo "Running yarn install.."
      yarn install
    )
  displayName: 'Check for .yarn cache'
```

### GitHub Actions - Windows
**The source code for this can be found [here](https://github.com/azureossd/azure-node-yarn-berry-examples/tree/main/windows-github-actions).**

Using the same project we created above, we can use this same approach in GitHub Actions. [Create an actions `.yaml` or edit an existing one](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#use-the-deployment-center). Add the following task of **actions/setup-node@v1**:

```yaml
- name: Set up Node.js version
  uses: actions/setup-node@v1
  with:
    node-version: '16.x'

- name: Check for .yarn cache
  run: |
    if (Test-Path -Path '.yarn\cache\') {
      echo '.yarn/cache checked in for "Zero Installs", pushing cache and not running install..'
    } elseif (-not (Test-Path -Path '.yarn\cache\')) {
      echo '.yarn/cache doesnt exist, running yarn set version and install..'
      echo 'Setting yarn version to latest (3.x)..'
      yarn set version stable
      echo 'Checking yarn version..'
      yarn -v
      echo 'Running yarn install..'
      yarn install
    }
```

## Deployment - Linux

One big difference between running this on Windows and Linux is that you can specify a startup command easily and set this to **`yarn start`** via the Azure Portal under **Configuration -> General Settings**. Therefor side-stepping the need for the `require("./.pnp.cjs").setup();` code within your `.js` entrypoint.

If you are wanting [Oryx to run the application](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/nodejs.md#run) automatically without the need for a explicit startup command - then leave this blank - as Oryx should run this via `yarn start`.

However, it may be advised to **keep the require() function with your code**, in case you want to avoid using a package manager for starting the application and use `node` (ex. `node server.js`) 

We'll reuse the same project as created above initially. **web.config** can be deleted when deploying to Linux App Services since this is ignored as there is no IIS being used.

### Linux - Local Git
**The source code for this can be found [here](https://github.com/azureossd/azure-node-yarn-berry-examples/tree/main/linux-localgit).**

Use the same project as above - and run the following in the root of your directory:

```
kuduScript --node -y -t bash
```

This will generate a `deploy.sh` and `.deployment` file.

> **NOTE**: The `deploy.cmd` file can be deleted as it will be ignored for Linux App Services

Delete the `selectNodeVersion` function on line 70 and the call on line 110. This function is not needed.

Lastly, change this:

```bash
# 3. Install npm packages
if [ -e "$DEPLOYMENT_TARGET/package.json" ]; then
  cd "$DEPLOYMENT_TARGET"
  echo "Running $NPM_CMD install --production"
  eval $NPM_CMD install --production
  exitWithMessageOnError "npm failed"
  cd - > /dev/null
fi
```

To this:

```bash
if [ -e "$DEPLOYMENT_TARGET/package.json" ]; then
  if [ -d "$DEPLOYMENT_TARGET/.yarn/cache/" ]; then
    cd "$DEPLOYMENT_TARGET"
    echo ".yarn/cache checked in for 'Zero Installs', pushing cache and not running install.."  
  elif [ ! -d "$DEPLOYMENT_TARGET/.yarn/cache/" ]; then
    cd "$DEPLOYMENT_TARGET"
    echo ".yarn/cache not found, configuring yarn.."
    echo "Setting yarn version to stable.."
    yarn set version stable
    echo "Checking yarn version.."
    yarn -v
    echo "Running yarn install.."
    yarn install 
  fi
fi
```

This contains the same logic we've discussed in the Windows section. This will check if `.yarn/cache` exists or not. If it does, it only pushes the cache - and does no installs. If it doesn't, it installs on the remote host.

As mentioned, it is recommended to push this cache. After a successful deployment, and using the set up we did in the **Getting Started** section, should show that no `node_modules` are being used here, and just the `.yarn/cache`. 

### Linux - DevOps
**The source code for this can be found [here](https://github.com/azureossd/azure-node-yarn-berry-examples/tree/main/linux-devops).**

Just as on Windows, add a `NodeTool@0` task with the below logic:

```yaml
- task: NodeTool@0
  inputs:
    versionSpec: '16.x'
  displayName: 'Install Node.js'

- script: |
    if [ -d ".yarn/cache/" ]; then
      echo ".yarn/cache checked in for 'Zero Installs', pushing cache and not running install.."  
    elif [ ! -d ".yarn/cache/" ]; then
      echo ".yarn/cache not found, configuring yarn.."
      echo "Setting yarn version to stable.."
      yarn set version stable
      echo "Checking yarn version.."
      yarn -v
      echo "Running yarn install.."
      yarn install 
    fi
  displayName: 'Check for .yarn cache or install packages'
```

### Linux - GitHub Actions
**The source code for this can be found [here](https://github.com/azureossd/azure-node-yarn-berry-examples/tree/main/linux-github-actions).**

Also like in the Windows section above, add a `actions/setup-node@v1` task in your Build portion of the GitHub Actions `.yaml` file with the following:

```yaml
- name: Set up Node.js version
  uses: actions/setup-node@v1
  with:
    node-version: '16.x'

- name: Check for .yarn cache
  run: |
    if [ -d ".yarn/cache/" ]; then
      echo ".yarn/cache checked in for 'Zero Installs', pushing cache and not running install.."  
    elif [ ! -d ".yarn/cache/" ]; then
      echo ".yarn/cache not found, configuring yarn.."
      echo "Setting yarn version to stable.."
      yarn set version stable
      echo "Checking yarn version.."
      yarn -v
      echo "Running yarn install.."
      yarn install 
    fi
```

As mentioned earlier, the logic for this can be changed as needed. The main goal is to set the yarn version to stable (currently 3.x) **if** needing to run any installs.

## Troubleshooting
### node_modules are being generated
If you see `node_modules` being created, check the following:
1. Ensure that yarn is not using 1.x
2. in `.yarnrc.yml`, ensure that `nodeLinker` is not set to `node_modules`
3. Or, a different package manager is being used (eg., `npm`)

### HTTP 500s are shown (Windows)
If HTTP 500.1xxx status codes are thrown - [which are `iisnode` specific](https://docs.microsoft.com/en-us/azure/app-service/app-service-web-nodejs-best-practices-and-troubleshoot-guide#iisnode-http-status-and-substatus), review the following:

1. A valid `web.config` is pushed and pointing to your entrypoint `.js` file, which is also using the `iisnode` handler.
2. `require("./.pnp.cjs").setup();` is the first line in your entrypoint `.js` file.
3. Check if [`iisnode.yml`](https://github.com/tjanczuk/iisnode/blob/master/src/samples/configuration/iisnode.yml) is being used specifically and using `nodeProcessCommandLine`. If a require() statement is not being used as described above, setting custom startup commands here may otherwise fail.

Ensure that [App Service Logs](https://docs.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-windows) are turned **on** as well.

### Container is crashing (Linux)
As above, ensure that [App Service Logs](https://docs.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) are turned **on**.

1. Check if `require("./.pnp.cjs").setup();` is the first line in your entrypoint `.js` file.
2. If it not, ensure that `yarn` is being used in the Startup command (eg., `yarn start`) or else packages may not resolve correctly.