---
title: " Migrate WordPress content to Azure blob storage"
tags:
  - Blob Storage
  - Wordpress
categories:
  - Azure App Service on Windows
  - WordPress
  - Blob Storage
  - Performance
date: 2017-06-21 11:23:44
author_name: Yi Wang
---

Azure storage provides solution for applications requiring scalable, durable, and highly available storage for their data. In this blog, we cover the steps how to migrate existing WordPress content from file system to Azure blob storage. 

1. Create storage blob Create an Azure storage account 

    [![](/media/2017/06/storage1-500x198.png)](/media/2017/06/storage1.png) 

   Create blob storage 

    [![](/media/2017/06/storage2-500x264.png)](/media/2017/06/storage2.png) 

   Create a blob container to store the images 

    [![](/media/2017/06/newblob-500x331.png)](/media/2017/06/newblob.png)   

2. Install "Windows Azure Storage for WordPress" plugin from [https://wordpress.org/plugins/windows-azure-storage/](https://wordpress.org/plugins/windows-azure-storage/) Once this plugin is installed, test to upload a image to Azure blob storage, you can detect the file path, and follow the same path structure when moving existing content files to blob storage. The path will be like this, [![](/media/2017/06/wordpress-content-500x157.png)](/media/2017/06/wordpress-content.png)   

3. Upload wp-content to Azure storage To upload files to Blob storage, you can launch storage explorer from Azure portal, [![](/media/2017/06/enable-storage-explorer-500x154.png)](/media/2017/06/enable-storage-explorer-1.png)   Azcopy is command line tool to download/upload files to Blob storage, to upload files,

        AzCopy /Source:C:\\myfolder /Dest:https://myaccount.blob.core.windows.net/mycontainer /DestKey:key /S

   (Specifying option /S uploads the contents of the specified directory to Blob storage recursively, meaning that all subfolders and their files will be uploaded as well.) 

   Refer to the document [https://docs.microsoft.com/en-us/azure/storage/storage-use-azcopy](https://docs.microsoft.com/en-us/azure/storage/storage-use-azcopy) 

4. Modify WordPress content URLs, point to the content in azure storage There are few ways to update content links. For example, use "Velvet Blues Update URLs" plugin in this blog, [https://wordpress.org/plugins/velvet-blues-update-urls/](https://wordpress.org/plugins/velvet-blues-update-urls/) File path on file system is &lt;site-url>/media (the old URL) From "Velvet Blues Update URLs" plugin, replace it by &lt;storage-url>/&lt;container-name> (the new URL) E.g. [![](/media/2017/06/velvet-blues-1-500x345.png)](/media/2017/06/velvet-blues-1.png) 


5. Test from from web app - Find an image from an article, the URL is pointing to blog storage now [![](/media/2017/06/test-blob-500x140.png)](/media/2017/06/test-blob.png)