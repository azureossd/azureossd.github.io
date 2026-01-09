---
title: "Installing troubleshooting tools in Java custom containers"
author_name: "Anthony Salemo"
tags:
    - Azure App Service on Linux
    - Azure Web App for Containers
    - Configuration
    - Java
    - Troubleshooting
categories:
    - Troubleshooting    
    - How-To
    - Configuration
    - Docker
    - Java
header:
    teaser: "/assets/images/javalinux.png" 
toc: true
toc_sticky: true
date: 2022-07-18 12:00:00
---

During performance troubleshooting, sometimes you may need to install various tooling to help track down a problem. With Java, common ones that can be used are Java Flight Recorder, jStack, or jMap. However, if your Docker Image happens to use a JRE (Java Runtime Environment) instead of a JDK (Java Development Kit), then there is a likely chance that these tools aren't installed.

For example:

- A custom Docker Image built that uses a JRE base image - which would likely not have anything pre-installed in regards to troubleshooting tooling:

    ```Dockerfile
    FROM openjdk:11.0.15-jre
    ```

    When trying to run various tooling commands in an `ssh` session, we get the following:

    ```
    root@0684fb751960:/home# jcmd  
    -bash: jcmd: command not found
    ```

- A Docker Image that uses a JDK base image - this ideally would have pre-installed troubleshooting tooling:

    ```Dockerfile
    FROM openjdk:11.0.15-jdk
    ```

    And therefor we can access this within the container:

    ```
    root@f5416d627ad5:/# jcmd
    24 /app/jre-0.0.1-SNAPSHOT.jar
    56 jdk.jcmd/sun.tools.jcmd.JCmd
    ```


This is due to a Development Kit normally including everything that needs to the run the application, plus more, for general application development - as opposed to a Runtime Environment, which just includes what's needed to run the application.

**Due to the size of these extra tools, packages, or others - using just the JRE may be a better option for production. Below will show a way to install this tooling when needed.**

> **NOTE**: Azure App Service Blessed Images for Java include the tooling we're covering by default. The scope of this post is purely for custom containers/images.

## Important prerequisites
### SSH access
**SSH needs to be integrated with the Dockerfile** or else you will not be able move further with this blog post. [Review this post](https://azureossd.github.io/2022/04/27/2022-Enabling-SSH-on-Linux-Web-App-for-Containers/index.html) on how to integrate it, which includes some examples for various runtimes or OS types.

### Enable persistent storage
By default, the [AppSetting](https://docs.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal) `WEBSITES_ENABLE_APP_SERVICE_STORAGE` is set to `false` for custom containers. Prior to doing any troubleshooting, change the value of this to `true`.

![Persistent Storage AppSetting](/media/2022/07/azure-ossd-java-cc-ts-1.png)

This will mount Azure App Services persistent storage as a volume to the `/home` directory (like we do on App Service Blessed Images). This can then easily be used to download files after taking traces/dumps.

If this is not enabled, files will likely not be retrievable.

> **NOTE**: Changing AppSettings will restart the container. Previous temporary/non-persistent files will be lost.

### Install a JDK that matches your Java version
To avoid any issues, install a JDK that matches your Java version. eg., Java 8 or Java 11.

## Install the JDK in the container
### Debian/Ubuntu

SSH into the container and run the following - this example assumes we're using a Java 11 based application:

```
apt-get update -yy
apt-get install openjdk-11-jdk -yy
```

> **NOTE**: If you see `update-alternatives: error: error creating symbolic link '/usr/share/man/man1/java.1.gz.dpkg-tmp': No such file or directory`, run `mkdir -p /usr/share/man/man1` and run the install command again.

This will now install some of the following tools, which should be available on `$PATH` - jcmd, jstack and jmap. Relevant executables can be found under `/usr/bin/`

If it's unclear where the tools have been installed, use the `whereis` or `which` command:
ex: `whereis jstack`, `which jstack`

> **NOTE**: Installation location for tools may differ depending on the JDK installed. 

#### JFR (jcmd)
Running `jcmd` from the container after installing the JDK should now show something like the following:

```
root@fc0c6df5003c:/# jcmd
23 /app/jre-0.0.1-SNAPSHOT.jar
2776 jdk.jcmd/sun.tools.jcmd.JCmd
```

To start a trace, run the following: `jcmd <Java PID> JFR.start name=MyRecording settings=profile duration=30s filename="/home/example.jfr"`

This should output the `.jfr` file to `/home`:

```
root@fc0c6df5003c:/usr/bin# ls /home
ASP.NET  Data  LogFiles  example.jfr  site
```

Review the Java Flight Recording documentation for further usage.

#### jStack
Running `jstack` from the container should show the following:

```
root@fc0c6df5003c:/usr/bin# jstack
Usage:
    jstack [-l][-e] <pid>
        (to connect to running process)

Options:
    -l  long listing. Prints additional information about locks
    -e  extended listing. Prints additional information about threads
    -? -h --help -help to print this help message
```

Run the following to generate a thread dump: `jstack <Java_PID> > /home/jstack.txt`

This should output a thread dump to `/home`, which we can see with the following:

```
root@fc0c6df5003c:/usr/bin# ls /home/
ASP.NET  Data  LogFiles jstack.txt  site
```

Review the jStack documentation for further usage.

#### jMap

Running `jmap` from the container should show the following:

```
root@fc0c6df5003c:/# jmap
Usage:
    jmap -clstats <pid>

    ...<truncated output>
```

A heap dump can be taken with jMap - the following command is an example: `jmap -dump:format=b,file=/home/dump.hprof <Java_PID>`

Review the jmap documentation for further usage.

### Alpine

SSH into the container and run the following:

```
apk add openjdk11
``` 

The same commands as above should now be accessible on `$PATH`.


## Download the files from the container

With `WEBSITES_ENABLE_APP_SERVICE_STORAGE` set to `true`, we can download these files we generated under `/home` with an FTP client (FileZilla, WinSCP).

These can be downloaded with the Kudu API as well (`https://yoursitename.scm.azurewebsites.net/api/logs/docker/zip`) by moving the profiles/thread/heapdump files into the `/home/LogFiles` directory first.




