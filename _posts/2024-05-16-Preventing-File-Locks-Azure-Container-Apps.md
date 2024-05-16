---
title: "Preventing File Locks when mounting storage on Azure Container Apps"
author_name: "Keegan D'Souza"
tags:
    - Azure Container Apps
    - File Locking
    - Failing Revisions
categories:
    - Azure Container Apps 
    - Troubleshooting 
header:
    teaser: "/assets/images/azure-containerapps-logo-1.png" 

toc: true
toc_sticky: true
date: 2024-05-16 12:00:00
---

## Overview 
In this blog we will review a common file locking scenario incountered when using run container apps that mount Azure File Storage.

## Problem
Whenever you deploy a new revision you might notice that the revision is failing due to certain files being locked, for example:

```Error: SQLITE_BUSY: database is locked```

```File Locked: failed to write to it```

Below is a bare bones code that runs code that repoduces the problem. I have containerized this code within and deployed it to Azure Container Apps. 

Initally it will deploy and work fine, however issues arise whenever I want to create a new revision. 

```python
import fcntl
import time

file_path = "/var/log/example.log"

# Open the file in write mode
file  = open(file_path, 'w')

try:
    # Acquire exclusive lock on the file
    fcntl.flock(file, fcntl.LOCK_EX | fcntl.LOCK_NB)
except BlockingIOError:
    print ("Cannot accquire a lock on the file", file)
    exit(1)

while True:
    # Perform operations on the file indefinitly
    file.write("Logging information\n")
    time.sleep(5);
```

This python code creates a lock on the file */var/log/example.log* indefinitly. The code itself writes data every 5 seconds and does not release the lock.

ContainerAppConsoleLogs shows the new revision cannot write to the file.

```
Connecting...
2024-05-16T21:54:37.25192  Connecting to the container 'python'...
2024-05-16T21:54:37.27032  Successfully Connected to container: 'python' [Revision: 'kedsouza-filelock--ua521gi-f945d6854-g67br', Replica: 'kedsouza-filelock--ua521gi']
2024-05-16T21:53:35.511069092Z Traceback (most recent call last):
2024-05-16T21:53:35.511114167Z   File "/app/app.py", line 11, in <module>
2024-05-16T21:53:35.511135978Z     fcntl.flock(file, fcntl.LOCK_EX | fcntl.LOCK_NB)
2024-05-16T21:53:35.511211058Z PermissionError: [Errno 13] Permission denied
```

ContainerAppSystemLogs show the container exit with code 1 due to the above exception.

```
{"TimeStamp":"2024-05-16 21:55:19 \u002B0000 UTC","Type":"Warning","ContainerAppName":"kedsouza-filelock","RevisionName":"kedsouza-filelock--ua521gi","ReplicaName":"kedsouza-filelock--ua521gi-f945d6854-g67br",
"Msg":"Container \u0027python\u0027 was terminated with exit code \u00271\u0027","Reason":"Error","EventSource":"ContainerAppController","Count":3}
```

## Explanation 
This happens due to the way the revision update lifecyle is designed on Azure Container Apps.
Essitentally the running revision will **not** be sent a sigterm or sigkill signal **until** the new revision is marked as healthly. 

More information here: [Revisions - Zero Downtime Deployment](https://learn.microsoft.com/en-us/azure/container-apps/revisions#zero-downtime-deployment)

![alt text](/media/2024/05/ACA-revision-restart-lifecycle.png)

This causes a problem because the new revision will be not be marked as healthly until the file lock as been released. 
However the lock is will never be released because the current replica will not be sent a sigterm or sigkill signal, causing a [catch-22](https://www.merriam-webster.com/dictionary/catch-22) scenario. 


## Solutions
- *(Recommended)* Modify your Azure FileShare storage to be mounted with the ```nobrl``` flags to prevent file locking.

  More information here: [Mount Options Azure Files](https://learn.microsoft.com/en-us/troubleshoot/azure/azure-kubernetes/storage/mountoptions-settings-azure-files)

  ![alt text](/media/2024/05/ACA-mount-options.png)

- *(Recommended)* Design your application in a way to startup sucessfully without relying on locked files. 

  In the case of log files create a unquie file name for every container. 

  If you are using a database which is persisted on the file system in production, consider using a managed Azure Database Solution like [Azure Database for MySQL](https://azure.microsoft.com/en-us/products/mysql). 
- Manually stop your container app, create a new revision, then start your container app again. This should be only used for quick development purposes and testing. Relying on this method will still cause your revision to fail in the case of automatic upgrades to the Container App Platform. 
