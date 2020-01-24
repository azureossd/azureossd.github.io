---
title: "Generating Shared access signature(SAS) on Azure Blob using PHP"
tags:
  - Azure Storage
  - PHP
  - SAS
categories:
  - PHP
  - Blob Storage
date: 2015-05-12 14:33:00
author_name: Prashanth Madi
---

As of 05/2015, Azure sdk for php doesn't support shared access signature(SAS) and this Blog would provide a workaround for it. 

Note : For information on Shared Access Signature visit : <http://azure.microsoft.com/en-us/documentation/articles/storage-dotnet-shared-access-signature-part-1/>

Below details would be required to create a Shared Access Signature(SAS) for blob with read access

\- ACCOUNT\_NAME

\- CONTAINER\_NAME

\- BLOB\_NAME

\- END\_DATE

\- YOUR\_ACCESS\_KEY

You can find more information about above params in my another blog   <http://blogs.msdn.com/b/azureossds/archive/2015/03/30/uploading-files-to-azure-storage-using-sas-shared-access-signature.aspx>

1\) Use Below function to create a shared access signature for blob in storage.

``` {.scroll}
function getSASForBlob($accountName,$container, $blob, $resourceType, $permissions, $expiry,$key)
 {
 
 /* Create the signature */
 $_arraysign = array();
 $_arraysign[] = $permissions;
 $_arraysign[] = '';
 $_arraysign[] = $expiry;
 $_arraysign[] = '/' . $accountName . '/' . $container . '/' . $blob;
 $_arraysign[] = '';
 $_arraysign[] = "2014-02-14"; //the API version is now required
 $_arraysign[] = '';
 $_arraysign[] = '';
 $_arraysign[] = '';
 $_arraysign[] = '';
 $_arraysign[] = '';
 
 $_str2sign = implode("\n", $_arraysign);
 
 return base64_encode(
 hash_hmac('sha256', urldecode(utf8_encode($_str2sign)), base64_decode($key), true)
 );
 }
```

2\) Use Below function to create a signed blob url using shared access signature which was generated from above function

``` {.scroll}
function getBlobUrl($accountName,$container,$blob,$resourceType,$permissions,$expiry,$_signature)
 {
 /* Create the signed query part */
 $_parts = array();
 $_parts[] = (!empty($expiry))?'se=' . urlencode($expiry):'';
 $_parts[] = 'sr=' . $resourceType;
 $_parts[] = (!empty($permissions))?'sp=' . $permissions:'';
 $_parts[] = 'sig=' . urlencode($_signature);
 $_parts[] = 'sv=2014-02-14';
 
 /* Create the signed blob URL */
 $_url = 'https://'
 .$accountName.'.blob.core.windows.net/'
 . $container . '/'
 . $blob . '?'
 . implode('&', $_parts);
 
 return $_url;
 }
```

 Simple test scenario using above two functions

``` {.scroll}
$_signature = getSASForBlob(ACCOUNT_NAME,CONTAINER_NAME,BLOB_NAME,'b','r',END_DATE,YOUR_KEY);
$_blobUrl = getBlobUrl(ACCOUNT_NAME,CONTAINER_NAME,BLOB_NAME,'b','r',END_DATE,$_signature);
```

 

Sample Blob url which I generated using above : https://samplemadi.blob.core.windows.net/samplecontainer/sample.txt?se=2016-10-12&sr=b&sp=r&sig=it0j%2BJIfJK%2FZCn65AoGOHaIxMYamFidkPQroPAQMxwY%3D&sv=2014-02-1.php
