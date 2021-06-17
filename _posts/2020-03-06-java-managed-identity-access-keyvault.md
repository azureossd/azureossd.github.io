---
title: "Azure webapp access Keyvault secrets with Java and Managed Services Identity"
author_name: "Milind Belhe"
tags:
    - Java # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
categories:
    - Azure App Service on Linux
    - Azure App Service on Windows
    - Azure SDK
    - Java
    - Spring Boot
    - How-to
header:
    teaser: "/assets/images/Javalogo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2020-03-06 08:10:20
---
This document will provide steps and example to access keys and secrets in Azure Keyvault from a Java Webapp using Managed Services Identity.

# To run this sample:

1. In Azure portal for the Webapp, turn on Identity


2. Then navigate to the Keyvault in Azure portal, add new Access policy and select the webapp as Principal.

![Image description](/media/2020/03/mibelhe-access_policy.jpg)

3. Clone this repo locally : https://github.com/milindvb/mbJavaSpringAzureManagedIdentity
4. Edit pom.xml and change the following:

       ```
       <!-- Web App information -->
       <resourceGroup>myspringbootresgrp</resourceGroup>  <--- Change to your resource group
       <appName>myspringbootlinux2</appName>  <-- new or existing app name
       <region>centralus</region>
       ```

5. This sample code will fetch a secret or a key from Azure keyvault and display on the page.
Authentication will be by Managed Services Identity 
In file /src/main/java/com/mibelhe/mbjavajib/PublishController.java
```
           String msiEndpoint =  System.getenv("MSI_ENDPOINT");
           String msiSecret =  System.getenv("MSI_SECRET");
           AppServiceMSICredentials msiCredentials = new AppServiceMSICredentials(AzureEnvironment.AZURE,msiEndpoint, msiSecret);
           KeyVaultClient keyVaultClient = new KeyVaultClient(msiCredentials);
           String secret = keyVaultClient.getSecret("https://mykey.vault.azure.net/","MY-TEST-SECRET").toString();
           String key = keyVaultClient.getKey("https://mykey.vault.azure.net/","myappkey").toString();
           return "my key : "+key;
```

In the above code, replace "mykey" with your vault name and "MY-TEST-SECRET" and "myappkey" with your secret and key names.     


6. Save pom.xml and build using "mvn clean package"
```
$ mvn clean package
[INFO] Scanning for projects...
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] Building sample-code 0.0.1-SNAPSHOT
[INFO] ------------------------------------------------------------------------
[INFO]
[INFO] --- maven-clean-plugin:3.0.0:clean (default-clean) @ mbjavajib ---
[INFO] Deleting /home/mibelhe/mbspringboothello/target
[INFO]
[INFO] --- maven-resources-plugin:3.0.2:resources (default-resources) @ mbjavajib ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] skip non existing resourceDirectory /home/mibelhe/mbspringboothello/src/main/resources
[INFO] skip non existing resourceDirectory /home/mibelhe/mbspringboothello/src/main/resources
[INFO]
[INFO] --- maven-compiler-plugin:3.7.0:compile (default-compile) @ mbjavajib ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 2 source files to /home/mibelhe/mbspringboothello/target/classes
[INFO]
[INFO] --- maven-resources-plugin:3.0.2:testResources (default-testResources) @ mbjavajib ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] skip non existing resourceDirectory /home/mibelhe/mbspringboothello/src/test/resources
[INFO]
[INFO] --- maven-compiler-plugin:3.7.0:testCompile (default-testCompile) @ mbjavajib ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 1 source file to /home/mibelhe/mbspringboothello/target/test-classes
[INFO]
[INFO] --- maven-surefire-plugin:2.21.0:test (default-test) @ mbjavajib ---
[INFO]
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.mibelhe.mbjavajib.AppTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.081 s - in com.mibelhe.mbjavajib.AppTest
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO]
[INFO] --- maven-jar-plugin:3.0.2:jar (default-jar) @ mbjavajib ---
[INFO] Building jar: /home/mibelhe/mbspringboothello/target/mbjavajib-0.0.1-SNAPSHOT.jar
[INFO]
[INFO] --- spring-boot-maven-plugin:2.0.5.RELEASE:repackage (default) @ mbjavajib ---
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 8.918 s
[INFO] Finished at: 2019-10-10T19:36:33+00:00
[INFO] Final Memory: 36M/175M
[INFO] ------------------------------------------------------------------------
```

7. Push to azure using "mvn azure-webapp:deploy"
 ```
 $ mvn azure-webapp:deploy
[INFO] Scanning for projects...
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] Building sample-code 0.0.1-SNAPSHOT
[INFO] ------------------------------------------------------------------------
[INFO]
[INFO] --- azure-webapp-maven-plugin:1.4.0:deploy (default-cli) @ mbjavajib ---
AI: INFO 10-10-2019 19:37, 1: Configuration file has been successfully found as resource
AI: INFO 10-10-2019 19:37, 1: Configuration file has been successfully found as resource
[INFO] Authenticate with Azure CLI 2.0
[INFO] Target Web App doesn't exist. Creating a new one...
[INFO] Creating App Service Plan 'ServicePlan06f8ca2c-1323-1222'...
[INFO] Successfully created App Service Plan.
[INFO] Successfully created Web App.
[INFO] Trying to deploy artifact to myspringbootlinux2...
[INFO] <-- HTTP FAILED: java.net.SocketTimeoutException: timeout
[INFO] Successfully deployed the artifact to https://myspringbootlinux2.azurewebsites.net
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 01:40 min
[INFO] Finished at: 2019-10-10T19:38:38+00:00
[INFO] Final Memory: 45M/206M
[INFO] ------------------------------------------------------------------------
```

8. Browse the app using the url:
 https://myspringbootlinux2.azurewebsites.net/hello?text=world
 

