---
title: " Azure SDK for PHP: Updating Blob Properties"
tags:
  - Azure sdk
  - blob
  - cache
  - options
  - PHP
  - properties PHP Troubleshooting
url: 1703.html
author_name: Mangesh Sangapu
id: 1703
categories:
  - PHP
  - Azure SDK
  - Blob Storage
  - How-To
date: 2016-03-25 10:02:45
---

Here is sample code to update Blob Properties using Azure SDK for PHP.

This code will traverse through all the blobs within the specified container and update the cache-control to "public, max-age=604800".

------------------------------------------------------------------------

    define("__BLOBNAME__", "name");
    define("__CONTAINERNAME__", "container");
    define("__BLOBKEY__", "key");

    require_once('WindowsAzure\WindowsAzure.php');
    use WindowsAzure\Common\ServicesBuilder;
    use WindowsAzure\Common\ServiceException;
    use WindowsAzure\Common\CloudConfigurationManager;
    use WindowsAzure\Blob\Models\Block;
    use WindowsAzure\Blob\Models\CreateContainerOptions;
    use WindowsAzure\Blob\Models\ListContainersOptions;
    use WindowsAzure\Blob\Models\CreateBlobOptions;
    use WindowsAzure\Blob\Models\CommitBlobBlocksOptions;

    use WindowsAzure\Blob\Models\BlobProperties;


    $connectionString = "DefaultEndpointsProtocol=http;AccountName=" . __BLOBNAME__ . ";AccountKey=" . __BLOBKEY__ . "";

    if (null == $connectionString || "" == $connectionString) {
        echo "Did not find a connection string whose name is 'StorageConnectionString'.";
        exit();
    }

    // Create blob REST proxy.
    $blobRestProxy = ServicesBuilder::getInstance()->createBlobService($connectionString);

    try {
        // List blobs.
        $blob_list = $blobRestProxy->listBlobs(__CONTAINERNAME__);
        $blobs = $blob_list->getBlobs();
        
        // iterate over blobs
        foreach ($blobs as $blob) {
            $options = new WindowsAzure\Blob\Models\CreateBlobOptions();
            $options->setBlobCacheControl("public, max-age=604800");
            echo 'setting ... ';
            $blobRestProxy->setBlobProperties(__CONTAINERNAME__,$blob->getName(), $options);
        }
        
    } catch (ServiceException $e) {
        // Handle exception based on error codes and messages.
        // Error codes and messages are here:
        // http://msdn.microsoft.com/library/azure/dd179439.aspx
        $code = $e->getCode();
        $error_message = $e->getMessage();
        echo $code . ": " . $error_message;
    }

------------------------------------------------------------------------
