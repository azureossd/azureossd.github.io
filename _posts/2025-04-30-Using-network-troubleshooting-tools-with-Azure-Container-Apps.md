---
title: "Using network troubleshooting tools with Azure Container Apps"
author_name: "Anthony Salemo"
tags:
    - Container Apps
    - Availability
    - Configuration
categories:
    - Azure Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: false
toc_sticky: true
date: 2025-04-30 12:00:00
---
This post will go over using networking troubleshooting tools and which scenarios they may be best for

# Overview
The below tooling (and much more in the *NIX ecosystem) can be thought of in two general approaches. Connectivity based (eg. testing if a connection can be opened to a resource or requested) versus DNS based (eg. confirming that from the current host, a target FQDN can be resolved through current or specific DNS servers)

Connection-based vs. DNS-based issues are generally two different problems - and will show up as two different sets of errors and typically under different circumstances. Therefor it's important to know what tooling should be required for what job.

This can be incredibly helpful since a large amount of cloud applications have external dependencies that are secured through locked-down networks. In terms of Azure, this could be almost an service, but ones much more commonly seen with Azure Container Apps are:
- Azure Container Registry (or any external registry being used for image hosting)
- Azure Entra Endpoints used for Managed Identity-based authentication, which in turn may be used for services like Key Vault authentication and authentication for Image pulls
- Azure Storage (Azure Files)
- Various databases like Azure Database for Postgres, SQL, MySQL, and others
- etc.

# Connectivity-based versus DNS-based tooling
## Connectivity-based
The below tools, which is not an exhaustive list, is generally best for opening a connection to a specific port and testing that it's reacheable. This is best for scenarios where an outbound NSG, a firewall on the target resource, or a customers UDR/Route Table or device along that network path may be blocking connectivity:

