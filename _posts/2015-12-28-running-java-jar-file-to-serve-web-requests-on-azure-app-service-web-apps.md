---
title: "Running java jar file to serve web requests on Azure App Service Web Apps"
tags:
  - azure java webapp
  - Java
  - java configuration
  - java jar
  - run java jar webapp
  - webapp java
categories:
  - Azure App Service on Windows
  - Java
  - How-To
date: 2015-12-28 15:09:20
author_name: Srikanth S.
---

There are several Java web servers that are supported on Azure App Service Web Apps. But if you have custom code built into a jar which allows it to act as web server, you can accomplish that as well. This blog talks about how we can achieve that. You can accomplish this with any web app from gallery/market place, but in this blog I will start with a blank web app. Below is an screenshot on how to create a blank web app 

[![clip_image001](/media/2015/12/clip_image0014.png "clip_image001")](http://blogs.msdn.com/cfs-file.ashx/__key/communityserver-blogs-components-weblogfiles/00-00-01-70-08-metablogapi/0066.image_5F00_0F550E7D.png) 

Once you have finished creating an empty web app, browse to its kudu console command prompt by accessing [http://yoursitename.scm.azurewebsites.net/DebugConsole](http://yoursitename.scm.azurewebsites.net/DebugConsole) (remember to change yoursitename with the actual site name) and create a directory under d:\\home\\site\\wwwroot. We will name it bin for now. 
![clip_image002](/media/2015/12/clip_image0021.png "clip_image002")

Now we will copy our jar file into the bin folder created above. You can drag drop the jar file into d:\\home\\site\\wwwroot\\bin folder or ftp and copy the jar to d:\\home\\site\\wwwroot\\bin folder. 

![clip_image003](/media/2015/12/clip_image0032.png "clip_image003")

Now we need to setup web.config file to run this jar file. Create a web.config file in d:\\home\\site\\wwwroot folder and add these contents:

     
    <?xml version="1.0" encoding="UTF-8"?>
    
    <configuration>
    
    <system.webServer>
    
    <handlers>
    
    <add name="httpPlatformHandler" path="*" verb="*"
    
    modules="httpPlatformHandler" resourceType="Unspecified" />
    
    </handlers>
    
    <httpPlatform processPath="%ProgramW6432%\Java\jdk1.8.0_60\bin\java.exe"
    
    arguments="-Djava.net.preferIPv4Stack=true -Dport.http=%HTTP_PLATFORM_PORT% -jar &quot;%HOME%\site\wwwroot\bin\demojar.jar&quot;"
    
    stdoutLogEnabled="true"
    
    startupRetryCount='10'>
    
    </httpPlatform>
    
    </system.webServer>
    
    </configuration>
    
    

Make note of these parameters in above code:

1.  processPath: This is where you specify the java executable path. You can use java 7 or 8 which are under %ProgramW6432%\\Java folder.
2.  arguments
    *   port.http which is set to HTTP\_PLATFORM\_PORT. This is where your Java Process will listen on. So you need to change your code to listen on this port.
    *   path for the jar file. This will be the path to where you place the jar file. In our case, we placed it in d:\\home\\site\\wwwroot\\bin.

Also you need to include a MANIFEST.MF file in META-INF folder in your jar file. It should include which class you want to execute. This has to be set to Main-Class parameter. Below is sample code I have for running a simple web server:

    
    package com.msft.demo;
    
    import java.io.*;
    
    import java.net.*;
    
    import com.sun.net.httpserver.*;
    
    public class Demo {
    
    public static void main(String[] args) throws Exception {
    
    // TODO Auto-generated method stub
    
    // port.http is where WebApp will listen for your Java Process
    
    String listenPort = System.getProperty("port.http");
    
    System.out.println("listenPort is " + listenPort);
    
    int port = Integer.parseInt(listenPort);
    
    HttpServer azServer = HttpServer.create(new InetSocketAddress(port), 0);
    
    azServer.createContext("/", new AzHandler());
    
    azServer.setExecutor(null);
    
    azServer.start();
    
    }
    
    static class AzHandler implements HttpHandler {
    
    public void handle(HttpExchange httpExchange) throws IOException {
    
    String response = "Demoing Azure Web Apps Jar Execution";
    
    httpExchange.sendResponseHeaders(200, response.length());
    
    OutputStream os = httpExchange.getResponseBody();
    
    os.write(response.getBytes());
    
    os.close();
    
    }
    
    }
    
    }
    
    

Also here is the sample MANIFEST.MF file for my sample application:

    
    Manifest-Version: 1.0
    
    Main-Class: com.msft.demo.Demo
    

You can also run without a manifest file, but you will need to include the jar in classpath and call out the exact class name with package path to be executed. Once you have configured your web.config and deployed your jar file, you can browse to your site and you should see this message: "Demoing Azure Web Apps Jar Execution" . You can also look into the httpplatform-stdout_*.log file and it should list the port that your Java process is listening on. If you do not want to run a jar file, there are numerous options available on Web Apps to run your java applications. For more information you can go through this article: [https://azure.microsoft.com/en-us/documentation/articles/web-sites-java-get-started/](https://azure.microsoft.com/en-us/documentation/articles/web-sites-java-get-started/)