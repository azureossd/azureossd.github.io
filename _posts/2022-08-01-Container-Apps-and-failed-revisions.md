---
title: "Container Apps and Failed Revisions"
author_name: "Anthony Salemo"
tags:
    - Azure Container Apps
    - Docker
    - Configuration
    - Kubernetes
    - Troubleshooting
categories:
    - Troubleshooting    
    - How-To
    - Configuration
    - Docker
    - Azure Container Apps
header:
    teaser: "/assets/images/azure-containerapps-logo.png" 
toc: true
toc_sticky: true
date: 2022-08-01 12:00:00
---

This post will cover some more common scenarios on why a Container App 'revision' may show as 'failed'.

With the introduction of Container Apps brings the notion of a [revision](https://docs.microsoft.com/en-us/azure/container-apps/revisions-manage?tabs=bash). Revisions allow you to manage different 'versions' of your application. This concept essentially follows the same idea that could be found in Kubernetes. For further reading on revisions and their modes, review this link [here](https://docs.microsoft.com/en-us/azure/container-apps/revisions).

# When you may see failed revisions

Failed revisions may show in some scenarios like:
- The initial Container App deployment to an environment.
- Changes to an existing Container App, like its configuration under the `templates` section, [which will create a new revision](https://docs.microsoft.com/en-us/azure/container-apps/revisions#revision-scope-changes)
- Creating a new revision from an existing Container App, and doing changes or updates from here, for the new revision.

It's important to note that these scenarios can present themselves for multiple reasons. Such as application code issues, container misconfiguration, or others. Below will cover a few scenarios.

# Incorrect Ingress
If deploying an application to Container Apps and using [external ingress](https://docs.microsoft.com/en-us/azure/container-apps/ingress?tabs=bash), the `targetPort` **must match** the port that's exposed in the Dockerfile (or what port your application is listening to).

If this is not correctly set, such as setting `Target Port` to 80, yet the application is listening on 8000, this will caused a failed revision, either upon deploying initially **or** when creating a new revision and updating this.

For example, this application is deployed to listen on port 8000, but we have 80 set as the target port:

![Target Port for Container Apps](/media/2022/08/azure-oss-container-apps-revision-3.png)

Since the container will never successfully return a response due to the mismatched ports, we can see the revision is marked as **failed**.

![Revision failed for Container Apps](/media/2022/08/azure-oss-container-apps-revision-2.png)

The solution in this case would be to set Target Port to what's exposed in your Dockerfile (or what port your application is listening to). 

**Important**:
If you are running your application as a background-service and/or do not expect to listen for HTTP traffic, then do not enable Ingress, as it expects a HTTP response back from the container to determine its health. This type of scenario will also cause a revision to be marked as failed.

# Health Probes
[Health Probes](https://docs.microsoft.com/en-us/azure/container-apps/health-probes?tabs=arm-template) can be configured to determine the container health in 3 different ways (startup, readiness and liveness). If these are misconfigured **or** the application doesn't respond to what is set for these, a revision will be marked as failed. For example:

- Setting the wrong `Port` in the **Readiness probe**
- Setting a path that returns a response outside of a 200 - 400 range (ex., 404) in the **Readiness probe**:
- Doing either of the above for **Liveness probes**.
- If the application doesn't expect HTTP traffic then this should be disabled as this can also cause failed revisions since no HTTP response would be sent back from the container.

> **Note**: This also may show that the container is indefinitely provisioning
    
![Revision pending for Container Apps](/media/2022/08/azure-oss-container-apps-revision-4.png)

# Running a privileged container
Privileged containers cannot be ran - this will cause a failed revision. If your program attempts to run a process that requires **real** root access, the application inside the container experiences a runtime error and fail.

> **NOTE**: Note that the user 'root' in containers is normally mapped to a non-priviledged user on the host - ultimately running as a non-proviledged container. This is due to [Docker itself dropping cretain CAP_ capability keys by default and design](https://docs.docker.com/engine/reference/run/#runtime-privilege-and-linux-capabilities) and the fact that [user namespaces are at play](https://docs.docker.com/engine/security/userns-remap/).

Additionally there is no option to run `docker run.. <args>` to allow this in Azure Container Apps, which is by design, nor is there any option exposed to change the priviledges set for Kubernetes underneath.

# Application errors

Consider the following: A Docker Image was built and pushed to a registry, this same image is used in a Azure Container App - either in a brand new created Container App or a new revision using the updated changes that were pushed to the tag. 

When running the application, after a scenario like the above, we see the following in our Log Analytics workspace:

```node
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'dotenv' imported from /app/server.js
```

An application issue like this would cause the container to exit and cause a **failed revision.** Essentially, an unhandled exception or error that causes the container to exit (process to terminate) will present itself as a failed revision.

In these scenarios, you can validate if your application is causing this with either [Log Analytics](https://docs.microsoft.com/en-us/azure/container-apps/monitor?tabs=bash), using Container App specific tables, [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/containerapp/logs?view=azure-cli-latest), or Log Stream.

> **NOTE**: Note that Log Stream may not show any output if the container is failing. If this is the case, use Log Analytics to double check if the application is writing to stdout/err.

# Invalid options or unreachable registry
## Image/Tag values
Another possibility of a failed revision if passing bad or incorrect image/tag combinations. 

However, in most cases (depending on how this is deployed), validation will fail the deployment prior to this stage. For example, doing this through the portal:

**Portal:**

![Portal validation for Container Apps](/media/2022/08/azure-oss-container-apps-revision-5.png)

**Template-based deployment**:

```bicep
{"status":"Failed","error":{"code":"DeploymentFailed","message":"At least one resource deployment operation failed. Please list deployment operations for details. Please see https://aka.ms/DeployOperations for usage details.","details":[{"code":"BadRequest","message":"{\r\n  \"code\": \"WebhookInvalidParameterValue\",\r\n  \"message\": \"The following field(s) are either invalid or missing. Invalid value: \\\"mycontainerregistry.azurecr.io/container-apps-scaling-examples-http:latest2\\\": GET https:: MANIFEST_UNKNOWN: manifest tagged by \\\"latest2\\\" is not found; map[Tag:latest2]: template.containers.containerappsscalingexampleshttp.image.\"\r\n}"}]}}
```

If this scenario is suspected to be the case - ensure the Image and Tag combinations are valid.

## Networked environment
Secondly, if the image is failing to pull due to either misconfiguration or an environment issue (eg., Networked environment - Firewall is blocking access to the Container Registry, or DNS lookup on the registry is failing), this may present itself as a failed revision as well - as the Image itself would not successfully pull.

In this scenario, review if it's possible to pull this publicly, and if so - work backwards to troubleshoot the environment itself.

The below documentation can be reviewed for help in configuration:

- [Networking - Architecture Overview](https://docs.microsoft.com/en-us/azure/container-apps/networking)
- [Deploy with an external environment](https://docs.microsoft.com/en-us/azure/container-apps/vnet-custom?tabs=bash&pivots=azure-portal)
- [Deploy with an internal environment](https://docs.microsoft.com/en-us/azure/container-apps/vnet-custom-internal?tabs=bash&pivots=azure-portal)
- [Securing a custom VNET](https://docs.microsoft.com/en-us/azure/container-apps/firewall-integration)
- [Customer responsibilites when using a VNET](https://github.com/microsoft/azure-container-apps/wiki/Lock-down-VNET-with-Network-Security-Groups-and-Firewall)

# Resource contention

Aggressive scale rules or applications that are consuming a large amount CPU and/or Memory, for example, and consistently enough - could potentially put the Pods that are running these workloads into a state that causes the application(s) to crash.

Underneath the hood, resources will be attempted to be allocated to provision these - however, if the scenario occurring is always using a large amount of resources (eg., Memory - if the combined limit for the Container App Pod that is configured is being hit consistently), this can cause the workloads to fail to be provisioned.

In scenarios like these - the **Metrics** blade under **Monitoring** can be used to check metrics such as Requests, Replica Count, CPU, Memory, and others.

If aggressive [scaling](https://docs.microsoft.com/en-us/azure/container-apps/scale-app) is done, review these rules and their criteria for what is triggering these events. 

