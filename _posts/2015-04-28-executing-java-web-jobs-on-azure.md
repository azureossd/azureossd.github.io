---
title: " Executing Java Web Jobs on Azure"
tags:
  - azure
  - Java
  - java configuration
  - WebJob
categories:
  - Java
  - WebJob
date: 2015-04-28 14:48:00
author_name: Prasad K.
---

To execute the Java web jobs on Azure, follow the below steps :

 

1\. Open Eclipse and create a Java Project and Java program for your application in your eclipse workspace.

![](/media/2019/03/3175.New%20Java%20Project.JPG)

 

2\. After creating your application, create a batch file with following text -
![](/media/2019/03/8637.Batch%20Instructions.JPG)
 

 

    set PATH=%PATH%;%JAVA\_HOME%/bin
    java <Your Main Class name>

3\. Bundle the batch file and your class files in a compressed zip file.

4\. Create a Web App on Azure portal and upload your zip file to Azure using the steps mentioned at  -

<http://azure.microsoft.com/en-us/documentation/articles/web-sites-create-web-jobs/>

You can set the desired execution frequency for the web job as mentioned in the above blog.  
