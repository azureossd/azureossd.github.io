---
title: "Overview of Azure Load Testing Service"
author_name: "Ragu Karuturi"
tags:
    - Load testing
    - Performance tuning
    - Scaling
categories:
    - Azure App Service Linux 
    - Azure Container App
    - Web App for Containers
    - Other # Azure Function apps, AKS, ACIs, VMs running Linux
    - Performance, How-to
header:
    teaser: "/assets/images/imagename.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: YYYY-MM-DD 12:00:00 # Ensure date and filename date match (ie. date: 2025-05-01 12:00:00 and filename: 2025-05-01-your-article-title.md)
---

## Overview that is using a H2 header which is useful for a TOC

## Overview
This post provides a practical overview of load testing applications deployed on Azure PaaS services such as Azure App Service and Azure Container Apps.

Azure Load Testing is a fully managed service for testing and evaluating application performance. It is especially valuable before production deployments because it helps predict application behavior at scale and under varying traffic patterns.

The following are the core components of the service:
1. Test - The overall configuration of the test including endpoints, rules, and metrics.
2. Test run - One execution of a test. 
3. Test engine - Managed compute that generates traffic and executes test runs. You can scale tests by increasing engine instances and users.
4. App components - The resources to monitor during load (for example CPU, memory, latency, and HTTP failures).
5. Engine instances - Up to a maximum of 400 per test, with a maximum of 1000 concurrent instances across tests (subject to change).
6. Users - On the Azure portal, users per engine instance are limited (up to 250, subject to change). This can be customized further in JMX based tests.

