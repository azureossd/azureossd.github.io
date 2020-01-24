---
title: " Use JpGraph library with Azure Web App"
tags:
  - jpgraph
  - PHP
categories:
  - Azure App Service on Windows
  - PHP
  - How-To
date: 2017-09-14 13:26:32
author_name: Yi Wang
header:
    teaser: /assets/images/phplogo.svg
---

JpGraph is a graph creating library for PHP5 and PHP7.0. The library is completely written in PHP and ready to be used in any PHP app. Here is a demo how to use it with web app on azure App Services. 

1. Download JpGraph PHP5 and PHP7 version from [http://jpgraph.net/download/](http://jpgraph.net/download/) (Pro. version require license) 

2. After downloading the library, extract and FTP "src" folder to web app. In this demo, I put it at D:\\home\\site\\wwwroot\\jpgraph 

3. Add the library to include_path in ".user.ini", e.g.

>include_path='.;D:\\home\\site\\wwwroot\\jpgraph\\src'

4. From your PHP script, require the libraries you need, e.g.

        <?php
        // Example for use of JpGraph,
        require_once ('jpgraph.php');
        require_once ('jpgraph_bar.php');

... 5\. Test the sample page, [![](/media/2017/09/jpgraph.png)](/media/2017/09/jpgraph.png)