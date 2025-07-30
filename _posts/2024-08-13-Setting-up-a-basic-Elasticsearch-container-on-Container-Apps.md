---
title: "Setting up a basic Elasticsearch container on Container Apps"
author_name: "Anthony salemo"
tags:
    - Container Apps
    - Configuration
    - Troubleshooting
    - Deployment
    - Elasticsearch
categories:
    - Azure Container App # Azure App Service on Linux, Azure App Service on Windows,  
    - How To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azure-containerapps-logo.png"
toc: true
toc_sticky: true
date: 2024-08-13 12:00:00
---

This post will cover deploying and setting up a basic Elasticsearch container on Azure Container Apps

# Overview
[Elasticsearch](https://www.elastic.co/elasticsearch) is a search and analytics software that's widely known and popular - which also makes up part of the _ELK_ stack. This post will cover deploying a basic Elasticsearch image from [Dockerhub](https://hub.docker.com/_/elasticsearch/) and running it on Azure Container Apps

# Deployment
This example will use the portal. You can use IaC or the AZ CLI, amongst other potential options, to create the application.

1. Navigate to the "Create a resource" option and search for "Container Apps" in the market place. Fill out the required fields:

    ![Step form creation for Container Apps](/media/2024/08/elastic-1.png)

2. Fill our the required fields under the **Container** blade. Set the following notable fields:
    - **Image source**: _Docker hub or other registrieis_
    - **Image type**: _Public_
    - **Registry login server**: _docker.io_
    - **Image and tag**: _elasticsearch:8.15.0_

    For _Workload profile_ (not available on _Consumption-only_ SKU), _CPU cores_, _Memory_, etc. - fill these out are deemed fit

    ![Container configuration for Container Apps creation](/media/2024/08/elastic-2.png)

    **IMPORTANT**: This examples uses the _8.15.0_ tag - which has a notable change from _7.x_ which will be explained later. You can use a _7.x_ tag version if desired

3. Set up your ingress. In this example, we'll be using _external_ ingress. Make sure to set the port to 9200 regardless of your ingress type.

    ![Ingress configuration for Container Apps creation](/media/2024/08/elastic-3.png)

4. Click **Review + create** to create the Container App


5. As seen in the **Container** blade, you have the options to set environment variables through here. We'll need to add some to get the application functional. But for the sake of explanation of what needs to be configured, we'll talk about this in the next section.

## Configuration
### Environment variables
You'll need to set two environment variables here to get this to work. This comes with some caveats. The biggest is needing to run in `single-node`. If this is a blocker for certain projects, it would be best to run on a platform (such as an Azure Linux VM or AKS) where you have host access to change `vm.max_map_count` - as without setting `discovery.type`to `single-node` will have Elasticsearch's logic go through [Bootstrap Checks](https://www.elastic.co/guide/en/elasticsearch/reference/current/bootstrap-checks.html) that will cause the container to fail to start, typically with the error regarding `vm.max_map_count` being too low due to underlying nodes mmap configuration.

> **IMPORTANT**: PaaS services like Container Apps, Spring Apps, Web App for Containers, etc. all do not let users set `vm.max_map_count`

1. `discovery.type` = `single-node`. What this does is explained [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/bootstrap-checks.html#single-node-discovery). When setting this, this will surpress the error at startup of `Max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]` - which **cannot be set on Container Apps** since this will avoid certain bootstrap checks. .
2. `xpack.security.enabled` = `false`. Starting with 8.x - HTTPS is enabled by default for these Elasticsearch images. On Container Apps, the proxied request between Envoy and the pod is through HTTP - as TLS offloading happens at the Load Balancer, which is infront of Envoy. This should be set, or else you'll get HTTP 502's (even thoug the container is running in the pod) or potential `received plaintext http traffic on an https channel` warnings.
    - If using a 7.x image - you may not need to set this.

To add an environment variable - go to **Containers** -> select the container to  **Edit** -> **Environment Variables** and then click "Save"

![Adding environment variables for Elasticsearch](/media/2024/08/elastic-4.png)


### Volumes
We need to persist the search data, to do so, we can use Azure Files and mount it as a persistent volume. Otherwise, given that containers (and pods) are ephemeral, data will be lost after a new pod is created or a container is restarted.

Add a Storage resource on the Container App Environment and then add a volume to the container mapped to the `/usr/share/elasticsearch/data` directory.

Follow [Use storage mounts in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?pivots=azure-portal&tabs=smb#temporary-storage) on how to configure volumes for a container.

![Adding storage volumes for Elasticsearch](/media/2024/08/elastic-5.png)

# Usage
After configuring the above, we should be able to test the application.

1. Add an index: `curl -X PUT https://elasticsearch.funnyname-12345-abc.someregion.azurecontainerapps.io/cities`
    - In logging (`ContainerAppConsoleLogs_CL` / `ContainerAppConsoleLogs` / Logstream, etc.) you should see this message: `[cities] creating index, cause [api], templates [], shards [1]/[1]`

2. Add data: 
    - `curl -X POST -H 'Content-Type: application/json' -d '{ "city": "rome", "country": "it" }' https://elasticsearch.funnyname-12345-abc.someregion.azurecontainerapps.io/cities/_doc`
    - `curl -X POST -H 'Content-Type: application/json' -d '{ "city": "tokyo", "country": "jp" }' https://elasticsearch.funnyname-12345-abc.someregion.azurecontainerapps.io/cities/_doc`
    - `curl -X POST -H 'Content-Type: application/json' -d '{ "city": "paris", "fr": "it" }' https://elasticsearch.funnyname-12345-abc.someregion.azurecontainerapps.io/cities/_doc`

3. Query the data - you can use various clients: `curl -X GET "https://elasticsearch.funnyname-12345-abc.someregion.azurecontainerapps.io/cities/_search?pretty" -H 'Content-Type: application/json'`

    ![Querying data from Elasticsearch](/media/2024/08/elastic-6.png)


# Troubleshooting
## max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
This will surface if not running `discovery.type` of `single-node`. The common way to resolve this is to have some type of host access to change `vm.max_map_count` - however as explained earlier **this cannot be done on Container Apps** (and other services)

## received plaintext http traffic on an https channel
This will occur if you're using an Elasticversion of 8.x or higher since TLS is enabled by default. Set `xpack.security.enabled` = `false` to overcome this.

## java.lang.IllegalStateException: failed to obtain node locks
The full message in this context is `java.lang.IllegalStateException: failed to obtain node locks, tried [/usr/share/elasticsearch/data]; maybe these locations are not writable or multiple nodes were started on the same data path?`.

This will occur if the `nobrl` mount option is **not** set. This is to allow file writes when [Container Apps are going through pod activity](https://azureossd.github.io/2024/01/11/Container-Apps-Demystifying-restarts/index.html). See [Preventing File Locks when mounting storage on Azure Container Apps](https://azureossd.github.io/2024/05/16/Preventing-File-Locks-Azure-Container-Apps/index.html)

## Issues with restarts
There may be certain behavior where Elasticsearch acts in the following when a restart (ex. a new pod is creating while the other one is being removed, thus an overlap situation occurs briefly (see the 'restarted' blog post above))
1. `java.io.IOError: java.nio.file.NoSuchFileException: /usr/share/elasticsearch/data/some/file`
    - This may end up recovering on its own
    - This doesn't recover and requires `_state` to be deleted

This behavior may not be ideal - coupled with the `single-node` usage, if this behavior is encountered, it may be best to run the Elasticsearch image on other services that are not PaaS, in general, like IaaS, where host access can be done by end-users to change Elasticsearch where this won't be a restriction, given much of Elasticsearch's documentation points to this type of unrestricted configuration.