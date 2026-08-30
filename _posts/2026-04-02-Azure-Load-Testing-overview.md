---
title: "Overview of Azure Load Testing"
author_name: "Ragu Karuturi"
tags:
    - Load testing
    - Performance tuning
    - Scaling
categories:
    - Azure App Service Linux 
    - Azure Container Apps
    - Web App for Containers
    - Other # Azure Function apps, AKS, ACIs, VMs running Linux
    - Performance
    - How-to
header:
    teaser: "/assets/images/azure-load-testing.svg"
toc: true
toc_sticky: true
date: 2026-04-02 12:00:00
---

## Overview
This post provides a practical overview of load testing applications deployed on Azure PaaS services such as Azure App Service and Azure Container Apps.

Azure Load Testing is a fully managed service for testing and evaluating application performance. It is especially valuable before production deployments because it helps predict application behavior at scale and under varying traffic patterns.

The following are the core components of the service:
1. Test - The test definition, including the test plan, engine count, failure criteria, and monitoring configuration.
2. Test run - One execution of a test definition.
3. Test engine - Managed compute that generates traffic and executes the test plan. You can scale a test by increasing the number of engine instances or virtual users.
4. App components - Azure resources monitored during a run. Their Azure Monitor metrics can include CPU, memory, request rate, and HTTP errors, depending on the resource type.
5. Engine instances - A test run can use up to 400 engine instances. The concurrent engine quota is scoped per subscription and region, and defaults vary. The maximum is 1,000 across concurrent runs. These values change over time, so confirm them against the limits page linked below.
6. Virtual users - For a URL-based test, the portal supports up to 250 virtual users per engine. In a JMeter test, thread groups in the JMX file define the virtual-user load for each engine.

