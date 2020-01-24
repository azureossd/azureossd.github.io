---
title: "Running Nodejs and php on Same Azure website"
tags:
  - PHP
  - php nodejs
categories:
  - PHP
  - Nodejs
date: 2015-03-23 15:31:00
author_name: Prashanth Madi
---

In this Blog we would try to create a php+nodejs application using iisnode

1\. Create a new azure website:

[![](/media/2019/03/2352.new_azure_website.PNG)](/media/2019/03/2352.new_azure_website.PNG)

**2\. Integrate source control using azure portal**

\- Go to website default page and click on setup deployment from source control

[![](/media/2019/03/2480.git_setup.PNG)](/media/2019/03/2480.git_setup.PNG)

Above step would create a Git repository and you can access its url using Deployments tab.

[![](/media/2019/03/1374.git_url.PNG)](/media/2019/03/1374.git_url.PNG)

3\. [](http://azure.microsoft.com/en-us/documentation/articles/web-sites-nodejs-chat-app-socketio/#download-the-chat-example)Download the chat example
------------------------------------------------------------------------------------------------------------------------------------------------------

For this project, we will use the chat example from the [Socket.IO GitHub repository](https://github.com/Automattic/socket.io). Perform the following steps to download the example and add it to the project you previously created.

1.  Download a [ZIP or GZ archived release](https://github.com/Automattic/socket.io/releases) of the Socket.IO project (version 1.3.5 was used for this document)
    
2.  Extract the archive and copy the **examples\\chat** directory to a new location. For example, **\\node\\chat**.
    

 4\. Include socket.io as dependency in package.json file or replace it with below content

      {
      "name": "socket.io-chat",
      "version": "0.0.0",
      "description": "A simple chat client using socket.io",
      "main": "index.js",
      "author": "Grant Timmerman",
      "private": true,
      "license": "BSD",
      "dependencies": {
      "express": "3.4.8",
      "socket.io": "^1.3.4"
      }
      }

 5\. open index.js at root folder and change line containing  var io = require('../..')(server); to below

      var io =require('socket.io')(server);

6\. insert below content in web.config file at root folder of project

    <?xml version="1.0" encoding="utf-8"?>
    <configuration>
    <system.webServer>
    <!-- Visit http://blogs.msdn.com/b/windowsazure/archive/2013/11/14/introduction-to-websockets-on-windows-azure-web-sites.aspx for more information on WebSocket support -->
    <webSocket enabled="false" />
    <handlers>
    <!-- Indicates that the server.js file is a node.js site to be handled by the iisnode module -->
    <add name="iisnode" path="index.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
    <rules>
    <!-- check if its root url and navigate to default page -->
    <rule name="Index Request" enabled="true" stopProcessing="true">
    <match url="^$" />
    <action type="Redirect" url="/index.php" logRewrittenUrl="true" />
    </rule>
    <!-- Do not interfere with requests for node-inspector debugging -->
    <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
    <match url="^index.js/debug[/]?" />
    </rule>
    <!-- consider whether the incoming URL matches a physical file in the /public folder -->
    <rule name="StaticContent">
    <action type="Rewrite" url="public{REQUEST_URI}"/>
    </rule>
    <!-- All other URLs are mapped to the node.js site entry point -->
    <rule name="DynamicContent">
    <conditions>
    <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
    </conditions>
    <action type="Rewrite" url="index.js"/>
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
    </system.webServer>
    </configuration>

7\. Insert sample php file in public folder to test if it works

      <html>
      <body>
      <?php
      echo "Hello World form php";
      ?>
      <br><br>
      Chat application using nodejs - <a href="http://blogs.msdn.com/index.html">link</a>
      </body>
      </html>

8\. Commit your changes to Azure website using any git client using the git repository url  from deployment tab in Azure portal

Above commit process would also download all the required modules listed in package.json file into node_modules folder.

Php Application : [http://nodephpsample.azurewebsites.net](http://nodephpsample.azurewebsites.net)

chat Application using nodejs : [http://nodephpsample.azurewebsites.net/index.html](http://nodephpsample.azurewebsites.net/index.html)

 Troubleshooting :

1\. Application crashed as /socket.io/socket.io.js is not found

check if socket.io is installed and available in node_modules folder.