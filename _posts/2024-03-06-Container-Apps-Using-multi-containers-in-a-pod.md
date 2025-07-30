---
title: "Container Apps - Using multicontainers in a pod"
author_name: "Anthony Salemo"
tags:
    - Linux
    - Configuration
    - Container Apps
    - Troubleshooting
categories:
    - Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azure-containerapps-logo-1.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-03-06 12:00:00
---

This post will go over general usage and other information about using multiple containers in a pod with Container Apps.

# Overview
Container Apps lets you use [multiple containers](https://learn.microsoft.com/en-us/azure/container-apps/containers#multiple-containers), if desired - this includes "sidecar" and "init" containers. These will all run together in a application pod or replica.

Since Container Apps is powered by Kubernetes, see [Kuberenetes.io - Pods with multiple containers](https://kubernetes.io/docs/concepts/workloads/pods/#how-pods-manage-multiple-containers).

An excerpt from the above link helps explain multicontainer usage in a pod or replica:

_Pods in a Kubernetes cluster are used in two main ways_
- _Pods that run a single container._
- _**Pods that run multiple containers that need to work together**. A Pod can encapsulate an application composed of multiple co-located containers that are tightly coupled and need to share resources. These co-located containers form a single cohesive unit of service—for example, one container serving data stored in a shared volume to the public, while a separate sidecar container refreshes or updates those files. The Pod wraps these containers, storage resources, and an ephemeral network identity together as a single unit._

Technically, most pods or replicas on Container Apps will already run in a multicontainer kind of set up. Since enabling services like Dapr, Built-in authentication, Managed Identity will add respective sidecar containers - and other "system" or "service" containers may exist outside of this.

However, the premise of "multi container" usage in this post and what's documented publicly is about being able to use more than one **application** container.

![Multicontainer UI](/media/2024/03/aca-multicontainer-1.png)

# Container types
There are two container types (aside from the "main" container):
- Sidecar
- Init

A sidecar will continuously run in the pod or replica (think background service or another TCP/HTTP/gRPC based application)

An init container will run, finish its logic, and exit _prior_ to the application container(s) starting. For information on init container usage, see the below blog posts:
- [Init Containers on Azure Container Apps](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/init-containers-on-azure-container-apps/ba-p/3930333)
- [Init Containers in Azure Container Apps : File Processing](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/init-containers-in-azure-container-apps-file-processing/ba-p/3930675)
- [Init Containers in Azure Container Apps : Database Initialization](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/init-containers-in-azure-container-apps-database-initialization/ba-p/3931271)

Sidecar containers are still defined in the `templates.containers` array in the Container App ARM spec. Essentially, if there is more than one (1) container defined in this array, the application pod or replica is using a multi container set up with sidecars.

Init containers are defined in a separate property, under the `templates.initContainers` array, in the Container App ARM spec

Documentation on container types can be found here - [Azure Container Apps - Multiple Containers](https://learn.microsoft.com/en-us/azure/container-apps/containers#multiple-containers)

# Containers and routing
Containers in pods can communicate with each other since these containers share a _network namespace_ which is a part of the pod. This functionality through Kubernetes lets pods communicate with each other over `localhost` instead of needing the pod IP.

This can be done since the network namespace with Kubernetes is shared between containers in a pod by default.

Since containers share the same namespace - care needs to be taken to avoid binding to the same port which can cause port clashes and one or more containers failing to start.

In the below example, the `frontend` container could call the `redis-sidecar` container by `localhost:6379`.

![Inter-pod routing](/media/2024/03/aca-multicontainer-2.png)

Within a pod with multiple containers on Container Apps - you can use `netstat -ano` to look at the listening addresses.

```
# netstat -ano
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       Timer
tcp        0      0 127.0.0.11:53           0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 0.0.0.0:8000            0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.8.90.151:23044      0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.8.90.151:23044      0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.8.90.151:23044      0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.8.90.151:23044      0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 0.0.0.0:23045           0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 0.0.0.0:23045           0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 0.0.0.0:23045           0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 0.0.0.0:23045           0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.78.144.42:23044     0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.78.144.42:23044     0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.78.144.42:23044     0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.78.144.42:23044     0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.39.62.152:23044     0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.39.62.152:23044     0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.39.62.152:23044     0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.39.62.152:23044     0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 0.0.0.0:6379            0.0.0.0:*               LISTEN      off (0.00/0/0)
```

Going off the above example, note that there is something listening to `0.0.0.6379` and `0.0.0.0:8000` which would correspond to application and sidecar containers. 

Depending what services are enabled (explained earlier above) there may be additional servers binding to addresses.

Another example is calling a sidecar API through its `localhost` address through `http://localhost:3000`:

![Inter-pod routing](/media/2024/03/aca-multicontainer-3.png)

-------------

To demonstrate further on other ways to configure routing, such as in a reverse proxy method - consider you have two containers - one is NGINX, the other is Go:

![Multicontainer UI with NGINX](/media/2024/03/aca-multicontainer-4.png)

1. These are two different containers in the pod. `go` is ran as a sidecar container. `nginx` is the main container.
2. One of these containers would need to be the "user" facing container - which `nginx` is, in this case - since it's listening port `80` and we have our ingress set to `80`.
3. Go is running at `0.0.0.0:3000` - since containers in pods can communicate via `localhost`, you could now `proxy_pass` requests from `nginx` to `go`:

(Go)
```go
func main() {
    app := fiber.New()

    app.Get("/", controllers.IndexController)
    app.Get("/get/headers", controllers.UpstreamController)

    log.Fatal(app.Listen(":3000"))
}
```

(NGINX)
```c
    location / {
        proxy_pass http://localhost:3000;
    }

    location /headers {
        proxy_pass http://localhost:3000/get/headers;
    }
```

You can confirm by Response Headers that the response is returned by NGINX, confirming this is being proxied:

![NGINX response](/media/2024/03/aca-multicontainer-5.png)

--------------

Using the same concept as above, instead of NGINX, we'll use our own custom Envoy container:


![Multicontainer UI with Envoy](/media/2024/03/aca-multicontainer-6.png)

1. Go is still listening at `0.0.0.0:3000` and was created as the sidecar container
2. Envoy is user facing and listening at port `10000` - ingress is also set to `10000`

The same Go code from above is used. For envoy, we configure this upstream endpoint as the following:

```yaml
....other fields
route_config:
  name: local_route
  virtual_hosts:
  - name: local_service
    domains: "*"
    routes:
     - match:
         prefix: "/headers"
       route:
         prefix_rewrite: "/get/headers"
         cluster: go-application
     - match:
         prefix: "/"
       route:
         cluster: go-application
....other fields

  clusters:
  - name: go-application
    connect_timeout: 30s
    type: LOGICAL_DNS
    # Comment out the following line to test on v6 networks
    dns_lookup_family: V4_ONLY
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: go-application
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: 127.0.0.1
                port_value: 3000
```

# Lifecycles
**Sidecar containers**:

For pods using multicontainers with sidecar containers (eg., app and sidecar containers), the lifecycle events would still follow what is described in [Container Apps - Demystifying restarts](https://azureossd.github.io/2024/01/11/Container-Apps-Demystifying-restarts/index.html)

There is no guarantee a certain container starts first. If an application requires the other application to be available - then the "client" application should use something like retry mechanisms (like general backoffs or exponential backoffs on connection or request attempts) until the other sidecar application or service is started.

**Init containers**:

Init containers will always run prior to the "main" and "sidecar" containers being created - as well as any system containers. Below is an example of what you'd see in `ContainerAppSystemLogs` / `ContainerAppSystemLogs_CL` regarding the pod lifecycle:

```
3/6/2024, 3:58:05.564 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq  Replica 'envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq' has been scheduled to run on a node.
3/6/2024, 3:58:12.953 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq     Successfully pulled image 'someacr.azurecr.io/containerappsmulticontainers-envoy:headers2' in 5.8793404s
3/6/2024, 3:58:14.096 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq     Successfully pulled image 'someacr.azurecr.io/azurecontainerappsgoinitcontainer:latest' in 7.4125569s
3/6/2024, 3:58:14.615 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq     Successfully pulled image 'someacr.azurecr.io/containerappsmulticontainers-go:latest' in 8.7526821s
3/6/2024, 3:58:14.615 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq     Created container 'go-init'
3/6/2024, 3:58:15.721 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq    Started container 'go-init'
3/6/2024, 3:58:15.721 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq    Probe started from stage StartUp
3/6/2024, 3:58:15.721 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq    Container 'go-init' was terminated with exit code '0' and reason 'ProcessExited'
3/6/2024, 3:58:15.721 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq    Probe started from stage StartUp
3/6/2024, 3:58:15.721 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq    Probe started from stage StartUp
3/6/2024, 3:58:15.721 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq    Created container 'envoyproxy'
3/6/2024, 3:58:15.721 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq    Started container 'envoyproxy'
3/6/2024, 3:58:15.721 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq    Probe started from stage StartUp
3/6/2024, 3:58:15.721 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq    Created container 'go'
3/6/2024, 3:58:15.721 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq   Started container 'go'
3/6/2024, 3:58:15.721 PM    envoy-go-multicontainer--94j5cq2-66b45d94c-wmhlq    Probe started from stage StartUp
```

We can infer the above from logging:
- There is a container named `go-init` which runs to completion **prior** to any system or other application main/sidecar containers that start their lifecycle events
- After the init container completes, the rest of typical container lifecycles continue for both system and other app containers

> **NOTE**: The above is a pod in a Dedicated environment - logging will be slightly different on Consumption-Only

**IMPORTANT**: For the rest of the system and app containers to move forward in their typical lifecycle events (image pull, container create, start, etc.) - the init container needs to succeed. An exit code of greater than 1, failing startups, failing image pulls, failing container creation, etc. - will all cause the pod or replica to be marked as "failed".

Below is a diagram of the lifecycle which includes init containers as described above:

![Pod lifecycle with init containers](/media/2024/03/aca-multicontainer-7.png)

# Configuration
## General
For both init container and main containers - typical container configuration that exists for main containers can be done for init containers.

With the following exceptions:
- Health Probes are not supported for init containers. They **are** supported for sidecar containers.
- init containers do not have access to Managed Identities at runtime. They **can** be used for image pulls with Managed Identity, however. See the [Init Containers](https://learn.microsoft.com/en-us/azure/container-apps/containers#init-containers) public documentation.

The Container App ARM definition can be found [here](https://learn.microsoft.com/en-us/azure/container-apps/azure-resource-manager-api-spec?tabs=arm-template#container-app) for further configuration.

## Health Probes
Health Probes can be configured for each individual container. Review the [Container Apps: Troubleshooting and configuration with Health Probes](https://azureossd.github.io/2023/08/23/Container-Apps-Troubleshooting-and-configuration-with-Health-Probes/index.html) blog for further information on probes and troubleshooting.

Note, that if one of the containers Health Probes starts to fail the defined probe definitions - the Revision will be marked as failed or potentially degraded.

# Troubeshooting
## Revision, pod, or application is marked as "Failed"
Essentially almost all troubleshooting for a multi container app should follow typical app troubleshooting.

The only main difference is if the init container exits with a status code greater than zero (0) and/or consistently fails start up - amongst other typical fatal issues like image pull failures, volume mount failures, container create failures, etc. - then the rest of system and app container creation and lifecycle events will not move forward. Logging and events will appear typical Container App logging tables.

Below is an example of what you'd see in `ContainerAppSystemLogs_CL` / `ContainerAppSystemLogs` if an init container was failing to start or exit with a unsuccessful status code:

```
ReplicaName	msg
someapp--se423cs-568986fd64-rxzvg	Pulling image "someacr.azurecr.io/azurecontainerappsgoinitcontainer:exit1"
someapp--se423cs-568986fd64-rxzvg	Successfully pulled image "someacr.azurecr.io/azurecontainerappsgoinitcontainer:exit1" in 189.996488ms (190.001986ms including waiting)
someapp--se423cs-568986fd64-rxzvg	Created container go-init
someapp--se423cs-568986fd64-rxzvg	Started container go-init
someapp--se423cs-568986fd64-rxzvg	Persistent Failiure to start container
someapp--se423cs-568986fd64-rxzvg	Back-off restarting failed container go-init in pod someapp2--se423cs-568986fd64-rxzvg_k8se-apps(adb8d524-571f-4928-ab41-7a7b927e2f8b)
```

At that point, you should look in `ContainerAppConsoleLogs_CL` / `ContainerAppConsoleLogs` or Logstream to review application `stdout` / `stderr`

## Common issues and scenarios
Since a large amount of issues will be the same as typical application and/or configuration issues, below are some quick reference links:
- [Container Apps - Troubleshooting ‘ContainerCreateFailure’ and ‘OCI runtime create failed’ issues](https://azureossd.github.io/2024/01/16/Container-Apps-Troubleshooting-OCI-Container-create-failed-issues/index.html)
- [Container Apps: Troubleshooting and configuration with Health Probes](https://azureossd.github.io/2023/08/23/Container-Apps-Troubleshooting-and-configuration-with-Health-Probes/index.html)
- [Troubleshooting volume mount issues on Azure Container Apps](https://azureossd.github.io/2023/07/24/Troubleshooting-volume-mount-issues-on-Azure-Container-Apps/index.html)
- [Container Apps: Troubleshooting image pull errors](https://azureossd.github.io/2023/08/25/Container-Apps-Troubleshooting-image-pull-errors/index.html)
- [Container Apps - Backoff restarts and container exits](https://azureossd.github.io/2024/01/19/Container-Apps-Backoff-restarts-and-container-exits/index.html)

For blog posts filed under the "Container Apps" category - see [Category - Container Apps](https://azureossd.github.io/containerapps/). Or, review the general [Azure OSS Developer blog](https://azureossd.github.io/)

## Address or port in use
Given the way networking with pods work - containers in a pod share the same network name space. Ports will need to be unique. If not, you'll run into something like the below in `ContainerAppConsoleLogs` / `ContainerAppConsoleLogs_CL` - and in turn, the revision will show as "failed":

```
failed to listen: listen tcp4 :3000: bind: address already in use
```

The above is just an example with Go - but the same general message will show regardless of language (with just some variation in the message). This can occur if you have two or more containers in a pod that happen to be binding to the same port.

To resolve this - ensure each container is using a unique port.

## init containers are not added when using IaC
IaC refers to infrastructure-as-code - like Bicep, ARM, Terraform, Pulumi, etc.

Ensure that recent API versions described in the [Container Apps ARM specification](https://learn.microsoft.com/en-us/azure/container-apps/azure-resource-manager-api-spec?tabs=arm-template) are used. As of writing this now - there is older or deprecated API versions available when init containers did not exist. A deployment may be successful when using these versions with IaC - but the `initContainers` array on the Container App resource will be `null` due to the usage of old versions.

## Metrics
CPU and Memory metrics exposed are for the pod resource usage as a whole, which is made up by the containers within. If troubleshooting high CPU or high memory scenarios - this may need to be taken into account.

If tools like `top` or `ps` exist in the container - you can go into a container to validate which process may be consuming high CPU or memory. If these tools don't exit - they can (normally) be installed - assuming access to the internet is not completely locked down for package installation.

Note, when you have a shell opened with a specific container, this will _not_ show process ID's from other containers in a pod. This is because the PID namespace is not shared between containers in a pod - by default, in Kubernetes. 

Blog posts for performance on Container Apps can be found in [Container Apps - Performance](https://azureossd.github.io/containerapps/#performance)