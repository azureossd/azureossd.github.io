---
title: "Compression on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Azure App Service Linux
    - Compression
    - Configuration
    - Deployment
    - gzip
categories:
    - Deployment    
    - How-To
    - Configuration
    - Docker
    - gzip
header:
    teaser: "/assets/images/azurelinux.png" 
toc: true
toc_sticky: true
date: 2022-07-13 12:00:00
---

This post will cover content compression on Azure App Service Linux.

By default, compression **is not enabled** on Azure App Service Linux. Therefor it is up to the end-user to enable this, if they desire to do so. 

Two general approaches to enabling compression would be:
- Enabling this on a proxy infront of the application
- Enabling this on the application (through code)

**However, since on App Services we don't expose configuration to any platform components, this would need to be done through application code.** Below are some examples of how to get this started.

## Node
If using Express.js, you can enable this globally for all responses with the [compression](https://www.npmjs.com/package/compression#install) package. This package acts as middleware.

```
app.use(compression());
```

The threshold for compression to be considered by default with this package is **1kb**, this can be increased with the [threshold](https://www.npmjs.com/package/compression#threshold) property. 

After enabling this you should see the `Content-Encoding` header now set to `gzip`.

![Node and gzip compression](/media/2022/07/azure-oss-gzip-node.png)


Example of code that uses this can be found [here](https://github.com/azureossd/gzip-stack-examples/tree/main/node/gzip).

## Dotnet
Compression can be enabled in Dotnet with the following:

```c#
builder.Services.AddResponseCompression(options =>
{
    // Specify a provider to use - we use gzip here
    options.Providers.Add<GzipCompressionProvider>();
    // Needs to be enabled
    options.EnableForHttps = true;
});

var app = builder.Build();

app.UseResponseCompression();
```

This example is with Dotnet 6 and added within `Program.cs`. 

Some points to note are:
- `builder.Services.AddResponseCompression` should be **before** the variable `app` is declared, or else an error may be thrown.
- `app.UseResponseCompression();` is set before `app.UseStaticFiles();`, or else content may not be compressed.
- `options.EnableForHttps` needs to be set to true. If set to `false`, we'll see that the `Content-Encoding` header will never be present and responses may not be compressed.

An example of code can be seen [here](https://github.com/azureossd/gzip-stack-examples/tree/main/dotnet/gzip)

## Java SE
With Spring Boot, compression can be enabled in the `application.properties` or `application.yaml` file.

This example is set as a `.yaml` file:

```yaml
server:
  compression:
    enabled: true
    mime-types: text/html,text/plain,text/css,application/javascript,application/json
    min-response-size: 1024
```

The value of `min-response-size` is set to 1024 bytes before considering to compress a response. 


Example code on how to enable this can be found [here](https://github.com/Ajsalemo/gzip-stack-examples/tree/main/java/gzip).

## Tomcat
Compression is already turned on for Tomcat Blessed Images, which is the exception. The default `server.xml` can be found under `/usr/local/tomcat/conf/server.xml` which has the `compression` setting set to `on`. 

If wanting to disable this, this [blog post on using Tomcat custom installations](https://azureossd.github.io/2022/05/20/Custom-Tomcat-Configuration-on-Azure-App-Service-Linux/index.html) can be used to set this to `off`.

## Python
Using the below example with Flask, this can be enabled with the [flask-compress](https://github.com/colour-science/flask-compress) package.

```python
app = Flask(__name__)
# Set the algoirthm to apply gzip - https://github.com/colour-science/flask-compress#options
app.config['COMPRESS_ALGORITHM'] = 'gzip'
Compress(app)
```

This is now enabled globally for all responses. Like other implementations across different stacks, responses may be considered for compression after hitting a certain size threshold (ex., ~1kb >)

An example of code can be found [here](https://github.com/azureossd/gzip-stack-examples/tree/main/python/gzip).





