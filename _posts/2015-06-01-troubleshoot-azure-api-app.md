---
title: " Troubleshoot - Azure Api App"
tags:
  - APIAPP
  - Swagger
categories:
  - API App
date: 2015-06-01 08:26:00
author_name: Prashanth Madi
---

An API app is an [App Service web app](https://azure.microsoft.com/en-us/documentation/articles/app-service-web-overview/) with additional features that enhance the experience of developing, deploying, publishing, consuming, managing, and monetizing RESTful web APIs.

For More information Please refer : [https://azure.microsoft.com/en-us/documentation/articles/app-service-api-apps-why-best-platform/](https://azure.microsoft.com/en-us/documentation/articles/app-service-api-apps-why-best-platform/)

This Blog would provide Troubleshoot techniques in API APP.

1)     If you change your API definition file, than you have to manually restart gateway to reflect new API definition changes in portal. Below is a procedure for it

*   Click on resource group in api app, It would open up a new blade

[![](/media/2019/03/3582.1.jpg)](/media/2019/03/3582.1.jpg)  
 

*   Click on your gateway and restart

  
[![](/media/2019/03/6505.2.jpg)](/media/2019/03/6505.2.jpg)

*   I have added new operation using above procedure as in below image.

 [![](/media/2019/03/1300.3.jpg)](/media/2019/03/1300.3.jpg)

2)     **Use Swagger Editor to check if issue is with API App definition file or Azure API Service.**  
Azure portal doesn’t provide enough info to troubleshoot Api app issue other than below error which has a link for un-related content. Even kudu logs won’t help you with this issue as it’s not an application specific.

Error: Cannot get the API definition. it may require additional configuration or authentication on the API app.

[![](/media/2019/03/0763.4.jpg)](/media/2019/03/0763.4.jpg)

Sample api-defination url : [https://microsoft-apiapp1b423cc9b3f6433692737d88d9d40511.azurewebsites.net/v1/api-docs](https://microsoft-apiapp1b423cc9b3f6433692737d88d9d40511.azurewebsites.net/v1/api-docs)

Swagger editor Link: [http://editor.swagger.io/#/](http://editor.swagger.io/#/)

*   Open swagger editor link in browser and use import url option under file nav. I have provided my api-defination url above, if you wanna play around.

[![](/media/2019/03/7870.5.jpg)](/media/2019/03/7870.5.jpg)

*   If your definition file is not well-formed, you would see errors as in right column of below image.

 [![](/media/2019/03/4762.6.jpg)](/media/2019/03/4762.6.jpg)