---
title: "Custom Tomcat Configuration on Azure App Service Windows"
author_name: "Kendrick Dubuisson"
tags:
    - Java
    - Tomcat
    - Windows
categories:
    - Azure App Service on Windows
    - Java
    - How-To
    - Troubleshooting
header:
    teaser: "/assets/images/Javalogo.png" 
toc: true
toc_sticky: true
date: 2021-06-17 00:00:00
---

App Service Windows includes multiple versions of Tomat for your choosing & uses IIS to quickly update your process path once any new runtime version is pinned. Still, there are use cases where you may be looking to tweak the server configuration or completely modify the existing Tomcat installation that's in use. 

The platform maintains all avaliable runtimes within the read-only system drive. Therefore, the Web App can access many standard Windows locations like %ProgramFiles%, but the Web App can never modify these files.

To work around this with Tomcat, we'll walk through modifying the IIS configuration with a web.config to either pass arguments to the current process path or update the path entirely.

References:

Azure File System Restrictions: https://github.com/projectkudu/kudu/wiki/Azure-Web-App-sandbox#file-system-restrictionsconsiderations

Understanding the Azure App Service File System: https://github.com/projectkudu/kudu/wiki/Understanding-the-Azure-App-Service-file-system

HttpPlatformHandler Configuration: https://docs.microsoft.com/en-us/iis/extensions/httpplatformhandler/httpplatformhandler-configuration-reference



## Prerequisites

- Windows Web App running Tomcat
- Access to the SCM site(kudu)
- Tomcat Version Validated
	- Kudu > Process Explorer > Find Handle > "tomcat"
    >  ![Startup Command on AppService Linux](/media/2021/12/tomcathandle.gif )


## Custom server.xml Configuration

1. Navigate to the site directory from the Kudu site (i.e https://\<sitename>\.scm.azurewebsites.net/webssh/host) 
2. Copy the read-only server.xml from the system drive to the site directory. *Use your correct tomcat version*
    ```	
    copy "C:\Program Files\apache-tomcat-X.X.XX\conf\server.xml" \home\site
    ```
3. Create a `web.config` file inside `C:\home\site\wwwroot` with the configuration below.
	```
	<?xml version="1.0" encoding="UTF-8"?>
	<configuration>
		<system.webServer>
			<handlers> 
				<remove name="httpPlatformHandlerMain" /> 
				<add name="httpPlatformHandlerMain" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified"/>
			</handlers> 
			<httpPlatform processPath="C:\Program Files\apache-tomcat-x.x.xx\bin\startup.bat" requestTimeout="00:04:00" arguments="-config C:\home\site\server.xml start" > 
				<environmentVariables> 
				</environmentVariables> 
			</httpPlatform>
		</system.webServer> 
	</configuration>
	```
4. Request site from browser to confirm that the site is still avaliable with custom argument.
	> If met with "`The specified CGI application encountered an error and the server terminated the process.`" Review the web.config for any errors. (invalid paths/arguments)  
5. Modify the new server.xml & validate the changes! 
    - I've modifed the default log path to confirm my changes using the line below. I should expect my logs to be saved in C:\home\site\Logfiles\test\RawLogs
        > `<Valve prefix="site_access_log.${catalina.instance.name}" pattern="%h %l %u %t &quot;%r&quot; %s %b %D %{x-arr-log-id}i" directory="${site.logdir}/test/RawLogs" className="org.apache.catalina.valves.AccessLogValve" suffix=".txt"/>`
       
        >  ![Startup Command on AppService Linux](/media/2021/12/tomcatnewlogpath.gif)







## Custom Tomcat Configuration
>⚠️ Notice - When using a custom tomcat version, this is no longer maintained nor in sync with the App Service Platform if changes occur. (Configuration/Path-Mapping/Env Variables) 

1. Navigate to the System drive for your tomcat directory from the Kudu site (i.e https://\<sitename>\.scm.azurewebsites.net/webssh/host) 
[image](blob:https://teams.microsoft.com/33233024-5156-4528-a858-260f1025e80a)
2. Download this from the system drive to your local machine.
    >  ![Download](/media/2021/12/tomcatDL.png )
3. Using Kudu, create a tomcat directory `C:\home\site\tomcat` Drag & drop the tomcat.zip to upload & unzip. (C:\home\site\tomcat)
    >  ![Tomcat Copy](/media/2021/12/tomcatcopy.png )

4. Add a web.config within the wwwroot to point to new tomcat location
    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <configuration>
    <system.webServer>
        <handlers>
        <remove name="httpPlatformHandlerMain" />
        <add name="httpPlatformHandlerMain" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified"/>
        </handlers>
        <httpPlatform processPath="C:\home\site\tomcat\bin\startup.bat" requestTimeout="00:04:00">
            <environmentVariables>
            </environmentVariables>
        </httpPlatform>
    </system.webServer>
    </configuration>
    ```

5. Validate the new path tomcat handle path!

    >  ![End](/media/2021/12/tomcatconfigupdate.gif )


