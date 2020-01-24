---
title: "Uploading Images to Azure Storage from AngularJS App"
tags:
  - AngularJs
  - Azure Storage
  - CORS
categories:
  - AngularJs
  - CORS
  - How-To
date: 2016-06-29 14:00:36
author_name: Prashanth Madi
header:
    teaser: /assets/images/angular.png
---

Azure Storage is the cloud storage solution for modern applications that rely on durability, availability, and scalability to meet the needs of their customers. 

More Info : [https://azure.microsoft.com/en-us/documentation/articles/storage-python-how-to-use-blob-storage/](https://azure.microsoft.com/en-us/documentation/articles/storage-python-how-to-use-blob-storage/) 

I had a few customers  asking how to create an application that can upload images from AngularJS without a backend App, so I decided to go ahead and create a sample application with this implementation

*   Navigate to portal and create a new storage account

[![cors7](/media/2016/06/cors7-1024x520.png)](/media/2016/06/cors7.png)

*   Create a container and provide required access level

[![cors8](/media/2016/06/cors8-1024x326.png)](/media/2016/06/cors8.png)

*   Copy Access Key from portal

[![cors9](/media/2016/06/cors9.png)](/media/2016/06/cors9.png) Make a note of  below items during above steps

1.  Storage account name
2.  Container name
3.  Access Key

*   Create an Azure Web App - Optional Steps (if you are using Azure Web Apps) [![cors1](/media/2016/06/cors1.png)](/media/2016/06/cors1.png)
*   I'm using Visual Studio online for convenience here but you may choose other options of development/deployment processes. [![cors2](/media/2016/06/cors2-1024x335.png)](/media/2016/06/cors2.png)
*   I used ng-file-upload for this sample app but there are other great modules to upload images from angular app to remote servers. [https://github.com/danialfarid/ng-file-upload](https://github.com/danialfarid/ng-file-upload)
*   Click on Open console option in left of visual studio online and enter below command to install ng-file-upload module `npm install ng-file-upload`

[![cors3](/media/2016/06/cors3.png)](/media/2016/06/cors3.png)

*   Replace content in hostingstart.html file with below content.

*   Change the values in storage url appropriately

**storageurl = "https://&lt;storage\_account\_name>.blob.core.windows.net/&lt;container_name>/"+file.name+"sas_content"** 

For More Details on Blob upload API Refer : [https://msdn.microsoft.com/en-us/library/azure/dd179451.aspx](https://msdn.microsoft.com/en-us/library/azure/dd179451.aspx) You can get sas_content using below python script. 

*   Most probably you would end up with below error while uploading the file

`XMLHttpRequest cannot load https://prmadisampletest.blob.core.windows.net/samplecontainer/8.jpg?sr=c&s…Nqb6zHI4dfgDJhNtksGYiCu2rFLtk%3D&sv=2015-07-08&se=2016-10-07T16%3A33%3A35Z. Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://azure-storage-sample.azurewebsites.net' is therefore not allowed access. The response had HTTP status code 403.` [![cors4](/media/2016/06/cors4.png)](/media/2016/06/cors4.png) 

CORS is an HTTP feature that enables a web application running under one domain to access resources in another domain. Web browsers implement a security restriction known as [same-origin policy](http://www.w3.org/Security/wiki/Same_Origin_Policy) that prevents a web page from calling APIs in a different domain. 

More info : [https://msdn.microsoft.com/en-us/library/azure/dn535601.aspx](https://msdn.microsoft.com/en-us/library/azure/dn535601.aspx) 

Run Below python script by setting proper details for below ACCOUNT\_NAME ="XXXXX" ACCOUNT\_KEY ="XXXXX" CONTAINER_NAME='XXXXX'  You should see images uploading successfully now. AngularJs App UI : 

[![cors5](/media/2016/06/cors5.png)](/media/2016/06/cors5.png) 

Portal with newly uploaded file in container : [![cors6](/media/2016/06/cors6.png)](/media/2016/06/cors6.png)   

Troubleshoot : **How to run above Python Scripts ?**

*   Refer below link to install python and Azure python SDK
    *   [https://azure.microsoft.com/en-us/documentation/articles/python-how-to-install/](https://azure.microsoft.com/en-us/documentation/articles/python-how-to-install/)
*   use below command to run python script > python script_file.py

  Update 12/1/2016  :  Now you can add CORS settings from Azure Storage Explorer https://azure.microsoft.com/pt-br/blog/microsoft-azure-storage-explorer-november-update/