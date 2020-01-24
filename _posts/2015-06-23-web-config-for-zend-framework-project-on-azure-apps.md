---
title: "web.config for Zend Framework Project on Azure Apps"
tags:
  - PHP
  - Rewrite Rules
  - web.config
  - Zend Framework
categories:
  - PHP
  - Configuration
date: 2015-06-23 07:48:00
author_name: Yi Wang
---

When you deploy Zend Framework project to Azure Apps, the web.config provided by Zend ([http://framework.zend.com/manual/1.12/en/project-structure.rewrite.html](http://framework.zend.com/manual/1.12/en/project-structure.rewrite.html)) maybe not fit. Here is how to modify web.config and configure new application root:

1\. Modify web.config:

      <?xml version="1.0" encoding="UTF-8"?>  
      <configuration>  
          <system.webServer>  
              <rewrite>  
                  <rules>  
                      <rule name="Imported Rule 1" stopProcessing="true">  
                          <match url="^.*$" />  
                          <conditions logicalGrouping="MatchAny">  
                              <add input="{REQUEST_FILENAME}"  
                                   matchType="IsFile" pattern=""  
                                   ignoreCase="false" />

                              <add input="{REQUEST_FILENAME}"  
                                   matchType="IsDirectory"  
                                   pattern=""  
                                   ignoreCase="false" />  
                          </conditions>  
                          <action type="None" />  
                      </rule>  
                      <rule name="Imported Rule 2" stopProcessing="true">  
                          <match url="^.*$" />  
                          <action type="Rewrite" url="/index.php" />  
                      </rule>  
                  </rules>  
              </rewrite>  
          </system.webServer>  
      </configuration>

2\. From "virtual applications and directories" in Azure portal "CONFIGURE" tab, configure web root to site\\wwwroot\\public, this is the application root of Zend Framework project.

    [![](/media/2019/03/0020.zendroot.PNG)](/media/2019/03/0020.zendroot.PNG)

3\. Copy web.config to site\\wwwroot\\public, the same location with index.php and old .htaccess .