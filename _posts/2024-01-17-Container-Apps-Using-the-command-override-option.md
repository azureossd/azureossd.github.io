---
title: "Container Apps - Using the 'Command override' option"
author_name: "Anthony Salemo"
tags:
    - Linux
    - Configuration
    - Container Apps
    - Troubleshooting
categories:
    - Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azure-containerapps-logo-1.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-01-17 12:00:00
---

This post will discuss the "Command override" option for overriding a containers ENTRYPOINT or CMD command.

# Overview
"Command override" refers to what is seen in the portal (below), or for example, what the `--command` parameter in the [az containerapp update](https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest#az-containerapp-update) command

![Command override](/media/2024/01/command-override.png)

This is the same concept of overriding a containers `ENTRYPOINT` or `CMD` with a custom command - which can be done in most environments that can run a container. For Kubernetes specific documentation, refer to [Kubernetes - Containers - Define command arguments for a container](https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/)

An example of this locally (non-kubernetes) - would be `docker run -d -p 8080:8080 somecontainer node server.js` - where `node server.js` is the command passed into override the container start up.

A working example of this on Container Apps may look someting like this - notice we have our `ENTRYPOINT` commented out:

```Dockerfile
FROM python:3.10.6-slim-bullseye

WORKDIR /app/
COPY requirements.txt /app/
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000 

# ENTRYPOINT [ "/app/entrypoint.sh" ] 
```

You can then set what would be your application startup command as the value to "Command override"

![Command override](/media/2024/01/command-override-2.png)

![Command override](/media/2024/01/command-override-3.png)


You can additionally use `args` as well. This fundamentally works the same as the above, where all commands and arguments are placed in the `command` property.

```json
"command": [
   "/bin/sh"
],
"args": [
   "-c",
   "echo 'this worked'"
]
```

With the difference being that `args` are just the arguments passed to the shell, which could be a command itself. The `args` array is available to be set by users. For example, here is documentation with the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest#az-containerapp-create). This is not available via the Azure Portal currently - but can get set through Iac implementations like Bicep, ARM, Terraform, etc. - and others like the REST API for Container Apps or Jobs, or the Azure CLI.

When using a command override for Container Apps (or in general for a container), a few things need to be validated:
- The command needs to be targeting the correct path
- The command used would need to be on `$PATH` (if invoking by executable name)
- Use commas to separate commands 

A common issue when trying to use this option is encountering `OCI runime create failed` issues due to the above reason (and others), this would look like the following - below are 2 examples:
- `Error: failed to create containerd task: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: exec: "java -jar probes-0.0.1-SNAPSHOT.jar": stat java -jar probes-0.0.1-SNAPSHOT.jar: no such file or directory: unknown`
- `Error: failed to create containerd task: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: exec: "dbt build --select stage+": executable file not found in $PATH: unknown`

The command following `exec` (above) is what is attempted to use to start the container.

These can be found in the `ContainerAppSystemLogs` / `ContainerAppSystemLogs_CL` table (depending on if you're using Log Analytics or Azure Monitor). However, be noted of logging differences between **Consumption-only** and **Dedicated** environments:
- (consumption-only): `Error: failed to create containerd task: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: exec: ... [rest or message]`
- (dedicated): `Container 'oci-runtime-test' was terminated with exit code '' and reason 'ContainerCreateFailure'`

As seen above, dedicated environments will show a "reason" of `ContainerCreateFailure` in the `Log_s` column. 

Consumption-only environments will output the full message that you would typically see in `stderr`.

# Mitigations and resolutions
If `OCI runtime create failed` or `ContainerCreateFailure` is being seen when using "command override":

- Use a full absolute path to the file or executable being invoked
- Ensure the path specified exists and is correct
  - For the first two points, you may see a message like `no such file or directory: unknown` in the `OCI` error
- If trying to invoke a command globally, make sure it's on `$PATH`
  - For executables not on `$PATH`, you may see `executable file not found in $PATH: unknown`. You will either need to reference the executable by the full path or `export` it first to make it available - 
- Make sure commas are being used in the command for separate commands and arguments- ex. `python, /some/path/python.py`
  - You may see `no such file or directory: unknown` for commands not comma separated 

For further information, see the blog - [Container Apps - Troubleshooting ‘ContainerCreateFailure’ and ‘OCI runtime create failed’ issues](https://azureossd.github.io/2024/01/16/Container-Apps-Troubleshooting-OCI-Container-create-failed-issues/index.html) 

If `backoff-restart` or container exits are seen after using Command Override - this likely indicates that the command being invoked was succesful to a degree, but an application or runtime issue is causing it to fail to succesfully start or terminate post-start. In these instances, reviewing LogStream or the `ContainerAppConsoleLogs` / `ContainerAppConsoleLogs_Cl` is important since the reason for failure depends on the application.