---
title: "Running gRPC with Container Apps"
author_name: "Anthony Salemo"
tags:
    - Azure Container Apps
    - Docker
    - Kubernetes
    - Configuration
    - Deployment
categories:
    - Deployment    
    - How-To
    - Configuration
    - Docker
header:
    teaser: "/assets/images/azure-containerapps-logo.png" 
toc: true
toc_sticky: true
date: 2022-07-07 12:00:00
---

[Azure Container Apps](https://docs.microsoft.com/en-us/azure/container-apps/overview) is a new offering that runs on top of [Kubernetes](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/). A nice feature of this is that it supports [gRPC](https://grpc.io/), which uses HTTP/2 as its transport protocol.

With using gRPC comes a few new concepts to be aware of, some that will be covered here. 

## Configuring
### The Transport property
By default when creating a Container App Environment, the `transport` property is set to `Auto` - assuming this is not changed explicitly during creation. 

Values for `transport` can be `Auto`, `http` and `http2`. The `transport` setting for the environment can be checked in the portal in the **Overview** blade of the Container App like the below:

![Overview Blade](/media/2022/07/azure-grpc-blog-1.png)

As of right now there is no direct way to change this to `http2` in the portal. **However**, methods such as the [AZ CLI](https://docs.microsoft.com/en-us/cli/azure/containerapp/ingress?view=azure-cli-latest#az-containerapp-ingress-enable), ARM, or BICEP, amongst others - can be used by specifying this on or after creation, like below:

In BICEP/ARM
```arm
..code..
ingress: {
    external: true
    targetPort: 50051
    // Set transport to http2 for gRPC
    transport: 'http2'
}
..code..
```

In the Azure CLI:

`az containerapp ingress enable --name mycontainerapp --resource-group my-rg --target-port 50051 --type external --transport http2`

A successful request will show the `transport` property with the new value.

### Troubleshooting
If invoking a gRPC server while `transport` is set to `Auto` or `http`, for example, you may recieve the following error:

```
{
  "error": "14 UNAVAILABLE: upstream connect error or disconnect/reset before headers. retried and the latest reset reason: protocol error"
}
```

If this is seen, double check that `transport` is set to `http2`, like in the method described above, or via [AZ CLI](https://docs.microsoft.com/en-us/cli/azure/containerapp/ingress?view=azure-cli-latest#az-containerapp-ingress-show), such as with this command:

`az containerapp ingress show --name dotnet-no-reflection --resource-group ansalemo-rg`

## Reflection
### Whos responsibility 
Unless explicitly enabled, gRPC servers are inheritly 'private' to their callers.

Depending on the gRPC package for the language in use, reflection may or may not be available. Official gRPC reflection supported packages can be found [here](https://github.com/grpc/grpc/blob/master/doc/server-reflection.md#known-implementations). 

**It is entirely up to the developer to implement, or not implement, reflection. This is done through code and is not Azure's responsibility.**

It's important to note that if reflection is **not** enabled, then these gRPC servers that have been deployed to Container Apps (or essentially any other environment) will not be able to be invoked **unless** the `proto` file is supplied with the client.

If it is enabled, then the `proto` file or known contract does not need to be supplied with the client calling the gRPC server. This can *almost* be thought of making the gRPC servers RPC methods 'public'. 

> **NOTE**: Some examples of applications with and without reflection can be found [here](https://github.com/azureossd/grpc-container-app-examples)

> **TIP**: Some languages may not have reflection support through the `grpc` package. This means other open-sourced packages may need to be used, if desired. 

### Troubleshooting
If reflection is not enabled, and a client tries to call a gRPC server hosted on Container Apps **without** a `proto` file supplied, an error like this may be returned to the client:

```
Failed to compute set of methods to expose: server does not support the reflection API
```

In this case, the `proto` file would need to be supplied from the calling client, or, enable reflection on the gRPC server.

## Client testing tools
There are a few client tools, UI or CLI based that can be used which has gRPC supported. 

- [grpcui](https://github.com/fullstorydev/grpcui#grpc-ui) - GUI based
- [grpcurl](https://github.com/fullstorydev/grpcurl#grpcurl) - CLI based
- [BloomRPC](https://github.com/bloomrpc/bloomrpc) - GUI based
- [Insomnia](https://docs.insomnia.rest/insomnia/grpc) - GUI based
- [Postman](https://www.postman.com/) - GUI based - **Note**: Currently this is in open Beta

Each tool has it's own way of creating a gRPC request to test with. When testing from a client tool, you **should not add https://** as a prefix to the FQDN. **This will likely cause an immediate error - which happens regardless of testing locally or on Azure Container Apps.**. This may surface as an error such as:

```
Could not invoke method - Error: Invalid protocol: https
```

Rather, do not add any protocol - or, if the tool supports it - `grpc://` or `grpcs://` can be prefixed for TLS support.




