---
title: "Azure Web App with AngularJs and NodeJs Apps on Same Instance"
tags:
  - AngularJs
  - nodejs
  - WAWS
  - Web Apps
  - web.config
categories:
  - Azure App Service on Windows
  - Nodejs
  - AngularJs
  - How-To
  - Configuration
date: 2015-12-03 12:41:00
author_name: prmadi
---

In my previous [Blog](../2015/11/29/creating-an-angular-js-spa-single-page-applicaiton-with-routes-on-azure-webapps.html "Blog"), I have wrote on hosting AngularJs app in Azure Web App. This post would provide details on how to host AngularJs App on a web app instance aside of NodeJs App.

 Code available on github @ [https://github.com/prashanthmadi/azure-nodejs-angular](https://github.com/prashanthmadi/azure-nodejs-angular "https://github.com/prashanthmadi/azure-nodejs-angular")

1) Install express-generator at global level, we would use this to create express(nodeJs web framework) templates.

    npm install -g express-generator

![](/media/2019/03/0028.1.PNG)

2) Use express cli to create a express template app

    express .

![](/media/2019/03/6710.2.PNG)

3) Install required modules using below command

    npm install

 ![](/media/2019/03/2480.3.PNG)

4) Use below command to start the app on local server and check if template app is working on local environment.

    npm start

5) Move your code to azure web app after adding below web.config file at root folder

        <?xml version="1.0" encoding="utf-8"?>
        <!--
        This configuration file is required if iisnode is used to run node processes behind
        IIS or IIS Express. For more information, visit:
        
        https://github.com/tjanczuk/iisnode/blob/master/src/samples/configuration/web.config
        -->
        
        <configuration>
        <system.webServer>
        <!-- Visit http://blogs.msdn.com/b/windowsazure/archive/2013/11/14/introduction-to-websockets-on-windows-azure-web-sites.aspx for more information on WebSocket support -->
        <webSocket enabled="false" />
        <handlers>
        <!-- Indicates that the server.js file is a node.js site to be handled by the iisnode module -->
        <add name="iisnode" path="bin/www" verb="*" modules="iisnode"/>
        </handlers>
        <rewrite>
        <rules>
        <!-- First we consider whether the incoming URL matches a physical file in the /public folder -->
        <rule name="StaticContent">
        <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        
        <!-- All other URLs are mapped to the node.js site entry point -->
        <rule name="DynamicContent">
        <conditions>
        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
        </conditions>
        <action type="Rewrite" url="bin/www"/>
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

6) Check if your app is still working on azure.

7) Change app.js file at root folder to set appropriate routes as below. Order of below routes is important (all the url's except for /users are getting routed to index.js/jade file which would load AngularJS Code)

``` {.scroll}
app.use('/users', users);
app.use('/*', routes);
```

8)  Change views/index.jade file to below content. [Red] part is to add ng-app div, [Blue] part is to add required AngularJs files, [Green] part would be used to insert templates based on incoming url.

          extends layout

          block content
               div(ng-app='giveCampaign')
               h1= title
               ul
               li
               a(href='/donarlist') Donar lists
               li
               a(href='/receivertrans') Receivers
               div(ng-view)
               script(src='js/angularmodules/angular.min.js')
               script(src='js/app.js')
               script(src='js/angularmodules/angular-route.min.js')

9) Add required Templates and AngularJs files in public folder @ <https://github.com/prashanthmadi/azure-nodejs-angular/tree/master/public>

10) For more details on individual templates/JS files, please refer <http://blogs.msdn.com/b/azureossds/archive/2015/11/29/creating-an-angular-js-spa-single-page-applicaiton-with-routes-on-azure-webapps.aspx>

11) Below are final output screenshots

\- Web App serving Node.js content at '/users' url

![](/media/2019/03/1256.Screen%20Shot%202015-12-06%20at%208.10.42%20PM.png)

\- Web App serving AngularJs content in all other url's

/receivertrans

![](/media/2019/03/6201.Screen%20Shot%202015-12-06%20at%208.10.16%20PM.png)

/donarlist

![](/media/2019/03/4130.Screen%20Shot%202015-12-06%20at%208.10.06%20PM.png)