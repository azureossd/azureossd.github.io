---
permalink: "/containerapps/"
layout: single
toc: true
title: "Container Apps"
sidebar: 
    nav: "links"
---

Azure Container Apps is a serverless hosting service for containerized applications and microservices. 

> You can find what is in current pipeline and features comming next in [**Roadmap**](https://github.com/orgs/microsoft/projects/540).

> Find additional Container Apps articles on [Technet/TechCommunity - Apps on Azure Blog](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/bg-p/AppsonAzureBlog/label-name/Azure%20Container%20Apps).

Here is a compilation of resources by categories:

## Configuration
- [Troubleshooting DNS connectivity on Azure Container Apps](https://azureossd.github.io/2023/03/03/azure-container-apps-testing-DNS-connectivity/index.html)
- [Using a Dapr Secret Store with Azure Key Vault to source credentials for a Dapr State Store](https://azureossd.github.io/2023/02/23/Using-a-Dapr-Azure-KeyVault-Secret-Store-to-source-credentials-for-a-Dapr-State-Store/index.html)
- [Running gRPC with Container Apps](https://azureossd.github.io/2022/07/07/Running-gRPC-with-Container-Apps/index.html)
- [Using Managed Identity and Bicep to pull images with Azure Container Apps](https://azureossd.github.io/2023/01/03/Using-Managed-Identity-and-Bicep-to-pull-images-with-Azure-Container-Apps/index.html)
- [Troubleshooting volume mount issues on Azure Container Apps](https://azureossd.github.io/2023/07/24/Troubleshooting-volume-mount-issues-on-Azure-Container-Apps/index.html)
- [Container Apps: How to capture a network trace using TCPDUMP](https://azureossd.github.io/2023/09/06/capturing-a-network-trace-aca/index.html)
- [Container Apps: Troubleshooting and configuration with Health Probes](https://azureossd.github.io/2023/08/23/Container-Apps-Troubleshooting-and-configuration-with-Health-Probes/index.html)
- [Installing troubleshooting tools in a Container Apps ‘hello-world’ image](https://azureossd.github.io/2023/11/20/Installing-troubleshooting-tools-in-a-Container-Apps-helloworld-image/index.html)
- [Container Apps - Using the ‘Command override’ option](https://azureossd.github.io/2024/01/17/Container-Apps-Using-the-command-override-option/index.html)
- [Container Apps - Using multicontainers in a pod](https://azureossd.github.io/2024/03/06/Container-Apps-Using-multi-containers-in-a-pod/index.html)
- [Container Apps - General troubleshooting with Dapr on Container Apps](https://azureossd.github.io/2024/02/12/Container-Apps-General-troubleshooting-with-Dapr-on-Container-Apps/index.html)
- [Running self-hosted agent Jobs locally with KEDA for Container Apps](https://azureossd.github.io/2024/04/01/Running-self-hosted-agent-Jobs-locally-for-Container-Apps/index.html)
- [Graceful termination on Container Apps](https://azureossd.github.io/2024/05/27/Graceful-termination-on-Container-Apps/index.html)
- [Container Apps - Binding to ports under 1024](https://azureossd.github.io/2024/06/10/Container-Apps-Binding-to-ports-under-1024/index.html)
- [Using a Container App Job as Github Actions Runner for your entire Github Orginization](https://azureossd.github.io/2024/07/02/Container-App-Job-runner-for-entire-Github-Orginization/index.html)
- [Container Apps - Using labels with KEDA and GitHub Action runners](https://azureossd.github.io/2024/10/04/Container-Apps-Using-labels-with-KEDA-and-GitHub-Action-runners/index.html)
- [Container Apps - Referencing env vars through other environment variables](https://azureossd.github.io/2024/10/03/Container-Apps-Referencing-env-vars-through-other-environment-variables/index.html)
- [Troubleshooting general secret issues on Container Apps](https://azureossd.github.io/2024/08/27/Troubleshooting-general-secret-issues-on-Container-Apps/index.html)
- [Troubleshooting general KEDA scaling scenarios](https://azureossd.github.io/2024/08/23/Troubleshooting-general-KEDA-scaling-scenarios/index.html)
- [Using Zipkin and OpenTelemetry on Azure Container Apps](https://azureossd.github.io/2024/12/02/Using-Zipkin-and-OpenTelemetry-on-Azure-Container-Apps/index.html)
- [Container Apps - Deployments through UI and CLI](https://azureossd.github.io/2024/11/11/container-apps-ui-cli-deployments/index.html)
- [Checkpoint strategies with Dapr, KEDA, Azure EventHub and Container Apps](https://azureossd.github.io/2024/11/05/Checkingpoint-strategies-with-KEDA-Azure-Eventhub-and-Container-Apps/index.html)
- [Using additional TCP ports in Azure Container Apps](https://azureossd.github.io/2024/10/31/Using-additional-tcp-ports-in-Azure-Container-Apps/index.html)
- [Container Apps - Setting storage directory permissions](https://azureossd.github.io/2024/12/30/Container-Apps-Setting-storage-directory-permissions/index.html)
- [Container Apps - View Log Streams without Container Apps Contributor role](https://azureossd.github.io/2025/01/07/Container-Apps-View-Log-Streams-without-Container-Apps-Contributor-role/index.html)

## Availability and Post Deployment issues
- [Troubleshooting ingress issues on Azure Container Apps](https://azureossd.github.io/2023/03/22/Troubleshooting-ingress-issues-on-Azure-Container-Apps/index.html)
- [Container Apps and Failed Revisions](https://azureossd.github.io/2022/08/01/Container-Apps-and-failed-revisions/index.html)
- [Container App ‘Console’ tab shows 'ClusterExecEndpointWebSocketConnectionError'](https://azureossd.github.io/2023/06/02/Container-App-Console-tab-shows-ClusterExecEndpointWebSocketConnectionError/index.html)
- [Container Apps: Troubleshooting image pull errors](https://azureossd.github.io/2023/08/25/Container-Apps-Troubleshooting-image-pull-errors/index.html)
- [Troubleshooting Container App Jobs when using self-hosted CI/CD runners and agents](https://azureossd.github.io/2023/11/29/Troubleshooting-Jobs-when-using-self-hosted-CICD-runners/index.html)
- [Troubleshooting failed job executions on Container App Jobs](https://azureossd.github.io/2023/10/30/Troubleshooting-failed-job-executions-on-Container-App-Jobs/index.html)
- [Container Apps - Troubleshooting ‘ContainerCreateFailure’ and ‘OCI runtime create failed’ issues](https://azureossd.github.io/2024/01/16/Container-Apps-Troubleshooting-OCI-Container-create-failed-issues/index.html)
- [Container Apps - Demystifying restarts](https://azureossd.github.io/2024/01/11/Container-Apps-Demystifying-restarts/index.html)
- [Container Apps - Backoff restarts and container exits](https://azureossd.github.io/2024/01/19/Container-Apps-Backoff-restarts-and-container-exits/index.html)
- [Preventing File Locks when mounting storage on Azure Container Apps](https://azureossd.github.io/2024/05/16/Preventing-File-Locks-Azure-Container-Apps/index.html)
- [Container Apps - ‘Target port does not match the listening port’](https://azureossd.github.io/2024/10/08/Container-Apps-'Target-port-does-not-match-the-listening-port'/index.html)

## Deployments
- [Container Apps and Bicep deployments](https://azureossd.github.io/2022/05/13/Container-Apps-and-Bicep-Deployments/index.html)
- [Using and troubleshooting GitHub Actions with Container Apps](https://azureossd.github.io/2023/07/13/Using-and-troubleshooting-GitHub-Actions-with-Container-Apps/index.html)
- [Using and troubleshooting Azure DevOps with Container Apps](https://azureossd.github.io/2023/06/30/Using-and-troubleshooting-Azure-DevOps-with-Container-Apps/index.html)
- [Deploying Reflex Applications to Azure Container Apps](https://azureossd.github.io/2024/08/24/Deploying-Reflex-Application-to-Azure-Container-Apps/index.html)
- [Setting up a basic Elasticsearch container on Container Apps](https://azureossd.github.io/2024/08/13/Setting-up-a-basic-Elasticsearch-container-on-Container-Apps/index.html)
- [Deploy Java app using UI and CLI](https://azureossd.github.io/2024/11/11/container-apps-ui-cli-deployments/index.html)
- [Container Apps Pull Image using an Azure Service Principal](https://azureossd.github.io/2025/02/18/Container-Apps-Pull-Image-With-Service-Principal/index.html)


## Performance
- [Container Apps: Profiling Node applications for performance issues](https://azureossd.github.io/2023/10/19/Container-Apps-Profiling-Node-applications-for-performance-issues/index.html)
- [Container Apps: Profiling Python applications for performance issues](https://azureossd.github.io/2023/10/02/Container-Apps-Profiling-Python-applications-for-performance-issues/index.html)
- [Container Apps: Profiling PHP applications for performance issues](https://azureossd.github.io/2023/09/22/Container-Apps-Profiling-PHP-applications-for-performance-issues/index.html)
- [Container Apps: Profiling Go applications for performance issues](https://azureossd.github.io/2023/09/18/Container-Apps-Profiling-Go-applications-for-performance-issues/index.html)
- [Container Apps: Profiling Dotnet applications for performance issues](https://azureossd.github.io/2023/09/12/Container-Apps-Profiling-Dotnet-applications-for-performance-issues/index.html)
- [Container Apps: Profiling Java applications for performance issues](https://azureossd.github.io/2023/08/30/Container-Apps-Profiling-Java-applications-for-performance-issues/index.html)

