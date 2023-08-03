---
title: "Deploying war files to App Service Linux Java images"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Configuration
    - Java
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Deployment # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-08-02 12:00:00
---

This post will cover various ways you can deploy war files to Java applications on App Service Linux. 

This was intended to be used in relation to App Service Linux, but all of these concepts can apply to Java on Windows App Service as well.

# Tomcat deployments on App Service - War file location, behavior and troubleshooting
This boils down to usually either:
- The war being deployed and expanded under `/home/site/wwwroot/webapps/[context]` - which deployment methods like [War Deploy](https://github.com/projectkudu/kudu/wiki/Deploying-WAR-files-using-wardeploy#deploying-to-apps-other-than-root) will implicitly do
- Or, the war remaining "as is" under `/home/site/wwwroot/app.war` - deployment methods that utilize OneDeploy will typically rename the war to `app.war` - the war will be copied locally and expanded under `/usr/local/tomcat/webapps/ROOT` in the container. This is handled by the platform.

Ultimately, the two locations above - eg., `/home/site/wwwroot/somewar.war` and `/home/site/wwwroot/webapps/[context]`, will be deployed to depending on the deployment method used.

You **should not** "mix and match" the two above approaches. It is highly recommended to only stick with one approach, which is either keeping a single war under `wwwroot`, or, if needing multiple contexts with Tomcat, only use `/home/site/wwwroot/webapps/ROOT` and other contexts under `wwwroot/webapps/[context]`

Otherwise, you may see unintended behavior.

# Zip Deploy and One Deploy
Zip Deploy is one of the recommended ways to deploy war files. Additionally, "One Deploy" is not entirely a deployment method - but type of deployment done through the Azure App Service platform. Certain deployment methods discussed in this article will use One Deploy under the hood.

## Zip Deploy
Different ways to deploy a Zip package (that contains either a .war or .jar) can be found here - [App Service - Deploy a ZIP package](https://learn.microsoft.com/en-us/azure/app-service/deploy-zip?tabs=cli#deploy-a-zip-package). This includes:
- Azure CLI
- Kudu API
- Kudu UI (drag-and-drop, on Windows. On Linux, use the /newui endpoint -> File Manager)
- PowerShell

As an example, we'll talk about using the Azure CLI for two approaches.

**az webapp deployment source config-zip**:

An example command of this would be:

```bash
# Deploy a war
az webapp deployment source config-zip -g some-rg -n some-tomcat-test --src ./target/some.war
# Deploy a zip
az webapp deployment source config-zip -g some-rg -n some-tomcat-test --src ./target/some.zip
```

On output of this, you can confirm this is using "push deployer" (Zip Deploy):

```json
...
"complete": true,
  "deployer": "Push-Deployer",
  "end_time": "2023-07-19T22:08:29.0520178Z",
  "id": "00000000-0000-0000-0000-000000000000",
  "is_readonly": true,
  "is_temp": false,
  "last_success_end_time": "2023-07-19T22:08:29.0520178Z",
  "log_url": "https://some-tomcat-test.scm.azurewebsites.net/api/deployments/latest/log",
  "message": "Created via a push deployment",
...
```

If deploying a non-zipped `.war` or `.war` that is in a Zip and try to use this command - this will deploy directly to `/home/site/wwwroot`. The file contents will look like the below:
```
6a1dd90d49ab:/home# ls /home/site/wwwroot/
war-0.0.1-SNAPSHOT.war
6a1dd90d49ab:/home# ls /usr/local/tomcat/webapps/
ROOT      ROOT.war
```
In this case, the war follows an approach that mimics the OneDeploy logic below - where the `.war` is _not_ expanded under `/home/site/wwwroot` but rather is locally coped over to `/usr/local/tomcat/webapps/[context` and expanded there.

## One Deploy
> The below is focusing on Azure CLI command usage

**az webapp deploy**:
> **NOTE**: This method uses **OneDeploy** instead of "Push Deployer" (Zip Deploy)

> Documentation on the below command can be found here - [az webapp deploy](https://learn.microsoft.com/en-us/cli/azure/webapp?view=azure-cli-latest#az-webapp-deploy)

You can use this to deploy a zip file (that contains a .war) or a .war itself:

```bash
// Deploy a zip
az webapp deploy -g some-rg -n some-tomcat-test --src-path ./target/some.zip --async true --type zip
// Deploy a war
az webapp deploy -g some-rg -n some-tomcat-test --src-path ./target/some.zip --async true --type war
```

In the output for this, you can confirm that OneDeploy is being used:

```json
  "complete": true,
  "deployer": "OneDeploy",
  "end_time": "2023-07-19T22:48:33.6663773Z",
  "id": "00000000-0000-0000-0000-000000000000",
  "is_readonly": true,
  "is_temp": false,
  "last_success_end_time": "2023-07-19T22:48:33.6663773Z",
```

If you are deploying _just_ the war, for example with this command: `az webapp deploy -g some-rg -n some-tomcat-test --src-path ./target/some.war --async true --type war`-  you'll find that the war is going to be renamed to `app.war` under `/home/site/wwwroot`, regardless of what the war is named on the machine initiating the deployment - this behavior is expected:

```
root@57e5b07b886e:/# ls /home/site/wwwroot/
app.war
```

  - You'll also notice under `/usr/local/tomcat/webapps`, the following content will exist (assuming just one war exists on `wwwroot`) after a deployment:
   ```
    root@f88be0a1b30d:/home/site/wwwroot# ls /usr/local/tomcat/webapps/
    ROOT  ROOT.war
   ```
   - When nothing exists under `wwwroot`, nothing will exist under `/usr/local/tomcat/webapps/`

The above method will automatically deploy this to a `ROOT` context.

This is the same concept when deploying with the Azure Maven Plugin as well, which will be covered below.

### Deploying multiple war files
> **NOTE**: This is discussed using the Azure CLI and not War Deploy, which can also do the same thing

If you want to deploy multiple `.war` files, then you need to use the `--target-path` flag with `az webapp deploy`. Note, that trying to place a war directly under `wwwroot`, like the below, will **not** properly expand the war locally to `/usr/local/tomcat/webapps/[context]` - only the initially deployed war will work (assuming it followed the above deployment method):

```
root@57e5b07b886e:/# ls /home/site/wwwroot/
app.war test.war
root@f88be0a1b30d:/# ls /usr/local/tomcat/webapps/
    ROOT  ROOT.war
```

You instead need to use `--target-path` to place the war(s) in a `webapps` folder under `/home/site/wwwroot`. An example of this is:

```bash
# This deploys to a "root" context - access it like sitename.azurewebsites.net
az webapp deploy -g some-rg -n some-tomcat-test --src-path ./target/some.war --async true --type war --target-path webapps/ROOT
# This deploys to a context named bapp - access it like sitename.azurewebsites.net/bapp
az webapp deploy -g some-rg -n some-tomcat-test --src-path ./target/some.war --async true --type war --target-path webapps/bapp
```

Now, when you list out content, you see it correctly locally copied over:

```
root@bddc4d31aed9:/# ls /home/site/wwwroot/webapps/
bapp  ROOT
root@bddc4d31aed9:/# ls /usr/local/tomcat/webapps/
bapp  ROOT
``` 

#### Zipped war file
If you are deploying a war **in a zip**, for example, with this command: `az webapp deploy -g some-rg -n some-tomcat-test --src-path ./target/some.zip --async true --type zip`, you'll notice the contents under `wwwroot` has now changed. Instead of renaming to `app.war` above, it is extracting the zip and leaving the name of the .war _as is_. 

```
root@b40b7050494c:/# ls /home/site/wwwroot/
war-0.0.1-SNAPSHOT.war
root@b40b7050494c:/# ls /usr/local/tomcat/webapps/
ROOT  ROOT.war
```

However, this will still locally expand to `/usr/local/tomcat/webapps/` a `ROOT` context (assuming just one .war exists under wwwroot).


# Maven Deployments
The Maven plugin also uses OneDeploy. This plugin expects to be ran relative to your `pom.xml` - this will then build the project to generate a `.war` or a `.jar` (depending on the project, which will be named `app.war` or `app.jar`, and deployed to `/home/site/wwwroot`.

The plugin will rebuild your application prior to deployment. This essentially acts like `mvn clean package` - if an application is unable to be compiled in a normal sense, with Maven, and in general - then the deployment will fail while still in the "local" build stage.

**IMPORTANT**: This plugin does **not** offer the same configuration that the Azure CLI (when using `az webapp deploy` - OneDeploy) does in terms of being able to target deployment to certain directories on the file system. This plugin will _only_ deploy to `wwwroot` and always rename the deployed `war` to `app.war`.

A quickstart for Azure App Service on Linux with Java and Maven can be found here - [Quickstart - Deploy a Java App to App Service Linux with Maven](https://learn.microsoft.com/en-us/azure/app-service/quickstart-java?tabs=tomcat&pivots=platform-linux-development-environment-maven#configure-the-maven-plugin)

You can quickly start using the plugin with these two commands:
- `mvn com.microsoft.azure:azure-webapp-maven-plugin:2.11.0:config` (This will prompt for configuration, which will then write to your `pom.xml` under the `<plugins>` element

This will write the following elements into your `pom.xml` under the `<plugin>` element:

> **NOTE**: Some of the below values will changed based on app type, OS type, and others

```xml
<plugin>
  <groupId>com.microsoft.azure</groupId>
  <artifactId>azure-webapp-maven-plugin</artifactId>
  <version>2.11.0</version>
  <configuration>
	<schemaVersion>v2</schemaVersion>
	<subscriptionId>00000000-0000-0000-82c2-0000000000000</subscriptionId>
	<resourceGroup>some-rg</resourceGroup>
	<appName>some-java-linux</appName>
	<pricingTier>S1</pricingTier>
	<region>eastus</region>
	<appServicePlanName>ASP-some-asp</appServicePlanName>
	<appServicePlanResourceGroup>some-rg</appServicePlanResourceGroup>
	<runtime>
		<os>Linux</os>
		<javaVersion>Java 17</javaVersion>
		<webContainer>Tomcat 9.0</webContainer>
	</runtime>
	<deployment>
		<resources>
		    <resource>
		        <directory>${project.basedir}/target</directory>
		        <includes>
		            <include>*.war</include>
		         </includes>
		      </resource>
		 </resources>
	  </deployment>
     </configuration>
  </plugin>
```


- `mvn package azure-webapp:deploy` - This will initiate a deployment

## Configuration
### Authentication
Documentation on what can be configured for the plugin can be found in these locations:
- [Azure Maven plugin - Authentication](https://github.com/microsoft/azure-maven-plugins/wiki/Authentication#overview).
  - The Maven plugin tries multiple authentication types when deploying, which is much like how `DefaultAzureCredential` works. Maven tries the list below, one-by-one, as called out in the above documentation:
    - Service Principles in plugin configuration
    - Service Principles in settings.xml (for Maven use only)
    - Managed Identity (since azure-webapp-maven-plugin:2.6.0, azure-functions-maven-plugin:1.19.0, azure-spring-apps-maven-    plugin:.1.12.0, for Azure hosting compute resource only)
    - Azure CLI (Recommended for developer)
    - VSCode will be supported soon
    - Visual Studio will be supported in future releases
    - OAuth2 (A browser is required)
    - Device Code
    - Maven Login(deprecated) (Deprecating, may will not be supported in future release)

You can use Maven in CI/CD deployment tasks as well by using the Service Principal methods. You can add the required credentials to your `pom.xml` (called out [here](https://github.com/microsoft/azure-maven-plugins/wiki/Authentication#service-principles-in-plugin-configuration)) or your `settings.xml` (called out [here](https://github.com/microsoft/azure-maven-plugins/wiki/Authentication#service-principles-in-settingsxml))

### Network Proxy
In some cases it may be required to set a proxy if a user is in a corpnet or private network. Useres may get a message like `Connection Timed Out`, `Connection Refused`, `Connection Reset`, or others.

This can be done with Maven by following the documentation outlined here - [Proxy](https://github.com/microsoft/azure-maven-plugins/wiki/Proxy).

This is supported through a system proxy, Java-based CLI arguments to the Azure Maven Plugin, or through Maven itself in `settings.xml` ([doc](https://maven.apache.org/guides/mini/guide-proxies.html))

### General Settings
The settings that define where the plugin will deploy to is found here - [Configuration - Settings](https://github.com/microsoft/azure-maven-plugins/blob/develop/azure-webapp-maven-plugin/README.md#configuration). This is done after running `mvn com.microsoft.azure:azure-webapp-maven-plugin:[x.x.x]:config` where `[x.x.x]` is the current major.minor.patch version. Maven will then write into the `pom.xml` in the project after the prompts are answered.

All versions for the Azure Maven Plugin can be found here in the [Maven Versions - Sonatype - Maven Central Repository](https://central.sonatype.com/artifact/com.microsoft.azure/azure-webapp-maven-plugin/2.11.1/versions) page.

- [Azure Maven plugin - Common Configuration](https://github.com/microsoft/azure-maven-plugins/blob/develop/docs/common-configuration.md)

## Troubleshooting
### Execution default-cli of goal com.microsoft.azure:azure-webapp-maven-plugin:[x.x.x]:deploy failed
You may get an error showing `'Execution default-cli of goal com.microsoft.azure:azure-webapp-maven-plugin:[x.x.x]:deploy failed` when trying to run `mvn com.microsoft.azure:azure-webapp-maven-plugin:[x.x.x]:config`

Check if you're using an older version or not - consult available Azure Maven Plugin versions [here](https://central.sonatype.com/artifact/com.microsoft.azure/azure-webapp-maven-plugin/2.11.1/versions).

- Consider using the most recent Maven version.
- Review the `pom.xml` file to see if a version is already hardcoded under the `<plugins>` element - this would matter more when trying to execute `mvn package azure-webapp:deploy`

### Connection Timed Out
If deploying in a corpnet, on a VNET or in a private network - see [Network Proxy](#network-proxy).

If there is no VNET or any private network in use - validate you have local network connectivity. 

### Goal requires a project to execute but there is no POM in this directory
The full error may show:

```
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  0.118 s
[INFO] Finished at: 2023-07-21T18:14:15-04:00
[INFO] ------------------------------------------------------------------------
[ERROR] The goal you specified requires a project to execute but there is no POM in this directory (path\to\current\directory. -> [Help 1]
```

Validate that:
- A `pom.xml` actually exists in the current directory
- That `mvn` commands for the plugin are being ran **within** the project root **relative** to `pom.xml`
- That the `pom.xml` is accessible and writeable. The plugin needs to write into this.

### Maven is failing to build
Maven will recompile the application when `mvn package azure-webapp:deploy` is ran. This is essentially equivalent to `mvn clean package` which will generate a war under `/target`.

Review the console error output. This can happen due to a variety of reasons - notably, if the application is unable to compile due to application code or syntax issue.

Ensure the application can be built locally with Maven (**not** using the Azure plugin) to validate this is a pure application issue.

#### Tests are failing to pass on deployment
Additionally, if the application is unable to pass certain tests - and it's confirmed that the application _will_ run without tests being ran, there are two general options:
- Use `-DskipTests=true` -eg., `mvn package azure-webapp:deploy -DskipTests=true`
- Remove any reference to test dependencies in the `pom.xml`, such as `spring-boot-starter-test` or others that will implicitly have tests be ran when Maven is invoked

If there are dependencies that include test-runners in their `pom.xml` or otherwise specific - Maven will try to run these.

# FTP
**NOTE**: Deployment through FTP is **not recommended** - see [here](https://learn.microsoft.com/en-us/azure/app-service/configure-language-java?pivots=platform-windows#tomcat).

_Do not deploy your .war or .jar using FTP. The FTP tool is designed to upload startup scripts, dependencies, or other runtime files. It is not the optimal choice for deploying web apps._

You can use FTP clients like WinSCP, FileZilla, or others - to initiate an FTP deployment.

## Deployments to wwwroot
You can deploy war files directly to `/home/site/wwwroot`. This is intended for "single" war files.

For consistency, it is advised to rename the war file to `app.war` prior to deploying the file. After adding the file to the file system, restart the application. You can confirm the war has been properly deployed by running `ls` on `wwwroot` and Tomcats local `webapps` folder:

```
root@f2154e97e63d:/# ls /home/site/wwwroot/
app.war  hostingstart.html
root@f2154e97e63d:/# ls /usr/local/tomcat/webapps/
ROOT  ROOT.war
```

Alternatively, if renaming the war to `app.war` is not an option - and - if wanting this to live under a root context, see below with [Deployments to webapps/wwwroot](#deployments-to-webapps/wwwroot) and create a folder structure of `/home/site/wwwroot/webapps/ROOT` and deploy the war to the folder named `ROOT` with the name of `ROOT.war`.

## Deployments to webapps/wwwroot
Deploying multiple wars to multiple contexts can be done by manually creating a folder named `webapps` under `/home/site/wwwroot`.

An example of what would be seen under `/home` may be:
- `/home/site/wwwroot/webapps/app` (accessible via sitename.azurewebsites.net/app/)
- `/home/site/wwwroot/webapps/bapp` (accessible via sitename.azurewebsites.net/bapp/)

In comparison to [OneDeploy and ZipDeploy](#one-deploy), it may not be possible to simply drop the unexploded war(s) under their respective contexts and expect Tomcat to unpack these. For instance:

- `/home/site/wwwroot/webapps/app/app.war`
- `/home/site/wwwroot/webapps/bapp/bapp.war`

This may only copy one (or none) of the wars to `ROOT` under `/usr/local/tomcat/webapps`.

Instead, you can try the following for Tomcat to properly pick up the contexts:
1. Create the desired folders under `wwwroot/webapps` with the appropriate war files in them:
    - eg., 
      - `/home/site/wwwroot/webapps/app/app.war`
      - `/home/site/wwwroot/webapps/bapp/bapp.war`
2. Unpack/explode the war(s) by navigating to each war relatively and run `jar -xvf warname.war`. Delete the war, after this, but leave the exploded contents.
3. This will unpack/explode the war(s) in the directory specified, eg., `/home/site/wwwroot/webapps/bapp`
4. Restart the site. Run `ls /usr/local/tomcat/webapps/[context]` and you should see the appropriate context and accessible via site URL as well.
    - The below, as an example, would be accessible via sitename.azurewebsites.net/bapp/
```
root@749298f4ec08:/# ls /home/site/wwwroot/webapps/bapp/
META-INF  org  WEB-INF
root@749298f4ec08:/# ls /usr/local/tomcat/webapps/bapp/
META-INF  org  WEB-INF
```

## Troubleshooting
### 404's seen after deployment
404's can be seen in a few scenarios, ranging from file/request path not found, to application error's that surface as 404's with Tomcat.

However, in this context with FTP deployments - this 404 discussed is due to a specific reason. When it comes to FTP deployments with War files - Essentially, there is a chance that if using > 1 instances, a 404 may be returned on certain instances due to a race-condition with multiple instances trying to unpack the deployed war under `/home`.

Multiple instances are trying to expand one (1) file on the `/home` volume - given this many-to-one scenario, some Tomcat instances may run into file-locking issues. This may manifest in `default_docker.log` as:
- [somefiles] is a read-only file
- [somefiles] are not found
- [somefiles] are locked, or a file lock for specific files is shown

This typically doesn't cause Tomcat to exit - only the inability to unpack the war, thus leading to a 404.

### HTTP 550
An HTTP 550 may be returned via the Kudu UI or an FTP client when trying to operate on a file under `/home`, such as the `.war` or `.jar` being ran.

This may be paired with a `file or directory` not found message. You may also see that when trying to delete the file that is clearly there on the file system, this will be returned.

This is typically due to the file being in-use by a process, or there is some type of lock on the file in which it cannot be operated on.

In these cases, **stop** the site (wait until the "blue" 403 "Site Stopped" page shows) - do the operation on said file - and then **start** the site. If this does not resolve the issue, try scaling to land on a new instance.

### Content is not changing after deployment
An FTP deployment may have been done but the expected change is not appearing. Validate that:
- The site was restarted (or stop, started) _after_ the deployment event.
- Pull down the same war or jar to your local machine - check if the same behavior occurs. Make sure the war is rebuilt locally first.

# Local Git
Java "Blessed" Images on Azure App Service do not support Local Git deployments.

Additionally, Java "Blessed Images" additionally do not support any usage of Oryx-based deployments. Any Local Git and/or Oryx related configuration, settings, or troubleshooting does not apply to these Java images.

## Azure DevOps and GitHub Actions
See [Deploying WAR based Java applications with CI/CD (GitHub Actions, Azure DevOps) on App Service Linux](https://azureossd.github.io/2022/12/22/Deploying-WAR-based-Java-applications-with-CICD-on-App-Service-Linux/index.html).


# Troubleshooting
## Parking page is showing
This means there is no war file existing on the file system, or we App Service can't find it to run. Additionally, there is a possibly a war or war-folder context exists, but the method being used to deploy did not let the platform appropriately unpack to `/usr/local/tomcat/webapps/[context]`.

For deployments using `.war` files, validate that:
- If `/home/site/wwwroot` or `/home/site/wwwroot/webapps` is being used. Check the `war` is actually under one of these two paths.
  - If both of the above file system locations exist, then only one (1) of these locations should be used and the other deleted.
- Check if the same context name is appearing under `/usr/local/tomcat/webapps/[context]` within the container.
- Validate that if using `/home/site/wwwwroot/[war].war` that `/home/site/wwwroot/webapps/ROOT` exists with appropriate expanded contents under `ROOT`
   - Validate that if using `/home/site/wwwwroot/[war].war` that `/home/site/wwwroot/webapps/[context]` exists with appropriate expanded contents under `[context]`

## HTTPSConnectionPool error or Certificate verification failed
This may error if using the Azure CLI behind a proxy - a private network, VPN, corpnet, and/or the destination is also in its own private network. A full error may look like this:

```
HTTPSConnectionPool(host='some-tomcat-test.scm.azurewebsites.net', port=443): Max retries exceeded with url: /api/publish?type=war&async=True&path=C:/Program%20Files/Git/home/site/wwwroot/webapps/test (Caused by SSLError(SSLEOFError(8, 'EOF occurred in violation of protocol (_ssl.c:2396)')))
Certificate verification failed. This typically happens when using Azure CLI behind a proxy that intercepts traffic with a self-signed certificate. Please add this certificate to the trusted CA bundle. More info: https://docs.microsoft.com/cli/azure/use-cli-effectively#work-behind-a-proxy.
```

Review the link in the error - which points to how to resolve this issue if working behind a proxy when using the Azure CLI - https://docs.microsoft.com/cli/azure/use-cli-effectively#work-behind-a-proxy.

Additionally, ensure that the client machine has appropriate network connectivity to the Kudu site of the target deployment.


## --target-path with absolute path causes "Internal Server Error" when deploying
If using --target-path set to a absolute path such as `/home/site/wwwroot/webapps[directory]`, you may see this:

```
<div id="header"><h1>Server Error</h1></div>
<div id="content">
 <div class="content-container"><fieldset>
  <h2>502 - Web server received an invalid response while acting as a gateway or proxy server.</h2>
  <h3>There is a problem with the page you are looking for, and it cannot be displayed. When the Web server (while acting as a gateway or proxy) contacted the upstream content server, it received an invalid response from the content server.</h3>
 </fieldset></div>
</div>
```

Although both absolute and relative are supported, relative paths will typically overcome the above issue in this situation.
