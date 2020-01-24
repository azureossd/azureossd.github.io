---
title: " Accessing storage blob using SAS with Java"
tags:
  - Azure Storage
  - blob
  - Java
  - java configuration
  - SAS
categories:
  - Java
  - How-To
  - Blob Storage
date: 2016-08-15 18:13:04
author_name: Prasad K.
---

    In order to access your storage blob using SAS with Java, please follow below steps -   

1. Configure the SAS access service in your Blob for your storage account. Navigate to Shared access signature setting as shown below - 

    [![image002_20160701-212525-212522_1](/media/2016/08/image002_20160701-212525-212522_1_thumb.png "image002_20160701-212525-212522_1")](/media/2016/08/image002_20160701-212525-212522_1.png)   

2. Copy the Blob Service SAS URL. (This is required to access the blob) 

3. Access your Blob in your Java code as shown in below snippet -                                  

        try {
            HttpURLConnection httpClient = (HttpURLConnection) new URL(Copy Blob service SAS URL with container).openConnection();
            httpClient.setRequestMethod(“PUT”);
            httpClient.setDoOutput(true);
            httpClient.setRequestProperty(“x-ms-blob-type”, “BlockBlob”);
            OutputStreamWriter out = new OutputStreamWriter(httpClient.getOutputStream());
            out.write(“This is test”);
            out.close();
            httpClient.getInputStream();                                            
          } catch (MalformedURLException e) {
          // TODO Auto-generated catch block
            e.printStackTrace();
          } catch (IOException e) {
        // TODO Auto-generated catch block
          e.printStackTrace();
          }


                 
**Where –**

storageurl = “https://&lt;storage_account_name>.blob.core.windows.net/&lt;container_name>/“+file.name+“sas_content“