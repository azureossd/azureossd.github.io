---
title: "Container Apps - Demystifying restarts"
author_name: "Anthony Salemo"
tags:
    - Linux
    - Container Apps
    - Performance
    - Troubleshooting
categories:
    - Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azure-containerapps-logo-1.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-01-11 12:00:00
---

This post will discuss some behavior surrounding "restarts" on Azure Container Apps.

# Overview
There may be times in logging, or maybe, custom alerts (if set up), that indicates a Container App restarted. Typically one of the first thoughts is _"why"_.

Note, this post will not nessecarily go into troubleshooting regarding any adverse reactions to restarts. But rather explain some of the potential reasons _why_ this may occur and behavior of it.

# "Restart" behavior
Since Container Apps is inheritly Kuberentes-based - and given the fact that application(s) run as a pod or replicas - a "restart" is a bit different than what be thought of as restart an existing container.

When a Container App is restarted - such as through the **Revision** -> "Restart" option (but also for the reasons listed in "Restart reasons" below), this ends up creating a _new_ pod or _new_ replicas. This does **_not_** restart just only a container or containers in the pod/replicas at the time and retain those specific pod/replicas. New pod/replicas (and thus new containers) will be created.

Again, given that this is inheritly a kubernetes concept - and pod/replicas are the "smallest schedulable unit" - we're technically not operating at a per-container basis, when it comes to restarts.

When a "restart"/pod or replica movement does occur, it follows the below approach:

![ACA restart behavior](/media/2024/01/aca-restart-diagram.png)

1. Pod `someapp-klis5dn--klis5dn-5988c6bbbf-ppbdw` is running
2. An event explicitly restarts the revision, or some other event occurs that creates a new pod 
3. New replica `some-appklis5dn-8579475cfd-tktxh` is assigned to a node, the pod is created, the containers created, and the containers start:
   - `Replica 'some-appklis5dn-8579475cfd-tktxh' has been scheduled to run on a node.`
   - Images are repulled
   - Create system and app containers
   - Start system and app containers
4. Containers in pod `someapp-klis5dn--klis5dn-5988c6bbbf-ppbdw` are stopped
5. Pod `someapp-klis5dn--klis5dn-5988c6bbbf-ppbdw` is deleted

The red box in the foreground shows the concept of "no downtime" deployments where at a brief point in time there are **two (2)** replicas running.

This is why in certain views you may see a brief increase in replica count in these kinds of scenarios.


This can also be seen in the `ContainerAppSystemLogs_CL` or `ContainerAppSystemLogs` Log Analytics/Azure Monitor tables and focusing on the `ReplicaName_s` column. You'll notice the change in pod or replica names and event activity like:

```
TimeGenerated              Log_s                                                                                                                ReplicaName_s
1/11/2024, 7:23:21.206 PM  Replica 'some-app--v8yb5cv-68cf9bd595-vqwrp' has been scheduled to run on a node.
1/11/2024, 7:23:26.855 PM  Pulling image "mcr.microsoft.com/k8se/quickstart:latest"                                                             some-app--v8yb5cv-68cf9bd595-vqwrp
1/11/2024, 7:23:28.297 PM  Successfully pulled image "mcr.microsoft.com/k8se/quickstart:latest" in 1.111535414s (1.11154593s including waiting) some-app--v8yb5cv-68cf9bd595-vqwrp
1/11/2024, 7:23:28.297 PM  Created container simple-hello-world-container                                                                       some-app--v8yb5cv-68cf9bd595-vqwrp
1/11/2024, 7:23:28.297 PM  Started container simple-hello-world-container                                                                       some-app--v8yb5cv-68cf9bd595-vqwrp
1/11/2024, 7:23:31.527 PM  Stopping container simple-hello-world-container                                                                      some-app--v8yb5cv-6cbc7f9c8b-fg8vn
```

**Health Probes failing after restarts**:

After a restart-like event, you may see something like `readiness probe failed: connection refused`. For the context of this post, this is not talking about most of what is described in [Container Apps: Troubleshooting and configuration with Health Probes](https://azureossd.github.io/2023/08/23/Container-Apps-Troubleshooting-and-configuration-with-Health-Probes/index.html)

Potentially, if you notice and compare the Replica/Pod name - you may actually see that this is occuring for the previously shutdown containers and deleted pod. Below is an example via `ContainerAppSystemLogs_CL` for a pod being removed due to a restart.

```
TimeGenerated                Log_s                                        ReplicaName_s
1/11/2024, 7:23:31.527 PM    Stopping container simple-hello-world-container
1/11/2024, 7:23:37.012 PM    readiness probe failed: connection refused   my-app--v8yb5cv-6cbc7f9c8b-fg8vn
1/11/2024, 7:23:32.009 PM    readiness probe failed: connection refused   my-app--v8yb5cv-6cbc7f9c8b-fg8vn
1/11/2024, 7:23:42.471 PM    readiness probe failed: connection refused   my-app--v8yb5cv-6cbc7f9c8b-fg8vn
```

What is happening is that probes are being sent to these containers after being shut down from a restart-like event. This is harmless and can be ignored.

# Restart reasons
- Management operations, such as:
  - Creation of new revisions (which creates a new pod/replicas)
    - This can be manually done to explicitly create a new one
    - Any changes to [revision scope](https://learn.microsoft.com/en-us/azure/container-apps/revisions#revision-scope-changes) properties
      - Common themes would be changing the image or tag, environment variables, and others
    - Scaling up
      - Note, that scaling _out_ would appear as if new replica was starting and not _restarting_ in the sense of old pod/replicas being shutdown and new ones being created
  - Restart of a revision


**Node movement**:

Kubernetes-based applications run on _nodes_ - which is essentially just some type of server (a VM, physical machine, etc.). If coming from Azure App Service - there may be familiarity with _instances_ and platform upgrades.

This same compute concept applies to Container Apps. At times, there may be platform maintenance or node "movement" for other reasons - which is also called out in [Azure Container Apps environments](https://learn.microsoft.com/en-us/azure/container-apps/environment)

This will also appear to look like a restart. To prevent any potential issues in these cases - it's typically a good idea to run >= 2 replicas or more

Note, that in certain cases you may also see something like `0/4 nodes are available` (although 0/x count will vary) - in most cases, this likely does not affect the application, and can rather be a sign of node movement and pod/replicas being rescheduled.

**Back-off restarts**:

This is probably one of the closest concepts to a classic container restart in a Kubernetes based environment. When `back-off restarts` occur, this means the container is consistently failing to be started. 
- An example of this would be consistently exiting upon startup

This will appear in `ContainerAppSystemLogs_CL` or `ContainerAppSystemLogs` - this is a product of a failing container and not an explicit user action technically.

When this occurs, the container will attempted to be restarted a defined number of times before the pod/replica is marked as failed. This may look like the following in the above Log Analytic / Azure Monitor tables:

```
Log_s                                    ReplicaName_s                                  Reason_s
Persistent Failiure to start container   some-app--6v70gws-995846dc9-jbvdz              ContainerBackOff
```
