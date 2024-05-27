---
title: "Graceful termination on Container Apps"
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
date: 2024-05-27 12:00:00
---

This post will discuss graceful termination on Container Apps.

# Overview
Graceful shutdown refers to the "window of opportunity" an application has to programmatically clean up logic/connections/other application behavior in the window of time _after_ `SIGTERM` is sent to the container(s) in a pod.

`SIGTERM` is a part of the standard Posix signals - which is as signal sent to process(es) being requested to shut down (but can be ignored, unless `SIGKILL` is sent) - more of this can be read [here](https://www.man7.org/linux/man-pages/man7/signal.7.html)

This may be logic such as:
- Closing database connections
- Waiting for any long running operations to finish
- Clearing out a message queue
- Ensuring any file handles or file operations are cleaned
- etc.

This "window" is beneficial for applications with logic where interruption to these kinds of operations or behaviors could impactively adverse systems, user experience, or other aspects of a program.

`SIGTERM` can be sent to containers in pods when scaling in, restarting a specific revision (which will cause new pods/replicas to be created that belong to that revision), or essentially what is described in [Container Apps - Demystifying restarts](https://azureossd.github.io/2024/01/11/Container-Apps-Demystifying-restarts/index.html)

> **NOTE:** It is possible for containers to immediately receive SIGKILL (exit code 137), which will forcefully kill processes (i.e containers), but that's not described here. See [Container Apps - Backoff restarts and container exits](https://azureossd.github.io/2024/01/19/Container-Apps-Backoff-restarts-and-container-exits/index.html#application-related)

This behavior is dictated by the property `terminationGracePeriodSeconds` - which can be set through ARM or the Azure Portal on Container Apps

- **Portal**: Go to the _Revisions_ blade -> _Create a new revision_

![Azure Portal for Graceful termination](/media/2024/05/aca-graceful-term-1.png)

- **ARM**: This is set under the `resources.properties.template.terminationGracePeriodSeconds` property:

   ```json
        "template": {
          "terminationGracePeriodSeconds": 35,
          "containers": [
            {
              "image": "someregistry.com/image:tag",
              "name": "some-container",
              "resources": {
                "cpu": 0.5,
                "memory": "1.0Gi"
              },
            ....
    ```

`terminationGracePeriodSeconds`, is ultimately from Kubernetes - a more detailed explanation on pod termination is found here - [Pod Lifecycle | Kubernetes](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination)

You can only set a **maximum** value of 600 seconds (10 minutes) for `terminationGracePeriodSeconds`. If an application is needing upwards of 10 minutes to clean up logic, or more, this can pose challenges, especially if an application is scaling out to many replicas (or even just a few). It would be heavily recommended to revisit the applications design around clean up logic to reduce this:
- Additionally, since the pod (and therefor container(s) within) will still exist, if many pods are pending termination for minutes at a time - and new pods/replicas are created, this can start presenting resource contention issues - depending on how many resources already exist within the environment


Below is an overview of what this would look like in the pod lifecycle - **"Window to shut down the application"** is the number defined in `terminationGracePeriodSeconds` by a user - and presents the window to clean up logic before a `SIGKILL` is sent:

![Azure Portal for Graceful termination](/media/2024/05/aca-graceful-term-2.png)

# Logging
You may not always seen a message regarding which exit code a container exited with (in this case, `137` or `143`) - but you can get an idea of when `SIGTERM` was sent to the container by looking in the `ContainerAppSystemLogs_CL` Log Analytic (or the Azure Monitor equivalent, `ContainerAppSystemLogs`) table.

```
ContainerAppSystemLogs_CL
| where ContainerAppName_s =~ "some-container"
| where Reason_s == "StoppingContainer"
| project TimeGenerated, Log_s, Reason_s
```

Using something like the above query, we can find a message like this:

```
TimeGenerated [UTC]         Log_s                                Reason_s
5/27/2024, 7:26:42.894 PM   Stopping container some-container    StoppingContainer
```

If our application happened to be writing to `stdout` when a `SIGTERM` is received, we can correlate these two events together. Which is seeing the `Stopping container [container-name]` would also mean that a `SIGTERM` has been sent to the container (s) running in said pod or replica. Note the timeframes.

```
ContainerAppConsoleLogs_CL
| where ContainerAppName_s =~ "some-container"
| project TimeGenerated, Log_s
```

```
TimeGenerated [UTC]          Log_s
5/27/2024, 7:26:42.345 PM    {"level":"warn","ts":1716838001.9346442,"caller":"app/main.go:36","msg":"SIGTERM received.., shutting down the application.."}
```

# Catching signals
There are various ways to catch signals, depending on the language. It's heavily advised to test this on your local machine first. You can mimic a `SIGTERM` by running a container on your local machine and sending something like `docker stop [container_id]` (if you're using Docker), or the relevant stop command for your container runtime.


Below are some quick examples:

**Go**:

Below is an example with Fiber

```go
...other code
func main() {
    app := fiber.New()

    app.Get("/", controllers.IndexController)
    // Run this as a goroutine in your application entrypoint
    signalChannel := make(chan os.Signal, 2)
    signal.Notify(signalChannel, os.Interrupt, syscall.SIGTERM)
    go func() {
        sig := <-signalChannel
        switch sig {
        case syscall.SIGTERM:
            zap.L().Info("Caught SIGTERM..")
            zap.L().Info("Calling os.Exit(0)..")
            os.Exit(0)
        }
    }()
    app.Listen(":3000")
}
```

**Node**:

Below is an example with Express

```js
import express from "express";
import { homeController } from "./controllers/indexController.js";

const port = process.env.PORT || 3000;
const app = express()

app.use(homeController)

process.on("SIGTERM", () => {
    console.log("SIGTERM received, exiting application with exit(0)");
    process.exit(0);
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})
```

**Python**:

Below is an example with Flask

```python
import signal
import sys
from flask import Flask, jsonify

app = Flask(__name__)

def shutdown_function(signal, frame):
    print('Recieved SIGTERM, exiting with exit(0)')
    sys.exit(0)

signal.signal(signal.SIGTERM, shutdown_function)

app.route('/')
def index():
    return jsonify({'message': 'sigterm-handlers-python'})
```

**Java**:

Below is an example with Spring Boot - note, there are lifecycle hook methods/annotations that can be used when `SIGTERM` is called as well.

```java
@SpringBootApplication
public class AzureApplication {

	private static void addSignalHandler() {
		SignalHandler signalHandler = new SignalHandlerImpl();
		Signal.handle(new Signal("TERM"), signalHandler);
	}

	private static class SignalHandlerImpl implements SignalHandler {

		@Override
		public void handle(Signal signal) {
			switch (signal.getName()) {
				case "TERM":
					System.out.println("Caught signal SIGTERM, exiting application with exit(0)");
					System.exit(0);
					break;
				default:
					break;
			}
		}
	}

	public static void main(String[] args) {
		SpringApplication.run(AzureApplication.class, args);
		addSignalHandler();
	}
}
```

**Dotnet**:

Below is an example with .NET 8 - note, that the default host automatically handles `SIGTERM` - and there are various ways to hook into lifecycle events through .NET once `SIGTERM` has been sent. This example is showing how to listen for the signal - if `exit()` is not explicitly called, the default host will handle this

```csharp
using System.Runtime.InteropServices;

var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();
... other code

// Listen for signals
PosixSignalRegistration.Create(PosixSignal.SIGTERM, (ctx) =>
{
    Console.WriteLine("Caught SIGTERM, default host is shutting down");
});

app.Run();

```

## Signals aren't being received by the application process

For users who have a `Dockerfile` that is using `ENTRYPOINT` to a shell file, like:

```
ENTRYPOINT [ "/usr/src/app/init_container.sh" ]
```

You'll notice that `SIGKILL` may not be caught by the process. This is because the shell (through `init_container.sh`) , is now `PID 1`. 

```
    7     1 root     S    10.2g  62%   6   0% node server.js
   18     0 root     S     1684   0%   3   0% /bin/sh
    1     0 root     S     1616   0%   2   0% {init_container.} /bin/sh /usr/src/app/init_container.sh
```

This causes the signal to **not** propagate to the application process. More importantly, this would happen on a local machine as well, or anywhere a container may run. To circumvent this, try:
- Change `ENTRYPOINT [ "/usr/src/app/init_container.sh" ]` to something like `ENTRYPOINT [ "node", "server.js" ]` 
- If you dont want the application process as `PID 1`, use an `init` manager like [tini](https://github.com/krallin/tini). You can then use it like: `ENTRYPOINT ["/sbin/tini", "--", "node", "server.js"]`
  - If we look below, we can see the the `node` process is now _not_ `PID 1` - but, it still does receive the `SIGTERM` signal properly

```
    7     1 root     S    10.2g  62%   7   0% node server.js
   18     0 root     S     1684   0%   2   0% /bin/sh
   24    18 root     R     1612   0%   2   0% top
    1     0 root     S      804   0%   2   0% /sbin/tini -- node server.js
```

> **NOTE**: Invocation of `tini` depends on the OS/distro and how this was installed - this is due to differences of where binaries are installed across some distributions or installation methods

- You can also use `CMD [ "/usr/src/app/init_container.sh" ]`, and then with the shell script, use `exec` to invoke your application entrypoint - such as `exec node server.js`:

  ```bash
  #!/bin/sh

  exec node server.js
  ```