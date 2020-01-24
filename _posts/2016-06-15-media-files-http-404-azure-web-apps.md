---
title: " Media Files - HTTP 404 - Azure App Service on Windows"
categories:
  - Azure App Service on Windows
  - Joomla
  - PHP
  - Configuration
date: 2016-06-15 19:29:47
tags:
author_name: Toan Nguyen
header:
    teaser: /assets/images/MS-IIS.png
---

You've uploaded a media file to your /media site and attempt to access the files URL but receive a HTTP 404 error.  You check to make sure that the file is in the correct directly but the error continues to be displayed.  This can occur if the type of file you are attempting to access is not part of the default list of MIME types on IIS.  You can modify the web.config file in your wwwroot directory to add the file extension and type of application associated with the file. 

**Sample Configuration**

    <configuration>
       <system.webServer>
             <staticContent>
                <remove fileExtension=".woff" />
                <remove fileExtension=".woff2" />
                <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
                <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
                <mimeMap fileExtension=".mp4" mimeType="video/mp4" />
                <mimeMap fileExtension=".webm" mimeType="video/webm" />
                <mimeMap fileExtension=".ogv" mimeType="video/ogg" />
             </staticContent>
       </system.webServer>
    </configuration>

A list of media types can be found at [http://www.iana.org/assignments/media-types/media-types.xhtml](http://www.iana.org/assignments/media-types/media-types.xhtml)