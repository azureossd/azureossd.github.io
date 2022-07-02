---
title: "Installing troubleshooting tools in Dotnet Core custom Images"
author_name: "Anthony Salemo"
tags:
    - Azure App Service on Linux
    - Azure Web App for Containers
    - Configuration
    - Dotnet Core
    - Deployment
categories:
    - Troubleshooting    
    - How-To
    - Configuration
    - Docker
header:
    teaser: "/assets/images/NETCoreIcon.png" 
toc: true
toc_sticky: true
date: 2022-07-01 12:00:00
---

Sometimes during performance troubleshooting you may need certain tools to profile or analyze the application during runtime. For example, to capture dumps during times of memory or CPU issues, slowness, or others.

In Azure Dotnet based 'Blessed Images', these Dotnet based performance tools are available since they're installed with the Image. **However, with Web App for Containers these may not be installed by the developer or maintainer as it is ultimately up to them.**

These custom Dotnet based Web App for Containers that are built may not include these tools (for example, lack of SDK or global tools) in the final layer to reduce overall Image size. This post will show how to install these tools if this is the case inside custom Linux containers.

# Prerequisites
## Enabling persistent storage

If installing these tools to gather data and retrieve them later on, make sure that `WEBSITES_APP_SERVICE_ENABLE_STORAGE` is set to **true** first. This is set as an AppSetting. Review [here](https://docs.microsoft.com/en-us/azure/app-service/reference-app-settings?tabs=kudu%2Cdotnet#custom-containers) for documentation. 

Afterwards FTP or the Kudu /newui can be used to download these files from the custom container, as long as the files are moved under /home.

If this is **not** set to true, these files may not be retrievable from the custom container as there is no persisted Storage Mount (/home) to access via FTP, Kudu, or other methods.

> **NOTE:** Adding or changing this App Setting will cause the container to restart. Temporary files will be lost.

## Adding commands to path
If needing to add commands to path for any reason, this can be done by installing the tool below, and running `export PATH=/dir/of/thetool/:$PATH`. If dotnet tool(s) were installed in home, `export PATH=/home:$PATH` would need to be ran.

**Otherwise, all commands should be ran as `./<dotnettool>`.**

# Installing tools
Below are some of the tools that can be installed if they are not available in the container. These can mostly be installed in the same way, as seen below.

## dotnet-counters
**(Applies for High CPU/Memory):** *It is a performance monitoring tool for ad-hoc health monitoring and first-level performance investigation. ​It can observe performance counter values that are published via the EventCounter API. ​For example, you can quickly monitor things like the CPU usage, or the rate of exceptions being thrown in your .NET Core application to see if there's anything suspicious before diving into more serious performance investigation using PerfView or dotnet-trace.​*

Follow the steps below to install `dotnet-counters`:

### Installation
- SSH into the container. Check if `curl` is installed. If it not, run `apt-get update && apt-get install curl`, for Ubuntu/Debian based Images. Alpine Images do not need to do this and would just need to run `apk add curl`.
- Run `curl -L https://aka.ms/donet-counters/linux-64 -o dotnet-counters` followed by `chmod +x dotnet-counters`. 
- This will make `dotnet-counters` executable. The curl command will install and create this binary in the current working directory.

### Running the command
- Run `./dotnet-counters ps` to get the current Dotnet PID, followed by `./dotnet-counters collect -p <PID>`. Use `Q` to terminate. The below should be seen:

```
root@9d92ec29b4db:~# dotnet-counters collect -p 17
--counters is unspecified. Monitoring System.Runtime counters by default.
Starting a counter session. Press Q to quit.
File saved to counter.csv
```

> **NOTE** The above command assumes the command was put onto `PATH`

- To save this to a specific directory other than the current directory, use the `-o` flag - example: `dotnet-counters collect -p 17 -o /home/LogFiles/dotnet-counters-1.csv`

Files are saved as `.csv` by default but [can be changed to .json](https://docs.microsoft.com/en-us/dotnet/core/diagnostics/dotnet-counters#options-1) as well. Optionally, the monitor flag can be used to display output within the terminal. Below is an example using `./dotnet-counters monitor -p <PID>`:

```
Press p to pause, r to resume, q to quit.
    Status: Running

[System.Runtime]
    % Time in GC since last GC (%)                                 0    
    Allocation Rate (B / 1 sec)                                8,168    
    CPU Usage (%)                                                  0    
    Exception Count (Count / 1 sec)                                0    
    GC Committed Bytes (MB)                                        0    
    GC Fragmentation (%)                                           0    
    GC Heap Size (MB)        
```

Review the [official documentation](https://docs.microsoft.com/en-us/dotnet/core/diagnostics/dotnet-counters) for more passable flags.

## dotnet-trace
**(Applies for High CPU and Slow Apps):** *.NET Core includes what is called the EventPipe through which diagnostics data is exposed. The dotnet-trace tool allows you to consume profiling data from your app that can help in scenarios where you need to root cause apps running slow.*

### Installation
- SSH into the container. Check if `curl` is installed. If it not, run `apt-get update && apt-get install curl`, for Ubuntu/Debian based Images. Alpine Images do not need to do this and would just need to run `apk add curl`.
- Run `curl -L https://aka.ms/donet-trace/linux-64 -o dotnet-trace` followed by `chmod +x dotnet-trace`. This will make `dotnet-trace` executable. The `curl` command will install and create this binary in the current working directory.

### Running the command
- Run `./dotnet-trace ps` to get the current Dotnet PID, followed by `./dotnet-trace collect -p <PID>`. Use `ENTER` or `CTRL+C` to terminate. The below should be seen:

```
No profile or providers specified, defaulting to trace profile 'cpu-sampling'

Provider Name                           Keywords            Level               Enabled By
Microsoft-DotNETCore-SampleProfiler     0x0000F00000000000  Informational(4)    --profile 
Microsoft-Windows-DotNETRuntime         0x00000014C14FCCBD  Informational(4)    --profile 

Process        : /usr/share/dotnet/dotnet
Output File    : /home/dotnet_20220616_170738.nettrace

[00:00:00:10]   Recording trace 565.031  (KB)
Press <Enter> or <Ctrl+C> to exit...
```

Review the [official documentation](https://docs.microsoft.com/en-us/dotnet/core/diagnostics/dotnet-trace#dotnet-trace-collect) for more passable flags.

## dotnet-dump
**(Applies for High CPU/Memory/Slow Apps/DeadLocks, etc):** *It is a way to collect and analyze Windows and Linux core dumps without a native debugger.*

### Installation
- SSH into the container. Check if `curl` is installed. If it not, run `apt-get update && apt-get install curl`, for Ubuntu/Debian based Images. Alpine Images do not need to do this and would just need to run `apk add curl.`
- Run `curl -L https://aka.ms/dotnet-dump/linux-64 -o dotnet-dump` followed by `chmod +x dotnet-dump`. This will make dotnet-dump executable. The `curl` command will install and create this binary in the current working directory.

### Running the command
- Run `./dotnet-dump ps` to get the current Dotnet PID, followed by `./dotnet-dump collect -p <PID>`. The below should be seen:

```
root@9d92ec29b4db:/home# ./dotnet-dump collect -p 17     

Writing full to /home/core_20220616_180309
Complete
```

Review the [official documentation](https://docs.microsoft.com/en-us/dotnet/core/diagnostics/dotnet-dump) for more passable flags.

## dotnet-gcdump
**(Applies for High Memory):** *It collects GC (Garbage Collector) dumps of live .NET processes using EventPipe. GC dumps are created by triggering a GC in the target process, turning on special events, and regenerating the graph of object roots from the event stream. These dumps are useful for several scenarios.*

### Installation
- SSH into the container. Check if curl is installed. If it not, run `apt-get update && apt-get install curl`, for Ubuntu/Debian based Images. Alpine Images do not need to do this and would just need to run `apk add curl`.
- Run `curl -L https://aka.ms/dotnet-gcdump/linux-64 -o dotnet-gcdump` followed by `chmod +x dotnet-gcdump`. This will make `dotnet-gcdump` executable. The `curl` command will install and create this binary in the current working directory.

### Running the command
- Run `./dotnet-gcdump ps` to get the current Dotnet PID, followed by `./dotnet-gcdump collect -p <PID>`. The below should be seen:

```
Writing gcdump to '/root/20220616_204244_17.gcdump'...
        Finished writing 1116309 bytes.
```

- Next, run `./dotnet-gcdump report 00000000_000000_00.gcdump`. This will output the report to stdout. Note this may be a large amount of output, so it may be more advisable to download this file and open this with Perfview or Visual Studio.

> **NOTE:** To walk the GC heap, this command triggers a generation 2 (full) garbage collection, which can suspend the runtime for a long time, especially when the GC heap is large. Don't use this command in performance-sensitive environments when the GC heap is large.

Review the [official documentation](https://docs.microsoft.com/en-us/dotnet/core/diagnostics/dotnet-gcdump) for more passable flags.