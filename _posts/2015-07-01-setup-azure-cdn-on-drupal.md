---
title: " Setup Azure CDN on Drupal"
tags:
  - Azure CDN
  - Drupal
categories:
  - PHP
  - Drupal
  - CDN
  - Configuration
  - Performance
date: 2015-07-01 13:57:00
author_name: Yi Wang
---

1\. Create Azure CDN endpoint:

From Azure portal, NEW->APP SERVICES->CDN->QUICK CREATE, select "Web Apps" for "ORIGIN TYPE", select site URL for "ORIGIN URL"

[![](/media/2019/03/5353.create_cdn.PNG)](/media/2019/03/5353.create_cdn.PNG)

CDN endpoint is listed in "CDN" section after created:

[![](/media/2019/03/1586.cdn_endpoint.PNG)](/media/2019/03/1586.cdn_endpoint.PNG)

Note: It takes 60 min to populate the CDN.

2\. Install CDN module on Drupal ([https://www.drupal.org/project/CDN](https://www.drupal.org/project/CDN)), and map to Azure CDN endpoint:

Select "Origin Pull", put the URL of Azure CDN endpoint to "CDN mapping" (note: no trailing / at the end of the URL), save the configuration.

[![](/media/2019/03/8688.cdn_config.PNG)](/media/2019/03/8688.cdn_config.PNG)

3\. To test, open developer tool from browser, check if img/css/js are pulling from Azure CDN endpoint

[![](/media/2019/03/0218.cdn_test.PNG)](/media/2019/03/0218.cdn_test.PNG)

4\. To check CDN integration statistics, turn on "Display statistics" , the result will be displayed for admin login.

[![](/media/2019/03/0243.cdn_statistics.PNG)](/media/2019/03/0243.cdn_statistics.PNG)