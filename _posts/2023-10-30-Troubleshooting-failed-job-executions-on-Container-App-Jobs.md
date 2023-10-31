---
title: "Troubleshooting failed job executions on Container App Jobs"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Troubleshooting
    - Configuration
    - Container Apps
    - Node
categories:
    - Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Troubleshooting
    - Node
header:
    teaser: "/assets/images/azure-containerapps-logo-1.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-10-30 12:00:00
---

This post will cover some potential reasons for why a job execution may show as "Failed".

# Overview 
[Jobs is a type of offering of Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/jobs?tabs=azure-cli) - there are 3 trigger types, being manual jobs, scheduled jobs, and event-driven jobs. 

These are similiar to Kubernetes [Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/), [CronJobs](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/), and [Scaled Jobs with KEDA](https://keda.sh/docs/2.12/concepts/scaling-jobs/), respectively. 

# Job execution failures
Below is an example of what it looks like when a Job fails (via the portal).

When a job executes (and fails) - it may show up in a "Running" state until it hits the specified "Replica timeout" limit is hit. This would look like the below in the Execution history blade - however, at this point already the job likely may have already failed - which may be especially true in circumstances where a "Replica timeout" is set to 1800 (default) but the container has exited within the first few seconds of execution:

![Portal - job running](/media/2023/10/aca-jobs-ts-2.png)

Eventually, this will be marked as failed in the **Execution history** blade - how soon a job is marked as failed may depend on the value of "Replica timeout" as well as "Replica Retry":

![Portal - job failure](/media/2023/10/aca-jobs-ts-1.png)

## Review logging
You can review logging in Log Analytics workspace via the `ContainerAppsSystemLogs_CL` table, for example, this may show after an execution has failed and the job limit has been hit:

```
TimeGenerated [UTC]            ExecutionName_s   Reason_s              Log_s
2023-10-24T18:30:59.733078Z    manual-abc234   BackoffLimitExceeded    Job has reached the specified backoff limit
```

Using `ContainerAppsConsoleLogs_CL` is important as well, in case execution failures are a result of something application specific. This table will show application specific stdout/err.

## Job timeouts - DeadlineExceeded vs. BackoffLimitExceeded
Before going into some reasons that a job may be marked as failed, we'll cover the difference of `DeadlineExceeded` and `BackoffLimitExceeded` and what this means.

When a job fails (not necessarily for other reasons like volume mount issues or image pull errors) - a job may be shown as failing with two "Reasons". This will show in the `ContainerAppsSystemLogs_CL` Log Analytics table.

- `DeadlineExceeded` - With a message of `Job was active longer than specified deadline in the msg column`
- `BackoffLimitExceeded` - With a message of `Job has reached the specified backoff limit in the msg column`

Both of these are core Kubernetes reasons - which are further explained here - [Kubernetes - Job termination and clean up](https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup). Since job types on Container Apps mimic the job types in Kubernetes - the concepts described in that section apply.

### DeadlineExceeded
This may show if a job is taking longer than what is specified in "Replica timeout" for the job configuration.

If a job timeout is set for 20 seconds, but the logic in the job is known to take 30 seconds (minimum) - this is would cause `DeadlineExceeded`.

This kind of behavior is able to be reproduced in a local Kubernetes cluster - by setting `activeDeadlineSeconds` to a value below known job completion time, eg:

```
Type     Reason            Age   From            Message
----     ------            ----  ----            -------
Normal   SuccessfulCreate  11s   job-controller  Created pod: manual-job-bt5ch
Normal   SuccessfulDelete  6s    job-controller  Deleted pod: manual-job-bt5ch
Warning  DeadlineExceeded  6s    job-controller  Job was active longer than specified deadline
```

The "Replica Timeout" option for Container Apps is fundamentally the same as `spec.activeDeadlineSeconds` above.

An example for what may cause longer execution to surpass the allowed timeout may be:

- Talking to dependencies that may be blocked - eg., a job that calls to KeyVault, but key vault is unable to be reached due to networking. However, application logic is not written to explicitly fail in that scenario - which leads to a "hung" response
- Data processing - organically long data processing that may take longer than usual at times to complete.

You can increase the replica timeout to a higher number as a test as well, if needed. Application logs should be reviewed through `ContainerAppConsoleLogs_CL` in Log Analytics. If no logs are showing by `DeadlineExceeded`, extend the timeout and reproduce the issue.

> **NOTE**: Consider increasing log verbosity, if applicable, on the application

Also important to note - is that it's entirely possibly as mentioned earlier that a job that failed execution (either for any of the below reasons or others) will not be marked as failed yet **until** "Replica Timeout" is hit. If a job is running longer than what is expected - review both `ContainerAppConsoleLogs_CL` and `ContainerAppSystemLogs_CL`

#### Replica timeout and Replica retry precedence:
As called out in [Kubernetes - Job termination and clean up](https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup) - "Replica timeout" (eg. `activeDeadlineSeconds`) will have precedence over if a "Replica retry limit" (eg., `backoffLimit`) is hit.

For example, if a job that is perma-failing through startup or exit code > 0 - and "Replica timeout" is set to 60 seconds with a "Replica retry limit" of 10 - the "Replica timeout" will be hit first, since the job (at that point in time) has not had any successful completions. Therefor, even though the job is failing at runtime - it will still show as `DeadlineExceeded`.

### BackoffLimitExceeded
BackOffLimitExceeded is also discussed in [Kubernetes - Job termination and clean up](https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup). From a Container Apps standpoint - this is equivalent to "Replica retry count".

From a general Kubernetes point of view (inline with the above) documentation, this is equivalent to `spec.backoffLimit`.

`BackOffLimitExceeded` will occur if a job hits the specified number of "Replica retry count" attempts defined by the user. 

The default value is zero (0). When a job fails, it will be retried the number of times defined on this property. Some examples would be:

- A container (in the job) exiting/crashing with a non-successful status code
    - Due to unhandled exceptions or other application errors
- A container failing startup - which can also be for various reasons, including the above point

This kind of behavior can be reproduced locally, if desired, in a Kubernetes cluster:

```
Type     Reason                Age   From            Message
----     ------                ----  ----            -------
Normal   SuccessfulCreate      39s   job-controller  Created pod: manual-job-674qt
Normal   SuccessfulCreate      27s   job-controller  Created pod: manual-job-8l88s
Normal   SuccessfulCreate      5s    job-controller  Created pod: manual-job-9jnq5
Warning  BackoffLimitExceeded  1s    job-controller  Job has reached the specified backoff limit
```

### Other Job failure reasons
The below reasons can also contribute to job failures. This is not an exhaustive list.

#### Image pull failures
Since Jobs still run as pods the subsequent image used for the job (and container within) will need to be pulled to the node it's scheduled to.

This means Jobs can show as "Failed" in the Execution History blade in the portal if the image fails to pull due to an unreachable registry or invalid credentials.

In `ContainerAppSystemLogs_CL`, you may see something like this:

```
Failed to pull image "container-app-jobs-examples-scheduled:latest": rpc error: code = Unknown desc = failed to pull and unpack image "docker.io/library/container-app-jobs-examples-scheduled:latest": failed to resolve reference "docker.io/library/container-app-jobs-examples-scheduled:latest": pull access denied, repository does not exist or may require authorization: server message: insufficient_scope: authorization failed
Error: ErrImagePull
Back-off pulling image "container-app-jobs-examples-scheduled:latest"
```

For further troubleshooting on image pull failures, see [Container Apps: Troubleshooting image pull errors](https://azureossd.github.io/2023/08/25/Container-Apps-Troubleshooting-image-pull-errors/index.html)

#### Storage mount failures and Storage quotas
Job execution can still be affected by storage quota limits and storage mount failures - jobs also inherit typical [container-based](https://learn.microsoft.com/en-us/azure/container-apps/jobs?tabs=azure-cli#container-settings) settings. Given this, storage quotas can be changed based on CPU allocation.

Jobs are still subjected to typical storage mount failure scenarios. Review [Troubleshooting volume mount issues on Azure Container Apps](https://azureossd.github.io/2023/07/24/Troubleshooting-volume-mount-issues-on-Azure-Container-Apps/index.html) for further troubleshooting regarding mount failures and quotas.

#### Container create failed - OCI runtime create failed
**NOTE**: The below error is not Azure specific. This is can happen with containers on any type of machine - cloud or not. This is a general container-specific error.

Jobs may fail if container(s) in the pod are unable to be created by `containerd`. An example of this error may look like:

```
Error: failed to create containerd task: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: exec: [some_reason]
```

For information as to why the container can't be created - review the full error message. The reason is typically provided within the message itself. For example, a container `ENTRYPOINT` referencing a bash file that doesn't exist/in the wrong location - or trying to call a command that is not on `$PATH`.

For more troubleshooting on this, review [Troubleshooting OCI runtime create errors](https://azureossd.github.io/2023/07/17/Troubleshooting-OCI-Runtime-Create-errors/index.html) - note, this post was written in the context of App Service Linux - but the same concepts can apply to Container Apps.

#### Container exiting and application issues
A container exiting due to an application unhandled exception or other other reasons will cause a job to be marked as failed.

In `ContainerAppSystemLogs_CL`, if a container exits with a specific status code - it may be logged out in this table. For instance:

```
Container 'manual' was terminated with exit code '1' and reason 'ProcessExited'
```

If an application is explicitly calling `exit()` (or the equivalent) through code, it must exit with a successful status code (status code 0), or else the job will be marked as failed.

If it is clear that when job execution kicks off, and that the container is exiting in a non-successful way, then review the container and platform logs.

#### Event Driven KEDA scaler failures
If an Event Driven Job fails (due to bad credentials, unreachable destination, incorrect `metaData`, etc.), this will not show up as a Failed execution in Execution history in the Container App Job portal. Meaning, nothing will be appearing as an attempted execution run - aside from trying to manually execute the Job.

Although nothing is being executed due to KEDA unable to scale out replicas - this may still count as a "failed" execution.