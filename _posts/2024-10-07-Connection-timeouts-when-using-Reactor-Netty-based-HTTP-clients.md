---
title: "Connection timeouts when using Reactor Netty based HTTP clients"
author_name: "Anthony Salemo"
tags:
    - Configuration
    - Linux
    - Azure App Service on Linux
    - Azure Container Apps
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/javalinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-10-07 12:00:00
---

This post will cover 'An existing connection was forcibly closed by the remote host' and 'recvAddress(..) failed: Connection timed out' messages that intermittently appear when using Java applications that use Reactor Netty HTTP clients

# Overview
**tldr**: This issue is explained here in [GitHub Issues - First WebClient request always fails after some idle time - Issue #764 - reactor/reactor-netty](https://github.com/reactor/reactor-netty/issues/764) which is due to a closed connection between the client and server, typically with a load balancer in between, and this closed connection not being notified to the application using Reactor Netty (in the form of a RST packet). Reactor Netty then tries to reuse the connection that was closed by the load balancer - which then fails since it was already closed

------
This post is written in the context of load balancers being used with Azure. More specifically, Azure App Service - Linux (and Web App for Containers, Linux) and Container Apps
- This can also happen when Azure Load Balancer is generally used in certain circumstances (see GitHub post above)
- This can happen **outside** of Azure as well. Essentially, anywhere a load balancer that exists that may be closing a connection without properly notifying other peers using that connection.

An important call out is that "connection timeouts" or "connection refused" can happen for an infinite number of reasons. Do not assume that your issue is immediately the one described here.

This post and the above GitHub issue(s) are **specifically for applications that use Reactor Netty - or - are usng Http clients (or framework methods) that use this under the hood** (eg. Spring Webflux, Spring Cloud Gateway, etc.)

Additionally, also ensure App Service Logs are enabled, or else you won't see these error messages. You'll only be able to tell by status code. These can be enabled by following this link - [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer). This can be then be viewed in various ways (FTP, Logstream, Azure CLI, Diagnose and Solve Problems -> Application Logs 'detector', etc.)

# Behavior
After making a request (or multiple requests), a subsequent request will timeout. This may be intermittent.

Errors will manifest as the following:

```java
io.netty.channel.unix.Errors$NativeIoException: recvAddress(..) failed: Connection timed out
```

Or, something like - which should also contain references to `io.netty` in the stack trace:

```java
java.io.IOException: An existing connection was forcibly closed by the remote host
```

You can easily reproduce this. The below is using Spring Boot with WebFlux, in this case, since `org.springframework.web.reactive.function.client.WebClient` is used, which uses Reactor Netty.

```java
@RestController
public class HttpReactorNettyController {
    WebClient webClient = WebClient.create("https://jsonplaceholder.typicode.com/");

    @GetMapping("/api/reactornetty/http")
    public String http() {
        return webClient.get().uri("/todos/1")
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
}
```

# Resolution
The main, direct resolution, is to set the `maxIdleTime` method to a value _less_ than the load balancers timeout. On Azure App Service and Container Apps, this is 240 seconds. In this example, we set this to 200 seconds.

Other load balancers will vary. More information on `maxIdleTime` and aspects of the HTTP client can be found here - [Reactor Netty Reference Guide - Connection Pool Timeout](https://projectreactor.io/docs/netty/release/reference/index.html#connection-pool-timeout)

The below is a more full-fledged example which uses `reactor.netty.resources.ConnectionProvider` to create a new provider which exposes `maxIdleTime` and is passed into the `WebClient`'s `builder()` method for our HTTP client.

> **NOTE**: Using other HTTP clients that are _not_ Reactor Netty based should not show this issue. That can potentially be another alternative

> The code below is just an example. Your code may vary.

```java
@RestController
public class HttpReactorNettyController {
    ConnectionProvider provider = ConnectionProvider.builder("webclient")
            .maxConnections(128)
            .maxIdleTime(Duration.ofSeconds(200))
            .build();

    WebClient webClient = WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(HttpClient.create(provider)))
            .baseUrl("https://jsonplaceholder.typicode.com/")
            .build();

    @GetMapping("/api/reactornetty/http")
    public String http() {

        return webClient.get().uri("/todos/1")
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

}
```



