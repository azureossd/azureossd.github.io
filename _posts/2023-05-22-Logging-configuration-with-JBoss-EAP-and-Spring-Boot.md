---
title: "Logging configuration with JBoss EAP and Spring Boot"
author_name: "Anthony Salemo"
tags:
    - JBoss EAP
    - Java
    - Deployments
    - Troubleshooting
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration
    - Java # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - JBoss EAP
    - Troubleshooting 
header:
    teaser: /assets/images/javalinux.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-05-22 12:00:00
---

This post will cover some logging configuration that can be done with Spring Boot, packaged as a WAR file, deployed to a JBoss EAP instance on App Service Linux.

# Overview
If deploying a Spring Boot application, packaged as a WAR, to a JBoss EAP instance - you may notice that Spring specific output may not show. By default, we'll see stdout and stderr from JBoss.

We'll cover some different methods below to configure logging to change this.

# Log File locations
> **NOTE**: Consider sending logs to Azure Monitor (Log Analytics workspace based) for a better approach at persisting logs, which also makes it much more searchable, as opposed to file system logs like in this blog. You can also send logs externally to log retention providers of your choice. 

As with all "Blessed" Images, stdout and stderr is redirected to `default_docker.log`. This includes typically the Web Server logging (in this case, Jboss and Undertow) - plus, application logging.

If absolutely needed, logging directory locations can be changed for certain files. In the current JBoss Blessed Image, there are a few files that are created for JBoss, GC, and the application. Some of this is redirected to `default_docker.log` already - and should generally suffice, however, some other files live under `/tmp/LogFiles`. The files under `/tmp/LogFiles` are:

- `gc.log` - Logs for Garbage Collection
- `audit.log`
- `server.log` - Logs for JBoss specific activity (the content here is redirected to `default_docker.log`)
- `Application/server.[host].log` - Logs for JBoss specific activity and application stdout/err (the content here is redirected to default_docker.log)
- `http/RawLogs/site_access_log.[host].txt` - HTTP access logs

This location is configured through a default `JAVA_OPTS` parameter on startup, provided a part of the Blessed Image, for example:

```
JAVA_OPTS:  -server -Xlog:gc*:file="/tmp/LogFiles/gc.log": ... -Djboss.server.log.dir=/tmp/LogFiles ... -XX:ErrorFile=/home/LogFiles/java_error_test-jboss_ln0sdlwk0000M2_%p.log ... -XX:HeapDumpPath=/home/LogFiles/java_memdump_test-jboss_ln0sdlwk0000M2.log  
```

You can override these locations by setting your own location for. For example, by changing the parameter of `-Djboss.server.log.dir=/tmp/LogFiles` to `-Djboss.server.log.dir=/home/LogFiles/Custom` - this will now create all of the above files under /home/LogFiles/Custom.

> **Note**: Doing this could potentially more quickly fill up the persistent Storage quota. Or potentially impact performance since more I/O operations will be going through the mounted volume to the File Server

# Spring Boot logging and JBoss
## Enable logging - application.properties/application.yaml
This is one of the more simple ways. Update the `application.properties` or `application.yaml` file under `src/main/resources` in the application with the below:

(application.properties)

```properties
logging.level.root=info
```

(application.yaml)
```yaml
logging:
    level:
        root: info
```

**NOTE:** If Log Level is not info, normal logging, such as println statements may not show. Additionally, you may see this message if this is `logging.level.root` is not set:

```
Handler java.util.logging.ConsoleHandler is not defined
```

## Enable logging - JBoss CLI
You can use the JBoss CLI and custom startup scripts to override this. This is a combination of:

