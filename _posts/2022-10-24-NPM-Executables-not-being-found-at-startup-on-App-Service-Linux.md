---
title: "NPM executables not being found on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - NPM
    - Nodejs
    - Deploy
    - Azure DevOps
    - GitHub Actions
    - Zip Deploy
categories:
    - Azure App Service on Linux
    - Node
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/nodelinux.png
toc: true
toc_sticky: true
date: 2022-10-24 12:00:00
---

Sometimes when deploying to Azure App Service Linux and Nodejs using options that use ZipDeploy - such as GitHub Actions (GitHub as the builder) or DevOps pipelines, you may run into a problem at runtime (on startup) where the NPM executable ran (eg., `nest start`, `nuxt start`, `next start`, etc.) is not found. 

## Overview
When deploying with Zip Deploy, you may run into an issue where NPM executables are not found. This does **not** happen when using Oryx as the builder (eg., Local Git, Zip Deploy when SCM_DO_BUILD_DURING_DEPLOYMENT = true)

This is more prevalent on pipeline deployments, such as GitHub Actions (GitHub builder) or Azure DevOps pipelines, because these deployment methods ultimately use Zip Deploy. The build would be entirely on the pipeline (**not** using Oryx to build) and all that is being deployed is a `.zip` artifact to be extracted on Kudu. The `npm install` and `npm build` would be done on the pipeline, and create a fully deployable artifact. This is also where the symlinks are created. 

But what may be noticed is that the symlinks required for these Node applications to run are missing, therefor breaking the application - at runtime. **Ultimately, what is happening here is that symlinks are not retained upon extraction on Kudu when using Zip Deploy.**

This may show up like the below:


```
Require stack:
    - /home/site/wwwroot/node_modules/.bin/nest
    at Module._resolveFilename (node:internal/modules/cjs/loader:939:15)
    at Module._load (node:internal/modules/cjs/loader:780:27)
    at Module.require (node:internal/modules/cjs/loader:1005:19)
    at require (node:internal/modules/cjs/helpers:102:18)
    at Object.<anonymous> (/home/site/wwwroot/node_modules/.bin/nest:5:20)
    at Module._compile (node:internal/modules/cjs/loader:1105:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1159:10)
    at Module.load (node:internal/modules/cjs/loader:981:32)
    at Module._load (node:internal/modules/cjs/loader:827:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:77:12) {
        code: 'MODULE_NOT_FOUND',
        requireStack: [ '/home/site/wwwroot/node_modules/.bin/nest' ]
    }
```

The above message would of course vary for different frameworks or NPM packages. Such as below, which is for **Nuxt.js**. The `requirestack` may vary but the premise is the same that the required symlink is missing.

```javascript
code: 'MODULE_NOT_FOUND',
requireStack: [ '/home/site/wwwroot/node_modules/.bin/nuxt' ]
```

