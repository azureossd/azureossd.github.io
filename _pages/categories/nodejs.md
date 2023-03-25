---
permalink: "/nodejs/"
layout: home
title: "Nodejs"
sidebar: 
    nav: "links"
pagination: 
  enabled: true
  category: nodejs
  sort_reverse: true
  trail: 
    before: 2
    after: 2
toc: true
---
App Service on Linux supports a number of language specific built-in images. One of the supported languages is Node.js.

>**Node.js Update Policy** - App Service upgrades the underlying Node.js runtime and SDK of your application as part of the regular platform updates. As a result of this update process, your application will be automatically updated to the latest patch version available in the platform for the configured runtime of your app. For more information about current supported node.js versions check [Support Timeline](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/node_support.md#support-timeline).

You can find a compilation of resources by categories:

## Availability and Performance
- [Troubleshooting Node.js High Memory scenarios](https://azureossd.github.io/2021/12/10/Troubleshooting-NodeJS-High-Memory-scenarios-in-App-Service-Linux/index.html)
- [Troubleshooting Node.js High CPU scenarios](https://azureossd.github.io/2021/12/09/Troubleshooting-NodeJS-High-CPU-scenarios-in-App-Service-Linux/index.html)
- [Missing or undefined environment variables](https://azureossd.github.io/2022/11/14/Missing-or-undefined-environment-variables-with-Node-on-App-Service-Linux/index.html)
- [Best practices for not using Development Servers on Nodejs applications](https://azureossd.github.io/2022/10/26/Best-practices-for-not-using-Development-Servers-on-Nodejs-applications-and-App-Service-Linux/index.html)
- [Module not found](https://azureossd.github.io/2022/10/25/Module-not-found-with-Node-on-App-Service-Linux/index.html)
- [NPM executables not being found](https://azureossd.github.io/2022/10/24/NPM-Executables-not-being-found-at-startup-on-App-Service-Linux/index.html)
- [Why to avoid installing packages in startup scripts](https://azureossd.github.io/2022/10/14/Nodejs-on-App-Service-Linux-and-why-to-avoiding-installing-packages-in-startup-scripts/index.html)
- [getaddrinfo ENOTFOUND](https://azureossd.github.io/2022/09/30/Node-applications-on-App-Service-Linux-and-getaddrinfo-ENOTFOUND/index.html)
- [ENOSPC: System limit for number of file watchers reached](https://azureossd.github.io/2022/09/28/ENOSPC-System-limit-for-number-of-file-watchers-reached/index.html)
- [Node.js 12 applications failing by Optional chaining](https://azureossd.github.io/2022/09/06/Nodejs-12-failing-by-Optional-Chaining/index.html)
- [Using modern Yarn for deployment with Node.js](https://azureossd.github.io/2022/08/10/Using-modern-Yarn-for-deployment-with-Node.js-on-Azure-App-Service/index.html)

## Deployment
- [Troubleshooting Node.js deployments on App Service Linux](https://azureossd.github.io/2023/02/09/troubleshooting-nodejs-deployments-on-appservice-linux/index.html)
- [Yarn install timeouts and private packages](https://azureossd.github.io/2023/03/24/yarn-install-timeouts-and-private-packages/index.html)
- [How to deploy Custom Docker containers using Azure DevOps](https://azureossd.github.io/2023/03/20/how-to-deploy-azure-functions-as-custom-container-using-azure-devops/index.html)
- **Frameworks**
  - [Next.js](https://azureossd.github.io/2022/10/18/NextJS-deployment-on-App-Service-Linux/index.html)
  - [Vue](https://azureossd.github.io/2022/02/11/Vue-Deployment-on-App-Service-Linux/index.html)
  - [Nest](https://azureossd.github.io/2022/02/11/Nest-Deployment-on-App-Service-Linux/index.html)
  - [React](https://azureossd.github.io/2022/02/07/React-Deployment-on-App-Service-Linux/index.html)
  - [Angular](https://azureossd.github.io/2022/01/29/Angular-Deployment-on-App-Service-Linux/index.html)
  - [Nuxtjs](https://azureossd.github.io/2022/01/28/Nuxtjs-Deployment-with-Azure-DevOps-Pipelines/index.html)

## Configuration
- [Using PM2 on App Service Linux](https://azureossd.github.io/2022/02/22/Using-PM2-on-App-Service-Linux/index.html)
- [NodeJS with Keep-Alives and Connection Reuse](https://azureossd.github.io/2022/03/10/NodeJS-with-Keep-Alives-and-Connection-Reuse/index.html)
- [Node.js and Redirects or Rewrite scenarios](https://azureossd.github.io/2022/01/16/NodeJS-and-Redirects-or-Rewrites-on-App-Service-Linux/index.html)
- [Loading and accessing certificates in node.js](https://azureossd.github.io/2021/02/03/Loading-certificates-using-nodejs/index.html)
- [Running Production Build Nodejs Apps](https://azureossd.github.io/2020/04/30/run-production-build-on-app-service-linux/index.html)
- [Configuring SSL Certificates with nodejs](https://azureossd.github.io/2020/02/11/configuring-ssl-certificates-with-nodejs/index.html)
- [Custom Startup Script for Nodejs](https://azureossd.github.io/2020/01/23/custom-startup-for-nodejs-python/index.html)

## Windows
- [Troubleshooting Common iisnode Issues](https://azureossd.github.io/2022/10/17/troubleshooting-common-iisnode-issues/index.html)
- [Avoiding hardcoding Node versions](https://azureossd.github.io/2022/06/24/Avoiding-hardcoding-Node-versions-on-App-Service-Windows/index.html)
- [Troubleshooting Node.js High CPU and Memory scenarios in App Service Windows](https://azureossd.github.io/2021/12/14/Troubleshooting-NodeJS-High-CPU-and-Memory-scenarios-in-App-Service-Windows/index.html)