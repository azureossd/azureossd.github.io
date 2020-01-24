---
title: " Azure Webapps - Java configurator site extension"
tags:
  - app service
  - azure app service web app
  - Java
  - java configuration
categories:
  - Azure App Service on Windows
  - Java
  - Configuration
date: 2016-05-04 15:29:46
author_name:
---

Azure webapps environment requires certain configuration changes in order to run a Java webapp. It uses IIS module called httpPlatform which acts as proxy to connect to Java process. We can configure various parameters for this module in web.config. Refer - http://www.iis.net/learn/extensions/httpplatformhandler/httpplatformhandler-configuration-reference#\_HttpPlatformHandler\_Configuration for more details. Java configurator site extension provides a convenient way to set the values for some of these configurations. This tool avoids the need to know the configuration syntax and also help in eliminating the manual errors while updating the web.config. Also, this tool does not modify the web.config, but makes changes in the applicationHost.xdt file which will take effect only on manual restart, which can be from the tool, Azure portal or Kudu console's site extension page. Changes to the web.config triggers restart automatically, which may not be desired on production site. This tool make sure you restart the site when you want with your desired configuration changes. [![Capture](/media/2016/05/Capture.png)](/wp-content/uploads/2016/05/Capture.png)