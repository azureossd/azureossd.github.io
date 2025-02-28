---
title: "Avoiding hardcoding Java or Tomcat versions on Windows App Service"
author_name: "Anthony Salemo"
tags:
    - Java
    - Configuration
categories:
    - Azure App Service on Windows # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/javawindows.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: false
toc_sticky: true
date: 2025-02-28 12:00:00
---

This post covers information on why to avoid hardcoding Java or Tomcat versions in web.config's with Java on Windows App Service.

# Overview
This post is specifically about using `web.config` and pointing to a hardcoded location for Java or Tomcat through `processPath` (eg. `C:\Program Files\Java\microsoft-jdk-17.0.13.11\bin\java.exe`). The theme that may happen is that after a platform upgrade, an application may see an error stating `The specified CGI application encountered an error and the server terminated the process`, and the application is failing to start. More commonly, this is due to the specific version being targetted has been updated, and the previous installation no longer exists.

> **NOTE**: The error `The specified CGI application encountered an error` is a general error, but is typically one that may be associated with this issue. However, this can happen in any number of other scenarios - do not always assume this is a direct 1:1 link to this issue described here.

The typical common symptoms are:
- Persistent HTTP 502/503 and application failed startups.
- `The specified CGI application encountered an error and the server terminated the process.`
- **No logs from the application or Tomcat**. This is expected because, if the application is encountering this scenario, there is **no** Java or Tomcat executable at the path they're pointing at.

