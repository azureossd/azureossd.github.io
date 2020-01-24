---
title: " Query strings exceed 1,024 characters using OAuth 2.0/AD with Node.js Azure Web Apps"
categories:
  - Azure App Service 
  - Nodejs
  - Configuration
date: 2016-07-25 12:05:18
tags:
author_name: Edison
---

If you are implementing [OAuth 2.0 protocol with Active Directory](https://azure.microsoft.com/en-us/documentation/articles/active-directory-v2-protocols-oauth-code/), you need to consider that Access tokens responses can increase to more than 1024 characters in some scenarios and you can get http 404.15 errors {Query String Too Long }, by default Azure Web Apps have a limit on Query String length, you can modify this limit with the following configuration: 


[![querystring](/media/2016/07/querystring.png)](/media/2016/07/querystring.png)