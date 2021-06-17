---
title: "Loading and accessing certificates in node.js on Azure App Service"
author_name: "Karthik"
tags:
    - node.js
    - certificate
categories:
    - Azure App Service
    - Azure function app # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Node.js # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/App-Services.svg" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2021-02-03 12:00:00
---

## About

This how-to guide shows accessing private certificates/Public certificates in your node.js application running on Azure App Services.

## Loading certificates 

1. In the Azure portal, from the left menu, select App Services > app-name.

2. From the left navigation of your app, select TLS/SSL settings > Private key certificates (.pfx)/Public key certificates (.cer) > Upload Certificate.

   ![Upload certificate to Azure](/media/2021/02/upload-private-cert.png)

3. Before we try to access the certificate through code we need to make the uploaded certificates accessible to the app service by adding `WEBSITE_LOAD_CERTIFICATES` app setting. This article outlines steps to [Make the certificate accessible](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-certificate-in-code#make-the-certificate-accessible)


## Accessing the certificate through code

The below is the code where you can fetch the private/public certificates that you have uploaded in a programmatic manner using node.js on Windows App Service. We will be using NPM package 'win-ca' for simplicity.

```javascript
const http = require('http');
const ca = require('win-ca');

// Create an instance of the http server to handle HTTP requests
let app = http.createServer((req, res) => {

// Set a response type of plain text for the response
res.writeHead(200, { 'Content-Type': 'text/plain' });

let certificates = []

// Fetch all certificates in PEM format from My store
ca({
    format: ca.der2.pem,
    store: ['My'],
    ondata: crt => certificates.push(crt)
})

// Send back a response and end the connection
  res.end("Certificate count under 'My' store is: " + certificates.length);
});

let port = process.env.PORT || 3000;

// Start the server on port 3000
app.listen(port);
```

You can refer the following [documentation](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-certificate-in-code#load-certificate-in-linuxwindows-containers) to access the thumbprint on Linux and Windows container App Services.

