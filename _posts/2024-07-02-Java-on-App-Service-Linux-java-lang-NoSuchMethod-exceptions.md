---
title: "Java on App Service Linux - java.lang.NoSuchMethod exceptions"
author_name: "Anthony Salemo"
tags:
    - Java
    - Configuration
    - Troubleshooting
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration
    - Java # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Troubleshooting 
header:
    teaser: /assets/images/javalinux.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-07-03 12:00:00
---

This post will discuss reasons behind why you may see "java.lang.NoSuchMethod" exceptions with Java on App Service Linux.

# Overview
This post technically would also apply to Java on App Service Windows, and, Web App for Containers that use Java. This includes Tomcat-deployed applications.

In the context of App Service and this post - `java.lang.NoSuchMethod` would be seen at runtime. This may cause HTTP 500-level status codes. At times, the behavior of this can seem random - although this exception is extensively covered in the Java community as a whole, the below post will dive further into this on the context of App Service.

-----

For what's described later in this post, this error will present itself at runtime - this could either be directly after application startup or when a certain class is accessed (eg. only hitting a certain path or logic). The full error may look something like this:

```java
Caused by: java.lang.NoSuchMethodError: com.some.package.ClassNameThatIsFailing
```

At a high level, this could be a few different reasons:
- Application code is trying to access a method that is `private` and therefor not in scope or visible. This, however, would likely fail at compile time. 
- Application code referencing a method of a class that simply does not exist at runtime. This could either be due to external library class methods or native Java API's

More commonly, the issue is on point 2), where _Application code referencing a method of a class that simply does not exist at runtime_. This could be due to even more reasons - being more specific now:
- **Standard library classes**: If using Java standard library API's - a developer may have built and ran against Java 8. But later on, the runtime was changed to Java 11. The standard library API they were using **has had it's method changed or removed** - therefor, this method may not be found anymore. Which would cause `java.lang.NoSuchMethodError`
- **External classes and dependencies**: An application is using dependencies, and they are unknowingly using **multiple** versions of the same dependencies. Under `WEB-INF/lib` in a Java SE `.jar` (or `/usr/local/tomcat/webapps/[context]/WEB-INF/lib`) - there may be multiple versions of the same library `.jars` - which is where `ClassLoader` loads the requested class from. A method from a version that _does not have the callable_ method is used at runtime - which is when `java.lang.NoSuchMethodError` would occur

Out of all of these scenarios, the ones we more commonly see tend to be due to _External classes and dependencies_. This behavior is well-mentioned in the Java community. 

When an application uses a dependency in its `pom.xml` (or `gradle.build`) - that dependencies `.jar` file will be downloaded and put into the `lib` directory in the project. If bad dependency management is occurring, or, dependencies have transitive dependencies which bring in other versions of the same library - these will all end up in the `lib` directory. You then have multiple `.jars` of the same dependency which may be using all of the same class naming but slightly different methods.

# Behavior
Given the nature of the error and _why_ it happens (see **Overview** above) - this may seem like it doesn't make sense to users. Because this typically may show in the following, but not limited to, scenarios:
- No code or configuration change - app was restarted and then `java.lang.NoSuchMethodError` was thrown on startup or when certain logic was invoked
- Instance movement (eg., scaling, platform upgrade, any other instance movement) - this causes a container to start on a new instance (eg. "restart") - and then `java.lang.NoSuchMethodError` was thrown on startup or when certain logic was invoked

However, if we can clearly see in the stack trace from the exception that this is referencing what is appears to be/or confirmed to be an external library, we can infer that _External classes and dependencies_ (above) is likely what needs to be investigated.

