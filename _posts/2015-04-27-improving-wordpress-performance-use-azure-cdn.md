---
title: "Use Azure CDN for WordPress site on Azure App"
tags:
  - WordPress Azure CDN
categories:
  - WordPress
  - CDN
date: 2015-04-27 13:15:00
author_name: Yi Wang
---

You can use CDN to store static contents such as images, audios, and files. Speed of fetching from CDN is much faster than access these contents locally. Azure CDN could help to improve performance of your WordPress site running on Azure cloud. In this blog, we will cover how to integrate Azure CDN in WP Super Cache and CDN Enabler.

1\. Create CDN profile:  From NEW, search for CDN

![cdnprofile](/media/2015/04/cdnprofile-192x350.png)

2\. Create CDN Endpoint:  From the CDN profile, click "+Endpoint" to add an endpoint, choose the web site for Origin hostname, e.g.

![cdnendpoint](/media/2015/04/cdnendpoint-193x350.png)

Once the Endpoint is created, you see the \<cdn-endpoint-name\>.azureedge.net running, e.g. 
![cdn](/media/2015/04/cdn-500x281.png)

3. If you have WP Super Cache plugin installed on your WordPress site, you can use WP Super Cache to integrate with Azure CDN:

Edit from WP Super Cache "Settings", select "CDN" tab, put the URL of Azure CDN endpoint in "Off site URL", save the change.

![cdnwpsupercache](/media/2015/04/cdnwpsupercache-500x254.png)

Check from developer tool, you should see js/css/images loaded from CDN endpoint, for example:

![cdnjs](/media/2015/04/cdnjs-500x241.png)
 

4\. [CDN Enabler](https://wordpress.org/plugins/cdn-enabler/) is another good tool, while you install and activate this plugin, put your CDN endpoint in CDN URL, save it,

![cdnenabler](/media/2015/04/cdnenabler-500x330.png)

Use developer tool in your browser to validate that CDN is working.

 

5\. Removing CDN - You can disconnect Azure CDN from WordPress easily by removing the link from your plugin when the CDN is not needed. Delete the CDN endpoint from your Azure portal after you disconnect it from WordPress.