## JMeter
Azure load tests are executed by Apache JMeter under the hood. More information on JMeter is available [here](https://jmeter.apache.org/). You can upload an existing JMeter script (`.jmx`) to the test engine. While Azure Load Testing users are analogous to JMeter threads and Azure engine instances are similar to JMeter nodes, Azure Load Testing includes built in Azure Monitor integration. This makes it easier to benchmark Azure resource metrics without additional plugins, integrations, or credential setup. JMeter still offers advanced customizations that are not exposed directly through the Azure Load Testing UI or API.

## Test Types: URL vs JMX
Before proceeding, it helps to understand the two common test types.

`URL` tests are lightweight and can be configured directly in the portal or by using a JSON request file (for example `requests.json`) to define one or more HTTP requests. They are useful for quick API checks.

`JMX` tests use a full Apache JMeter test plan (`.jmx`). Choose this when you need advanced behavior such as authentication flows, parameterization, and CSV data driven testing.

In practice, start with `URL` for fast validation and move to `JMX` as your scenario complexity grows.

## Creating Tests in Portal vs Azure CLI
You can create and run tests from either the Azure portal or Azure CLI. The CLI option is better for repeatable workflows, source control, and CI/CD automation.

Below are corresponding Test Definition samples. 

## Sample YAML for JMX deployment

```yaml
version: v0.1
testId: YourUniqueTestID
displayName: Your Readable Test Name
description: Load test website home page
testPlan: YourTestPlan.jmx
testType: JMX #URL is the other type
engineInstances: 1
subnetId: /subscriptions/<subid>/resourceGroups/rgname/providers/Microsoft.Network/virtualNetworks/vnetname/subnets/subnetid #optional
configurationFiles:
  - 'sampledata.csv'
zipArtifacts:
  - largedata.zip 
#Large configuration/data files under 50MB, up to 5 zip files - only for JMX
splitAllCSVs: true 
#Splits CSV files per engine. Useful to split test data across engines or to avoid collisions such as with logins
failureCriteria: 
#examples
  - avg(response_time_ms) > 300
  - percentage(error) > 50
  - YourJMeterSampler: avg(latency) > 200
autoStop:
  errorPercentage: 80
  timeWindow: 60 #seconds
env: 
#Env variable referenced by the script
    BASE_URL: https://app.yourdomain.com  
    ENVIRONMENT: prod

```

## Sample YAML for URL type deployment

```yaml
version: v0.1
testId: YourUniqueTestID
displayName: Your Readable Test Name
description: Simple URL load tests
testType: URL
testPlan: requests.json
engineInstances: 2
failureCriteria:
  - avg(response_time_ms) > 500
  - percentage(error) > 5
autoStop:
  errorPercentage: 20
  timeWindow: 60 #seconds

```

## Sample JSON (required) configuration for URL type test
```json
{
  "requests": [
    {
      "requestName": "HomePage",
      "method": "GET",
      "url": "https://yourdomain.com/"
    },
    {
      "requestName": "HealthCheck",
      "method": "GET",
      "url": "https://yourdomain.com/health"
    }
  ]
}
```

## Configuring and executing tests from the Azure Portal
The first step is to create the resources, which can be done quickly from the portal. Create an Azure Load Testing resource, select `Tests`, then choose `Create` and follow the guided options. The following areas are the most important to configure.
1. Load
Select the number of engine instances and the type of load pattern. It is recommended to create separate tests to test all the load patterns (Linear, Spike and Step) to replicate production scenarios and your use cases. 
    - Linear: traffic increases over time. Allow an initial ramp up time.
    - Spike: traffic rises rapidly to simulate seasonal or occasional spikes.
    - Step: traffic increases in defined plateaus.
Select the number of concurrent users per engine. On the portal, this is commonly limited to 250 users per engine instance. Select the number of engines, test duration, and ramp-up time. More information on limits is available [here](https://learn.microsoft.com/en-us/azure/app-testing/load-testing/resource-limits-quotas-capacity).

2. Monitoring
Attach key Azure dependencies being tested, such as App Service and Azure databases. Otherwise, testing is limited to client side metrics. It is recommended to add relevant components such as App Service, App Service Plan, upstream dependencies, and Application Insights.

3. Test criteria
Specify test criteria for client side metrics as well as Azure resource metrics. For client side analysis, useful metrics include response times, latency, and errors. For server side analysis, useful metrics include CPU, memory, scaling events, requests, and responses.

Additionally, if your workload is private, configure subnet/VNet integration and validate DNS/routing before runs.

As an example, to simulate 5,000 users, you could configure 250 virtual users with 20 engine instances, set ramp up time to one minute, and run separate tests for linear, spike, and step scenarios.

After configuring the test, review the resources and settings, start the run, monitor live metrics, and then save and compare outcomes across runs.

## Configuring and executing tests with Azure CLI and GitHub Actions
Azure CLI is the recommended path for repeatability, source control, and CI/CD integration. In a typical operating model, you keep YAML/JMX/JSON/CSV files in the repository, create or update tests from YAML, and trigger runs in release stages. This provides traceable configuration history and consistent execution across environments.

### Example invocation with Azure CLI
```bash
# Install the Azure Load Testing CLI extension if needed
az extension add --name load --upgrade
# Create or update a test from YAML
az load test create \
  --load-test-resource <your-load-test-resource-name> \
  --resource-group <your-load-test-rg> \
  --test-id <test-id> \
  --load-test-config-file loadtest-config.yaml
# Start a test run
az load test-run create \
  --load-test-resource <your-load-test-resource-name> \
  --resource-group <your-load-test-rg> \
  --test-id <test-id> \
  --test-run-id <test-run-id>
```

This can be automated with Github Actions as part of pull request or release workflows. The pipeline authenticates to Azure, runs the test with the repository configuration, and publishes result files as build artifacts for auditing and comparison.

### Example workflow with GitHub Actions

```yaml
name: your-load-test-name
on:
  workflow_dispatch:
  push:
    branches: [ "main" ]
jobs:
  run-load-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - name: Run Azure Load Testing
        uses: azure/load-testing@v1
        with:
          loadTestConfigFile: loadtest-config.yaml
          loadTestResource: <your-load-test-resource-name>
          resourceGroup: <your-load-test-rg>
      - name: Publish results artifact
        uses: actions/upload-artifact@v4
        with:
          name: load-test-results
          path: |
            loadTest/*.json
            loadTest/*.csv
```

An example appraoch would be to run short tests with every pull requests and more comprehensive tests before releases. Save the test results to compare and review trends over time corresponding to application releases. 






