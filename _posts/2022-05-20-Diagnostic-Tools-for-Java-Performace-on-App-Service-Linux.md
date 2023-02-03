---
title: "Diagnostic Tools for Java Performace on App Service Linux"
author_name: "Kendrick Dubuisson"
tags:
    - Java
    - Troubleshooting
    - Performance
categories:
    - Azure App Service on Linux    
    - Java
    - How-To, Diagnostics
    - Troubleshooting
    - Performance
header:
    teaser: "/assets/images/javalinux.png" 
toc: true
toc_sticky: true
date: 2022-05-20 12:00:00
---
When dealing with High CPU, High Memory, or general performance scenarios on App Service Linux, it’s recommended to profile the application locally, but this may not always be possible nor reflect the same results. This may be due to the difference in load or environment configuration.

The App Service Linux pre-built images for Java include the various JDK tools for profiling & this article will walk through the steps required for collecting traces on App Services.

 > As a pre-requisite, assure [persistent storage](https://docs.microsoft.com/en-us/azure/app-service/configure-custom-container?pivots=container-linux#use-persistent-shared-storage) is enabled on your App Service. To enable it, set the `WEBSITES_ENABLE_APP_SERVICE_STORAGE` app setting value to `true`.

You can select which instance you’d like to console into if scaled out to multiple instances before collecting your trace. This is helpful if a performance issue has been narrowed down to a particular instance.
> `https://<app-name>.scm.azurewebsites.net/newui#`
>![Java Perfomance](/media/2022/05/javaprof-9.png)


# Heap Dumps - High Memory
Heaps dumps provide us with a snapshot of all the heaps live objects in use at a specific moment which is useful when troubleshooting memory leaks or understanding resource constraints.


1. Detemine the PID using `jcmd`. 

    ```bash
    # Example Output

    root@4ddc09ac647f:/# jcmd

    Picked up JAVA_TOOL_OPTIONS: -Xmx4865M -Djava.net.preferIPv4Stack=true 
    42 org.apache.catalina.startup.Bootstrap start
    223 jdk.jcmd/sun.tools.jcmd.JCmd
    ```

2. Collect your heap dump using jmap. 
    `$JAVA_HOME/bin/jmap -dump:format=b,file=/home/LogFiles/dump1.hprof <pid>`

    ```bash
    # Example Output

    root@4ddc09ac647f:/# $JAVA_HOME/bin/jmap -dump:format=b,file=/home/LogFiles/dump1.hprof 42

    Picked up JAVA_TOOL_OPTIONS: -Xmx4865M -Djava.net.preferIPv4Stack=true 
    Dumping heap to /home/LogFiles/dump1.hprof ...
    Heap dump file created [53217296 bytes in 0.209 secs]
    ``` 

3. The dump file will be created at /home/Logfiles/dump1.hprof, which can be downloaded using FTP, KUDU API, or Kudu File Manager. 
    > `https://<webapp-name>.scm.azurewebsites.net/newui/fileManager#`

4. [Eclipse Memory Analyzer](https://www.eclipse.org/mat/) can then be downloaded locally to analyze heap dumps. Below we can see the dominator  tree of a heap dump showing the objects of my retained heap. 

    >![Java Perfomance](/media/2022/05/javaprof-2.png)
 
# Thread Dumps - High CPU
Thread dumps provide us with a snapshot of all the threads executing at a specific moment. This includes information like the state of the threads, stack trace associated & reference addresses. We'll be using jStack to collect our thread dumps which can help us identify any blocked threads or running threads. 

It's a best practice to collect at least three thread dumps. Each thread dump should be taken within 10-second intervals of one another to account for thread state changes.

1. Detemine the PID using `jcmd`. 

    ```bash
    # Example Output

    root@adb27c7aa8af:/# jcmd

    Picked up JAVA_TOOL_OPTIONS: -Xmx4865M -Djava.net.preferIPv4Stack=true 
    74 org.springframework.boot.loader.JarLauncher
    191 jdk.jcmd/sun.tools.jcmd.JCmd
    ```

2. Collect your thread dump using jstack. 
    `$JAVA_HOME/bin/jstack <pid> > /home/LogFiles/threaddump1.txt`

    ```bash
    # Example Output

    root@adb27c7aa8af:/# $JAVA_HOME/bin/jstack 74 > /home/LogFiles/threaddump1.txt

    Picked up JAVA_TOOL_OPTIONS: -Xmx4865M -Djava.net.preferIPv4Stack=true 
    ``` 

3. The thread dump will be created at /home/Logfiles/threaddump1.txt, which can be downloaded using FTP, KUDU API, or Kudu File Manager. 
    > `https://<webapp-name>.scm.azurewebsites.net/newui/fileManager#`

4. Thread Dumps can be reviewed manually or with any of the thread analyzers mentioned below. At the same time, thread dumps contain application data, and local or client-side analyzers can be used to avoid leaking any potentially sensitive information.

    - [Spotify Thread Analyzer - https://spotify.github.io/threaddump-analyzer  – Client Side](https://spotify.github.io/- threaddump-analyzer)
    - [FastThread - Smart Java thread dump analyzer - thread dump analysis in seconds – Server Side](fastthread.io)
    - [Samurai Tread Dump Analysis Tool - Local](https://github.com/yusuke/samurai)

    >![Java Perfomance](/media/2022/05/javaprof-3.png)

# Java Flight Recorder - Profiling
Java Flight Recorder (JFR) is a monitoring tool that collects information about the events in a Java Virtual Machine (JVM) while the application is running.

JFR is designed to have minimal perforamce impact & continuously saves large amounts of data about the running system. This profiling information includes thread samples (which show where the program spends its time), lock profiles, and garbage collection details.

Depending on the scenario & if the issue is reproducible, recordings can be manually started or ran continuously at startup.

Flight Recordings can be reviewed using [Zulu Mission Control](https://www.azul.com/products/components/zulu-mission-control/)

>![Java Perfomance](/media/2022/05/javaprof-4.png)

## Timed Recordings

1. Detemine the PID using `jcmd`. 

    ```bash
    # Example Output

    root@adb27c7aa8af:/# jcmd

    Picked up JAVA_TOOL_OPTIONS: -Xmx4865M -Djava.net.preferIPv4Stack=true 
    74 org.springframework.boot.loader.JarLauncher
    191 jdk.jcmd/sun.tools.jcmd.JCmd
    ```

2. Execute the command below to start a 300-second recording of the JVM. This will profile the JVM and create a JFR file named jfr_example.jfr in  `/home/Logfiles`. [Additional JFR parameters](https://access.redhat.com/documentation/en-us/openjdk/11/html/using_jdk_flight_recorder_with_openjdk/configure-jfr-options)

    `jcmd <pid> JFR.start name=MyRecording settings=profile duration=300s filename="/home/LogFilesjfr_example.jfr"`

    ```bash
    # Example Output

    root@adb27c7aa8af:/# jcmd 74 JFR.start name=MyRecording settings=profile duration=300s filename="/home/LogFiles/jfr_example.jfr" 

    Picked up JAVA_TOOL_OPTIONS: -Xmx4865M -Djava.net.preferIPv4Stack=true 
    74:
    Started recording 1. The result will be written to:

    /home/LogFiles/jfr_example.jfr
    ```
3. Flight Recordings will be created at /home/LogFiles/jfr_example.jfr which can be downloaded using FTP, KUDU API or Kudu File Manager.JFR can be reviewed using [Zulu Mission Control](https://www.azul.com/products/components/zulu-mission-control/).
    > `https://<webapp-name>.scm.azurewebsites.net/newui/fileManager#`

## Continuous Recordings

1. Update your application's App Setting to pass the flight recording arguments to the JVM. This will start a continuous recording that will start a flight recording at JVM startup that will exit after one day or if the size reaches 1024MB. [Additional JFR parameters](https://access.redhat.com/documentation/en-us/openjdk/11/html/using_jdk_flight_recorder_with_openjdk/configure-jfr-options)

    `JAVA_OPTS=-XX:StartFlightRecording=disk=true,name=continuous_recording,dumponexit=true,maxsize=1024m,maxage=1d`

2. The continuous recording can also be manually stopped with the following command. Note: The name parameter specified must match was is passed in the JAVA_OPTS to stop the JFR.
    `jcmd <pid> JFR.dump name=continuous_recording filename="/home/LogFiles/manuallystopped_recording1.jfr"`

    ```bash
    # Example Output

    root@97c687c874b5:/#     jcmd 74 JFR.dump name=continuous_recording filename="/home/LogFiles/recording1.jfr"
    Picked up JAVA_TOOL_OPTIONS: -Xmx4865M -Djava.net.preferIPv4Stack=true 
    74:
    Dumped recording "continuous_recording", 1.9 MB written to:

    /home/LogFiles/recording1.jfr
    ```

3. Flight Recordings will be created at /home/LogFiles/recording1.jfr, which can be downloaded using FTP, KUDU API, or Kudu File Manager.JFR can be reviewed using [Zulu Mission Control](https://www.azul.com/products/components/zulu-mission-control/).
    > `https://<webapp-name>.scm.azurewebsites.net/newui/fileManager#`
