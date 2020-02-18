---
title: "Using specific IIS Node versions for handling requests to Node Applications - App Services (Windows)"
author_name: "Anand Anthony Francis"
tags:
    - Node.js
    - iisnode
    - iisnode version
    - configuration
    - how to
categories:
    - Azure App Service on Windows
    - Nodejs
    - IISNode
    - Configuration
header:
    teaser: "/assets/images/imagename.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
date: 2020-02-18 23:05:00
---

This article will discuss on how to use a specific version of IISNode for Node Applications running on Azure App Services (windows). This was achieved by pointing to a different version of IISNode and the steps for the same are given below. Though, in addition to the steps, I would like to share the following findings which might help us to understand about IISNode module and how it comes into picture when handling requests specific to Node.

-	Firstly, where we can check the IISNode version today for our App Service?
    If we want to check the IISNode version for our App Service, we can go to the process explorer tab of the respective App Service’s KUDU site and in the “Properties” section of the w3wp.exe process look for “iisnode.dll” under modules tab.

    ![processExplorer](/media/2020/02/processexplorer-properties.jpg)
 
    We can also see the path for this specific module and by default it is “D:\Program Files(x86)\iisnode”. Also we can see that the default version for IISNode as of today is 0.2.27.

-	Where is this iisnode module used for Node specific requests?
    For Node Applications running on Windows, we have a web.config in which under the “handlers” section we specify the module to intercept our Node application specific requests and process them.
    <handlers>
    <!-- Indicates that the server.js file is a node.js site to be handled by the iisnode module -->
    <add name="iisnode" path="index.js" verb="*" modules="iisnode"/>
    </handlers>


-	Where can we get other versions of IISNode ?
    I was able to get the different versions of IIS Node from the following URL:
    https://github.com/Azure/iisnode/downloads

Now, in order to use a different version of IIS Node, the following steps can be taken:

1.	Download the specific Node version that is required from the URL given above and upload it to a custom folder under D:\home.
2.	Create an “applicationHost.xdt” file under “D:/home/site” that can be used to add a module to the default Application Host Configuration for the App Service and add the path to the “iisnode.dll” for the custom IIS Node version that you want to use.
```cli
<?xml version="1.0"?>
<configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
  <system.webServer>
    <globalModules>
        <!--<add name="iisnode" xdt:Locator="Match(iisnode)" xdt:Transform="Remove" />-->
        <add name="iisnode2" image="<your_custom_path>\iisnode.dll" xdt:Locator="Match(name)" xdt:Transform="InsertIfMissing" />
    </globalModules>
  </system.webServer>
  <location path="" xdt:Locator="Match(path)" xdt:Transform="InsertIfMissing">
    <system.webServer xdt:Transform="InsertIfMissing">
      <modules xdt:Transform="InsertIfMissing">
        <add name="iisnode2" xdt:Transform="Insert" />
      </modules>
    </system.webServer>
  </location>
</configuration>
```

3.	Now, we have registered another module – “iisnode2” which is pointing to the specific “iisnode.dll” which we want to use for serving the requests of our Node Application. Though, we also need to tell the Application to use this module which we would do by modifying the “handlers” section in the web.config.
```cli
<handlers>
<!-- Indicates that the server.js file is a node.js site to be handled by the iisnode module -->
<add name="iisnode" path="index.js" verb="*" modules="iisnode2"/>
</handlers>
```

4.	Restart the Application and now, if you check the “modules” for the w3wp.exe process you would see the added iisnode.dll as well.

![updatediisnode](/media/2020/02/updatesiisnode.jpg)
 
5.	To be sure that your Application is using the added IIS Node version, go to the properties of “node.exe” in the process explorer and under “Environment Variables” blade where we would see the setting “IISNODE_VERSION” set to version of “iisnode.dll” added.
