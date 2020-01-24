---
title: "Configuring node.js application on Azure App Service with Azure Blob Storage"
categories:
  - Azure App Service Web App
  - Nodejs
  - Configuration
date: 2018-08-30 05:39:51
tags:
author_name: krvillia
header:
    teaser: /assets/images/nodejslogo.png
---

  

In this article, we will learn about configuring the node js applications deployed on Azure App Services with the **Azure blob storage**.

If you would like to store the application logs in a blob storage on azure for the node.js applications, you would need to follow the steps below. It basically includes 2 main steps:

1.  **Enabling from Portal**
2.  **Configuring from the code**

# Enabling from Portal

* Navigate to your webapp from the azure portal

* Choose the Diagnostic Logs blade. For application level logging, choose **Blob storage** as shown below**.** If you would like to choose file system, please check out the blog post [here](/2018/08/03/debugging-node-js-apps-on-azure-app-services/)

[![clip_image002](/media/2018/08/clip_image002_thumb8.jpg "clip_image002")](/media/2018/08/clip_image00210.jpg)

# Configuring from the code

*   In your application, install the packages **winston & winston-azure-blob-transport** by the running the commands below



        npm install winston

        npm install winston-azure-blob-transport

*   Now, use the code below in order to configure them from the application

        var winston = require("winston");

        require("winston-azure-blob-transport");

        var logger = new (winston.Logger)({

            transports: [

            new (winston.transports.AzureBlob)({

                account: {

                name: process.env.ACCOUNT_NAME,

                key: process.env.ACCOUNT_KEY

                },

                containerName: process.env.CONTAINER_NAME,

                blobName: "test.log",

                level: "info"

            })

            ]

        });

        logger.info("Hello!");

*   **test.log** in the above code snippet is the name of the blob where the logs get stored.
*   You would be able to get the **Account name**, **Account key** and the **container name** from the Azure storage account view
*   You would need to make use of **Storage Explorer** in order to check the log file as shown below.

[![clip_image004](/media/2018/08/clip_image004_thumb1.gif "clip_image004")](/media/2018/08/clip_image0041.gif)