Typically, there may be hesitation around the idea of this. However, as described in the Java community - if there are multiple versions of the same jar, there is a chance that the Java `ClassLoader` may reference a different class at runtime (where a method may not exist) in the libraries needing to be called, than build time, which is why this error is reproduced. Further more, there are different `ClassLoaders` and their behavior - like in the example of Tomcat, which can be read [here](https://tomcat.apache.org/tomcat-8.0-doc/class-loader-howto.html).
- Given the difference in `ClassLoader` behavior - if we have the same `.jar`s with only different versions, there is a chance that a different one gets picked, eg. is it's picked by the first one seen on the `ClassPath` or alphabetically. In the example of Tomcat, it's been [discussed](https://stackoverflow.com/questions/6105124/java-classpath-classloading-multiple-versions-of-the-same-jar-project) (in multiple places) that there should be no reliance on this order - and to simply avoided dependency conflict or many versions of the same dependency

Given that - if an application is experiencing this issue - they may notice restarts **do not** work, until seemingly a random restart of change _does_ resolve it. Which again, is likely due to the fact that the correct class from a jar (that has multiple versions of it) was loaded this time.

Because of all of this, to a user, this behavior may seem random and unstable and will likely discard the application being the issue. But if we can infer the **stack trace** references a particular dependency, we can explain what is the likely issue and way's to resolve/mitigate this.

# Case study 
The below is an example of a real-world scenario of this in an application. This same approach could apply to other applications. We could see this was failing on the following after an application restart that had no changes to its codebase:

```
2024-06-28T14:46:01.840416007Z Caused by: java.lang.reflect.UndeclaredThrowableException
2024-06-28T14:46:01.840420407Z 	at com.sun.proxy.$Proxy101.find(Unknown Source)
2024-06-28T14:46:01.840424208Z 	at com.mchange.v2.cfg.MConfig.readVmConfig(MConfig.java:75)
2024-06-28T14:46:01.840428008Z 	at com.mchange.v2.c3p0.cfg.C3P0Config.findLibraryMultiPropertiesConfig(C3P0Config.java:157)
2024-06-28T14:46:01.840431908Z 	at com.mchange.v2.c3p0.cfg.C3P0Config.<clinit>(C3P0Config.java:143)
2024-06-28T14:46:01.840435708Z 	... 138 more
2024-06-28T14:46:01.840439408Z Caused by: java.lang.reflect.InvocationTargetException
2024-06-28T14:46:01.840443208Z 	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
2024-06-28T14:46:01.840447008Z 	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
2024-06-28T14:46:01.840450908Z 	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
2024-06-28T14:46:01.840455008Z 	at java.lang.reflect.Method.invoke(Method.java:498)
2024-06-28T14:46:01.840458908Z 	at com.mchange.v1.lang.Synchronizer$1.invoke(Synchronizer.java:58)
2024-06-28T14:46:01.840463508Z 	... 142 more
2024-06-28T14:46:01.840467109Z Caused by: java.lang.NoSuchMethodError: com.mchange.v2.cfg.BasicMultiPropertiesConfig.<init>([Ljava/lang/String;Ljava/util/List;)V
2024-06-28T14:46:01.840471209Z 	at com.mchange.v2.cfg.ConfigUtils.read(ConfigUtils.java:63)
2024-06-28T14:46:01.840475209Z 	at com.mchange.v2.cfg.MConfig$CSManager.recreateFromKey(MConfig.java:153)
```

In this case, note the references to the dependency - which is [c3p0](https://github.com/swaldman/c3p0). This can be understood by the `com.mchange.v2` reference and can be found on Maven Central [here - com.mchange/c3p0](https://mvnrepository.com/artifact/com.mchange/c3p0). During research, we could find a much older version of this package in Maven Central, [here - c3p0/c3p0](https://mvnrepository.com/artifact/c3p0/c3p0). This is important for later.

Since this was a Tomcat (.war) application, when we looked in `/usr/local/tomcat/webapps/[context]/WEB-INF/lib` and ran `ls`, we could confirm that at least 3 versions of `c3p0` exist:

```
c3p0-0.9.1-pre9.jar
c3p0-0.9.5.2.jar
c3p0-0.9.5.5.jar
c3p0-oracle-thin-extras-0.9.1-pre9.jar
```

Since we already know the potential missing method is `BasicMultiPropertiesConfig`. We can go to Maven and download these `.jars` and investigate further by clicking on the "jar" hyperlink after navigating to the specific package.

![Downloading a jar from Maven Central](/media/2024/07/mvn-java-dep-1.png)

Also to note, aside from the fact at least three different versions of the same package is used - using Maven central, we can see that `0.9.5.5` was released in 2017, `c3p0-0.9.5.2` was released in 2015 - but `0.9.1-pre9` is so old these versions live in the prior [c3p0/c3p0](https://mvnrepository.com/artifact/c3p0/c3p0) repo - which given the dates, we can infer `0.9.1-pre9` is likely from **2007**. 
- Therefor, a best practice here is to keep dependencies updated, and not have various versions of the same one.

After downloading these `jar`s - you can use Visual Studio Code to unzip these jars with the `jar xf [.jar name]` in the terminal and then decompile the `.class` files using the VSCode extension **Extension Pack for Java**. 

![Reviewing source code from a dependency jar](/media/2024/07/mvn-java-dep-2.png)

When we unzip the `jar` for `c3p0-0.9.5.2` and `c3p0-0.9.5.5` - we **do not** see a `BasicMultiPropertiesConfig` class under `com.mchange.v2.cfg`

![Downloading a jar from Maven Central](/media/2024/07/mvn-java-dep-3.png)

What we come to learn is that when adding these `c3p0` versions in a `pom.xml`, it installs _another_ `.jar`, [mchange-commons-java.jar](https://mvnrepository.com/artifact/com.mchange/mchange-commons-java). When we unzip that with `jar xf [jar name]`, we can see **this jar** actually is the one that contains `BasicMultiPropertiesConfig`

![Reviewing source code from a dependency jar](/media/2024/07/mvn-java-dep-4.png)

If we're going this deep - we should actually take a look at the Class itself. We can see it has five (5) **Constructors** for `BasicMultiPropertiesConfig` (`BasicMultiPropertiesConfig.BasicMultiPropertiesConfig()`). They accept parameters `String[] var1`, `String[] var1, List var2`, `String var1, Properties var2`, `String[] var1, Map var2, List var3`, and none.

Now, if we unzip the closest `pre` version to `c3p0-0.9.1-pre9.jar`, which we'll use [c3p0/0.9.0-pre5](https://mvnrepository.com/artifact/c3p0/c3p0/0.9.0-pre5), we can see that this version of `c3p0` **directly implements** `BasicMultiPropertiesConfig` with the same package and class name as the `mchange-commons-java.jar` - so we technically have two different Classes of the same name, from diferent `.jar`s, under `com.mchange.v2.cfg.BasicMultiPropertiesConfig`

![Reviewing source code from a dependency jar](/media/2024/07/mvn-java-dep-5.png)

If we actually look at _this_ `BasicMultiPropertiesConfig` class, we can tell it's overall generally different (different variables, constants, methods) from the other "newer" versions. This one only has **two (2)** Constructors for `BasicMultiPropertiesConfig`, which accept the parameters `String[] resourcePaths` and `String[] resourcePaths, MLogger logger`.

If we revisit the error - `java.lang.NoSuchMethodError: com.mchange.v2.cfg.BasicMultiPropertiesConfig.<init>([Ljava/lang/String;Ljava/util/List;)`- we notice this was referencing parameters of `String` and `List` - which were _only_ available one of the class Constructors in the `mchange-commons-java.jar`, **not** the `c3p0-0.9.1-pre9.jar` jar.

Lastly, if we do a mock repro and use [duplicate-finder-maven-plugin](https://basepom.github.io/duplicate-finder-maven-plugin/release-2.0.1/summary.html) where a `pom.xml` contains various versions of `c3p0`, we can see this infact _is_ a problem. This further confirms the issue where runtime behavior may not be stable if we have duplicate classes on the classpath:

```
[WARNING] Found duplicate and different classes in [c3p0:c3p0:0.9.0-pre5, com.mchange:c3p0:0.9.5.2]:
[WARNING]   com.mchange.Debug
[WARNING]   com.mchange.v2.Debug
[WARNING]   com.mchange.v2.c3p0.C3P0ProxyConnection
….. a lot more classes
WARNING] Found duplicate and different classes in [c3p0:c3p0:0.9.0-pre5, com.mchange:mchange-commons-java:0.2.11]:
[WARNING]   com.mchange.lang.PotentiallySecondary
[WARNING]   com.mchange.lang.PotentiallySecondaryError
[WARNING]   com.mchange.lang.PotentiallySecondaryException
…. a lot more classes
[WARNING] Found duplicate and different resources in [c3p0:c3p0:0.9.0-pre5, com.mchange:mchange-commons-java:0.2.11]:
[WARNING]   com/mchange/v2/log/default-mchange-log.properties
[WARNING] Found duplicate and different classes in [c3p0:c3p0:0.9.0-pre5, com.mchange:c3p0:0.9.5.2]:
[WARNING]   com.mchange.Debug
[WARNING]   com.mchange.v2.Debug
[WARNING]   com.mchange.v2.c3p0.C3P0ProxyConnection
[WARNING]   com.mchange.v2.c3p0.C3P0ProxyStatement
… a lot more classes
[WARNING] Found duplicate and different classes in [c3p0:c3p0:0.9.0-pre5, com.mchange:mchange-commons-java:0.2.11]:
[WARNING]   com.mchange.lang.PotentiallySecondary
[WARNING]   com.mchange.lang.PotentiallySecondaryError
… a lot more classes
[WARNING] Found duplicate and different resources in [c3p0:c3p0:0.9.0-pre5, com.mchange:mchange-commons-java:0.2.11]:
[WARNING]   com/mchange/v2/log/default-mchange-log.properties
[WARNING] Found duplicate and different classes in [c3p0:c3p0:0.9.0-pre5, com.mchange:c3p0:0.9.5.2]:
[WARNING]   com.mchange.Debug
[WARNING]   com.mchange.v2.Debug
… a lot more classes
[WARNING] Found duplicate and different classes in [c3p0:c3p0:0.9.0-pre5, com.mchange:mchange-commons-java:0.2.11]:
[WARNING]   com.mchange.lang.PotentiallySecondary
[WARNING]   com.mchange.lang.PotentiallySecondaryError
… a lot more classes
[WARNING] Found duplicate and different resources in [c3p0:c3p0:0.9.0-pre5, com.mchange:mchange-commons-java:0.2.11]:
[WARNING]   com/mchange/v2/log/default-mchange-log.properties
```

Given all of this, we can come to the following conclusions:
- `c3p0-0.9.5.2` and `c3p0-0.9.5.5` do **not** directly implement `BasicMultiPropertiesConfig`, but rather is used through a _different_ external jar
- `c3p0-0.9.1-pre9.jar` (versions around this jar version) **directly implement** `BasicMultiPropertiesConfig` itself
- Therefor we have two completely different jars and dependencies referencing the same package name and class name for `BasicMultiPropertiesConfig` - which is a dependency conflict. These classes between the two jars are _not_ the same and have various differences
- Given the parameters in the error - we can assume that the `ClassLoader` potentially loaded the oldest class from the oldest jar at runtime - where a Constructor with those parameters **do not exist**.
- Keeping dependencies updated, since some where as old as 2006/2007 - and avoiding various versions of the same one, can ensure to avoid these errors in the future.

# Troubleshooting and scoping
**Prerequisites**:

To see these errors, you need to have **App Service Logging** enabled. See [Enable application logging (Linux/Container)](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer)

After enabling this, application `stdout` / `stderr` will be written to `/home/LogFiles/xxxxx_default_docker.log` (for Linux App Service and Linux Web App for Containers)

These logs can then be viewed in various ways:
- **Diagnose and Solve Problems** -> **Application Logs**
- **Logstream**
- **Kudu** -> `/home/LogFiles/`
- **FTP** -> `/home/LogFiles/`
- Azure CLI - [az webapp log tail](https://learn.microsoft.com/en-us/cli/azure/webapp/log?view=azure-cli-latest#az-webapp-log-tail)

--------

Aside from following the **case study** section above - some of the additional troubleshooting can be done to narrow down what may be causing `NoSuchMethod`:

- You can also run `mvn dependency:tree -Dverbose` locally and look for that dependency. Run this relative to `pom.xml` - this will output a tree of direct and transitive dependencies. If the error looks to be due to a external dependency, this can be used to see what packages may be bringing it in. Try to resolve any conflicting dependency issues.
- Add `JAVA_OPTS=-Dverbose:class` to either a `.jar` or `.war` based application. This will print of a **very** verbose output of all classes loaded when certain logic is invoked. This can be **extremely helpful** if this can be ran on a working application .vs non-working - as this may show the exact `.jar` and class name being referencing, and thus, causing the failure.
    - If the issue is occurring with only invocation of a method on a specific endpoint - ensure that endpoint is hit, otherwise, depending on how this is failing - the class may not show in `stdout`
- **For Maven applications - Use [duplicate-finder-maven-plugin](https://basepom.github.io/duplicate-finder-maven-plugin/)**. As seen above in the _Case Study_ section - this can be hugely beneficial if a developer can use this against their build and can confirm they do infact see class, dependencies or method names related to the `NoSuchMethodError` stack trace.

Add the below to their `build` element in their `pom.xml` and then run `./mvnw duplicate-finder:check` or `mvn duplicate-finder:check`:

```xml
<build>
  <plugins>
    <plugin>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-maven-plugin</artifactId>
    </plugin>
    <plugin>
      <groupId>org.basepom.maven</groupId>
        <artifactId>duplicate-finder-maven-plugin</artifactId>
	  <version>2.0.1</version>
     </plugin>
  </plugins>
</build>
```

From a scoping and conceptual standpoint, these may be good questions to ask yourself or try to uncover:
- Did this occur after a restart/instance movement?
  - If this occurred after a deployment - confirm what was changed
- Was the Java version recently changed at runtime? Has this been rebuilt with a differing major version at build time vs. runtime recently?
- Does this occur on a specific path or at startup? What logic or dependencies are used in these areas?
- **Review the 'prerequisite' section above to review the full log**. Ensure this contains the _full stack trace_.
  - Review the stack trace to see if it points to a certain area in code
  - If not, review the stack trace to see if it points to a dependency or certain Java API


