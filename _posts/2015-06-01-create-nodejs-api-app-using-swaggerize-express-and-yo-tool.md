---
title: "Create Nodejs API APP using Swaggerize-express and YO tool"
tags:
  - APIAPP
  - express
  - nodejs
  - Swagger
categories:
  - Nodejs
date: 2015-06-01 10:15:00
author_name: Prashanth Madi
---

An API app is an [App Service web app](https://azure.microsoft.com/en-us/documentation/articles/app-service-web-overview/) with additional features that enhance the experience of developing, deploying, publishing, consuming, managing, and monetizing RESTful web APIs.

For More information Please refer : [https://azure.microsoft.com/en-us/documentation/articles/app-service-api-apps-why-best-platform/](https://azure.microsoft.com/en-us/documentation/articles/app-service-api-apps-why-best-platform/)

This Blog would provide steps to create a sample Azure API APP in NodeJS using Swaggerize-express

*   Install  generator-swaggeize(and yo if you haven't already) - [https://www.npmjs.com/package/swaggerize-express](https://www.npmjs.com/package/swaggerize-express)

    $ npm install -g yo$ npm install -g generator-swaggerize

*    Now run the generator

    $ yo swaggerize

*   It would ask you set of questions as in below screenshot

![](/media/2019/03/7416.2.JPG)

you can find sample swagger document @ [https://raw.githubusercontent.com/prashanthmadi/Azure-nodejs-API-APP/master/config/BumblebeeNodejsAPI.json](https://raw.githubusercontent.com/prashanthmadi/Azure-nodejs-API-APP/master/config/BumblebeeNodejsAPI.json)

*   At the end it would create a api app with required handlers and node_modules as in below screenshot

![](/media/2019/03/8032.3.JPG)

*   After importing project into phpstorm, you can see that each path defined in swagger definition would get its own file

![](/media/2019/03/5327.4.JPG)

*   Now Replace content in server.js at Root folder with below

    'use strict';  var port = process.env.PORT || 1337; var baseHost = process.env.WEBSITE_HOSTNAME || 'localhost';  var http = require('http'); var express = require('express'); var bodyParser = require('body-parser'); var swaggerize = require('swaggerize-express'); var path = require('path');  var app = express();  var server = http.createServer(app);  app.use(bodyParser.json());  app.get('/', function (req, res) { res.send('Hello World!'); });  app.use(swaggerize({ api: path.resolve('./config/BumblebeeNodejsAPI.json'), docspath: '/swagger', handlers: path.resolve('./handlers') }));  server.listen(port, 'localhost', function () { if (baseHost === 'localhost') { app.setHost(baseHost + ':' + port); } else { app.setHost(baseHost); } console.log("Server started .."); });

 I have highlighted changes made in server.js file as red.

*   Create a new file apiapp.json at root folder

    { "$schema": "http://json-schema.org/schemas/2014-11-01/apiapp.json#", "id": "Bumblebee", "namespace": "microsoft.com", "gateway": "2015-01-14", "version": "1.9.0", "title": "Bumblebee", "summary": "", "author_name": "", "endpoints": { "apiDefinition": "/swagger", "status": null } }

*    Start your nodejs api app in local env by using below command at root folder

    node server.js

check if your api app is up : [http://localhost:1337/](http://localhost:1337/) -\> this url would return a hello world

Api Defination file  : [http://localhost:1337/swagger](http://localhost:1337/swagger)  -\> this url would return json file with swagger spec of app.

Please find more details on creating and deploying Azure API app at below link

[https://azure.microsoft.com/en-us/documentation/articles/app-service-api-nodejs-api-app/](https://azure.microsoft.com/en-us/documentation/articles/app-service-api-nodejs-api-app/)

After deploying your app, you should be able to see app definition in portal as below

![](/media/2019/03/2625.portal_output.JPG)

