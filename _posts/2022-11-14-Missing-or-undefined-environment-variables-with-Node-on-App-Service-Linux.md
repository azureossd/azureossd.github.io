---
title: "Missing or undefined environment variables with Node on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - NPM
    - Yarn
    - Nodejs
    - Deploy
    - Environment Variables
    - Production
    - SPAs
    - Windows
    - Linux
categories:
    - Azure App Service on Windows
    - Azure App Service on Linux
    - Node
    - Deployment 
    - Configuration
    - Troubleshooting
    - Windows
    - Linux
header:
    teaser: /assets/images/nodelinux.png
toc: true
toc_sticky: true
date: 2022-11-14 12:00:00
---

Sometimes with Single Page Applications (SPAs), it might be confusing on where and how to get your environment variables populated, especially if you're deploying across different environments. This also might vary on the framework, and also may happen for frameworks/libraries that aren't exactly SPA's.

Below we'll cover some reasons why you may be missing or undefined environment variables in your deployment process or at runtime and how to resolve this.

## Overview
At deployment time - and speaking strictly about SPA's, these type of applications handle their environment variables by injecting them into the build. This means that the environment variable **must** be available in the environment **where the production build is happening** which generates your static bundle. In this context, we're talking about [production builds](https://azureossd.github.io/2022/10/26/Best-practices-for-not-using-Development-Servers-on-Nodejs-applications-and-App-Service-Linux/index.html#resolution).

We are **not** talking about a Development Server being used (like in local development, usually). This ideally would be using Web Pack to handle this when running with a development server. But in production, this is not what we'd use (explained in the above blog post link). 

## Where should I add them?
Since the environment variable must exist where the "build" is happening which generates your production bundle, we'll look at some below scenarios for a better explaination:

### Local Git (and other methods using Oryx)
If deploying with Local Git, you will be [building with Oryx](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/nodejs.md#build) against the Kudu site, which runs as a seperate container from the application. This will be the environment where the build is happening.

Therefor, you need to add the environment variables you want in your application, to be injected your build - as **App Settings**. This approach is the same for all types of SPAs and frameworks which depend on client code to be built.

The reason we'd add our environment variables as App Settings as opposed to the other methods below is because adding App Settings will have these be available in the Kudu environment as well, which is our **build environment**, and exactly what is needed to properly inject them. Using React as an example, which [expects a `REACT_APP_` prefix to any environment accessible in client-side code](https://create-react-app.dev/docs/adding-custom-environment-variables/), let's add an App Setting:

![React App App Setting](/media/2022/10/azure-blog-node-env-vars-1.png)

We can see it's available in the Kudu environment:

![Kudu App Setting](/media/2022/10/azure-blog-node-env-vars-2.png)

Now, if we deploy some code like this, we should see this is properly injected:

```javascript
<span>
    API URI: `{process.env.REACT_APP_API_URI ?? "No environment variables found"}`
</span>
```

![React App Env Var](/media/2022/10/azure-blog-node-env-vars-3.png)

#### Why might environment variables show as missing or undefined?
In the above example, we added the App Setting **before** we deployed, so it was already available to the environment when `npm run build` or `yarn run build` happened. But what happens if we **deployed first** and then added that same App Setting **after** the deployment was done?

Assuming we do not have any App Settings (like the `REACT_APP_API_URI`) added, and we now deploy, this is what we see:

This means the null coalesence fell back to our default value because `REACT_APP_API_URI` wasn't available in the environment to be injected into our build.

![React App Env Var](/media/2022/10/azure-blog-node-env-vars-4.png)

**In summary**:

If using Oryx as the builder, App Settings should be added **before** deploying, otherwise the environment variables will not be available for the build.

If these App Settings are added **after**, then redeploy the application.

### GitHub Actions
When deploying with GitHub Actions (with GitHub as the builder), typically the entirety of the build process would be carried out in this pipeline.

Therefor, this would be the **build environment** and the environment variables would be needed there. This again is essentially the same premise for all SPA's or Node-based applications that require a build process for client-side code.

Below is using Next.js as an example. We specify environment variables in GitHub Actions using the `env` property. More on that can be found [here](https://docs.github.com/en/actions/learn-github-actions/environment-variables):

```yaml
name: Build and deploy Node.js app to Azure Web App - myapp

env:
  NEXT_PUBLIC_API_URI: ${{ secrets.NEXT_PUBLIC_API_URI }}

on:
  push:
    branches:
      - main
  workflow_dispatch:
```

We add our environment variable to the pipeline, since `NEXT_PUBLIC_` prefixed variables are variables accessible to the browser, and are needed to be available at build time.

Using some code like this in our Next.js application, we can see it's now accessible:
```javascript
<p className={styles.description}>
    NEXT_PUBLIC_API_URI: {process.env.NEXT_PUBLIC_API_URI ?? "No environment variables exposed to the browser"}
</p>
```

![Nextjs Env Var](/media/2022/10/azure-blog-node-env-vars-5.png)

**IMPORTANT**:

Since the build happens in GitHub Actions, **we do not need to add these to App Settings on the App Service side**. This would have no affect, but is also redundant as the build is happening on the pipeline, not with Oryx (App Service). **This is only applicable to environment variables being embedded into the build, eg. browser-accessed variables)**

**NOTE**: Beware and review your framework/libraries documentation. In Next.js's example, there are environment variables **only** available to the browser (`NEXT_PUBLIC_` prefixed ones) and environment variables **only** available within Node. If your framework has environment variables only available within the node runtime, and **NOT** the browser, they will have to be added as App Settings.

See more on this with Next.js's environment variable documentation [here](https://nextjs.org/docs/basic-features/environment-variables).

### DevOps pipelines
Azure DevOps pipelines will follow the same approach that we talked about with GitHub Actions.

We'll use a [Vue](https://vuejs.org/guide/introduction.html) application to illustrate this.

As with both React and Next, [Vue expects a certain prefix to environment variables](https://cli.vuejs.org/guide/mode-and-env.html#using-env-variables-in-client-side-code) to have these be accessed in the browser - this prefix is `VUE_APP_` (This method uses Vue CLI which is in maintenance mode). For Vue applications using [Vite](https://vuejs.org/guide/scaling-up/tooling.html#project-scaffolding), the prefix is `VITE_`.

We'll use some code like this to access our environment variable in the browser:

```javascript
<script setup>
const apiUri = import.meta.env.VITE_API_URI;

defineProps({
  msg: {
    type: String,
    required: true
  }
})

</script>

<template>
  <div class="greetings">
    <h1 class="green">{{ msg }}</h1>
    <h3>
      VITE_API_URI: {{ apiUri ?? "No environment variable defined" }}
    </h3>
  </div>
</template>
```

On the pipeline side, to add an environment variable:
- Click **Pipelines** -> **Ellipsis Icon** -> **Edit Pipelines**
- Then, click **Variables** -> **Add New Variable**

![Vue variables on Dev Ops](/media/2022/10/azure-blog-node-env-vars-6.png)
![Vue variables on Dev Ops](/media/2022/10/azure-blog-node-env-vars-7.png)

This will now expose the environment variable so when we run `npm run build` in the pipeline, the environment variable will be embedded into the build. We would now see this available to us at runtime:

![Vue variables on Dev Ops](/media/2022/10/azure-blog-node-env-vars-8.png)

If we forget to do this, our environment variable may be undefined. 

**IMPORTANT**:

Since the build happens on the DevOps pipeline, **we do not need to add these to App Settings on the App Service side**. This would have no affect, but is also redundant as the build is happening on the pipeline, not with Oryx (App Service). **This is only applicable to environment variables being embedded into the build, eg. browser-accessed variables)**

### Zip Deploy (without Oryx Builder), FTP
If using Zip Deploy without building with Oryx (either the App Setting `SCM_DO_BUILD_DURING_DEPLOYMENT` is not set or is set to `false`) or using FTP to deploy your SPA-based applications - you will need to make sure the production build is generated **locally**.

Zip Deploy and FTP expect a fully built application (node_modules and all other files) - therefor in this case you would need to set your environment variables locally and run your build (eg., `yarn run build`, `npm run build`) there - so variables will already be embedded into your build with you zip or copy these files over for deployment.

## Framework Specific examples
Below are some framework's who require specific variable prefix to expose these to the browser. Without adding these prefixes, your variables will be undefined even if you're correctly exposing them to the build environment:

- [React](https://create-react-app.dev/docs/adding-custom-environment-variables/) - Uses `REACT_APP_` prefix
- [Vue (with Vue CLI)](https://cli.vuejs.org/guide/mode-and-env.html#using-env-variables-in-client-side-code) - Uses `VUE_APP_` prefix
- [Vue (with Vite)](https://vitejs.dev/guide/env-and-mode.html) - Uses `VITE_` prefix
- [Nextjs (client-code)](https://nextjs.org/docs/basic-features/environment-variables) - Uses `NEXT_PUBLIC_` prefix
- [Angular](https://angular.io/guide/build) - Angular handles this differently through the `environment.<someEnv>.ts` file. `process.env.<SOME_ENV>` can still be used, like with these other libraries and frameworks, but will require a bit of extra work. An example on how to use the `process.env.` approach can be seen [here](https://github.com/azureossd/angular-env-var-with-processenv).


## Troubleshooting
If your variables are showing as undefined at runtime, review these points:

- Are these environment variables supposed to be exposed to the browser? (eg., `REACT_APP_`, `VUE_APP_`, `VITE_`, `NEXT_PUBLIC_`, etc.)
    - If so, ensure the values for these environment variables are available at build time in your GitHub Actions pipeline **or** DevOps pipelines. Review the documentation for [adding variables with DevOps](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch) and [adding variables with GitHub Actions](https://docs.github.com/en/actions/learn-github-actions/environment-variables). If building against Kudu with Oryx (eg., Local Git) - add these values as App Settings.
- Are these environment variables supposed to be exposed to the Node runtime (eg., server-side, non-browser/client code?)
    - If so, ensure these values for the environment variables are added as **App Settings** on the App Service.
- If your library/framework expects specific prefixes to make them available to client-side code, check your syntax.
- If added these as secrets to be referenced in your `env` block in GitHub Actions, make sure you're referencing the appropriate secret name




