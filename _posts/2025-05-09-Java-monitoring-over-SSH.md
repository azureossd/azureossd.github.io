---
title: "Java monitoring over SSH"
author_name: "Denis Fuenzalida, Rodrigo Gallazzi"
tags:
    - Java
    - Monitoring
    - Troubleshooting
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Java # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Diagnostics # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/javalinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2025-05-09 12:00:00
---
This post will cover how to remotely connect to the JVM when running on Azure App Service with Java. 

# Overview 

We can connect to a remote running Java VM and inspect the Java virtual machine and Management Extensions (JMX) in real time, using port forwarding over SSH (the same technique used for debugging Java apps.)

The internals of the JVM can be explored using different tools, including JConsole (bundled with the JDK), Java Mission Control (from Oracle, free) and Visual VM (free, now part of the GraalVM project)

## Configuration for Java (standalone) and Apache Tomcat

We'll use port `1234` for debugging and standalone Web app running on Java 17 on App Service. The same technique can be also used with Apache Tomcat.

Create JAVA_OPTS on the portal with the following value (all in one line):
-Dcom.sun.management.jmxremote=true -Djava.rmi.server.hostname=localhost -Dcom.sun.management.jmxremote.port=1234 -Dcom.sun.management.jmxremote.rmi.port=1234 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false -Dcom.sun.management.jmxremote.local.only=true

![Add environment variables](/media/2025/05/AddAppSettingsJava.png)

Using `Kudu`, you can confirm that port 1234 is listening for connections. Open a new SSH connection and run the following commands:
On Alpine-based images (Java 8, Java 11, Tomcat 8.5, Tomcat 9) the command is:

`netstat -lp | grep java`


![netstat command](/media/2025/05/netstat1.png)

On Ubuntu-based images (Java 17, Tomcat 10), install the net-tools package to have the netstat command, then run `netstat -ap | grep java` instead:

![netstat command 2](/media/2025/05/netstat2.png)


## Create a remote connection and SSH tunnel

 Run in one terminal:
 
 `az webapp create-remote-connection --resource-group myjava17jmxdemo-rg --name myjava17jmxdemo --port 9000`


 Run in another terminal:
 
 `ssh -L 1234:127.0.0.1:1234 root@127.0.0.1 -p 9000 -m hmac-sha1`
 
 Enter the password shown in the output of the "az webapp" command when asked


![password screenshot](/media/2025/05/pwddocker.png)

Now you can use several alternatives to connect to your application and inspect the runtime.


## JConsole (bundled with the JDK)

 Run `Jconsole`, then create a remote connection to `127.0.0.1:1234`

 ![Jconsole connection](/media/2025/05/jconsoleconn.png)

 Click on "Insecure connection" (it's over the SSH tunnel so it's OK)

 ![Jconsole connection](/media/2025/05/jconsolemonitoring.png)

 Beans annotated to be exposed through JMX will show up under Mbeans (see the Spring Boot code example futher down the page):

 ![Jconsole Beans](/media/2025/05/jconsolebeans.png)

## Java Mission Control [JDK Mission Control-Oracle.com-](https://www.oracle.com/java/technologies/jdk-mission-control.html)

 Create a new JVM connection. Hit Finish, open the connection "localhost:1234" and double-click on "Mbean server":

 ![JVM Connection](/media/2025/05/jvmconnection.png)

 ![JMC Screen](/media/2025/05/jvmscreen.png)

## Visual VM [Visual VM Homepage](https://visualvm.github.io/)

 Launch with: `visualvm.exe --jdkhome "C:\Program Files\Microsoft\jdk-17.0.6.10-hotspot"`

 Add a new JMX connection:

 ![VisualVM](/media/2025/05/visualvm.png)

 ![VisualVM screen](/media/2025/05/visualvmscreen.png)

## Exposing beans / resources through JMX
 Example of a JMX-enabled resource with a minimal Spring Boot app:

 ```java 
 package com.example.demo;

 import org.springframework.boot.SpringApplication;
 import org.springframework.boot.autoconfigure.SpringBootApplication;
 import org.springframework.jmx.export.annotation.ManagedResource;
 import org.springframework.web.bind.annotation.GetMapping;
 import org.springframework.web.bind.annotation.RequestParam;
 import org.springframework.web.bind.annotation.RestController;

 @SpringBootApplication
 @RestController
 @ManagedResource
 public class DemoApplication {
    @GetMapping("/")

    public String root() {
        return "it works!";
    }

    @GetMapping("/hello")
        public String hello(@RequestParam(value="name", defaultValue="World") String name) {
        String reply = String.format("Hello, %s!", name);
        return reply;
    }

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
 }

 ```

## See also
 [JMX Ports - Baeldung](https://www.baeldung.com/jmx-ports)
 [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/docs/3.0.5/reference/htmlsingle/#actuator.jmx)



