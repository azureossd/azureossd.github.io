---
title: "WordPress MultiSite 404 on Admin Dashboard"
tags:
  - php wordpress
categories:
  - Azure App Service on Windows
  - PHP
  - WordPress
  - Debugging
date: 2016-06-23 09:26:01
author_name: Mangesh Sangapu
---

If you are experiencing a **404** when switching to the dashboard of a given site, verify the web.config is accurate. We've found that _older_ versions of WordPress have incorrect rules within web.config. Try the following web.config:

      <?xml version="1.0" encoding="UTF-8"?>
      <configuration>
      <system.webServer>
      <rewrite>
      <rules>
        <rule name="WordPress Rule 1" stopProcessing="true">
          <match url="^index\\.php$" ignoreCase="false" />
          <action type="None" />
        </rule>
        <rule name="WordPress Rule 2" stopProcessing="true">
          <match url="^(\[_0-9a-zA-Z-\]+/)?wp-admin$" ignoreCase="false" />
          <action type="Redirect" url="{R:1}wp-admin/" redirectType="Permanent" />
        </rule>
        <rule name="WordPress Rule 3" stopProcessing="true">
          <match url="^" ignoreCase="false" />
          <conditions logicalGrouping="MatchAny">
              <add input="{REQUEST_FILENAME}" matchType="IsFile" ignoreCase="false" />
              <add input="{REQUEST_FILENAME}" matchType="IsDirectory" ignoreCase="false" />
          </conditions>
          <action type="None" />
        </rule>
        <rule name="WordPress Rule 4" stopProcessing="true">
          <match url="^(\[_0-9a-zA-Z-\]+/)?(wp-(content|admin|includes).*)" ignoreCase="false" />
          <action type="Rewrite" url="**{R:2}**" />
        </rule>
        <rule name="WordPress Rule 5" stopProcessing="true">
          <match url="**^(\[_0-9a-zA-Z-\]+/)?(.*\\.php)$**" ignoreCase="false" />
          <action type="Rewrite" url="{R:2}" />
        </rule>
        <rule name="WordPress Rule 6" stopProcessing="true">
          <match url="." ignoreCase="false" />
          <action type="Rewrite" url="index.php" />
        </rule>
      </rules>
      </rewrite>
      </system.webServer>
      </configuration>