---
title: " Magento Web.Config for Azure and IIS"
tags:
  - .htaccess
  - azure
  - azure app service web app
  - iis
  - Magento
  - PHP
  - web.config
categories:
  - PHP
  - Magento
date: 2015-05-01 09:12:00
---

After installing Magento on Azure, here is the web.config file that should be within the wwwroot folder.

* * *

      <?xml version="1.0" encoding="UTF-8"?>   
      <configuration>   
          <system.webServer>   
              <rewrite>   
                  <rules>   
                     <!--## rewrite API2 calls to api.php (by now it is REST only)-->   
                     <rule name="Rewrite API2 calls to api.php" stopProcessing="true">   
                       <match url="^api/rest" ignoreCase="false" />   
                       <action type="Rewrite" url="api.php?type=rest" appendQueryString="true" />   
                     </rule>

                     <!--## HTTP_author_nameIZATION variable removed—>  
                     <rule name="TRACE and TRACK HTTP methods" stopProcessing="true">   
                       <match url=".*" ignoreCase="false" />   
                       <conditions>   
                         <!--## TRACE and TRACK HTTP methods disabled to prevent XSS attacks-->   
                         <add input="{REQUEST_METHOD}" pattern="^TRAC\[EK\]" ignoreCase="false" />   
                       </conditions>   
                       <action type="Redirect" redirectType="Temporary" url="{R:0}" />   
                     </rule>

                     <!--## rewrite everything else to index.php-->   
                     <rule name="Rewrite everything to index.php" stopProcessing="true">   
                         <match url=".*" ignoreCase="false" />   
                         <conditions>  
                         <add input="{URL}" pattern="^/(media|skin|js)/" ignoreCase="false" negate="true" />  
                         <add input="{REQUEST_FILENAME}" matchType="IsFile" ignoreCase="false" negate="true" />   
                         <add input="{REQUEST_FILENAME}" matchType="IsDirectory" ignoreCase="false" negate="true" />   
                         <!\-\- Symbolic link filetype does not exists in Windows/IIS -->   
                       </conditions>   
                       <action type="Rewrite" url="index.php" />   
                     </rule>   
                    </rules>   
              </rewrite>      
          </system.webServer>   
      </configuration>

* * *

There are multiple ways to upload the web.config file to the wwwroot folder.

Here is an example using Microsoft WebMatrix:

**1) Launch WebMatrix and connect to your Magento site**

> ![](/media/2019/03/2022.2015-05-01%2010_51_27-Quick%20Start%20-%20Microsoft%20WebMatrix.png)

**2) Your file structure will look something like this**

> ![](/media/2019/03/3513.2015-05-01%2010_52_11-[REMOTE]%20mangesh-magento%20-%20Microsoft%20WebMatrix.png)
> 
> If web.config already exists, you may not need to complete these steps. If you are certain that you want to overwrite this file. As a general rule of thumb, make a backup of existing web.config file.

**3) Add a new file and name it web.config**

> ![](/media/2019/03/6332.2015-05-01%2010_54_29-Greenshot.png)

> ![](/media/2019/03/8321.2015-05-01%2010_54_59-[REMOTE]%20mangesh-magento%20-%20Microsoft%20WebMatrix.png)

**4) Copy-paste the web.config text from above**

> ![](/media/2019/03/3301.2015-05-01%2010_55_59-[REMOTE]%20mangesh-magento%20-%20Microsoft%20WebMatrix.png)

**5) Test the site by clicking ‘Run’**

> ![](/media/2019/03/7411.2015-05-01%2010_56_22-[REMOTE]%20mangesh-magento%20-%20Microsoft%20WebMatrix.png%20)

If your page loads, then we know that our web.config has been installed without errors.

![](/media/2019/03/2860.2015-05-01%2011_10_19-Home%20page%20-%20Internet%20Explorer.png)