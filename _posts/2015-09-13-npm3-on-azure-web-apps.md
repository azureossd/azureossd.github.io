---
title: " NPM3 on Azure Web Apps"
tags:
  - nodejs
  - npm3
categories:
  - Nodejs
  - NPM
  - Azure App Service on Windows
date: 2015-09-13 21:05:00
author_name: Prashanth Madi
---

On Windows, the file system itself cannot seem to cope very well with too deeply nested node_modules directory used by NPM. This blog provides details on how to change npm version in Azure web apps which uses flat file system instead of Nested dependencies.

In Azure web Apps, Every web app comes with a default npm version which co-relates to node.js version you have set in web app configure tab.

Ex:  
-          Node 0.12.2  would use npm 2.7.4  
-          Node 0.10.32 would use npm 1.4.28

[npm@3](mailto:npm@3) executable is available in azure web apps but they are not exposed yet (D:\\Program Files (x86)\\npm\\3.1.0\\npm) using node.js version as above. Below are different ways to deploy node.js application and ways to utilize npm 3 in it.

**Using Visual Studio Publish option:**  
1) Delete npm_modules folder in your web app folder.  
2) Upgrade NPM in local environment using npm-windows-upgrade ([https://github.com/felixrieseberg/npm-windows-upgrade](https://github.com/felixrieseberg/npm-windows-upgrade)).  
3) run npm install in your web app root folder where your package.json file exists. This would create npm_modules folder.  
4) Publish your web app using Visual Studio.

**Using Git Deployment :**  
Azure GIT deployment process would involve below steps  
1) Moves content to azure web app  
2) Creates default deployment script, if there isn’t one in web app root folder  
3) Run’s deployment script where it install’s npm modules

At Step 2, Instead of deployment process creating a default script. We can include custom deployment script and change it's content to use [npm@3](mailto:npm@3) instead of default npm.  
Below steps would help you generate custom deployment script :  
\- Install the azure-cli tool, it'll also give you some cool features on managing azure related resources directly from the command-line:

    npm install azure-cli -g

\- Go to the root of your repository (from which you deploy your site).  
\- Run the custom deployment script generator command:

    azure site deploymentscript --node

\- Above command will generate the files required to deploy your site, mainly:

` .deployment - Contains the command to run for deploying your site.  
deploy.cmd - Contains the deployment script.`

[![](/media/2019/03/0804.custom_deployment.jpg)](/media/2019/03/0804.custom_deployment.jpg)

\- In deployment.cmd file, replace line no 103 with below highlighted content to use [npm@3]

    :: 3. Install npm packages IF EXIST "%DEPLOYMENT_TARGET%\package.json" ( pushd "%DEPLOYMENT_TARGET%" call :ExecuteCmd "D:\Program Files (x86)\npm\3.1.0\npm" install --production IF !ERRORLEVEL! NEQ 0 goto error popd )

**Similar Links:**

\- Finding Memory Leaks and CPU Usage in Azure Node.js Web App ( [Troubleshoot Finding Memory Leaks and CPU Usage in Node JS Azure Web App](../2015/08/23/troubleshoot-finding-memory-leaks-and-cpu-usage-in-node-js-azure-web-app.aspx) )

\- Debug Node.js Web Apps at Azure ( [Detecting Memory Leak in Node JS Web App at Azure](../2015/08/19/detecting-memory-leak-in-node-js-web-apps-at-azure.aspx) )