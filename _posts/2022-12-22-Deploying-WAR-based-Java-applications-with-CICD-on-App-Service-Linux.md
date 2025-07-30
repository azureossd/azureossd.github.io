---
title: "Deploying WAR based Java applications with CI/CD (GitHub Actions, Azure DevOps) on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Java
    - Maven
    - Gradle
    - Deploy
    - Spring
    - Configuration
categories:
    - Azure App Service on Linux
    - Java
    - Deployment 
    - Configuration
    - Troubleshooting
    - Linux
header:
    teaser: /assets/images/javalinux.png
toc: true
toc_sticky: true
date: 2022-12-22 12:00:00
---

In this blog post we'll cover some examples of how to deploy war based applications using Azure DevOps and GitHub Actions.

## Overview
**Source code for these GitHub Action workflows and Azure DevOps pipelines can be found [here](https://github.com/azureossd/java-war-cicd-examples)**.

This section will cover CI/CD deployment for war-based applications - this is for Blessed **Tomcat** images, which will act as our Web Container for our war. With this image, you still have the option to choose your Java major version, as well as Apache Tomcat major and minor version - but the premise is that we're deploying a war file into a Tomcat container, which Tomcat itself will run.

Below is a configuration reference from the portal:

![Tomcat Configuration](/media/2022/12/azure-blog-tomcat-linux-cicd-1.png)


This is **not** the same as running a Java SE "Blessed" Image which requires this to be an executable jar with an embedded Web Server.


This post will also include deployment differences for [Maven](https://maven.apache.org/what-is-maven.html) and [Gradle](https://gradle.org/).

## Local Development
> **NOTE**: We'll be using Tomcat 9 and below since Tomcat 10 and above requires additional changes to run with Spring Boot

For simplicity, we'll be using Spring Boot (that can be packaged as a war) to create the application we'll be deploying. If you have an application that uses JSP's, that can be used as well since ultimately we'll be producing a war to deploy either way.

### Configuring for Maven

1. Go to [Spring Initializr](https://start.spring.io/) and create the application with the following properties:
- **Project**: Maven
- **Language**: Java
- **Spring Boot**: 2.7.6
- **Project Metadata**: Fill this as fits your needs
- **Packaging**: War
- **Java**: 17

For Dependencies, go to **Add Dependencies** and choose **Spring Web**. Click **Generate** after this, which will download a zip which we'll extract into a project workspace. 

![Spring Initializr](/media/2022/12/azure-blog-tomcat-linux-cicd-2.png)

2. After downloading the zip, extract it on your local machine and cd into the folder with the source code.
3. In a terminal, run either of the following:
- If Maven is **on $PATH**, you can run `mvn spring-boot:run` relative to the `pom.xml`.
- If Maven is **not** on $PATH or not installed locally, run `./mvnw spring-boot:run` relative to the `pom.xml`

> **NOTE**: This assumes you have Java 17 locally. Maven needs to point to a Java 17 installation as well. If you're unsure to what Maven is using, use `mvn -v`.

After running the above command, you should see some output like the below in your terminal:

```java
2022-12-15T18:55:00.699-05:00  INFO 22012 --- [           main] com.devops.azure.AzureApplication        : No active profile set, falling back to 1 default profile: "default"
2022-12-15T18:55:03.249-05:00  INFO 22012 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2022-12-15T18:55:03.272-05:00  INFO 22012 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2022-12-15T18:55:03.272-05:00  INFO 22012 --- [           main] o.apache.catalina.core.StandardEngine    : Starting Servlet engine: [Apache Tomcat/10.1.1]
2022-12-15T18:55:03.453-05:00  INFO 22012 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2022-12-15T18:55:03.455-05:00  INFO 22012 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 2575 ms
2022-12-15T18:55:04.090-05:00  INFO 22012 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2022-12-15T18:55:04.104-05:00  INFO 22012 --- [           main] com.devops.azure.AzureApplication        : Started AzureApplication in 5.152 seconds (process running for 6.599)
```

Locally, we can use Maven to help run our Spring Boot application with an Embedded Tomcat server, even though we specified the packaging as a **war** - and even if you don't have a local Tomcat instance running. The **war** packaging of this only matters for when we move to deploying this to Azure, otherwise you can run this locally as any other application with an embedded server.

4. Browsing to localhost:8080 should show a **Whitelabel Error Page**, which is expected, since we have no Controllers serving our root path. 
5. Let's add a Controller to show some type of content when hitting the root path. Under your project src, **relative** to your entrypoint `.java` file, create a controller. Let's name is **HomeController.java**. The project structure should look like this:

```
| - src
|   | - main
|       | - java
|           | - com
|               | - some
|                   | - reversedns
|                       | - name
|                           | Name.java
|                           | HomeController.java
```

Add the following code to **HomeController.java**:

```java
package com.some.package;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {
    String message = "This is a war file from Azure DevOps pipelines!";

    @GetMapping("/")
    public String index() {
        return message;
    }
}
```

6. Restart the application. Refresh the browser, we should now see the below:

![Local Spring Boot](/media/2022/12/azure-blog-tomcat-linux-cicd-3.png)

7. Push this code to a repository of your choosing to use later on for the DevOps section. To use with GitHub Actions, it's recommended to push this to a GitHub repository.

### Configuring for Gradle
1. Follow the steps under the **Local Development - Maven** section above to create a Spring Boot application with Gradle. Choose either **Gradle - Kotlin** or **Gradle - Groovy** for the **Project** field on [Spring Initializr](https://start.spring.io/), the rest of the properties can remain the same.
2. Continue to follow all other **Local Development** section steps to create a Controller, as we did earlier.
3. On your local machine, in your terminal, run `./gradlew bootRun` to start the Spring Boot application. You should see the same output above as discussed in th Maven section.

## DevOps 
### Maven
**Prerequisites**:
- If not done so already, create an [Azure DevOps Organization](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/create-organization?view=azure-devops). 
- Next, create a [Azure DevOps Project](https://learn.microsoft.com/en-us/azure/devops/organizations/projects/create-project?view=azure-devops&tabs=browser) to host our pipeline after this.

**Creating the pipeline**:

In your Azure DevOps project go to:
1.  **Pipelines** -> **Pipelines** -> **Create Pipeline**
2. Select the repository that is hosting the code
3. Select the **Maven package Java project Web App to Linux on Azure** template:

![Maven DevOps template](/media/2022/12/azure-blog-java-devops-deployment-3.png)

4. Select your subscription in the right-hand navbar, when prompted.
5. Select the Web App you're deploying to. Then select **Validate and Configure**:

![Maven DevOps template](/media/2022/12/azure-blog-java-devops-deployment-4.png)

6. This will generate a `.yaml` that looks closely to the below. In the `.yaml` below, **we add some changes to account for Java 17 with Maven** - the below is now our **updated .yaml**:

```yaml
trigger:
- main

variables:

  # Azure Resource Manager connection created during pipeline creation
  azureSubscription: '00000000-0000-0000-0000-000000000000'

  # Web app name
  webAppName: 'myapp'

  # Environment name
  environmentName: 'myapp'

  # Agent VM image name
  vmImageName: 'ubuntu-latest'

stages:
- stage: Build
  displayName: Build stage
  jobs:
  - job: MavenPackageAndPublishArtifacts
    displayName: Maven Package and Publish Artifacts
    pool:
      vmImage: $(vmImageName)

    steps:
    - task: Maven@4
      displayName: 'Maven Package'
      inputs:
        mavenPomFile: 'pom.xml'
        # We add jdkVersionOption to point to Java 17 for Maven
        jdkVersionOption: 1.17

    - task: CopyFiles@2
      displayName: 'Copy Files to artifact staging directory'
      inputs:
        SourceFolder: '$(System.DefaultWorkingDirectory)'
        Contents: '**/target/*.?(war|jar)'
        TargetFolder: $(Build.ArtifactStagingDirectory)

    - upload: $(Build.ArtifactStagingDirectory)
      artifact: drop

- stage: Deploy
  displayName: Deploy stage
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: DeployLinuxWebApp
    displayName: Deploy Linux Web App
    environment: $(environmentName)
    pool:
      vmImage: $(vmImageName)
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            displayName: 'Azure Web App Deploy: myapp'
            inputs:
              azureSubscription: $(azureSubscription)
              appType: webAppLinux
              appName: $(webAppName)
              package: '$(Pipeline.Workspace)/drop/**/target/*.?(war|jar)'
              # IMPORTANT: If you don't add this it will deploy to a context named after your WAR
              # ex. yoursite.azurewebsites.net/azure-0.0.1-SNAPSHOT/
              customDeployFolder: 'ROOT'
```

Note the Glob Pattern for the `Contents` and `package` properties in these tasks: `**/target/*.?(war|jar)`. Ideally, this would work fine for both jar and war based deployments.

You can change this to `**/target/yourwar.war` if needed.

However, since we're using **Java 17** we needed to update the Maven task to the below, `JAVA_HOME` (at the time of writing this) points to `/usr/lib/jvm/temurin-11-jdk-amd64`. We need to point this to a Java 17 JDK. If you don't do this we'll get an `Fatal error compiling: error: invalid target release: 17`

```yaml
    - task: Maven@4
      displayName: 'Maven Package'
      inputs:
        mavenPomFile: 'pom.xml'
        jdkVersionOption: 1.17
```

7. Make sure to Authorize the pipeline for deployment. Click into the pipeline to **view** and **permit** this. This should be a one time operation.

![Template authorization](/media/2022/12/azure-blog-java-devops-deployment-5.png)


8. At this point after deployment, and ensuring your `.yaml` is updated, you should have a successful deployment. 

#### Azure DevOps - Why am I getting a 404 after deployment?
If you're following along with the above, you should be able to get a pipeline quickly spun up with a succesful deployment. However, if you are expecting your site content to show up on the site's root path ("/") but did not add the **customDeployFolder** property (seen above), you may see this 404 after deployment:

![Tomcat 404](/media/2022/12/azure-blog-tomcat-linux-cicd-4.png)

This is because of the deployment API that the built-in Azure DevOps tasks currently use, which is the [War Deploy API](https://github.com/projectkudu/kudu/wiki/Deploying-WAR-files-using-wardeploy#deploying-to-apps-other-than-root). This is called via the `/api/wardeploy` URI and can be seen through the DevOps deployment task if we enabled [DevOps debug logging](https://learn.microsoft.com/en-us/azure/devops/pipelines/troubleshooting/review-logs?view=azure-devops):

```
##[debug][POST]https://$yoursitename:***@yoursitename.scm.azurewebsites.net/api/wardeploy?isAsync=true&name=azure-0.0.1-SNAPSHOT&message=....
```

You'll see that when this deployment API is used it creates a `webapps` folder under `wwwroot` containing our exploded war:

```
root@4969de8b8855:/# ls /home/site/wwwroot/webapps/
azure-0.0.1-SNAPSHOT
```

This is because, by default, the API's used in this deployment task pass the name of our war to the `name` parameter in the War Deploy URI being called. Therefore, if your war isn't named `ROOT`, **it will always deploy to a different context named after your war file**. 

This is opposed to the **OneDeploy** API being used on deployment methods such as the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/webapp?view=azure-cli-latest#az-webapp-deploy) or the [Maven Plugin](https://learn.microsoft.com/en-us/azure/app-service/quickstart-java?tabs=javase&pivots=platform-linux-development-environment-maven#configure-the-maven-plugin) which, under the hood, rename our war (or jar) to `app.war` and deploy directly to `wwwroot` instead of `wwwroot/webapps`. This in turn is mapped directly to the root context ("/").

Another quick way to solve this, aside from using the `customDeployFolder` property is to add the `<finalName></finalName>` element to the `<build></build>` section of your `pom.xml`. Such as:

`<finalName>ROOT</finalName>` 

This will package the war with the name defined here and is what will be passed to the `name` parameter described above.

#### Azure DevOps - What are other ways I can target a root site context?
Aside from the ways mentioned above (**customDeployFolder** with the `AzureWebApp@1` task or `<finalName>` in your `pom.xml`) you can try to implement the below deployment approach which uses the **OneDeploy** API.

**Azure CLI with `az webapp deploy`**:

You can replace the Deployment Task in the above `.yaml` with this script. Ensure if using authentication such as Service Principals, that it's appropriately added and scoped. The below is a drop-in replacement for the `AzureWebApp@1` task:

```yaml
- task: AzureCLI@2
  displayName: 'Azure Web App Deploy: myapp'
  inputs:
    azureSubscription: 'Mysub (00000000-0000-0000-0000-000000000000)'
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: 'az webapp deploy --resource-group my-rg --name $(webAppName) --src-path "$(Pipeline.Workspace)/drop/target/YOURWAR.war" --type war --async true'
```

Another example using a command we can put in `inlineScript` is with `--target-path`, for instance:

```
az webapp deploy --resource-group my-rg --name $(webAppName) --src-path "$(Pipeline.Workspace)/drop/target/YOURWAR.war" --target-path webapps/test --type war --async true
```

> **NOTE**: `--target-path` should be relative. An absolute may fail with an internal server error.

You can further confirm **OneDeploy** is being used from the JSON output after the CLI command completes:

```json
...
  "complete": true,
  "deployer": "OneDeploy",
  "end_time": "2022-12-19T23:26:21.8900147Z",
  "id": "00000000-0000-00000-0000-000000000000",
  "is_readonly": true,
  "is_temp": false,
  "last_success_end_time": "2022-12-19T23:26:21.8900147Z",
  "log_url": "https://yoursite.scm.azurewebsites.net/api/deployments/latest/log",
  "message": "OneDeploy",
  "progress": "",
...
```

You'll see this deploys directly to `wwwroot`:

```
root@a7285bf25867:/# ls /home/site/wwwroot/
app.war  hostingstart.html
```

> **NOTE**: To avoid unintended issues, only either deploy your war directly to `wwwroot` or only use the `webapps` folder. Do not do both.

**Renaming the war to ROOT.war in the pipeline**:

Another simple way is to just simply use a script in the pipeline to rename the war to `ROOT.war`. Such as below:

```yaml
- script: |
      mv azure-0.0.1-SNAPSHOT.war ROOT.war
    displayName: 'Rename war to ROOT.war'
```


### Gradle
In your Azure DevOps project go to:
1.  **Pipelines** -> **Pipelines** -> **Create Pipeline**
2. Select the repository that is hosting the code
3. Select **Show more**, do not choose the Gradle one that appears by default.

![Deployed Maven Jar](/media/2022/12/azure-blog-java-devops-deployment-7.png)

3. For simplicity, we'll choose the **Maven package Java project Web App to Linux on Azure** template, like we did in the above section, but instead change out the Maven task with a **Gradle** one.

Below is the `.yaml` file we'll use for our Gradle deployment. This is generated from the Maven template but with three notable changes below - that of explicitly setting our Java version to 17, switching our Maven task for our **Gradle** one and changing our **CopyArtifacts** task to reflect where Grade outputs our built war to.

> **NOTE**: At the time of writing this, the `Gradle@3` task only has up to JDK 11 support in the Task Assistant. If needed, this can manually be configured to point to a different JDK installation with the **Path** option.

Below is the `.yaml` with the recommended changes. Replace **war_name** with the name of your war file.

```yaml
trigger:
- main

variables:

  # Azure Resource Manager connection created during pipeline creation
  azureSubscription: '00000000-0000-0000-0000-000000000000'

  # Web app name
  webAppName: 'yourapp'

  # Environment name
  environmentName: 'yourapp'

  # Agent VM image name
  vmImageName: 'ubuntu-latest'

stages:
- stage: Build
  displayName: Build stage
  jobs:
  - job: MavenPackageAndPublishArtifacts
    displayName: Maven Package and Publish Artifacts
    pool:
      vmImage: $(vmImageName)

    steps:
    # We add this to set Java 17 for our pipeline environment
    - task: JavaToolInstaller@0
      inputs:
        versionSpec: '17'
        jdkArchitectureOption: 'x64'
        jdkSourceOption: 'PreInstalled'
        
    # We add this Gradle task to build with Gradle
    - task: Gradle@3
      inputs:
        gradleWrapperFile: 'gradlew'
        tasks: 'build'
        javaHomeOption: 'JDKVersion'

    - task: CopyFiles@2
      displayName: 'Copy Files to artifact staging directory'
      inputs:
        SourceFolder: '$(System.DefaultWorkingDirectory)'
        Contents: '**/build/libs/your_war.war'
        TargetFolder: $(Build.ArtifactStagingDirectory)

    - upload: $(Build.ArtifactStagingDirectory)
      artifact: drop

- stage: Deploy
  displayName: Deploy stage
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: DeployLinuxWebApp
    displayName: Deploy Linux Web App
    environment: $(environmentName)
    pool:
      vmImage: $(vmImageName)
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            displayName: 'Azure Web App Deploy: yourapp'
            inputs:
              azureSubscription: $(azureSubscription)
              appType: webAppLinux
              appName: $(webAppName)
              package: '$(Pipeline.Workspace)/drop/**/build/libs/your_war.war'
              # IMPORTANT: If you don't add this it will deploy to a context named after your WAR
              # ex. yoursite.azurewebsites.net/azure-0.0.1-SNAPSHOT/
              customDeployFolder: 'ROOT'
```

Deploying this to a new Java App Service on Linux should show updated site content, for example:

![Deployed Gradle War](/media/2022/12/azure-blog-tomcat-linux-cicd-5.png)


To view other configuration that can be used with Gradle for the `Gradle@3` task, view the documentation [here](https://learn.microsoft.com/en-us/azure/devops/pipelines/tasks/reference/gradle-v3?view=azure-pipelines).

#### Why am I getting a 404 after deployment?
The same applies to what was covered in the [Maven section above](#azure-devops---why-am-i-getting-a-404-after-deployment). 

#### What are other ways I can target a root site context?
The same applies to what was covered in the [Maven section above](#azure-devops---why-am-i-getting-a-404-after-deployment).

### Troubleshooting
#### Java tests failing during build

If tests are failing and are able to be excluded, a Maven Options property can be added to the task, like the below:

```yaml
- task: Maven@4
  displayName: 'Maven Package'
  inputs:
    mavenPomFile: 'pom.xml'
    options: '-DskipTests=true'
```

For Gradle, we can pass the `-x` flag for exclusions, like the below:

```yaml
- task: Gradle@3
  inputs:
    gradleWrapperFile: 'gradlew'
    tasks: 'build'
    javaHomeOption: 'JDKVersion'
    options: '-x test'
```

Since Gradle outputs the tasks its running, you can confirm that `Task :test` is removed from this in the Azure DevOps task logs:

(Before adding `-x test`)
```
...other tasks
> Task :testClasses
> Task :test
> Task :check
> Task :build
```

(After adding `-x test`)
```
> Task :compileJava
> Task :processResources
> Task :classes
> Task :resolveMainClassName
> Task :bootJar
> Task :jar
> Task :assemble
> Task :check
> Task :build
```

#### Maven or Gradle is pointing to a different Java version
Maven and Gradle are configured to point to a specific Java version. What is the default set to `JAVA_HOME` may not be what is the target release goal for Maven or source compatability for Gradle. This can be changed through the `jdkVersionOption` property for both Maven and Gradle tasks.

You can alternatively use the **JavaToolInstaller@0** task to point to a specific JDK version, this will be set to `$PATH`, which Maven and Gradle will pick up. You can alternatively use the `javaHomeOption` option to point `JAVA_HOME` to the JDK that's installed and discovered (i.e through the JavaToolInstaller) or to a specific path on the agent.

For example (using JavaToolInstaller):

```yaml
- task: JavaToolInstaller@0
  inputs:
    versionSpec: '17'
    jdkArchitectureOption: 'x64'
    jdkSourceOption: 'PreInstalled'
```

If there is a version mismatch, you'll see Gradle exit with a message like this in the task logs:

```
...
Incompatible because this component declares an API of a component compatible with Java 17 and the consumer needed a runtime of a component compatible with Java 11
...
```

Maven will look like this if targeting a mismatched version from what it's pointing towards:

```
Fatal error compiling: error: invalid target release: <versionNumber>
```

#### Application Error : ( is shown at runtime
This is a very generic message, but this means your application/container is either timing out or crashing. A crucial step is to **ensure you have App Service Logs enabled**. Review [here](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) on how to do so.

You can now view your Application Logging (stdout/err) in any of these following areas, or more:
- **Diagnose and Solve Problems** -> **Application Logs** detector
- **Diagnose and Solve Problems** -> **Container Crash** or **Container Issues** detector
- **Log Stream**
- **Browsing the Kudu site directly** or through **FTP**
- **Using the AZ CLI**, and others

You can view additional Tomcat specific logging in troubleshooting scenarios, which gets generated in the form of the below files - these will be found on the Kudu site under `/home/LogFiles/Application` and can be accessed through FTP or browsing the Kudu site directly:
- catalina.<instance_name>.yyyy-mm-dd.log
- host-manager.<instance_name>.yyyy-mm-dd.log
- manager.<instance_name>.yyyy-mm-dd.log
- localhost.<instance_name>.yyyy-mm-dd.log

You can also review Application and Docker specific stdout/err logging under `/home/LogFiles` with `default_docker.log` and `docker.log` files.

Two general reasons this would happen after a new deployment is:
- **Container Crash** - Due to an unhandled exception/fatal error on start up. Examples such as: making a dependency call but this application wasn't whitelisted to be allowed to access the resource, missing files (doing some type of i/o operation on a non-existent file from an application level), missing environment variables, bad syntax, forgetting to change your Spring Profile (or other localhost based values) to that of remote resources, etc.
- **Container Timeout** - Due to the application/container starting, but timing out at 240 (s) ([the default](https://learn.microsoft.com/en-us/troubleshoot/azure/app-service/faqs-app-service-linux#is-it-possible-to-increase-the-container-warmup-request-timeout-)). Common scenarios are trying to bind to `localhost` in some fashion or application logic never returning an HTTP response. The Tomcat container listens on port 80, with Tomcat itself listening over 80 which is set by the default value of `-Dport.http`.

#### Default "parking page" is showing
This typically means your war is not under wwwroot (or wwwroot/webapps - depending on the deployment method). If not using the approach above, ensure the zip or single war being passed between stages and deployed actually contains the desired content. You can view the **Artifact** being passed between stages, if using this method, and review specifically what was produced in the Azure DevOps UI (this can also be downloaded):

![Deployed Gradle War](/media/2022/12/azure-blog-tomcat-linux-cicd-6.png)

It is advised to review the file content under `/home/site/wwwroot` (or `wwwroot/webapps`) when these scenarios occur (such as with FTP), to check that you're not accidentally deploying a nested zip. If this is the case we fallback to showing the default hosting page 

#### Pipeline is failing on the build or deploy stage
This can fail for various reasons, and is usually a product of the tasks being misconfigured here - troubleshooting this needs to be on the **Azure DevOps or GitHub Actions side**, especially if this is failing _only_ in the **Build** stage. This alone would mean this is not an App Service issue, but rather a pipeline issue.

You can review Azure DevOps task logs by clicking into each specific task in your pipeline UI - and can additionally [enable debug logs](https://learn.microsoft.com/en-us/azure/devops/pipelines/troubleshooting/review-logs?view=azure-devops).

The same be done from the GitHub Actions **Actions** tab in GitHub.

One common scenario is **`Error: No package found with specified pattern: /some/path/zip.zip`**. This may is normally related to the CopyFiles task or when trying to download said artifact into the Deploy stage. Review the CopyFiles task to ensure the file(s) or folders it's transferring to the next stage actually actually matches whats specified under the `Contents` property. Additionally, ensure your `SourceFolder` property is not set to a path that does **not** contain the `Contents` you're trying to transfer. You may need to investigate the `SourceFolder`, `TargetFolder` and `Contents` property locations all together. 

Another is on the **Deployment** task - such as **`"Error: No such file or directory or directory, stat /path/to/file/or/folder"`** when the Zip Deploy is initiated. This can happen due to the above, if deploying an incorrect file (non war, or non-zip), or the application source is missing a file from the build stage.

This is a direct product of how the pipeline is configured.

### DevOps - Tomcat Configuration for runtime
One popular configuration for Tomcat applications on App Service Linux is using [CATALINA_OPTS](https://learn.microsoft.com/en-us/azure/app-service/configure-language-java?pivots=platform-linux#set-java-runtime-options) to pass various arguments to the application and JVM at runtime. We can do all of this from our pipeline, in our our Deployment task, without having to manage it from the Azure Portal. Such as below:

```yaml
- task: AzureWebApp@1
  displayName: 'Azure Web App Deploy: myapp'
  inputs:
    azureSubscription: $(azureSubscription)
    appType: webAppLinux
    appName: $(webAppName)
    package: '$(Pipeline.Workspace)/drop/**/build/libs/somewar.war'
    appSettings: -CATALINA_OPTS "-Dfoo=bar"
```

Use the `-CATALINA_OPTS "-Dsome=value -Dfoo=bar"` syntax

> **NOTE**: Tomcat applications use CATALINA_OPTS, where as Java SE (Embedded Tomcat, .jar applications) use JAVA_OPTS - see [here](https://learn.microsoft.com/en-us/azure/app-service/configure-language-java?pivots=platform-linux#set-java-runtime-options)

## GitHub Actions
> GitHub Actions (`azure/webapps-deploy@v3`) does not use WarDeploy. This uses OneDeploy. Only `azure/webapps-deploy@v2` uses War Deploy

### Maven
To get started with GitHub Actions, create a Java on App Service Linux application. In this case, we'll still use a Java 17 runtime with Tomcat 9. After creating the application, do the following:

1. Go to **Deployment Center** in the Azure Portal on the App Service and select GitHub as the source

![Deployment Center](/media/2022/12/azure-blog-java-devops-deployment-9.png)

2. Select **Organization**, **Repository** and **Branch** - then click **Save**

![Deployment Center](/media/2022/12/azure-blog-java-devops-deployment-10.png)

This will now generate the following `.yml` which will be commited and created under `.github/<branch>_<appname>.yml`

3. Choose whether "User Assigned Identity" or "Publish Profile" authentication will be used. Publish Profile authentication requires "Basic Authentication" to be enabled on the App Service.

- For User Assigned Identity authentication this will generate the following `.yml` which will be committed and created under `.github/<branch>_<appname>.yml`

```yaml
name: Build and deploy WAR app to Azure Web App - myapp

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Java version
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'microsoft'

      - name: Build with Maven
        run: mvn clean install

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v4
        with:
          name: java-app
          path: '${{ github.workspace }}/target/*.war'

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}
    permissions:
      id-token: write #This is required for requesting the JWT

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v4
        with:
          name: java-app
      
      - name: Login to Azure
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZUREAPPSERVICE_CLIENTID_00000000000000000000000000000000 }}
          tenant-id: ${{ secrets.AZUREAPPSERVICE_TENANTID_00000000000000000000000000000000 }}
          subscription-id: ${{ secrets.AZUREAPPSERVICE_SUBSCRIPTIONID_00000000000000000000000000000000 }}

      - name: Deploy to Azure Web App
        id: deploy-to-webapp
        uses: azure/webapps-deploy@v3
        with:
          app-name: 'someapp'
          slot-name: 'Production'
          package: '*.war'
```

- For publish profile authentication this will generate the following `.yml` which will be committed and created under `.github/<branch>_<appname>.yml`

```yaml
# Docs for the Azure Web Apps Deploy action: https://github.com/Azure/webapps-deploy
# More GitHub Actions for Azure: https://github.com/Azure/actions

name: Build and deploy JAR app to Azure Web App - someapp

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Java version
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'microsoft'

      - name: Build with Maven
        run: mvn clean install

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v4
        with:
          name: java-app
          path: '${{ github.workspace }}/target/*.jar'

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}
    
    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v4
        with:
          name: java-app
      
      - name: Deploy to Azure Web App
        id: deploy-to-webapp
        uses: azure/webapps-deploy@v3
        with:
          app-name: 'someapp'
          slot-name: 'Production'
          package: '*.war'
          publish-profile: ${{ secrets.AzureAppService_PublishProfile_00000000000000000000000000000000 }}
```

Since the Maven executable being used here is a typical CLI approach, you pass additional parameters as needed. For example:

```
mvn clean install -DskipTests=true && mvn -v
```

Using this generated Actions Workflow should be all we need to get a successful deployment started. However, if your war is **not** named `ROOT` and you're seeing HTTP 404's after deployment, review the section below.

#### GitHub Actions - Why am I getting a 404 after deployment?
**Update**: `azure/webapps-deploy@v3` now uses OneDeploy, which will always, by default, deploy to a `ROOT` context with Tomcat - therefor doing manual configuration to deploy to a `ROOT` context does not need to be done. `azure/webapps-deploy@v2` however uses the older "War Deploy" API - which does _not_ inheritly deploy to a `ROOT`context. If using `azure/webapps-deploy@v2`, the below will still apply.

The same applies to what was covered in the [Maven section above](#why-am-i-getting-a-404-after-deployment). 

GitHub Actions uses the **War Deploy** API under the hood. If we turn on [debug logging](https://github.blog/changelog/2022-05-24-github-actions-re-run-jobs-with-debug-logging/), we can see what exactly is being called on the deployment task:

```
...
Package deployment using WAR Deploy initiated.
##[debug][POST] https://mysite.scm.azurewebsites.net:443/api/wardeploy?isAsync=true&name=azure-0.0.1-SNAPSHOT&message=...
...
```

> **NOTE**: If you want to avoid this behavior and use the recommended OneDeploy API, consider using `azure/webapps-deploy@v3`

Just as discussed in the Azure DevOps section, the name of our war is passed as a value to the `name` parameter, which deploys this to a Tomcat Context of the same name. Therefor, if your war is **NOT** named `ROOT`, it will be accessed under the name of your war (ex., https://sitename.azurewebsites.net/azure-0.0.1-SNAPSHOT)

#### GitHub Actions - What are other ways I can target a root site context?
> **NOTE**: If using `azure/webapps-deploy@v3`, this will by default deploy to a root context. Consider using this instead. Otherwise, follow the below.

As opposed to the Azure DevOps deployment task we used, the `azure/webapps-deploy@v2` deployment task does not have a property for setting the value of the `name` parameter in the War Deploy API. 

However, we can still deploy to root, below is an example using the AZ CLI in the deployment task:

```yaml
deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v4
        with:
          name: java-app

      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to Web App with Azure CLI
        uses: azure/CLI@v2
        with:
          azcliversion: latest
          inlineScript: |
            az webapp deploy --resource-group "myrg" --name "myapp" --src-path azure-0.0.1-SNAPSHOT.war --type war --async true
```

In this example, we use the help of the [azure/login@v1](https://github.com/Azure/login) and [azure/cli@v1](https://github.com/Azure/cli) task. As discussed in the [Maven - Azure DevOps](#azure-devops---why-am-i-getting-a-404-after-deployment) section, the Azure CLI uses the **OneDeploy** deployment API, which will automatically rename our war to `app.war` and place this directly under wwwroot - which maps to the root context with Tomcat.

As seen in the above Azure DevOps section, you can alternatively target a non-root path with the `--target-path` flag passed to `az webapp deploy`. The path should be relative (eg., `webapps/test`)


If you don't want to alter the workflow file - or can't, you can add `<finalName>ROOT</finalName>` to the `<build></build>` section of your `pom.xml`. This will name your war to `ROOT.war` and always be deployed in a root context.

You can review Mavens reference on this [here](https://maven.apache.org/pom.html#the-basebuild-element-set). 

**Renaming the war to ROOT.war in the pipeline**:

Another simple way is to just simply use a script in the pipeline to rename the war to `ROOT.war`. Below is the syntax for GitHub Actions:

```yaml
- name: Rename war to ROOT
  run: mv azure-0.0.1-SNAPSHOT.war ROOT.war
```

### Gradle
We'll set up GitHub Actions with our Spring Boot project and Gradle using the same approach as seen under the **GitHub Actions - Maven** section. 

**NOTE**: When setting this up from the Azure Portal as a first time project, it will default to using Maven, so your initial build may fail. We'll need to change the generated `.yml` file to the below:

```yaml
name: Build and deploy WAR app to Azure Web App - myapp

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Java version
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'microsoft'

      # This is the important change we need to make to switch between Maven to Gradle
      # Gradle is available on these runners through typical [CLI commands](https://docs.gradle.org/current/userguide/command_line_interface.html)
      - name: Build with Gradle
        run: gradle build

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v4
        with:
          name: java-app
          path: '${{ github.workspace }}/build/libs/azure-0.0.1-SNAPSHOT.war'

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}
    permissions:
      id-token: write #This is required for requesting the JWT

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v4
        with:
          name: java-app
      
      - name: Login to Azure
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZUREAPPSERVICE_CLIENTID_00000000000000000000000000000000 }}
          tenant-id: ${{ secrets.AZUREAPPSERVICE_TENANTID_00000000000000000000000000000000 }}
          subscription-id: ${{ secrets.AZUREAPPSERVICE_SUBSCRIPTIONID_00000000000000000000000000000000 }}

      - name: Deploy to Azure Web App
        id: deploy-to-webapp
        uses: azure/webapps-deploy@v3
        with:
          app-name: 'someapp'
          slot-name: 'Production'
          package: '*.war'
```

### GitHub Actions - Tomcat Configuration for runtime
As with Azure DevOps deployment tasks, you can use the `azure/appservice-settings@v1` and `azure/login@v1` tasks to configure runtime settings for your Tomcat application. The approach between the two differs - to set up proper credentials and authentication to add these App Settings, follow the documentation for `appservice-settings` [here](https://github.com/marketplace/actions/azure-app-service-settings).

Below is an example of using `CATALINA_OPTS` in our `deploy` stage:

```yaml
deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}
    
    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v2
        with:
          name: java-app

      - uses: azure/login@v2
        with:
          creds: '${{ secrets.AZURE_CREDENTIALS }}'

      - uses: azure/appservice-settings@v1
        with:
          app-name: 'myapp'
          app-settings-json: '[{ "name": "CATALINA_OPTS", "value": "-Dfoo=bar" }]' 

      - name: Deploy to Azure Web App
        id: deploy-to-webapp
        uses: azure/webapps-deploy@v3
        with:
          app-name: 'someapp'
          slot-name: 'Production'
          package: '*.war'

      - run: |
          az logout
```

### Troubleshooting
#### Error: More than one package matched with specified pattern: *.war. Please restrain the search pattern.
This may happen in the default generated template where a glob pattern is specified for any file matching a `.war` extension. As with Maven and Gradle both, they package two wars on the build output, which means, unless otherwise configured - per build you will be outputting two (2) .war files to the /build (Gradle) or /target (Maven) directory.

This same issue can happen in any of the pipelines using a glob pattern for a wild-card or general search pattern.

To resolve this, either tighten down the glob pattern being used, or, if using a specific or easily identified naming scheme for your war file, replace the `path` and `package` properties in the above `.yml` with the name of the war specifically - example: `azure-0.0.1-SNAPSHOT.war `. This same approach can be used in any of the CI/CD examples in this post.

#### Other troubleshooting
Most other troubleshooting can follow whats listed under the [DevOps troubleshooting section](#troubleshooting), respective of task syntax differences.





