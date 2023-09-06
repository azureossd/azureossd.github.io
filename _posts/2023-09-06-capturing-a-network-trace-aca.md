---
title: "Container Apps: How to capture a network trace using TCPDUMP"
author_name: "Aldmar Joubert"
tags:
    - Configuration
    - TCPDUMP
    - networking
    - network trace
    - storage mounts
    - container apps
categories:
    - Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Troubleshooting
header:
    teaser: "assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-09-06 12:00:00
---

This post will cover using TCPDUMP to capture a network trace on Container Apps.

# Prerequisites
Some **important** prerequisites are to be able to capture and download the dump file for analysis:
- Ability to download files from the container. This can be done by mounting an Azure File Share with read/write permissions allowed.
- Ability to connect to the container through the **Console** blade or use the [`az containerapp exec`](https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest#az-containerapp-exec) command. See console documentation [here](https://learn.microsoft.com/en-us/azure/container-apps/container-console?tabs=bash)


## Download files from the container
You'll need a way to download files from the container. By default, there is no way to get files generated at runtime by a container in Container Apps without some additional configuration.

The most simplistic way is to mount a volume from an Azure File Share with an Azure Storage Account.

For a quickstart on how to add a volume, follow [Use storage mounts in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?pivots=azure-portal)

## Console access
You can use either the Azure CLI or the portal for console access. Below is what portal access would look like:

![Console access from portal](/media/2023/08/aca-java-ts-1.png)

The commands for installing TCPDUMP and capturing a network trace requires access to a terminal - so console access is required.

# Installing TCPDUMP

## Validate the OS

Run th below command in the console to validate which installation commands to use.

```sh
cat /etc/os-release
```

![Console - validate os](/media/2023/09/aca-console-os.png)

## Install TCPDUMP

For Ubuntu/Jessie/Debian based images, you need to run the below commands:
```sh
	apt-get update
	apt install tcpdump
```
For Alpine based images, you need to run the below commands:
```sh
	apk update
	apk add tcpdump
```

# Collect a network trace using TCPDUMP

## Check which network interface is being used

```sh
tcpdump -D
```

![Console - validate network interface](/media/2023/09/aca-console-ip-interface.png)

## Run TCPDUMP

Once you have identified which <b>network interface</b> you wish to collect the trace on, run the below TCPDUMP command to start collecting the trace for traffic flowing through that particular <b>network interface</b>. The trace will be saved to a file named dump.pcap under your mount path.

```sh
tcpdump -i eth0 -s0 -w /MOUNT-PATH/dump.pcap
```

Reproduce the issue and once complete you can stop the trace in the console with <b>CTRL + C</b>. The dump will then be available to download in your file share. 

## Explanation of each switch in the above command

<b>-i</b>  : is to select which interface  the capture is to take place on. If you want to capture traffic on all interfaces use -i any

<b>-s</b> : Snap length, is the size of the packet to capture. -s0 will set the size to unlimited - use this if you want to capture all the traffic.

<b>-w</b> : to write to a capture file.

## Analyze the newtork trace

[Wireshark](https://www.wireshark.org/) can be used to analyze the PCAP file locally.

To analyze the PCAP file in the console, use:

```sh
tcpdump -r dump.pcap
```
