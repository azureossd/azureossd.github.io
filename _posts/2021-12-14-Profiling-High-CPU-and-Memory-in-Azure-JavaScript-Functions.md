---
title: "Profiling High CPU and Memory in Azure JavaScript Functions"
author_name: "Edison Garcia"
tags:
    - Node.js
    - JavaScript
    - High Memory
    - High CPU
    - Profiler
categories:
    - Azure Functions
    - JavaScript
    - Performance 
    - Troubleshooting
header:
    teaser: /assets/images/nodefunction.png
toc: true
toc_sticky: true
date: 2021-12-14 16:00:00
---

When dealing with High CPU/Memory scenarios in Azure Functions, the best recommendation is to profile your app in your local environment, but sometimes it is hard to reproduce the issue specially not having the same request load or environment. For those scenarios you can configure a Node.js profiler for your application. These profilers can be divided in two main categories: **Built-in profilers** and **Third-Party Profilers**. You can find information for CPU and Memory in the sections below. 
> These links are for Azure App Service Linux but applies for Azure Functions.

# Windows
- [High CPU](https://azureossd.github.io/2021/12/14/Troubleshooting-NodeJS-High-CPU-and-Memory-scenarios-in-App-Service-Windows/index.html#high-cpu)
- [High Memory](https://azureossd.github.io/2021/12/14/Troubleshooting-NodeJS-High-CPU-and-Memory-scenarios-in-App-Service-Windows/index.html#high-memory)

# Linux 
- High CPU
    - [Built-in profilers](https://azureossd.github.io/2021/12/09/Troubleshooting-NodeJS-High-CPU-scenarios-in-App-Service-Linux/index.html#built-in-profilers)
    - [Third-Party Profilers](https://azureossd.github.io/2021/12/09/Troubleshooting-NodeJS-High-CPU-scenarios-in-App-Service-Linux/index.html#third-party-profilers)

- High Memory
    - [Built-in profilers](https://azureossd.github.io/2021/12/10/Troubleshooting-NodeJS-High-Memory-scenarios-in-App-Service-Linux/index.html#built-in-profilers)
    - [Third-Party Profilers](https://azureossd.github.io/2021/12/10/Troubleshooting-NodeJS-High-Memory-scenarios-in-App-Service-Linux/index.html#third-party-profilers)


# Profiling in local dev environment vs Azure

- If you are profiling locally in your computer, then open `local.settings.json` and add this line `"languageWorkers__node__arguments": "<value>"` inside Values array, as an example:

    ```javascript
        {
        "IsEncrypted": false,
        "Values": {
            "FUNCTIONS_WORKER_RUNTIME": "node",
            "AzureWebJobsStorage": "UseDevelopmentStorage=true",
            "languageWorkers__node__arguments": "--cpu-prof"
            }
        }
    ```

- If you are profiling in **Azure App Service Windows**, add this app setting `languageWorkers:node:arguments` with value `--cpu-prof`.

- If you are profiling in **Azure App Service Linux**, add this app setting `languageWorkers__node__arguments` with value `--cpu-prof-dir "/home/LogFiles/" --cpu-prof`.




