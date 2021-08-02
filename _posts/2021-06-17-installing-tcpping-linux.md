---
title: "Installing TcpPing on Azure App Service Linux"
author_name: "Toan Nguyen"
tags:
    - Tcpping
    - Troubleshooting
    - trace
categories:
    - Azure App Service on Linux
    - Python
    - Java
    - PHP
    - Nodejs
    - Ruby
    - .NET Core
    - How-To
    - Troubleshooting
header:
    teaser: "/assets/images/azurelinux.png" 
toc: true
toc_sticky: true
date: 2021-06-17 00:00:00
---

A useful tool to help with diagnosing network related issues on Azure App Service is TcpPing.  Below are the steps for installing the tool for Debian and Alpine based Docker images.

## Prerequisites

- Your Web App must be running
- If using a custom container, SSH access must be configured.

## Installation - Debian

1. Go to your Kudu site (i.e https://\<sitename>\.scm.azurewebsites.net/webssh/host) to SSH  into your app.
2. `apt-get install tcptraceroute`
3. 	`cd /usr/bin`
4. `wget http://www.vdberg.org/~richard/tcpping`
5. `chmod 755 tcpping`
6. `apt install bc`

### Sample WebSSH Session

```
root@0723dbccc05e:/usr/bin# apt-get install tcptraceroute
Reading package lists... Done
Building dependency tree
Reading state information... Done
tcptraceroute is already the newest version.clear
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
root@0723dbccc05e:/usr/bin# cd /usr/bin
root@0723dbccc05e:/usr/bin# wget http://www.vdberg.org/~richard/tcpping
converted 'http://www.vdberg.org/~richard/tcpping' (ANSI_X3.4-1968) -> 'http://www.vdberg.org/~richard/tcpping' (UTF-8)
--2017-10-27 15:10:52--  http://www.vdberg.org/~richard/tcpping
Resolving www.vdberg.org (www.vdberg.org)... 94.142.246.140, 2a02:898:62:f6::8c
Connecting to www.vdberg.org (www.vdberg.org)|94.142.246.140|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 3510 (3.4K)
Saving to: 'tcpping.1'

tcpping.1           100%[=====================>]   3.43K  --.-KB/s   in 0s

2017-10-27 15:10:52 (258 MB/s) - 'tcpping.1' saved [3510/3510]

root@0723dbccc05e:/usr/bin# chmod 755 tcpping
root@0723dbccc05e:/usr/bin# tcpping
tcpping v1.7 Richard van den Berg <richard@vdberg.org>

Usage: tcpping [-d] [-c] [-C] [-w sec] [-q num] [-x count] ipaddress [port]

        -d   print timestamp before every result
        -c   print a columned result line
        -C   print in the same format as fping's -C option
        -w   wait time in seconds (defaults to 3)
        -r   repeat every n seconds (defaults to 1)
        -x   repeat n times (defaults to unlimited)
```

## Installation - Alpine

1. Go to your Kudu site (i.e https://\<sitename>\.scm.azurewebsites.net/webssh/host) to SSH  into your app.
2. `apk update`
3. `apk add tcptraceroute`
3. 	`cd /usr/bin`
4. `wget http://www.vdberg.org/~richard/tcpping`
5. `chmod 755 tcpping`
6. If you receive an error "*cannot find bc. Install bc package:*" use, `apt install bc`

### Sample WebSSH Session

```
  _____
  /  _  \ __________ _________   ____
 /  /_\  \___   /  |  \_  __ \_/ __ \
/    |    \/    /|  |  /|  | \/\  ___/
\____|__  /_____ \____/ |__|    \___  >
        \/      \/                  \/
A P P   S E R V I C E   O N   L I N U X

Documentation: http://aka.ms/webapp-linux

**NOTE**: No files or system changes outside of /home will persist beyond your application's current session. /home is your application's persistent storage and is s
hared across all the server instances.


79eaacc1cd21:/home# apk update
fetch http://dl-cdn.alpinelinux.org/alpine/v3.12/main/x86_64/APKINDEX.tar.gz
fetch http://dl-cdn.alpinelinux.org/alpine/v3.12/community/x86_64/APKINDEX.tar.gz
v3.12.7-75-gb976e2d90a [http://dl-cdn.alpinelinux.org/alpine/v3.12/main]
v3.12.7-63-gd5f321e0c1 [http://dl-cdn.alpinelinux.org/alpine/v3.12/community]
OK: 12767 distinct packages available
79eaacc1cd21:/home# apk add tcptraceroute
(1/3) Installing libnet (1.1.6-r3)
(2/3) Installing libpcap (1.9.1-r2)
(3/3) Installing tcptraceroute (1.5b7-r2)
Executing busybox-1.31.1-r19.trigger
OK: 224 MiB in 71 packages
79eaacc1cd21:/home# cd /usr/bin
79eaacc1cd21:/usr/bin# wget http://www.vdberg.org/~richard/tcpping
--2021-06-17 18:00:09--  http://www.vdberg.org/~richard/tcpping
Resolving www.vdberg.org (www.vdberg.org)... 136.144.244.145, 2a01:7c8:d006:f0::1
Connecting to www.vdberg.org (www.vdberg.org)|136.144.244.145|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 3510 (3.4K)
Saving to: 'tcpping'

tcpping             100%[===================>]   3.43K  --.-KB/s    in 0s

2021-06-17 18:00:09 (446 MB/s) - 'tcpping' saved [3510/3510]
79eaacc1cd21:/usr/bin# chmod 755 tcpping
79eaacc1cd21:/usr/bin# tcpping
tcpping v1.7 Richard van den Berg <richard@vdberg.org>

Usage: tcpping [-d] [-c] [-C] [-w sec] [-q num] [-x count] ipaddress [port]

        -d   print timestamp before every result
        -c   print a columned result line
        -C   print in the same format as fping's -C option
        -w   wait time in seconds (defaults to 3)
        -r   repeat every n seconds (defaults to 1)
        -x   repeat n times (defaults to unlimited)

See also: man tcptraceroute

79eaacc1cd21:/usr/bin#
```