As a side, This is **NOT** the same thing as "pinning" to a specific Java or Tomcat `major.minor.patch` version as discussed in [Choosing a Java runtime version](https://learn.microsoft.com/en-us/azure/app-service/configure-language-java-deploy-run?pivots=java-javase&tabs=windows#choosing-a-java-runtime-version). Although this can influence this behavior which is explained below.

Pinning to a specific version (in the portal) and not having any explicit reliance on using `web.config` pointing to any hardcoded platform paths with Java/Tomcat applications is ideally what should be done to avoid this issue.

# Example of hardcoding
If any of these are seen, **always** confirm if the application is using a `web.config` and review it to see if it's pointing to a specific process path. If so, navigate to that process location path and check if the specific Tomcat and/or Java version changed. 

`web.config` should typically be directly in `wwwroot`

Below is an example of hardcoding:

(Java SE)

```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <configuration>
        <system.webServer>
            <handlers>
                <add name="httpPlatformHandler" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified"/>
            </handlers>
            <httpPlatform processPath="C:\Program Files\Java\microsoft-jdk-17.0.13.11\bin\java.exe"
                      arguments="-Dserver.port=%HTTP_PLATFORM_PORT% -jar &quot;%HOME%\site\wwwroot\app.jar&quot;"
                      stdoutLogEnabled="true"
                      stdoutLogFile="%HOME%\LogFiles\httpPlatformHandler.log">
            </httpPlatform>
        </system.webServer>
    </configuration>
```

(Tomcat)

```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <configuration>
        <system.webServer>
            <handlers>
                <add name="httpPlatformHandler" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified"/>
            </handlers>
             <httpPlatform processPath="C:\Program Files\apache-tomcat-9.0.98\bin\startup.bat"
                           arguments="start"
                           stdoutLogEnabled="true"
                           stdoutLogFile="%HOME%\LogFiles\%COMPUTERNAME%.application.log">
              <environmentVariables>
                <environmentVariable name="CATALINA_OPTS" value="-Dport.http=%HTTP_PLATFORM_PORT%" />
              </environmentVariables>
          </httpPlatform>
        </system.webServer>
    </configuration>
```

We can obviously see some problems here:
- If the drive letter changes (C: or D:), this will cause the issue described here
- If the specific `patch.*` version changes (removed), this will cause the issue described here
- If the a user mistypes or has invalid syntax for any of this file path, it will cause the issue described here

As mentioned above, and called out in [Deploy and configure Tomcat, JBoss, or Java SE apps - Azure App Service | Microsoft Learn](https://learn.microsoft.com/en-us/azure/app-service/configure-language-java-deploy-run?pivots=java-tomcat&tabs=windows#set-java-runtime-options) (which is both applicable for Java SE and Tomcat) - **avoid using web.config**. The platform handles much of what `web.config` tries to accomplish. Most of the time, an application is using this for rewrite rules or other custom logic that can be offloaded to components like App Gateway for [Rewrite HTTP headers and URL with Azure Application Gateway | Microsoft Learn](https://learn.microsoft.com/en-us/azure/application-gateway/rewrite-http-headers-url#request-and-response-headers) or other concepts.

# Best practices
When applications are hardcoding values, _any time_ there is a platform upgrade - they are at risk of encountering this issue. If there is absolutely no way to remove the reliance of `web.config`, then follow the below practice of using `%JAVA_HOME%` and `%AZURE_TOMCAT[majorversion]_HOME%` environment variables, since this will always expand to the current version selected in the portal. Given that is the case, be cognizant about pinning to a specific minor and patch version in the **Configuration** blade and **not** using auto-update. This is called out in [Choosing a Java runtime version](https://learn.microsoft.com/en-us/azure/app-service/configure-language-java-deploy-run?pivots=java-tomcat&tabs=windows#set-java-runtime-options)

(Java SE)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <handlers>
            <add name="httpPlatformHandler" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified"/>
        </handlers>
        <httpPlatform processPath="%JAVA_HOME%\bin\java.exe"
                      arguments="-Dserver.port=%HTTP_PLATFORM_PORT% -jar &quot;%HOME%\site\wwwroot\app.jar&quot;"
                      stdoutLogEnabled="true"
                      stdoutLogFile="%HOME%\LogFiles\httpPlatformHandler.log">
        </httpPlatform>
    </system.webServer>
</configuration>
```

(Tomcat)

```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <configuration>
        <system.webServer>
            <handlers>
                <add name="httpPlatformHandler" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified"/>
            </handlers>
             <httpPlatform processPath="%AZURE_TOMCAT90_HOME%\bin\startup.bat" 
                           arguments="start"
                           stdoutLogEnabled="true"
                           stdoutLogFile="%HOME%\LogFiles\%COMPUTERNAME%.application.log">
             <environmentVariables>
                <environmentVariable name="CATALINA_OPTS" value="-Dport.http=%HTTP_PLATFORM_PORT%" />
             </environmentVariables>
          </httpPlatform>
        </system.webServer>
    </configuration>
```

If wanting to use the environment variables, be aware of the following:
- `JAVA_HOME` is influenced by the **Configuration blade**:

![Configuration blade for Java SE](/media/2025/02/java-hardcoding-versions-1.png)

For example, setting the above will have `JAVA_HOME` expand to `C:\Program Files\Java\microsoft-jdk-17.0.3.7` (at the time of writing this). Since these versions may change to keep App Service updated - it is always possible that a semantic version changes for a specific `major.minor.patch.*`. That means irregardless of using environment variables, there is a small chance these versions will change/be removed/updated under the hood. This is **no different** than why this all happens in the first place when applications hardcode these versions, the major benefit with using environment variables is that if a version is removed, then the environment variable will expand to the next available version in that place - so applications will thus avoid site downtime due to non-existing versions.

> **NOTE**: If users have the portal set to auto-update, then `JAVA_HOME` will expand to the latest of that version. Users still need to follow runtime version pinning best practices so the environment variable stays to a specific major.minor version as mentioned above.

`AZURE_TOMCAT[majorversion]_HOME` on the other hand always expands to the latest version of the specified major, regardless if the portal is specified to a target minor.patch version. Users may not opt to use this knowing it follows auto-update (given current guidance is to pin to a specific version). If this is the case, and they absolutely do not want to avoid using `web.config`, then ensure `processPath` targets a proper Tomcat location - and opt to avoid hardcoding the drive letter through something like `%HOME%\Program Files\apache-tomcat-10.1.16\bin\startup.bat`. Ultimately, the long term resolution for this is to simply move away from hardcoded versions in `web.config`, since if not wanting to use `AZURE_TOMCAT[majorversion]_HOME` and rather pointing to a specific version will still end up hardcoding the Tomcat version.

Some additional notes on the `AZURE_TOMCAT[majorversion]_HOME`:
- `AZURE_TOMCAT85_HOME` expands to the latest version of Tomcat 8.5 on the hosting instance
- `AZURE_TOMCAT90_HOME` expands to the latest version of Tomcat 9.0 on the hosting instance
- `AZURE_TOMCAT10_HOME` expands to the latest version of Tomcat 10.x (10.1 as of writing this) on the hosting instance (there is no variable that points to 10 directly)

What this doesn't resolve is if a Java/Tomcat version is changed, and even though the application is using an environment variable to expand the path - the application goes down due to an application issue with incompatible versions with dependencies/codebase on that specific Java or Tomcat version. **This is a completely different issue** and is thoroughly explained in the [Java on App Service Linux - java.lang.NoSuchMethod exceptions](https://azureossd.github.io/2024/07/03/Java-on-App-Service-Linux-java-lang-NoSuchMethod-exceptions/index.html) blog post.