## Test engines and script types
Azure Load Testing supports URL-based tests, Apache JMeter test plans, and Locust scripts. URL-based tests are converted into a managed JMeter test plan. You can also upload an existing JMeter script (`.jmx`) or Locust script (`.py`). More information on JMeter is available in the [Apache JMeter documentation](https://jmeter.apache.org/).

For JMeter based tests, including URL tests, virtual users are analogous to JMeter threads and engine instances are similar to JMeter nodes. Azure Load Testing also includes built-in Azure Monitor integration. This makes it easier to correlate client-side results with Azure resource metrics as well as to benchmark Azure resource metrics without additional plugins, integrations, or credential setup. A JMX test plan or Locust script is appropriate when you need custom logic that the URL-based experience does not expose.

## Test Types: URL vs JMX
Before proceeding, it helps to understand the two common test types.

`URL` tests are lightweight and can be configured directly in the portal or by using a JSON request file (for example `requests.json`) to define one or more HTTP requests. They are useful for quick API checks.

`JMX` tests use a full Apache JMeter test plan (`.jmx`). Choose this option when you need advanced behavior such as authentication flows, parameterization, and CSV data-driven testing. Locust is another script-based option for teams that prefer Python.

In practice, start with `URL` for fast validation and move to `JMX` as your scenario complexity grows.

## Creating Tests in Portal vs Azure CLI
You can create and run tests from either the Azure portal or Azure CLI. The CLI option is better for repeatable workflows, source control, and CI/CD automation.

The following sections contain corresponding test-definition samples.

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
# ZIP files must remain below 50 MB. Up to five are supported for JMX and Locust tests.
splitAllCSVs: true 
# Split CSV rows across engines to avoid reusing test data such as logins.
failureCriteria: 
#examples
  - avg(response_time_ms) > 300
  - percentage(error) > 50
  - YourJMeterSampler: avg(latency) > 200
autoStop:
  errorPercentage: 80
  timeWindow: 60 #seconds
env: 
# Environment variables referenced by the script
  - name: BASE_URL
    value: https://app.yourdomain.com
  - name: ENVIRONMENT
    value: prod

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
  "version": "1.0",
  "scenarios": {
    "website": {
      "requests": [
        {
          "requestName": "HomePage",
          "requestType": "URL",
          "method": "GET",
          "endpoint": "https://yourdomain.com/"
        },
        {
          "requestName": "HealthCheck",
          "requestType": "URL",
          "method": "GET",
          "endpoint": "https://yourdomain.com/health"
        }
      ],
      "csvDataSetConfigList": []
    }
  },
  "testSetup": [
    {
      "virtualUsersPerEngine": 250,
      "durationInSeconds": 600,
      "loadType": "linear",
      "scenario": "website",
      "rampUpTimeInSeconds": 60
    }
  ]
}
```

## Configuring and executing tests from the Azure portal
The first step is to create the resource, which can be done quickly from the portal. Create an Azure Load Testing resource, select `Tests`, then choose `Create`, and follow the guided options. The following areas are the most important to configure.

1. Load
Select the number of engine instances and the type of load pattern. Use the patterns that represent the expected workload. Separate linear, spike, and step tests can answer different capacity questions.

    - Linear: traffic increases over time. Allow an initial ramp-up time.
    - Spike: traffic rises rapidly to simulate seasonal or occasional spikes.
    - Step: traffic increases in defined plateaus.

Select the number of virtual users per engine. For URL-based tests, the portal supports up to 250 users per engine instance. Also select the engine count, test duration, and ramp-up time. More information is available in [Azure Load Testing service limits](https://learn.microsoft.com/en-us/azure/app-testing/load-testing/resource-limits-quotas-capacity).

2. Monitoring
Attach key Azure dependencies being tested, such as App Service and Azure databases. Otherwise, the results are limited to client-side metrics. Add relevant components such as the web app, App Service plan, downstream dependencies, and Application Insights. 

3. Test criteria
Specify pass/fail criteria for client-side metrics and, where appropriate, Azure resource metrics. Useful client-side measures include percentile response time, latency, error percentage, and requests per second. Useful server-side measures include CPU, memory, request rate, HTTP status counts, and scaling events. Available metrics vary by Azure resource type.

If the target endpoint is private, configure virtual network injection by specifying a subnet for the test engines, and validate DNS and routing before running the test.

For example, to configure 5,000 virtual users in a URL-based test, you could use 250 virtual users per engine with 20 engine instances and a one-minute ramp-up time.

After configuring the test, review the resources and settings, start the run, monitor live metrics, and then save and compare outcomes across runs.

## Configuring and executing tests with Azure CLI and GitHub Actions
Azure CLI is well suited to repeatable workflows, source control, and CI/CD integration. In a typical operating model, you keep YAML, JMX, JSON, and CSV files in the repository, create or update tests from YAML, and trigger runs in release stages. This provides traceable configuration history and consistent execution across environments.

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

This can be automated with GitHub Actions as part of pull-request or release workflows. The pipeline authenticates to Azure, runs the test with the repository configuration, and publishes result files as build artifacts for auditing and comparison. The example uses OpenID Connect (OIDC), which avoids storing a long-lived Azure client secret.

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
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
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

One approach is to run short tests with pull requests and more comprehensive tests before releases. Save the test results to compare trends across application releases.

## Reading and comparing results

After a run completes, the dashboard summarizes both client side and server side behavior. On the client side, focus on throughput measured as requests per second, response time percentiles such as p90, p95, and p99, and the error percentage. Averages hide problems, so lead with percentiles and the error rate rather than the mean.

If you attached app components under Monitoring, the same view shows server side metrics for those Azure resources, for example CPU, memory, request counts, HTTP status codes, and scaling events. Correlating a rise in client side latency with a server side signal such as CPU saturation, falling available memory or HTTP errors is usually the fastest way to locate a bottleneck.

Azure Load Testing keeps the history of every run, so you can compare a new run against a baseline and watch trends across releases. Keep the test plan, data, application version, resource configuration, and region consistent between runs, so a difference in results reflects a real change rather than a change in the test.


## Practical addendum

- Obtain authorization before testing an endpoint, and avoid directing high load at production unless the test is explicitly planned and guarded. Load tests can scale resources, consume downstream quotas, trigger alerts, and create billable traffic.
- Establish a baseline, include a warm-up period, and repeat comparable runs. Compare throughput, error rate, and percentile response times such as p95 or p99 rather than relying only on averages.
- Keep the test plan, data, application version, Azure resource configuration, and region consistent when comparing runs. Change one major variable at a time when isolating a bottleneck.
- Verify that the load generators are not the bottleneck. Increase engine count when an engine reaches its own CPU or network capacity, and confirm that throughput scales as expected.
- Treat test data and logs as potentially sensitive. Use managed identities and Azure Key Vault references for secrets rather than embedding credentials in JMX, YAML, JSON, CSV, or workflow files.

## References

- [Azure Load Testing documentation](https://learn.microsoft.com/en-us/azure/app-testing/load-testing/)
- [Load test configuration YAML reference](https://learn.microsoft.com/en-us/azure/app-testing/load-testing/reference-test-config-yaml)
- [Azure Load Testing service limits](https://learn.microsoft.com/en-us/azure/app-testing/load-testing/resource-limits-quotas-capacity)
- [Azure Load Testing GitHub Action](https://github.com/Azure/load-testing)
