---
title: "Troubleshooting DNS connectivity on Azure Container Apps"
author_name: "Aldmar Joubert"
tags:
    - Docker
    - Troubleshooting
    - Azure Contianer Apps
    - Network Connectivity
    - DNS
categories:
    - Azure Container Apps
    - Docker
    - Troubleshooting DNS
header:
    teaser: /assets/images/azure-containerapps-logo.png# There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-03-03 12:00:00
---

# Introduction
Azure Container Apps provides a convenient and efficient way to deploy containerized applications in the cloud, allowing you to quickly scale and manage your applications with ease. However, like any technology, it's not uncommon to encounter connectivity issues that can impact the availability and performance of your applications.

In this post, we will focus on installing and running tools to isolate network DNS connectivity issues.

# Common issue - Name or service not known
A typical application exception observed when there is a DNS misconfiguration is <b>Name or service not known</b>. When troubleshooting this issue, you will first need to review your DNS records to ensure the appropriate entries for the remote server have been added and are pointing to the correct location.

If your VNET uses a custom DNS server instead of the default Azure-provided DNS server, configure your DNS server to forward unresolved DNS queries to 168.63.129.16.

More information on Container Apps and DNS can be found [here.](https://learn.microsoft.com/en-us/azure/container-apps/networking#dns)

# Connect to a container console
Connecting to a container's console is useful when you want to troubleshoot your application inside a container. We will install and run the DNS connectivity testing tools here.

Instructions on how to connect to a container console through the portal or the Azure CLI can be found [here.](https://learn.microsoft.com/en-us/azure/container-apps/container-console?tabs=bash)

# Installing nslookup and dig
Once connected to your container console, run ```cat /etc/os-release``` to double-check which Linux distribution the container runs on.

![running cat /etc/os-release to check linux distro](/media/2023/02/azure-blog-container-apps-check-linux-distro.png)

For Ubuntu/Debian/Jessie based images, you need to run:

```sh
apt-get update

apt install dnsutils
```

For Alpine based images, you need to run:

```sh
apk update

apk add bind-tools
```

# Running nslookup and dig
The nslookup and dig commands are used for DNS (Domain Name System) resolution on Linux systems. DNS resolution is the process by which a domain name is translated into an IP address, allowing computers to communicate with one another over the internet.

The nslookup command is a basic tool for querying DNS to obtain a domain name or IP address mapping information. It sends a DNS query to a specified DNS server and returns the IP address that corresponds to a specific hostname or domain name. The syntax for using nslookup is as follows:

```sh
nslookup domain_name
```
where domain_name is the domain name you want to look up.

For example, to look up the IP address of the Microsoft domain, you would use the following command:

```sh
nslookup microsoft.com
```

The output will include the IP address of the Microsoft domain and the IP addresses of any associated name servers.

The dig command is more powerful than nslookup and provides more detailed information about DNS queries. It can perform queries for any DNS record type, including A, AAAA, MX, NS, PTR, SOA, SRV, and TXT records. The syntax for using dig is as follows:

```sh
dig domain_name record_type
```

where domain_name is the domain name you want to look up and record_type is the type of DNS record you want to query.

For example, to look up the MX records for the Microsoft domain, you would use the following command:

```sh
dig microsoft.com MX
```
Both nslookup and dig will help validate that you can connect to your DNS server and that the DNS entry is pointing to the correct location.

![running nslookup and dig](/media/2023/02/azure-blog-container-apps-run-dig-nslookup.png)

# Articles of Note
- [Networking architecture in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/networking)
- [Securing a custom VNET in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/firewall-integration)
