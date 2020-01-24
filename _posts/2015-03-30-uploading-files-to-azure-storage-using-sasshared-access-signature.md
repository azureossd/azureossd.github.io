---
title: "Uploading files to Azure Storage using SAS(shared access signature) - Python"
tags:
  - python
  - SAS
categories:
  - Python
date: 2015-03-30 14:13:00
author_name: Prashanth Madi
---

For information on Shared Access Signature visit : http://azure.microsoft.com/en-us/documentation/articles/storage-dotnet-shared-access-signature-part-1/ 

This Blog would help you upload images into azure storage using Azure SDK(Python). 

1) Download Azure python SDK - [https://github.com/Azure/azure-sdk-for-python](https://github.com/Azure/azure-sdk-for-python) 

2) Create a storage in Azure portal and make note of account name, access key and storage url.   

[![](/media/2019/03/6303.access%20key.jpg)](/media/2019/03/6303.access%20key.jpg) 

[![](/media/2019/03/6433.storage_account_name.PNG)](/media/2019/03/6433.storage_account_name.PNG) 

3) Create a new container inside storage and make a note of container name. 

4) Use below code along with azure sdk downloaded in step 1 to generate SAS  

5) Use Below code to upload content to blob  

        import urllib2
        def put_blob(storage_url,container_name, blob_name,qry_string,x_ms_blob_type):
        opener = urllib2.build_opener(urllib2.HTTPHandler)
        request = urllib2.Request(storage_url+container_name + '/' + blob_name+'?'+qry_string, data='Hello World!!')
        request.add_header('x-ms-blob-type', x_ms_blob_type)
        request.get_method = lambda: 'PUT'
        opener.open(request)

  ## uploading a sample blob to azure storage put\_blob(STORAGE\_URL,CONTAINER\_NAME,"sample.txt",sas\_url,"BlockBlob")   

[![](/media/2019/03/8662.uploaded_file.PNG)](/media/2019/03/8662.uploaded_file.PNG) Special Thanks to @laurent for helping me fix this issue : https://github.com/Azure/azure-sdk-for-python/issues/651