---
title: " Sample Nodejs App on Azure App services"
tags:
  - nodejs
  - test-app
categories:
  - Azure App Service on Windows
  - Nodejs
  - How-To
date: 2016-04-18 10:18:56
author_name: Prashanth Madi
---

*   Create a azure webapp
*   Browse to Kudu In your favorite Microsoft browser, surf to http://<sitename>.scm.azurewebsites.net. Ex: if your Azure App Service Web App name is “example”, then surf to http://example.scm.azurewebsite.net Once there, you will see the interface below:
*   [![step1](/media/2016/04/step1-1024x593.png)](/media/2016/04/step1.png)
*   Click ‘Debug Console’ and select ‘CMD’ ![step2](/media/2016/04/step2.png)Traverse to wwwroot folder

* [![step3](/media/2016/04/step3.png)](/media/2016/04/step3.png) ![step4](/media/2016/04/step4.png)

*   Create app.js file and enter below content: > touch app.js

*   Create web.config file and enter below content: > touch web.config

*   Navigate to http://\<sitename\>.azurewebsites.net and you should see a "hello world" message