---
title: "Troubleshooting 'com.hazelcast.kubernetes.RestClientException' with Spring Cloud Gateway on Azure Spring Apps"
author_name: "Anthony Salemo"
tags:
    - Spring Apps
    - Java
    - Deployments
    - Troubleshooting
categories:
    - Azure Spring Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration
    - Java # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Spring Apps
    - Troubleshooting 
header:
    teaser: /assets/images/springapps.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-07-12 12:00:00
---

This post will cover what seeing 'com.hazelcast.kubernetes.RestClientException: Failure in executing REST call' may mean when deploying a Spring Cloud Gateway on Azure Spring Apps

# Overview
[Spring Cloud Gateway](https://learn.microsoft.com/en-us/azure/spring-apps/enterprise/how-to-use-enterprise-spring-cloud-gateway) on Azure Spring Apps Enterprise Tier is one of the Tanzu components offered with this specific tier. This is an optional additional component that can be used for routing to other applications, amongst a number of other capabilities. 

This post will cover a deployment failure scenario about deploying Azure Spring Apps Enterprise that is VNET injected and when using Spring Cloud Gateway. This could be enabled upfront during instance creation - or after. You'd generally see something like the following
- A message returned via IaC, the Azure Portal, or some other deployment client stating `CreateOrUpdateSpringCloudGateway` "Failed"
- The Spring Cloud Gateway may be in a "Failed" state. Operations to it will eventually time out.
- The Azure Spring Apps Enterprise instance would technically be in a created state. The issues above would be limited in scope to Spring Cloud Gateway

The error in question that we're focusing on and would accompany this is `com.hazelcast.kubernetes.RestClientException: Failure in executing REST call`


# Issue
For Spring Cloud Gateway to provision successfully, both the `gateway` (`asc-scg-default`) replicas and the operator pod (`scg-operator`) need to succesfully start. There is various logic upon startup of these containers in these pods/replicas that need to be successful. 

One potential issue is seeing a message like this: `com.hazelcast.kubernetes.RestClientException: Failure in executing REST call`. This is viewable through the following table and query in Log Analytics (see [here](https://learn.microsoft.com/en-us/azure/spring-apps/enterprise/how-to-troubleshoot-enterprise-spring-cloud-gateway)) 

```
AppPlatformSystemLogs
| where LogType in ("SpringCloudGateway")
| project TimeGenerated, ServiceName, LogType, Log, InstanceName, _ResourceId
```


Seeing this would very likely correlate to a Spring Cloud Gateway in a 'failed' provisioning state - additionally, any operations against SCG in a 'failed' state may immediately fail or timeout after a while:

An example of the entirety of this message and what is occurring, that is leading up to this, is seen below:

```
2024-06-06T23:16:02.977Z  INFO 1 --- [           main] com.hazelcast.system                     : [10.1.4.18]:5701 [dev] [4.2.8] Hazelcast 4.2.8 (20230529 - 90df6cd) starting at [10.1.4.18]:5701
2024-06-06T23:16:03.200Z  INFO 1 --- [           main] c.h.s.d.integration.DiscoveryService     : [10.1.4.18]:5701 [dev] [4.2.8] Kubernetes Discovery properties: { service-dns: null, service-dns-timeout: 5, service-name: asc-scg-default-headless, service-port: 5701, service-label: null, service-label-value: true, namespace: scg-system, pod-label: null, pod-label-value: null, resolve-not-ready-addresses: true, use-node-name-as-external-address: false, kubernetes-api-retries: 3, kubernetes-master: https://kubernetes.default.svc}
2024-06-06T23:16:03.202Z  INFO 1 --- [           main] c.h.s.d.integration.DiscoveryService     : [10.1.4.18]:5701 [dev] [4.2.8] Kubernetes Discovery activated with mode: KUBERNETES_API
2024-06-06T23:16:03.238Z  INFO 1 --- [           main] com.hazelcast.instance.impl.Node         : [10.1.4.18]:5701 [dev] [4.2.8] Using Discovery SPI
....
2024-06-06T23:16:03.542Z  WARN 1 --- [           main] com.hazelcast.kubernetes.RetryUtils      : Couldn't discover Hazelcast members using Kubernetes API, [1] retrying in 1 seconds...
2024-06-06T23:16:05.076Z  WARN 1 --- [           main] com.hazelcast.kubernetes.RetryUtils      : Couldn't discover Hazelcast members using Kubernetes API, [2] retrying in 2 seconds...
2024-06-06T23:16:07.362Z  WARN 1 --- [           main] com.hazelcast.kubernetes.RetryUtils      : Couldn't discover Hazelcast members using Kubernetes API, [3] retrying in 3 seconds...
...
2024-06-06T23:16:10.778Z  INFO 1 --- [           main] c.h.s.d.integration.DiscoveryService     : [10.1.4.18]:5701 [dev] [4.2.8] Cannot fetch the current zone, ZONE_AWARE feature is disabled
2024-06-06T23:16:10.832Z  WARN 1 --- [           main] com.hazelcast.kubernetes.RetryUtils      : Couldn't discover Hazelcast members using Kubernetes API, [1] retrying in 1 seconds...
2024-06-06T23:16:12.369Z  WARN 1 --- [           main] com.hazelcast.kubernetes.RetryUtils      : Couldn't discover Hazelcast members using Kubernetes API, [2] retrying in 2 seconds...
2024-06-06T23:16:14.657Z  WARN 1 --- [           main] com.hazelcast.kubernetes.RetryUtils      : Couldn't discover Hazelcast members using Kubernetes API, [3] retrying in 3 seconds...
2024-06-06T23:16:18.068Z  WARN 1 --- [           main] c.h.s.d.integration.DiscoveryService     : [10.1.4.18]:5701 [dev] [4.2.8] Cannot fetch name of the node, NODE_AWARE feature is disabled
2024-06-06T23:16:18.100Z  WARN 1 --- [           main] com.hazelcast.kubernetes.RetryUtils      : Couldn't discover Hazelcast members using Kubernetes API, [1] retrying in 1 seconds...
2024-06-06T23:16:19.637Z  WARN 1 --- [           main] com.hazelcast.kubernetes.RetryUtils      : Couldn't discover Hazelcast members using Kubernetes API, [2] retrying in 2 seconds...
2024-06-06T23:16:21.926Z  WARN 1 --- [           main] com.hazelcast.kubernetes.RetryUtils      : Couldn't discover Hazelcast members using Kubernetes API, [3] retrying in 3 seconds...
2024-06-06T23:16:25.333Z ERROR 1 --- [           main] c.h.i.cluster.impl.DiscoveryJoiner       : [10.1.4.18]:5701 [dev] [4.2.8] Failure in executing REST call

com.hazelcast.kubernetes.RestClientException: Failure in executing REST call
```
This logic is executed upon container startup in the `asc-scg-default-[n]` replicas.

What we notice here is the following messages: `Kubernetes Discovery properties: ... kubernetes-api-retries: 3, kubernetes-master: https://kubernetes.default.svc`. What we can infer is that:
- Retry attempts are [3] (which is seen above in the log messages)
- `https://kubernetes.default.svc` is the [Kuberentes Service FQDN](https://kubernetes.io/docs/tasks/run-application/access-api-from-pod/) for accessing the `kubeapi-server` replicas - aka. the "Kubernetes API" in the above message and in general

> **NOTE**: This behavior is present upon startup, in general

So what is happening, is that upon `gateway` replica startup - it's trying to make a request to the Kubernetes API server - but the request is timing out. Which is very likely due to the fact that traffic is being blocked to the `kubeapi-server`. Note that the message is not talking about failed DNS resolution - but rather just time outs. Indicating a likely deny in traffic. More important points to note are:
- This scenario currently is only relevant if an instance is using a VNET
- Subnets using UDRs/Route Tables that traverse through a firewall or external appliance can greatly affect this behavior


# Troubleshooting
Prior to using the below commands, for users who are deploying with an older or "smaller" Tanzu Builder (eg. `tiny`, `base`) - the below commands may not be available.

If they're not, create or edit your builder to a `full` builder image. The below example shows the `default` builder edited to use `io.buildpacks.stacks.jammy-full`:

![Builder image OS](/media/2024/07/asa-scg-3.png)

---------
At this point, if using a VNET - you'd want to first follow and read [Customer responsibilities for running Azure Spring Apps in a virtual network](https://learn.microsoft.com/en-us/azure/spring-apps/enterprise/vnet-customer-responsibilities)

This behavior can happen for a few reasons:
- Denying traffic to `kubeapi-server` in a firewall. Firewall logs may show this being blocked. Users should review their firewall set up to see what is allowed and what is denied.
- Firewall that have validation against self-signed certificates. Firewalls returning their own certificate information for the `kubeapi-server` certificate, instead of Kubernetes own information - or - some type of certificate "checkpoint" behavior that may affect traffic for self-signed certs
- **Generally not following the required rules in [Customer responsibilities for running Azure Spring Apps in a virtual network](https://learn.microsoft.com/en-us/azure/spring-apps/enterprise/vnet-customer-responsibilities)**

Although the error is not explicitly describing a DNS misconfiguration - ensure this is reviewed proactively in the above link. 

The below troubleshooting can potentially help further isolate the problem. Before going too much further - ensure some other high level problems are not occurring:
- The UDR on the subnet(s) are not accidentally pointing to the wrong network device
- The subnets and VNET are not accidentally peered to the wrong VNET (if VNET peering is used)

The `kubeapi-server` should typically be under a `10.0.0.1` address. In complex networking scenarios - ensure that address is whitelisted/allowed. Additionally, to avoid any other problems with underlying cluster connectivity - ensure the FQDN `*.azmk8s.io` with `HTTPS:443` is whitelisted. 

Going into **Console** for a container on an app that works in the environment, use the `env` or `printenv` command, you can see the IP for the Kubernetes API - below is an example:

```
...
KUBERNETES_PORT_443_TCP=tcp://10.0.0.1:443
KUBERNETES_SERVICE_PORT_HTTPS=443
KUBERNETES_SERVICE_HOST=10.0.0.1
...
```

![Kubernetes endpoints](/media/2024/07/asa-scg-1.png)

Since we saw the Spring Cloud Gateway replicas trying to use `https://kubernetes.default.svc` in its startup logic - we can do a quick test to see what this resolves to. From **Console** on a working application, you can run `nslookup kubernetes.default.svc.cluster.local`

![Kubernetes Service](/media/2024/07/asa-scg-2.png)

We can see this resolves to `10.0.0.1`, which is what we expect given the above. Note, that this is just test for validation and actual cluster access or anything typically deeper than this with interacting with the underlying cluster is blocked, by design.

To ensure that `kubeapi-server` is accessible, we can do a few things:

**nc**:
- Another way to validate connection is to use the `nc` command - this would confirm whether or not the target port is accessible or open 

  ![nc command](/media/2024/07/asa-scg-4.png)

  This example shows a successfull connection. If you're seeing `nc` timeout or fail to the IP address - this is a possible indication of traffic being denied. This is especially common with UDR's being used and network devices along these routes.

**openssl**:
- `openssl` can be used for two potential things, as an example, in this case.
1. To check if the `tls` version supplied to the `kubeapi-server` works
2. To see the certificate returns from `kubeapi-server`


   Below is a test to see what certificate is returned.

   ![openssl certificate command](/media/2024/07/asa-scg-5.png)

   We can see here the connection itself is successful - furthermore, we can see that `apiserver` is returned in the `CN` - which is what we want.

   If you see something other than this - for example, your own firewalls certificate (or something certificate related to a network device in the flow of the UDR) then this would indicate the firewall or said device is potentially altering this.

   It is important to note that these Kubernetes certificates are **self-signed**. This should be noted for firewalls/devices used that may check for self-signed certificates and deny requests related to this - or ones that do any type of "certificate checkpointing" and acts upon this.

    The other usage of `openssl` could be to validate the protocol used from Spring Cloud Gateway to the `kubeapi-server` - which is `tls 1.2`.

    ![openssl certificate command](/media/2024/07/asa-scg-6.png)

    Here, we pass the `-tls1_2` option to `openssl`. We can see this is succesfull.

    If this _failed_ - this would likely indicate that a device (if UDR's are being used) is generally denying traffic, or, denying traffic based on this protocol.