- Following [Configure Data Sources - JBoss EAP Data Sources](https://learn.microsoft.com/en-us/azure/app-service/configure-language-java?pivots=platform-linux#jboss-eap-data-sources)
- Following RedHat's JBoss documentation to [Configure a Log Category in the CLI](https://access.redhat.com/documentation/en-us/jboss_enterprise_application_platform/6/html/administration_and_configuration_guide/configure_a_log_category_in_the_cli1#doc-wrapper)

1. (Optional): Add `JAVA_OPTS` as an App Setting with the value of `-Djboss.server.log.dir=/home/LogFiles`.
2. Ideally, the updated logging will also be written to `default_docker`.log

Add a file named `startup_script.sh` under `/home`:

```bash
#!/usr/bin/env bash

echo "Entering startup_script.sh.."

$JBOSS_HOME/bin/jboss-cli.sh --connect --file=/home/site/deployments/tools/jboss-cli-commands.cli
```

3. Add a file named `jboss-cli-commands.cli` under `/home/site/deployments/tools`
4. In this file, add the below:

```bash
#!/usr/bin/env bash

# Replace com.jboss.azure with the main package name of the application
/subsystem=logging/logger=com.jboss.azure:add 
# Add a category for 'stdout', otherwise stdout from print statements or others from the application may not show
/subsystem=logging/logger=stdout:add
/subsystem=logging/logger=com.jboss.azure:write-attribute(name="level", value="INFO") 
/subsystem=logging/logger=com.jboss.azure:write-attribute(name="use-parent-handlers", value="true") 
/subsystem=logging/logger=stdout:write-attribute(name="level", value="INFO") 
/subsystem=logging/logger=stdout:write-attribute(name="use-parent-handlers", value="true") 
```

You should now start seeing Spring Boot logging in `server.[machineName].log` and `default_docker.log`:

```
2023-05-22T20:24:13.152474492Z [0m[0m20:24:13,151 INFO  [stdout] (ServerService Thread Pool -- 82) 
2023-05-22T20:24:13.153479310Z [0m[0m20:24:13,152 INFO  [stdout] (ServerService Thread Pool -- 82)   .   ____          _            __ _ _
2023-05-22T20:24:13.154400426Z [0m[0m20:24:13,153 INFO  [stdout] (ServerService Thread Pool -- 82)  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
2023-05-22T20:24:13.156788269Z [0m[0m20:24:13,156 INFO  [stdout] (ServerService Thread Pool -- 82) ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
2023-05-22T20:24:13.157297978Z [0m[0m20:24:13,156 INFO  [stdout] (ServerService Thread Pool -- 82)  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
2023-05-22T20:24:13.158924407Z [0m[0m20:24:13,157 INFO  [stdout] (ServerService Thread Pool -- 82)   '  |____| .__|_| |_|_| |_\__, | / / / /
2023-05-22T20:24:13.159758122Z [0m[0m20:24:13,158 INFO  [stdout] (ServerService Thread Pool -- 82)  =========|_|==============|___/=/_/_/_/
2023-05-22T20:24:13.160641038Z [0m[0m20:24:13,160 INFO  [stdout] (ServerService Thread Pool -- 82)  :: Spring Boot ::                (v2.6.7)
2023-05-22T20:24:13.161472853Z [0m[0m20:24:13,160 INFO  [stdout] (ServerService Thread Pool -- 82) 
2023-05-22T20:24:13.170895022Z [0m[0m20:24:13,170 INFO  [com.jboss.azure.ServletInitializer] (ServerService Thread Pool -- 82) No active profile set, falling back to 1 default profile: "default"
2023-05-22T20:24:13.369726587Z [0m[0m20:24:13,369 INFO  [com.jboss.azure.ServletInitializer] (ServerService Thread Pool -- 82) Started ServletInitializer in 0.27 seconds (JVM running for 110.683)

2023-05-22T20:24:57.671594299Z [0m[0m20:24:57,670 INFO  [stdout] (default task-1) This is logged from:com.jboss.azure.Controllers.HomeController
```

For other ways on how to use the JBoss CLI and the logging subsystem, check out Redhat's JBoss EAP documentation here:
- [RedHat - JBoss - Logging Subsystem tuning](https://access.redhat.com/documentation/en-us/red_hat_jboss_enterprise_application_platform/7.4/html-single/performance_tuning_guide/index#logging_tuning)
- [RedHat - JBoss - Logging Subsystem Configuration](https://access.redhat.com/documentation/en-us/jboss_enterprise_application_platform/6/html/administration_and_configuration_guide/chap-the_logging_subsystem)

## Spring Boot Starter logger dependency conflict
If trying to use slf4j within code, you may see this:

```java
Caused by: java.lang.IllegalArgumentException: LoggerFactory is not a Logback LoggerContext but Logback is on the classpath
```

To resolve this, you need to exclude spring-boot-starter-logging which is apart of spring-boot-starter.

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter</artifactId>
    <exclusions>
      <exclusion>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-logging</artifactId>
    </exclusion>
  </exclusions>
</dependency>
```

**NOTE:** If you exclude `spring-boot-starter-logging`, you may notice that there will be no logs from your Spring Boot application - only logs from JBoss's context. You can use the above methods for reenabling this functionality.