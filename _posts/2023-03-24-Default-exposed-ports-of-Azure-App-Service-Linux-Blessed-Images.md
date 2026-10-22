---
title: "Default exposed ports of Azure App Service Linux Blessed Images"
author_name: "Anthony Salemo"
tags:
    - Azure App Service on Linux
    - Configuration
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-03-24 12:00:00
---

This post will quickly cover the default ports that are exposed on various Azure App Service Blessed Images

# Overview
When deploying your application to Blessed Images - it should be known that these Docker images have already defined listening ports. Depending on the application, you'll need to ensure you are not hardcoding a different port within code - as this port mismatch between what's exposed on the running container and what your application is actually listening on will cause the container to time out on start up, due to this.

# Ports
- **Node**:
    - Port 8080 is the default exposed port for the Node Blessed Image.
    - Unless you're serving static content with the built-in PM2 installation, your Node server must be listening on this port - this can be listened on with the `process.env.PORT` which takes the current port value. Review the public documentation here on this - [Get port number](https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs?pivots=platform-linux#get-port-number)

- **Python**:
    - Port 8000 is the default exposed port for the Python Blessed Image. 
    - Gunicorn is used as the default wSGI server to serve our Python entrypoint - Gunicorn also listens on 8000. 
    - If you're following how we detect Python applications [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md), then you should not need to worry about changing your port.
    - If you're **not** following the default detection method, you should listen for the `PORT` environment variable, with something like `os.environ.get('PORT', 8000)`

- **PHP**:
    - Port 8080 is the default exposed port for the PHP Blessed Image. This uses NGINX by default as the Web Server which serves the deployed PHP files.
    - The legacy Apache-based PHP images also expose port 8080, but switching to them is not recommended.
    - Keep the default NGINX + PHP-FPM variant to serve PHP files.

    > **IMPORTANT:** Do **not** use the `WEBSITES_DISABLE_FPM` App Setting to switch App Service Linux PHP applications to the legacy Apache-based images. **PHP 8.3 is the last version with an Apache variant.** These images are no longer maintained and do **not** receive security updates or CVE backports, including fixes for the critical PHP vulnerabilities [CVE-2026-109618](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w) and [CVE-2026-109619](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp). Use the default **NGINX + PHP-FPM** variant on a supported PHP version with current security fixes. Switching web servers alone is not a substitute for applying fixes. If temporarily unavoidable, restrict legacy Apache usage to a short-term stopgap in an environment that is **both non-production and not publicly accessible**, while migrating to the default variant.

- **.NET**:
    - Port 8080 is the default exposed port for the .NET Blessed Image. This expects a Web Server to be brought with your code (eg., Kestrel)

- **Java SE**:
    - Port 80 is the default exposed port for the Java SE Blessed Image. This expects an embedded Web Server like Tomcat, Jetty, Undertow, etc. to be packaged in the JAR being deployed - the port number is passed to the Web Server through the -Dserver.port setting, which is set as 80. This is default behavior for this image.

- **Tomcat**:
    - Port is 80 the default exposed port for the Tomcat Blessed Image. A WAR or JSP pages can be deployed here - which is what Tomcat will run.

- **Go**:
    - Port is 8080 the default exposed port for the Go Blessed Image (experimental). A Go HTTP Web Server is expected to be brought in the code being deployed. This can be listened on by the application in a ways uch as - `err := http.ListenAndServe(":8080", nil)`

- **Ruby**:
    - Port is 8080 the default exposed port for the Ruby Blessed Image. 

## How to change the exposed port
Adding the App Setting `PORT` to your new value will change the listening port. This will change the port exposed for the container in the `docker run` command.

Assuming the application is listening for the `PORT` environment variable (if applicable), this should be generally fine. If you're hardcoding the value and make this change, your container will likely time out on startup due to the port value mismatch.

See this post - [Whats the difference between PORT and WEBSITES_PORT](https://azureossd.github.io/2023/02/15/Whats-the-difference-between-PORT-and-WEBSITES_PORT/index.html) - for more.
