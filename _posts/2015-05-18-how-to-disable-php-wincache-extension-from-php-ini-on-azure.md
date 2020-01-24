---
title: "How to disable php wincache extension from php.ini on Azure"
tags:
  - PHP
  - php.ini wincache azure
categories:
  - PHP
date: 2015-05-18 07:58:00
---


To disable a PHP extension, such as wincache.dll, you will need to modify php.ini, here are the steps how to do it:

(Reference https://github.com/projectkudu/kudu/wiki/Xdt-transform-samples#using-a-custom-phpini )

1. Create “applicationhost.xdt” file at “d:\home\site”,

2. Copy the content to applicationhost.xdt (see from the above link)

        <?xml version=“1.0“?> 
        <configuration xmlns:xdt=“http://schemas.microsoft.com/XML-Document-Transform“> 
        <system.webServer> 
            <fastCgi>
            <application fullPath=“D:\Program Files (x86)\PHP\v5.x\php-cgi.exe“ xdt:Locator=“Match(fullPath)“>
                <environmentVariables>
                <environmentVariable name=“PHPRC“ xdt:Locator=“Match(name)“ value=“d:\home\site\php.ini“ xdt:Transform=“SetAttributes(value)“ />
                </environmentVariables>
            </application>
            </fastCgi>
        </system.webServer> 
        </configuration>
3. Find your PHP version from kudu debug console, copy default php.ini to “d:\home\site”, location of default php.ini  is “D:\local\Config\PHP-5.x.xx”

![](/media/2019/03/6445.kudu-02.PNG)

4.  Edit your local “d:\home\site\php.ini”, search for wincache and comment/remove all wincache  related  directives.

5. Cleanup .user.ini, remove the directives that disable wincache cache options if there is any.

6. Restart the site, check from phpinfo, validate custom PHP runtime

 

**Note: Match youe PHP version with "v5.x" and "v5.x.xx".**