Or with [**concurrently.js**](https://www.npmjs.com/package/concurrently):
```javascript
code: 'MODULE_NOT_FOUND',
requireStack: [ '/home/site/wwwroot/node_modules/.bin/concurrently' ]
```

Next.js (etc.)
```javascript
code: 'module_not_found'
requirestack: [ '/home/site/wwwroot/node_modules/.bin/next' ]
```

You can confirm if symlinks exist by running `ls -lrta ./node_modules/.bin`, and should get an output like this (this can find **entrypoint** which is talked about below in the Resolution):

```json
lrwxrwxrwx   1 runner docker    16 Oct 20 15:58 rimraf -> ../rimraf/bin.js
lrwxrwxrwx   1 runner docker    22 Oct 20 15:58 resolve -> ../resolve/bin/resolve
lrwxrwxrwx   1 runner docker    23 Oct 20 15:58 node-which -> ../which/bin/node-which
lrwxrwxrwx   1 runner docker    21 Oct 20 15:58 next -> ../next/dist/bin/next
```

What you will see is that `node_modules/.bin/<package>` is always in the stack, this is because NPM relies on this path to call executables - this is then symlinked to the actual package path under `/node_modules/<some>/<package>/<entrypoint>`, and where this ultimately fails. More on that can be found [here](https://docs.npmjs.com/cli/v8/configuring-npm/folders#executables).

### Difference between other "like" errors
Before going onto the resolution, it is very important to note that this is **distinctly different** than your typical `module not found` error, in the sense that the package is missing from your `package.json` **or** you forgot to run `npm install` (or yarn) during your deployment process.

## Resolution
The most generally simple way to resolve this is to just change the `package.json` script that points to these framework or package specific commands.

For example, if using GitHub Actions (GitHub Builder) and **Nuxt.js**:

You'd change your `package.json` from this:

```json
"scripts": {
    "dev": "nuxt",
    "build": "nuxt build",
    "start": "nuxt start",
    "generate": "nuxt generate"
}
```

To this:

```json
"scripts": {
    "dev": "nuxt",
    "build": "nuxt build",
    "start": "node_modules/nuxt/bin/nuxt.js start",
    "generate": "nuxt generate"
}
```

With **Next.js**, it would go from this:

```json
"scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
}
```

To this:

```json
"scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node_modules/next/dist/bin/next start",
    "lint": "next lint"
}
```

This is the same for any other packages encountering this on startup. What we're doing is instead of relying on symlinks, we're directly pointing to the package entrypoint. All packages have entrypoints (.js files) - which is the same ones that NPM would ultimately be symlinked to.

This can be further extended by adding it to specific `start` scripts for local and remote. For example:

```json
"scripts": {
    "start": "./node_modules/concurrently/dist/bin/concurrently.js \"npm run start:azure\" \"echo 'This worked'\"",
    "start:dev": "concurrently \"npm run start\" \"echo 'This worked'\"",
    "start:azure": "node server.js
}
```

We can see this also successfully works with the below output:

```javascript
This worked
'This worked' exited with code 0
npm info it worked if it ends with ok
npm info using npm@6.14.15
npm info using node@v18.2.0
npm info lifecycle azure-webapps-linux-node-express-basic@1.0.0~prestart: azure-webapps-linux-node-express-basic@1.0.0
npm info lifecycle azure-webapps-linux-node-express-basic@1.0.0~start: azure-webapps-linux-node-express-basic@1.0.0
> azure-webapps-linux-node-express-basic@1.0.0 start /home/site/wwwroot
> node server.js
Server listening on port: 8080
```

**In summary**, what we're doing above to resolve this is to point directly to the package entrypoint. Which is the same entrypoint NPM would have been ultimately pointing to. 

**Another resolution**:

Another potential resolution, although a bit more redundant here since we'd ideally want to contain out install and build logic for the application on the pipeline, is to set `SCM_DO_BUILD_DURING_DEPLOYMENT` to `true.

This uses Oryx as the builder, which means the install and build (if applicable) will be handled by Oryx and is run on the Kudu container, which then files are synced to `/home/site/wwwroot` - as opposed to a zip package being POST'ed to Kudu, and then extracted with our application ready to run.

You can confirm the differences in builders by viewing the file named `Background_POST_api-zipdeploy_pending.xml` under `/home/LogFiles/kudu/trace` - in other cases, it _may_ be possible to see the builder being used in **Deployment Center** -> **Logs** tab. For the `.xml file`, there is an xml element containing the builder being used at the time, for example:

(BasicBuilder)
```xml
<step title="Determining deployment builder" date="2023-06-09T15:40:30.155" >
    <step title="Builder is BasicBuilder" date="2023-06-09T15:40:30.159" />
</step>
```

(Oryx being used)
```xml
<step title="Determining deployment builder" date="2023-06-09T15:50:03.027" >
    <step title="Builder is OryxBuilder" date="2023-06-09T15:50:03.031" />
</step>
```