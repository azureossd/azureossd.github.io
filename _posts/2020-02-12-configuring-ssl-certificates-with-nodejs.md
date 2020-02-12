---
title: "Configuring SSL Certificates with nodejs"
author_name: "Edison Garcia"
tags:
    - Nodejs
    - Azure VM
    - Express
    - Configuration
    - How-To
date: 2020-02-12 02:40:00
tags:
header:
    teaser: "/assets/images/nodelinux.png" 
---
## How to configure a SSL Certificate for NodeJS

In specific scenarios you are looking for creating a https server within nodejs as described in the following reference: [Https Server](https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/)

You will need at least a self signed certificate for dev/test into localhost or one signed by a 'Certificate Authority'.
In this example we are going to use one is signed by CA bought from GoDaddy and setup everything inside a Linux VM.

## First Step

1. In your Linux VM ssh session, you can use openssl to create the csr (Certificate signing request) with the following command:

```bash
openssl req -new -newkey rsa:2048 -nodes -keyout yourdomainname.key -out yourdomainname.csr
```

2. You will need to update the required information and for your fully-qualified domain name just put your custom domain or wildcard if you are using one.
3. Once the .csr is generated, you can open this file and copy the content and go your SSL certificate provider and find the CSR part to paste it. In some SSL providers you need to setup the common name in their website as well.

In this example I am using GoDaddy since I have one already there.
![GoDaddyCSR](/media/2020/02/edisga-godaddy-csr.png)

4. After get the ssl certificate, you can download and select the type of servers, try to select other types, we will not use nginx or apache here.
[GoDaddyCSR](/media/2020/02/edisga-godaddy-downloadssl.png)

5. Most SSL providers will provide the following structure, where you can have the certificate (.crt) and (pem) and the bundle where is the intermediate certificate used as proxy for root CA.
[GoDaddyCSR](/media/2020/02/edisga-godaddy-sslstructure.png)

6. Copy these files to your app location and you can use the following code, this is just an example , basically you will use the generated key from step 1, the crt and gd(bundle) as a ca:

```bash
var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var server = express();
var port = process.env.PORT || 3001;

var sslOptions = {
    key: fs.readFileSync('certificates/domainname.key','utf8'),
    cert: fs.readFileSync('certificates/domainname.crt','utf8'),
    ca: fs.readFileSync('certificates/domainname-ca.crt','utf8'),
  };

server.get('/', function (req, res) {
    res.send("Hello World!");
});

https.createServer(sslOptions, server).listen(port);
```

**This should work at this point. Note: There are some conditions where nodejs requires to separate the gd bundle into different files as following:

```bash
var sslOptions = {
    key: fs.readFileSync('certificates/domainname.key','utf8'),
    cert: fs.readFileSync('certificates/domainname.crt','utf8'),
    ca: [
        fs.readFileSync('certificates/domainname-gd1.crt','utf8'), 
        fs.readFileSync('certificates/domainname-gd2.crt','utf8'),
        fs.readFileSync('certificates/domainname-gd3.crt','utf8')
    ]
  };
```

Additional Reference can be found [Here](https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/)
