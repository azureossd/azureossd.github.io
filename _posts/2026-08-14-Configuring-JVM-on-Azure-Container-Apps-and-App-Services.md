---
title: "Configuring JVM settings on Azure Container Apps and App Service (and why JAVA_OPTS may not work)"
author_name: "Ragu Karuturi"
tags:
    - Java
    - Memory
    - Configuration
categories:
    - Azure Container Apps
    - Azure App Service on Linux
    - Java
    - Configuration
header:
    teaser: "/assets/images/javalinux.png"
toc: true
toc_sticky: true
date: 2026-08-14 12:00:00
---

## Overview

This post explains how JVM heap settings are (and aren't) honored on **Azure Container Apps** and **Azure App Service**, across custom Docker images, built-in ("blessed") images, and code/artifact deployments. 

While the idea is relevant to various other JVM settings, this post will focus on setting the **heap size** which is a much more commonly observed issue. 

## TL;DR

- Off the bat, this is one of the main takeaways. The JVM by default is unaware and does **not** read `JAVA_OPTS`. `JAVA_OPTS` is a shell-script convention honored only when a platform or custom launcher script explicitly passes it to `java`. 
- The JVM **does** read `JAVA_TOOL_OPTIONS` and `JDK_JAVA_OPTIONS` on its own and those are the reliable ways to inject settings in general, for all java applications (hosted on Azure or otherwise). Ex (for setting the heap size): `-Xmx`/`-XX:MaxRAMPercentage`. 
- Whether `JAVA_OPTS` works depends entirely on **who launches `java`**. An App Service *blessed* Java image reads it for you while a custom Docker image that runs `java -jar app.jar` does not.
- By default a container aware JVM caps the heap at 25% of container memory. If nothing raises that, large requests and related processing could lead to heap exhaustion and application errors.

## How the JVM decides its heap size

Modern JVMs are container aware. `-XX:+UseContainerSupport` is on by default (JDK 10+), so the JVM reads the container's memory limit rather than the host's. From that limit it derives a **default maximum heap**. Per Microsoft's [Containerize your Java applications](https://learn.microsoft.com/en-us/azure/developer/java/containers/overview) ergonomics table (valid for OpenJDK 11+ across Microsoft Build of OpenJDK, Azul Zulu, Oracle OpenJDK, and others):

| Memory available | Default maximum heap size |
| --- | --- |
| Up to 256 MB | 50% of available memory |
| 256 MB to 512 MB | ~127 MB |
| More than 512 MB | 25% of available memory |

For instance, on a **4 GB** container the default max heap is only **~1 GB**. If your workload needs more than that (Ex: csv build, in-memory cache, a report build etc), you could run into an `OutOfMemoryError: Java heap space` error, even though the container has gigabytes free. This would **not** result in a platform OOM kill event. Depending on which thread hits the limit and whether the app handles it, the JVM may terminate (the container then exits with the Java error and is restarted) or the app may keep running in a degraded state. Either way you diagnose it from the **application logs**. The heap exhaustion stack trace is on the JVM's std out/err logs which is captured by the platform into application logs. 

To fix this, you must get `-Xmx` (or `-XX:MaxRAMPercentage`) either **onto the `java` command line** or **into an environment variable the JVM reads on its own**.

## Below are the environment variables generally referenced

| Variable | Read by the JVM itself? | Where it's defined |
| --- | --- | --- |
| `JAVA_TOOL_OPTIONS` | **Yes** | Prepended to the options at startup 
| `JDK_JAVA_OPTIONS` | **Yes** | Prepended to the `java` launcher command line (JDK 9+) 
| `_JAVA_OPTIONS` | **Yes** | Legacy and not recommended
| `JAVA_OPTS` | **No** | Not a JVM variable and generally needs a launcher script

### Some context about JAVA_OPTS

`JAVA_OPTS` is a convention that originated outside the Java platform in various community projects such as Apache Tomcat's `catalina.sh` script which expands `java $JAVA_OPTS $CATALINA_OPTS …`, and the same pattern was adopted by Maven (`MAVEN_OPTS`), Gradle, Jenkins, the Spring Boot build plugins, and various Docker entrypoint scripts. So while the support may be broad, it's not native. The launcher itself never consults `JAVA_OPTS` and the variable is not documented in the Oracle `java` command reference unlike `JDK_JAVA_OPTIONS` and `JAVA_TOOL_OPTIONS`.`JAVA_OPTS` works only when something in the startup chain has been written to forward it to the JVM.

The JVM however **always checks** for `JAVA_TOOL_OPTIONS` at startup, and the `java` launcher **always checks** for `JDK_JAVA_OPTIONS` (Java 9+). In some cases, the platform may set some values for `JAVA_TOOL_OPTIONS` and with App Service, the platform also recognizes `JAVA_OPTS` (custom and specific to Azure App Service).

Below is a general overview:

| Environment | JVM checks `JDK_JAVA_OPTIONS` or `JAVA_TOOL_OPTIONS`? | Does the platform set any defaults 
| --- | --- | --- |
| Local machine / Linux VM | Yes | No (unless you add them to a profile) 
| Custom Docker image: general | Yes | No, unless your `Dockerfile` has an `ENV` line 
| Azure Container Apps:custom image | Yes | Sets `JAVA_TOOL_OPTIONS` in some cases. Ex: when Java core metrics are enabled 
| Azure Container Apps: code, source/JAR (buildpack) | Yes | Sets `JAVA_TOOL_OPTIONS` via the memory-fit calculator 
| App Service Linux: Custom Container | Yes | No, unless your `Dockerfile` has an `ENV` line 
| App Service Linux: code, blessed image | Yes | But also reads `JAVA_OPTS`. Adds `-XX:…` flags through its startup script (via `JAVA_OPTS`/`CATALINA_OPTS`) 

Azure's documented injection mechanisms read but currently do **not** set `JDK_JAVA_OPTIONS` and hence it's the safe option today. JAVA_TOOL_OPTIONS could also be used and the platform appends any custom settings to the defaults. 

## Azure Container Apps

### Source code or JAR deployment: automatic memory fitting

When you deploy from source code or a JAR (`az containerapp up --source .` or `--artifact app.jar`), ACA Platform builds the image with Cloud Native (Oryx++) buildpacks with Microsoft Build of OpenJDK as the runtime base. If you would rather run the buildpack build yourself, in your registry, `az acr pack build` lets you choose the builder, but the public builders bring their own JDK distribution. Example below with Paketo builder:

```bash
az acr pack build -r <registry> -t <image>:<tag> --builder paketobuildpacks/builder-jammy-base --pull .
```

You can inspect various images before usage. It is useful to check the vendors, JDK versions, build tools, base OS etc. 

```bash
docker pull paketobuildpacks/builder-jammy-base
docker inspect paketobuildpacks/builder-jammy-base \
  --format '{{index .Config.Labels "io.buildpacks.builder.metadata"}}' \
  | jq -r '. | keys[]' #lists all keys
docker inspect paketobuildpacks/builder-jammy-base \
  --format '{{index .Config.Labels "io.buildpacks.builder.metadata"}}' \
  | jq -r '.description' #base image and builders
```

Regardless, the Java buildpack includes a **Java Memory Calculator** that runs at startup, computes `-Xmx`, `-XX:MaxMetaspaceSize`, `-XX:ReservedCodeCacheSize`, `-Xss`, and `MaxDirectMemorySize` from the container memory, thread count, and loaded class count, and injects them **via `JAVA_TOOL_OPTIONS`**. This feature is called **automatic memory fitting** (see [Use memory efficiently for Java apps in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/java-memory-fit)).

Because the buildpack builds the image, it attempts to detect the JDK version (ex: pom.xml from source deployment or the manifest file in a jar) and it may alternatively default to a recent LTS. It's recommended that you explicitly pin the version with the build environment variable **`BP_JVM_VERSION`** as below:

```bash
az containerapp up -n myapp -g rg --environment myenv --artifact app.jar \
  --build-env-vars BP_JVM_VERSION=17
```

You can view the automatic memory fit details in the log stream at startup:

```text
Calculated JVM Memory Configuration: -XX:MaxDirectMemorySize=10M -Xmx1498277K -XX:MaxMetaspaceSize=86874K -XX:ReservedCodeCacheSize=240M -Xss1M (Total Memory: 2G, Thread Count: 250, Loaded Class Count: 12924, Headroom: 0%)
Picked up JAVA_TOOL_OPTIONS: -XX:MaxDirectMemorySize=10M -Xmx1498277K ...
```

Memory fitting applies when **(1)** a single Java app runs in the container and **(2)** the app is deployed from source or a JAR. It is enabled by default and is disabled when:

- Container memory is less than 1 GB, or
- You already specify memory options through `JAVA_TOOL_OPTIONS` (`-XX:MaxRAMPercentage`, `-Xmx`, `-Xms`, `-XX:MaxMetaspaceSize`, etc.), or
- The calculated heap/non-heap size would be too small (< 200 MB).

To disable it manually, set `BP_JVM_FIT=false`. 

### Custom Docker image (bring your own image)

When you deploy your own image, Container Apps runs your image's `ENTRYPOINT`/`CMD` as-is. If that command is a plain `java -jar app.jar`, then `JAVA_OPTS` is never referenced and your heap flag is silently ignored and the JVM falls back to the 25% default.

To set the heap on a custom image, use one of:

- Add the flag to a JVM-native variable, e.g. `JDK_JAVA_OPTIONS=-XX:MaxRAMPercentage=75`. Using `JDK_JAVA_OPTIONS` avoids colliding with the platform-managed `JAVA_TOOL_OPTIONS`.
- Add it to the launcher in your image startup script: `CMD ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app.jar"]`.
- Fix your entrypoint script to forward the defined `$JAVA_OPTS` (e.g. `exec java $JAVA_OPTS -jar app.jar`). This is not recommended but remains an option if you want to keep using `JAVA_OPTS`. 

## Azure App Service

### Built-in ("blessed") Java SE, Tomcat, and JBoss images

On the built-in Java images, App Service platform's startup script builds the `java`/Tomcat launch command and **reads `JAVA_OPTS` for you**. From the [App Service environment variables reference](https://learn.microsoft.com/en-us/azure/app-service/reference-app-settings?tabs=kudu%2Cdotnet):

- `JAVA_OPTS` — "For Java Standard Edition (SE) apps, environment variables to pass into the `java` command. … For Tomcat, use `CATALINA_OPTS`."
- `CATALINA_OPTS` — "For Tomcat apps, environment variables to pass into the `java` command."
- `WEBSITE_JAVA_MAX_HEAP_MB` — "Maximum size of the Java heap, in megabytes. **Note: if `JAVA_OPTS` is defined and already contains one of the `-Xms` or `-Xmx` options, then `WEBSITE_JAVA_MAX_HEAP_MB` is not used.**"

### Custom container on App Service

If you run a **custom container** on App Service (Web App for Containers), App Service no longer owns the startup command. Your image's `ENTRYPOINT` or `CMD` does and the approach is the same as with Container Apps (custom image) above. 

## Skipping heap tuning entirely with `jaz`

If your image is built `FROM` a [Microsoft Build of OpenJDK](https://learn.microsoft.com/en-us/java/openjdk/containers) base, you can use the **Azure Command Launcher for Java** (`jaz`) instead of tuning the heap yourself. Note that this is not yet **GA** and not a default today, even on the ACA platform build that uses Microsoft OpenJDK.

**Note**: 
- `jaz` is in Public Preview and not **GA**, so validate it on your exact base image before production.
- If your base image isn't a Microsoft OpenJDK image, `jaz` isn't present, but you can install it and use it. 
- The Microsoft OpenJDK **distroless** images currently launch with the vanilla `java` launcher, not `jaz`, and may default to `jaz` once it reaches GA. 

To use `jaz`, point the startup command at `jaz` instead of `java`. It auto-sizes heap and GC from the container's limits, so setting `-Xmx` or other heap env vars is not needed. If `jaz` detects your own tuning flags it keeps them, so you can still override when needed. It works the same way on Container Apps and App Service, and for both custom container and code or artifact deployments. Below is an example:

```bash
az containerapp update -n myapp -g rg --command "jaz" --args "-jar" "/app.jar"
```

## Precedence when more than one is set

The JVM assembles options in this order.

```text
JAVA_TOOL_OPTIONS  →  JDK_JAVA_OPTIONS  →  explicit command-line args
   (lowest)                                       (highest)
```

So `JDK_JAVA_OPTIONS` takes precedence over `JAVA_TOOL_OPTIONS` and an explicit `-Xmx` on the actual `java` command takes precedence over both env vars. 


## How to verify what the JVM actually got

From inside a running instance (Console or SSH):

```bash
# List running JVMs with their main class/jar, and note your app's PID:
jcmd -l

# What's set in the environment:
env | grep -iE 'JAVA_OPTS|JAVA_TOOL_OPTIONS|JDK_JAVA_OPTIONS'

# The actual maximum heap that JVM chose (replace <pid>):
jcmd <pid> VM.flags | tr ' ' '\n' | grep -iE 'MaxHeapSize|MaxRAMPercentage'

# If -Xmx was on that process's command line?
cat /proc/<pid>/cmdline | tr '\0' ' '; echo
```

In log streams, look for `Picked up JAVA_TOOL_OPTIONS: …` and (on buildpack builds) `Calculated JVM Memory Configuration: …`. On App Service blessed Java images, you can also enable `WEBSITE_JAVA_GC_LOGGING=1` to capture GC behavior and details.

## References

- [Use memory efficiently for Java apps in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/java-memory-fit)
- [Java on Azure Container Apps overview](https://learn.microsoft.com/en-us/azure/container-apps/java-overview)
- [Containerize your Java applications (Java on Azure)](https://learn.microsoft.com/en-us/azure/developer/java/containers/overview)
- [Container images for the Microsoft Build of OpenJDK](https://learn.microsoft.com/en-us/java/openjdk/containers)
- [Environment variables and app settings reference — Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/reference-app-settings?tabs=kudu%2Cdotnet)
- [The `java` Command — JDK 21 (Oracle)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)
