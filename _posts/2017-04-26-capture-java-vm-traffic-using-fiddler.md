---
title: " Capture Java VM Traffic using Fiddler"
categories:
  - Azure SDK
  - Java
  - How-To
date: 2017-04-26 12:25:21
tags:
  - Java
author_name: Toan Nguyen
toc: true
toc_sticky: true
---

Customer's using the Azure SDK for Java may need to capture network traffic for the REST API requests to troubleshoot issues. Below are the steps to configure Fiddler and Eclipse to capture the API requests. Telerik provides documentation for configuring your Java app to send traffic to Fiddler available [here](http://docs.telerik.com/fiddler/configure-fiddler/tasks/configurejavaapp), however, additional steps will be need to capture secure traffic which is provided in this article. Other development tools can be used but this article covers Eclipse and IntelliJ IDEA. To use other tools, use the VM arguments described in either the Eclipse or IntelliJ IDEA sections.  

### Prerequisites

  Networking Tracing-   Fiddler - [https://www.telerik.com/download/fiddler](https://www.telerik.com/download/fiddler)  

### Development Tools

  Eclipse - [https://www.eclipse.org/downloads/](https://www.eclipse.org/downloads/) or IntelliJ IDEA Community - [https://www.jetbrains.com/idea/download/](https://www.jetbrains.com/idea/download/)  

### Configuring Fiddler

  By default, Fiddler is not configured to decode any encoded traffic. To enable this feature you can select an encoded request/response and select the "click to decode" message.   

**TIP: Stop capturing of all traffic from Fiddler by pressing f12. All traffic sent from the Java App will still be captured in Fiddler when traffic is sent using the proxy settings. This makes it easier to troubleshoot the requests coming from the app.**   

[![fiddler-decode](/media/2017/04/fiddler-decode.png)](/media/2017/04/fiddler-decode.png) 

You will also need to perform the following.   

1. Select the Tools menu. 
2. Choose Telerik Fiddler Options. 
3. Select the HTTPS tab and check the following

   a) Capture HTTPS CONNECTs
   
   b) Decrypt HTTPS Traffic

    [![fiddler-options](/media/2017/04/fiddler-options.png)](/media/2017/04/fiddler-options.png)   


4. We'll need to export the certificate used by Fiddler to use with Eclipse later. Perform the following.

   a)  Select the "Actions" button.

   b)  Choose "Export Root Certificate to Desktop. Press the OK button.

    [![fiddler-export](/media/2017/04/fiddler-export.png)](/media/2017/04/fiddler-export.png)   

5. To create a keystore with this certificate, perform the following.

   a)  Open the command line as administrator.

   b)  echo %JAVA_HOME%

   c)  Change directories to the variable provided (I.e. C:\\Program Files\\Java\\jdk1.8.0_121 in my case).

   d)  cd bin

   e)  keytool.exe -import -file C:\\Users\\<username>\\Desktop\\FiddlerRoot.cer -keystore FiddlerKeystore -alias Fiddler

   f)  Enter a password and confirm the password.

   g)  Trust this certificate? \[no\]: y

   h)  Example screenshot below.

    [![fiddler-keystore](/media/2017/04/fiddler-keystore.png)](/media/2017/04/fiddler-keystore.png)  

### Configure Eclipse

1. In Eclipse, select the Run menu and choose "Run Configurations". 

    [![eclipse-1](/media/2017/04/eclipse-1.png)](/media/2017/04/eclipse-1.png) 

2. Select your Project and choose the "Arguments" tab. 

3. Enter the following in the VM arguments section.  

        -DproxySet=true 
        -DproxyHost=127.0.0.1 
        -DproxyPort=8888
        -Djavax.net.ssl.trustStore="path\to\java_home\bin\FiddlerKeyStore" 
        -Djavax.net.ssl.trustStorePassword="password_used_during_keystore_creation"

4. Press Apply and Run. 
    [![eclipse-2](/media/2017/04/eclipse-2.png)](/media/2017/04/eclipse-2.png)  

### Configuring IntelliJ IDEA

1. Select the Run menu and choose "Edit Configurations" 

    ![intellij-1](/media/2017/04/intellij-1.png)

2. Select your Java Application on the left and enter the following "VM Options".  

        -DproxySet=true 
        -DproxyHost=127.0.0.1 
        -DproxyPort=8888 
        -Djavax.net.ssl.trustStore="path\to\java_home\bin\FiddlerKeyStore" 
        -Djavax.net.ssl.trustStorePassword="password_used_during_keystore_creation"

3. Press OK, Apply, and Run the App. 

    [![intellij-2](/media/2017/04/intellij-2.png)](/media/2017/04/intellij-2.png)

### Fiddler Capture Examples

1. HTTP 401 response showing the JSON output for the authentication request from the Azure SDK for Java. 

    [![fiddler-sample1](/media/2017/04/fiddler-sample1.png)](/media/2017/04/fiddler-sample1.png)   

2. HTTP 200 with JSON response for a REST API to the Azure Resource Management Service from the Azure SDK for Java 

    [![fiddler-sample2](/media/2017/04/fiddler-sample2.png)](/media/2017/04/fiddler-sample2.png)