*   [ip-utils](https://github.com/iputils/iputils) - (`ping`, `tracepath`)
*   [nc](https://en.wikipedia.org/wiki/Netcat) - netcat (`nc`)
*   [openssl](https://github.com/openssl/openssl) - (`openssl`)
*   [traceroute](https://en.wikipedia.org/wiki/Traceroute) - (`traceroute`) (uses UDP or ICMP)
- [tcptraceroute](https://linux.die.net/man/1/tcptraceroute) - (`tcptraceroute`) (uses TCP)
*   [tcpping](http://www.vdberg.org/%7Erichard/tcpping.html) - (`tcpping`)

Out of the ones above, `tcpping`, `nc` are most commonly used and should typically be used to check connectivity initially. Other tools, like `tcptraceroute` could be used to "trace" a path to a request resource. However, there is no guarantee this shows useful information aside from source and destination. If you want a detailed look at a end-to-end TCP conversation, take a network trace by following [Container Apps: How to capture a network trace using TCPDUMP](https://azureossd.github.io/2023/09/06/capturing-a-network-trace-aca/index.html).

Tools that are typically made to validate if a resource is reachable through HTTP (more-or-less in the same vein as above), are as follows:
  - `curl`
  *   [wget](https://github.com/mirror/wget) - (`wget`)

## DNS-based
The below is a non-exhaustive list of some DNS-based tooling that can confirm if DNS resolution is working from the target host against the current DNS servers (or ones to be specified)

*   [bind-utils](https://www.linuxfromscratch.org/%7Eken/inkscape-python-deps/blfs-book-sysv/basicnet/bind-utils.html) - (`dig`, `host`, `nslookup`)

## Network monitoring
`netstat` can be used to monitor current in and outbound connections, eg. with `netstat -ano` (or many other variations).

Although this can be installed in a container if desired. This will show **many** connections typically and could easily cause confusion, as it may derail an investigation if wanting to look into various ports. Be cautious with using this.

*   [net-tools](https://github.com/ecki/net-tools) - (`netstat`)

`tcpdump` (shown above in the linked blog post) is used to monitor and capture network traffic. This is incredibly helpful for trying to figure out the source of _Connectivity-based_ issues, especially in cases where it may not be obvious from a typical logging perspective

- [Home | TCPDUMP & LIBPCAP](https://www.tcpdump.org/) - (`tcpdump`)

# Common errors/scenarios on when to use certain tools over others
This is not a full-fledged list of errors, just ones to give you a general idea.

## Connectivity errors
Connectivity errors would imply that DNS is resolvable. But somewhere else in the network flow there is failure.

- Errors like the below are typically _connection_ based and therefor would make the most sense to use _Connectivity-based_ tooling to troubleshoot the issue while reproducing the issue:
  - `connection reset`
  - `connection refused`
  - `connection timed out`
  - `EOF/EOF timeout`
  - `couldn't acquire connection..`
  - etc.

  Errors may vary depending on the technology too, for example, with volume mounting through CIFS/NFS this may appear as `Output: mount error(115): Operation now in progress` or `Output: mount error(13): Permission denied` (in some scenarios). See [Troubleshooting volume mount issues on Azure Container Apps](https://azureossd.github.io/2023/07/24/Troubleshooting-volume-mount-issues-on-Azure-Container-Apps/index.html)

## DNS errors
DNS resolution needs to succeed to connect to a resource. If this fails, no proper connection is established. Note, SNAT port exhaustion or high CPU and very high request load can surface errors as DNS-issue related ones (like the below). This is not _real_ DNS problems - but rather performance/availability issues. Always make the distinction to ensure you're troubleshooting a _real_ DNS issue.

- Errors like the below are typically _DNS_ based and therefor would make the most sense to use _DNS-based_ tooling to troubleshoot the issue while reproducing the issue:
  - `no such host`
  - `Service Unavailable`
  - `addr not found`
  - etc.

Certain languages/frameworks/libraries may return their own version of these messages. If you're unsure of the error - **google/bing it** or search internally. In most cases there would be a thread/discussion online that would point you in the direction of what _kind_ of error it is.

## Scenarios
Some common scenarios that may occur are
- Outbound traffic to a registry is blocked by a NSG, UDR or unable to resolve the registries FQDN through the specified DNS server. See [Container Apps: Troubleshooting image pull errors](https://azureossd.github.io/2023/08/25/Container-Apps-Troubleshooting-image-pull-errors/index.html)
- Outbound traffic to Azure Storage for Azure Files is blocked by an NSG or UDR. More specifically blocking port 445 - both 443 and 445 should be allowed. (This also includes DNS resolution failures). See [Troubleshooting volume mount issues on Azure Container Apps](https://azureossd.github.io/2023/07/24/Troubleshooting-volume-mount-issues-on-Azure-Container-Apps/index.html)
- Outbound traffic to Azure Entra endpoints, specifically the ones listed in [Networking in Azure Container Apps environment](https://learn.microsoft.com/en-us/azure/container-apps/networking?tabs=workload-profiles-env%2Cazure-cli#application-rules) are denied by NSG rules or blocked in UDR's. This will cause potential issues with using Key Vault and Secrets and pulling images with Managed Identities.
- Intermittent DNS failures.
  - If you're using custom DNS servers, intermittent failures may be due to one or more of the custom DNS server's intermittently failing to resolve domains. You can use the DNS based tooling below as well as what's in the "helpful scripts" section to narrow down which one may be causing a problem

Most of the time, outbound traffic being blocked and cannot connect to a target service (but can resolve DNS fine) is due to NSG denying a specific port needed to connect (such as with Azure Files and port 445) and/or users who route traffic with a User Defined Route to a firewall/NVA where traffic is denied there.
- If reviewing firewall logs or NSG flow logs don't yield anything - a network trace can also be helpful. Aside from more general testing/isolation like allowing all in the NSG and/or firewall or NVA

With DNS - this could be a mix of custom DNS servers not able to resolve FQDN's - and more specifically not having Azure DNS set to resolve unresolved queries
- On other cases, when using Private Endpoints on target resources, misconfigured/incorrect Private DNS zones that point to wrong/incorrect records or IP's are another theme

All of the tooling and how to use it can typically help isolate many or all of the above common themes.

> **NOTE**: You can also get away with testing from a VM in the same subnet, and not strictly on Azure Container Apps, in some cases

# Prerequisites and installation
**IMPORTANT**:
- You will need _Console_ access. See the public docs at [Connect to a container console in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/container-console?tabs=bash). The Console option is essentially opening a shell to your specified container in a pod.
- The application container needs to be _running_. If it's scaled to zero (0) or **crashing** you will not be able to open a shell into it
- If the environment is in a network and is blocking outbound internet connectivity then there is a good chance package installation will fail. If no exception can be made to allow traffic to the internet to download these packages - then there is typically nothing else that can be done

Prior to installing any tooling in the application container, you should likely run the relevant package manager update command:
- Debian/Ubuntu: `apt-get update -yy`
- Alpine: `apk update`
- Mariner: `tdnf update`

## Debug container (Recommended)
The 'debug console' is a new offering which dynamically spins up a sidecar container in a pod with all of this tooling already available. Consider using that instead since all of the below tooling is already installed. If that option cannot be used for some reason, installing tools above in an application container is perfectly acceptable still.

See how to get started at [Connect to a container debug console in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/container-debug-console?tabs=bash)

## Application container tool installation
> **NOTE**: The below only cover Debian/Ubuntu, Alpine, and Mariner - there could be various other distro's. Use general search engines to figure out how to install relevant tooling into distributions not covered here.

> **NOTE**: If your `USER` in the container is not `root` or doesn't have user/group permissions to allow installations, it'll likely fail tool installation

**nc**:

Run the following to install `nc` (netcat)

- Debian/Ubuntu: `apt-get install -yy netcat-openbsd`
- Alpine: `apk add netcat-openbsd`
- Mariner: `tdnf install nc -yy`

**dig and nslookup**:

Run the following to install `dig` and `nslookup`

- Debian/Ubuntu: `apt-get install -yy dnsutils`
- Alpine: `apk add bind-tools`
- Mariner: `tdnf install bind-utils -yy`

**netstat**:

Run the following to install `netstat`

- Debian/Ubuntu: `apt-get install -yy net-tools`
- Alpine: `apk add net-tools`
- Mariner: `tdnf install net-tools -yy`

**wget**:

Run the following to install `wget`

- Debian/Ubuntu: `apt-get install -yy wget`
- Alpine: `apk add wget`
- Mariner: `tdnf install wget -yy`

**traceroute**:

Run the following to install `wget`

- Debian/Ubuntu: `apt-get install -yy traceroute`
- Alpine: `apk add traceroute`
- Mariner: `tdnf install traceroute -yy`

**tcptraceroute**:

Run the following to install `tcptraceroute`

- Debian/Ubuntu: `apt-get install -yy tcptraceroute`
- Alpine: `apk add tcptraceroute`
- Mariner: `tdnf install traceroute util-linux -yy`

**tcpdump**:

Run the following to install `tcpdump`

- Debian/Ubuntu: `apt-get install -yy tcpdump`
- Alpine: `apk add tcpdump`
- Mariner: `tdnf install tcpdump -yy`

**tcpping**:

Potential prerequisites to install this may be the `bc` package. You can install this with:

- Debian/Ubuntu: `apt-get install -yy bc`
- Alpine: `apk add bc`
- tdnf install bc -yy
  - Other `tdnf` potential prerequisites include:
    - `tdnf install gawk traceroute -yy`
   
The below uses `wget`. Install that if it's not already installed:

```
cd /usr/bin
wget http://www.vdberg.org/~richard/tcpping
chmod 755 tcpping
```

```
sh-5.1# tcpping google.com
traceroute to google.com (172.253.122.101), 255 hops max, 52 byte packets
seq 0: tcp response from bh-in-f101.1e100.net (172.253.122.101) <syn,ack>  2.850 ms
traceroute to google.com (142.251.167.139), 255 hops max, 52 byte packets
seq 1: tcp response from ww-in-f139.1e100.net (142.251.167.139) <syn,ack>  2.165 ms
```

# Useful scripts for testing
Connectivity tools like `tcpping` run on a loop which can be useful for trying to test intermittent connectivity issues. However others like `nc` or `dig` / `nslookup`, etc. exit after invocation. You can use an approach like the below to run the command in a script to better track down intermittent issues - the examples below execute the specified commands every 3 seconds:

```sh
#!/bin/sh

HOST_TO_LOOKUP="google.com"

while true; do
    nslookup ${HOST_TO_LOOKUP}
    sleep 3
done
```

Another is with `nc`. These kinds of simple loops could be extended based on use case and need:

```sh
#!/bin/sh

HOST_TO_LOOKUP="google.com"

while true; do
    nc -vz ${HOST_TO_LOOKUP} 443
    sleep 3
done
```

Using the _Console_ option, you could create these Bash/shell script files and execute them after for quick testing.

# Other useful posts
Other useful content related to networking troubleshooting on Container Apps can be found at the [AzureOSSD - Container Apps](https://azureossd.github.io/containerapps/) blog section. 
- [Troubleshooting DNS connectivity on Azure Container Apps](https://azureossd.github.io/2023/03/03/azure-container-apps-testing-DNS-connectivity/index.html)
- [Container Apps: How to capture a network trace using TCPDUMP](https://azureossd.github.io/2023/09/06/capturing-a-network-trace-aca/index.html)
- [Installing troubleshooting tools in a Container Apps ‘hello-world’ image](https://azureossd.github.io/2023/11/20/Installing-troubleshooting-tools-in-a-Container-Apps-helloworld-image/index.html)