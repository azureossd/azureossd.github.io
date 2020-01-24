---
title: "How to set node version for Windows node.js webapp from Azure Portal"
categories:
  - Azure App Service on Windows
  - Nodejs
  - Configuration
date: 2018-09-25 16:35:42
tags:
author_name: milindvb
header:
    teaser: /assets/images/nodejslogo.png
---

# Create the Azure WebApp

* Create new WebApp using Azure portal

![](/media/2018/09/blog1.jpg)
 

-   Set the App name, Resource Group and click "Create"

![](/media/2018/09/blog2.jpg)
 

*   Wait for deployment to succeed and then click on Application Settings for the new Webapp.
*   Add a new setting with **App Setting Name** "WEBSITE\_NODE\_DEFAULT\_VERSION" and **Value** "8.9.4" and click Save. If you would like to use a different version of node, please refer to the section "***How to find available node.js versions for Windows Webapps***" below.

![](/media/2018/09/blog3-1024x596.jpg)

*   You can now start developing your node.js application in Azure Environment.

How to find available node.js versions for Windows Webapps.
-----------------------------------------------------------

For nodejs release schedule, please refer to

<https://github.com/nodejs/Release>

To find current nodejs versions available in Azure Windows WebApps, navigate to this link:

https://\<yourwebappname\>.scm.azurewebsites.net/api/diagnostics/runtime

You can only use the versions available in this list.

New versions are added regularly, so please check for newer versions using the */api/diagnostics/runtime* url above.

![](/media/2018/09/blog4-246x300.jpg)

Common Error that indicates the node.js version is missing or incorrect.


If your application is getting the following error, please check whether WEBSITE\_NODE\_DEFAULT\_VERSION is set to a valid value.

    Application has thrown an uncaught exception and is terminated:
    SyntaxError: Unexpected token {
    at Module._compile (module.js:434:25)
    at Object..js (module.js:464:10)
    at Module.load (module.js:353:31)
    at Function._load (module.js:311:12)
    at Module.require (module.js:359:17)
    at require (module.js:375:17)
    at Object.<anonymous> (D:\Program Files (x86)\iisnode\interceptor.js:459:1)
    at Module._compile (module.js:446:26)
    at Object..js (module.js:464:10)
    at Module.load (module.js:353:31)
