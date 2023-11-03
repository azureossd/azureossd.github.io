---
title: "Logging with supervisord on Web Apps for Containers"
author_name: "Anthony Salemo"
tags:
    - Configuration
    - Web Apps for Containers
    - Logging
    - Linux
categories:
    - Configuration
    - Web Apps for Containe # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Linux
    - Troubleshooting 
header:
    teaser: /assets/images/springapps.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-11-03 12:00:00
---

This post will talk about some ways to show logging for child processes on App Service with Web Apps for Containers when using Supervisord

# Overview
[Supervisord](http://supervisord.org/) is a process control manager. This can be used within containers to start multiple processes, rather than just one, typically.

A struggle with troubleshooting supervisord applications, if using a basic/bare-bones configuration, is that logging **does not** go directly to `stdout/err` unless explicitly configured.

Meaning, an application could be hitting various errors when attempting to start up (or later at runtime), but this is never written to `stdout/err` - which means this is never written into `default_docker.log` files. This makes troubleshooting more tough since if no changes to logging are made, then these files will be gone if the container exited/restarted - and also if SSH is not enabled, since this directory cannot be accessed unless otherwise enabled on the Docker image.

What would only be shown in this case, is logging about supervisord _only_, eg:

```
2023-11-02 13:13:40 2023-11-02 17:13:40,912 CRIT Supervisor is running as root.  Privileges were not dropped because no user is specified in the config file.  If you intend to run as root, you can set user=root in the config file to avoid this message.
2023-11-02 13:13:40 2023-11-02 17:13:40,917 INFO supervisord started with pid 7
2023-11-02 13:13:41 2023-11-02 17:13:41,920 INFO spawned: 'nginx' with pid 8
2023-11-02 13:13:41 2023-11-02 17:13:41,924 INFO spawned: 'node' with pid 9
2023-11-02 13:13:43 2023-11-02 17:13:43,077 INFO success: nginx entered RUNNING state, process has stayed up for > than 1 seconds (startsecs)
2023-11-02 13:13:43 2023-11-02 17:13:43,078 INFO success: node entered RUNNING state, process has stayed up for > than 1 seconds (startsecs)
```

Through startup supervisord output, you can however potentially understand which processes were created and which were able to stay running. In the above example, we can see both `nginx` and `node` started successfully.

If an application was failing post process creation, it would typically mention through supervisord that a process exited with an exit code - eg., 

```
2023-11-02 13:52:29 2023-11-02 17:52:29,084 WARN exited: node (exit status 1; not expected)
2023-11-02 13:52:30 2023-11-02 17:52:30,086 INFO gave up: node entered FATAL state, too many start retries too quickly
```
- For more information on supervisord logging, see [here](http://supervisord.org/logging.html#child-process-logs).
- For more information on enabled SSH for Web Apps for Containers, see [here](https://azureossd.github.io/2022/04/27/2022-Enabling-SSH-on-Linux-Web-App-for-Containers/index.html)

# Logging
By default, child process logging of supervisord is written to `/tmp` - where each child process has it's own `stdout`/`stderr` file. Using the above example with NGINX and node, the `/tmp` directory may look like this:

```
# ls /tmp
nginx-stderr---supervisor-7gnbs84i.log  
nginx-stdout---supervisor-2pzp3p_j.log  
node-stderr---supervisor-pipaztb4.log  
node-stdout---supervisor-hi3xwv46.log
```

Since `/tmp` is a non-persistent directory, when a container restarts or exits - this data would be cleared, which is not useful for troubleshooting.

There are some workarounds to persisting this data.

## Change log directory
In `supervisord.conf`, you can change the log directory of child processes through the below:

> **NOTE**: If the directory doesn't already exist, the container will exit with `Error: /some/dir is not an existing directory` - make sure the directory exists by adding it as an instruction in your `Dockerfile`

```conf
[supervisord]
nodaemon=true
childlogdir=/var/log/supervisord-logs
```

With this now being configurable - you could use [BYOS to mount a volume](https://learn.microsoft.com/en-us/azure/app-service/configure-connect-to-azure-storage?tabs=basic%2Cportal&pivots=container-linux) to that path for log persistence. Or, this can be pointed to `/home/LogFiles` as long as `WEBSITES_ENABLE_APP_SERVICE_STORAGE` is true, to use the built-in volume with App Service's File Servers. These files can then be downloaded through FTP or Kudu.

## Redirect child process to stdout/err

```conf
[program:node]
command=node /usr/share/nginx/html/server.js
autostart=true 
autorestart=true
stdout_logfile=/dev/fd/1
stdout_logfile_maxbytes=0
stderr_logfile=/dev/fd/2
stderr_logfile_maxbytes=0
```

You can combine the `stdout_logfile` and `stderr_logfile` directives to log to console - in this case, this would now be captured in `default_docker.log` as long as [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) are enabled