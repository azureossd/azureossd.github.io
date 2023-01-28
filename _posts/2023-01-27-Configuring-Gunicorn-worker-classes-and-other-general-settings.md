---
title: "Configurating Gunicorn worker classes and other general settings"
author_name: "Anthony Salemo"
tags:
    - Python
    - WSGI
    - Performance
    - Configuration
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Python # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/pylinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-01-27 00:00:00
---

In thos post we'll go over how to make Gunicorn target different worker classes for different types of applications - and other general settings we can configure through Gunicorn.

# What is Gunicorn?
[Gunicorn](https://gunicorn.org/) (aka. "Green Unicorn") is a production-grade Python wSGI HTTP server for UNIX environments. Gunicorn can run both wSGI and aSGI (through worker classes) based Python applications.

Python "Blessed Images" on Azure App service has Gunicorn built into these [images](https://github.com/Azure-App-Service/ImageBuilder/blob/master/GenerateDockerFiles/python/template-3.9/Dockerfile) which is a part of the default startup routine and is what is ultimately running Python applications unless explicitly configured otherwise. 

In production environments, it's heavily advised to run with a production grade server like this, to help manage requests, especially under high load, and avoid subpar performance, or issues like DDOS attacks - by not directly fronting your `.py` entrypoint (such as invoking it with `python -m app`). 

**NOTE**: In the below examples, we won't cover all use cases, but rather some that are more likely to appear while running your application on Azure App Service.

# Prerequisites
**IMPORTANT**: Ensure that App Service Logs are enabled - review [this document](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) on how to do so.

This is important incase the Gunicorn command is misconfigured which may potentially cause the application/container to crash. You can view logging in a few ways:
- Diagnose and Solve Problems -> Application Logs
- Log Stream
- Directly through the Kudu site - such as the /newui endpoint (https://sitename.scm.azurewebsites.net/newui) or the normal Kudu site
- An FTP client

# Configuration
Gunicorn has many ways it can be [configured](https://docs.gunicorn.org/en/latest/configure.html). We'll focus on worker classes and then look at some ways to possibly optimize performance.

In these examples, we'll be changing the startup command directly through the portal. Although, there are other ways you can configure it - such as through the [AZ CLI](https://learn.microsoft.com/en-us/cli/azure/webapp/config?view=azure-cli-latest#az-webapp-config-set).

Another important point to note, if not explicitly setting a startup command in the portal, is how Gunicorn will run a wSGI application with the help of Oryx's logic (If deploying a typical Flask or Django based application) is shown [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#run).

Additionally, aside from the startup command, you can tell what worker is currently being used from Gunicorn stdout - the below would be found in Application Logs:

```
[2023-01-27 00:11:45 +0000] [80] [INFO] Using worker: gthread
```
Or
```
[2023-01-27 17:23:58 +0000] [87] [INFO] Using worker: sync
```

**NOTE**:
- Any reference in the below commands to `app:app` should be replaced with the appropriate location of your wSGI callable file location and wSGI callable itself.

## Worker Classes
> **NOTE**: A good explanation on differences of worker classes can be found [here](https://gist.github.com/zpoint/022250cc00fbd6c5c55514536d613673).

### sync
`sync` is the [default](https://docs.gunicorn.org/en/latest/settings.html#worker-processes) worker class that Gunicorn uses, and is the default class that would also be ran on startup for Python applications on App Serivce Linux, when no startup command is defined. The `sync` worker handles a request at a time in this default mode.

The default arguments we use with sync is:
`--timeout 600 --access-logfile '-' --error-logfile '-' -c /opt/startup/gunicorn.conf.py --chdir=/tmp/<RANDOM_GUID>" gunicorn <wsgi_file_location>:<wsgi_callable>`

This would be the basic equivalent of `gunicorn --bind 0.0.0.0 --timeout 600 --access-logfile '-' --error-logfile '-' app:app`.

**NOTE**: As per Gunicorn documentation:

_If you try to use the sync worker type and set the threads setting to more than 1, the gthread worker type will be used instead._

We can see if we add the startup command `gunicorn --bind 0.0.0.0 --threads 2 --timeout 600 --access-logfile '-' --error-logfile '-' app:app` with the `--threads` option, our worker will change to `gthread` from `sync`. 

```
[INFO] Using worker: gthread
```

Additionally, if we add the App Setting `PYTHON_GUNICORN_CUSTOM_THREAD_NUM`, this would be the equivalent of the `--threads` flag, except we can easily manage it through the App Setting instead of having to re-add a whole new startup command instead. This App Setting will still cause the worker to be changed from `sync` to `gthread`.

### eventlet
[Eventlet](https://eventlet.net/) can be used, which is a non-blocking I/O based library that also uses coroutines for asynchronous work. 

If we wanted to use `eventlet`, we'd need to change our Gunicorn command to use the appropriate worker class for this.

As an example, take the below application using `threading`:

```python
from threading import Thread, Event

...

thread = Thread()
thread_stop_event = Event()
```

Go to the Azure Portal and add the below as a startup command:

```
gunicorn --bind=0.0.0.0 --timeout 600 --access-logfile '-' --error-logfile '-' --worker-class eventlet app:app
```

If you view logging, you'd see this worker now being used:

```
[2023-01-27 17:20:28 +0000] [79] [INFO] Using worker: eventlet
```

#### Possible issues
Using `eventlet` can arise some other issues related to the library and Gunicorn usage.

- `TypeError: cannot set 'is_timeout' attribute of immutable type 'TimeoutError'`: May be seen, which is covered under this [eventlet GitHub issue](https://github.com/eventlet/eventlet/issues/733).

- `RuntimeError: eventlet worker requires eventlet 0.24.1 or higher`: Which is covered in this [eventlet GitHub issue](https://github.com/eventlet/eventlet/issues/734).

- `ImportError: cannot import name 'ALREADY_HANDLED' from 'eventlet.wsgi'`: This is covered in this [Gunicorn GitHub pull comment](https://github.com/benoitc/gunicorn/pull/2581#issuecomment-994198667). This is a part of a breaking change due to the removal of `wsgi.ALREADY_HANDLED`.

All 3 of these issues are due to issues in specific versions of `eventlet`. This can be generally fixed by pinning to specific versions in your `requirements.txt` (ex. `eventlet==<major.minor.patch`)

### aiohttp
If you have an application using [aiohttp](https://docs.aiohttp.org/en/stable/) as the server, you can use Gunicorn to run that well. In the Azure Portal add the following startup command:

```
gunicorn --bind 0.0.0.0 --worker-class aiohttp.worker.GunicornWebWorker --timeout 600 --access-logfile '-' --error-logfile '-' app:app
```


> **NOTE**: If you try to deploy an aiohttp application using the `sync` worker, you may see this: `TypeError: Application.__call__() takes 1 positional argument but 3 were given`

### gthread
You can use `gthread` by using the following worker class:

```
gunicorn --bind 0.0.0.0 --worker-class gthread --timeout 600 --access-logfile '-' --error-logfile '-' app:app
```

The `gthread` worker type allows each worker (defined by an additional flag of `-w` or `--workers`) to run on multiple threads.

In this case, with `sync` being the default with a single worker with a single thread, this would change Gunicorn to handling application requests on multiple workers which those multiple child workers (distributed from the master process) which can potentially use x number of threads defined.

This could be beneficial in certain I/O scenarios or CPU bound/processing work - since the workers flag itself should follow the algorithm of [`2-4 x $(NUM_CORES)`](https://docs.gunicorn.org/en/latest/settings.html#settings).


### uvicorn
[Uvicorn](https://www.uvicorn.org/) is used as a production grade server to help run aSGI-based applications, a popular one being [FastAPI](https://fastapi.tiangolo.com/tutorial/).

You can use the Uvicorn worker as seen below to run these kinds of applications.

```
gunicorn --workers 3 --worker-class uvicorn.workers.UvicornWorker --timeout 600 --access-logfile '-' --error-logfile '-' app:app
```

**Note**:

If you try to run FastAPI against a `sync` worker, you may see this:

```
TypeError: FastAPI.__call__() missing 1 required positional argument: 'send'
```

## Setting worker counts
Gunicorn uses one (1) worker by default, with the `sync` worker class explained above. If we want to utilize multi workers to use for scenarios like multiprocessing, we can use the two approachs below:

> **NOTE**: Gunicorns recommendation is to follow the `2-4 x $(NUM_CORES)` algorithm for the worker value

### Command line
To set Gunicorn to use more than one worker, use the `--workers` or `--worker` flag:

```
gunicorn --bind 0.0.0.0 -w 4 --access-logfile '-' --error-logfile '-' --timeout 600 app:app
```

Or 

```
gunicorn --bind 0.0.0.0 --workers 4 --access-logfile '-' --error-logfile '-' --timeout 600 app:app
```

Since `--threads` is not specified, this will default to have each worker use one (1) thread each.

You can tell that multiple workers are being spawned by either reviewing Gunicorn startup stdout, which would show the worker PID:

```
2023-01-27T20:17:23.280992836Z [2023-01-27 20:17:23 +0000] [80] [INFO] Using worker: gthread
2023-01-27T20:17:23.290651707Z [2023-01-27 20:17:23 +0000] [89] [INFO] Booting worker with pid: 89
2023-01-27T20:17:23.349836378Z [2023-01-27 20:17:23 +0000] [90] [INFO] Booting worker with pid: 90
2023-01-27T20:17:23.393782565Z [2023-01-27 20:17:23 +0000] [91] [INFO] Booting worker with pid: 91
2023-01-27T20:17:23.480446390Z [2023-01-27 20:17:23 +0000] [92] [INFO] Booting worker with pid: 92
```

And/or by using something like the `ps` command to validate what processes are running. You can do this by initating an [SSH session with the application](https://learn.microsoft.com/en-us/azure/app-service/configure-linux-open-ssh-session).

You can then run `ps -aux | grep gunicorn`, which should show these workers as well. Note that the PID's will match the PID's logged out by Gunicorn:

```
root        80  0.5  0.6  37700 28076 ?        SN   20:17   0:01 /opt/python/3.10.9/bin/python3.10 /opt/python/3.10.9/bin/gunicorn --bind 0.0.0.0 -w 4 --threads 2 --timeout 600 app:app
root        89  0.5  0.8  44816 33108 ?        SN   20:17   0:01 /opt/python/3.10.9/bin/python3.10 /opt/python/3.10.9/bin/gunicorn --bind 0.0.0.0 -w 4 --threads 2 --timeout 600 app:app
root        90  0.5  0.8 118436 32988 ?        SNl  20:17   0:01 /opt/python/3.10.9/bin/python3.10 /opt/python/3.10.9/bin/gunicorn --bind 0.0.0.0 -w 4 --threads 2 --timeout 600 app:app
root        91  0.4  0.8  44728 33052 ?        SN   20:17   0:00 /opt/python/3.10.9/bin/python3.10 /opt/python/3.10.9/bin/gunicorn --bind 0.0.0.0 -w 4 --threads 2 --timeout 600 app:app
root        92  0.4  0.7 117244 31796 ?        SNl  20:17   0:00 /opt/python/3.10.9/bin/python3.10 /opt/python/3.10.9/bin/gunicorn --bind 0.0.0.0 -w 4 --threads 2 --timeout 600 app:app
```

Also to note, is that we see an additional Gunicorn process with PID 80 - this would be the master process, given this is not a worker technically, it would make sense this is not logged out in Gunicorn's stdout startup logging.

### App Settings
Instead of having to manually enter in the worker count through a startup command, you can use the App Setting `PYTHON_ENABLE_GUNICORN_MULTIWORKERS` [(docs)](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#gunicorn-multiple-workers-support).

This enables the multi-worker strategy. After enabling this (and depending on your machine core count) - you should see the `sync` worker be used with additional worker processes started.

You can further customize the worker count with this App Setting `PYTHON_GUNICORN_CUSTOM_WORKER_NUM` [(docs)](https://github.com/microsoft/Oryx/blob/main/doc/configuration.md). This will change worker count to the number specified. The App Setting `PYTHON_ENABLE_GUNICORN_MULTIWORKERS` is required to be `true` if wanting to use the custom worker number count. If the custom count App Setting is not set, this falls back to `2 * (CPU core num) + 1`.

For example:

`PYTHON_GUNICORN_CUSTOM_WORKER_NUM = 8` will set `-w/--workers` to 8 workers.

**NOTE**: This will **not** work in addition to an existing start up command, meaning, you cannot specify a command like `gunicorn --bind 0.0.0.0 --worker-class gevent --timeout 800 app:app` and expect the multi-worker strategy be added into this existing command. In this case, you'd manually have to add the `-w` or `--worker` flag.

This **only** applies to the default Gunicorn startup command ran when **no** startup commands are set in the Azure Portal. 

## Gunicorn.conf.py
If you'd rather not pass all of these arguments via startup command, you can utilize a [`gunicorn.conf.py`](https://docs.gunicorn.org/en/latest/settings.html#config) file for your set up. 

You can pass all of the usual configuration into this file to be read by Gunicorn with the `-c` flag. To set this up, take the below directory structure as an example. This would be relative to where the startup command is executing from, when deployed to Azure App Service, which is in the site root (which uses [$APP_PATH](https://github.com/Azure-App-Service/KuduLite/wiki/Python-Build-Changes)):

![Project directory](/media/2023/01/azure-blog-python-gunicorn-1.png)

The `gunicorn.conf.py` would look like the following:

```python
import multiprocessing, os

worker_class = 'sync' # or gthread, gevent, tornado, eventlet, etc.
bind = '0.0.0.0'
timeout = '600'
workers = 2 * multiprocessing.cpu_count() + 1
accesslog = os.getenv("ACCESS_LOG", "-")
errorlog = os.getenv("ERROR_LOG", "-")
########## You can log these to a specific file as well
# accesslog = '/home/site/wwwroot/gunicorn_access_logs'
# errorlog = '/home/site/wwwroot/gunicorn_error_logs'
```

With the startup command being simplified to:

```
gunicorn -c gunicorn.conf.py app:app
```


## Troubleshooting
### Why am I not seeing logging with custom startup commmands?
Ensure that `--access-logfile '-' --error-logfile '-'` are being passed to your custom startup command. Otherwise, application specific stdout/err will not show.

### Application Error : (
This is a generic error that'll display in the browser - but essentially means your container (application) has crashed. Unless you have **App Service Logs** enabled, you will not be able to easily discern what the problem is.

Given this is related to the application - or in this contenxt, possibly, the startup command, enable this prior to proceed with troubleshooting further. After enabling these, it should be more clear what the issue is. Follow the [prerequisites](#prerequisites) section on how to view these logs.

### Error: class uri '[worker]' invalid or not found
If this is occuring, review the entirety of what is logged to stderr. Normally, the real issue is further down in the log. For example, with **eventlet**:

```python
Error: class uri 'eventlet' invalid or not found: 
[Traceback (most recent call last):
File "/opt/python/3.9.16/lib/python3.9/site-packages/gunicorn/util.py", line 99, in load_class
    mod = importlib.import_module('.'.join(components))
File "/opt/python/3.9.16/lib/python3.9/importlib/__init__.py", line 127, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
        File "", line 1030, in _gcd_import
        File "", line 1007, in _find_and_load
        File "", line 986, in _find_and_load_unlocked
        File "", line 680, in _load_unlocked
        File "", line 850, in exec_module
        File "", line 228, in _call_with_frames_removed
File "/opt/python/3.9.16/lib/python3.9/site-packages/gunicorn/workers/geventlet.py", line 20, in 
    from eventlet.wsgi import ALREADY_HANDLED as EVENTLET_ALREADY_HANDLED
        ImportError: cannot import name 'ALREADY_HANDLED' from 'eventlet.wsgi' (/tmp/8dafff3d21f6b01/antenv/lib/python3.9/site-packages/eventlet/wsgi.py)
]
```

If a worker class was targetted that was incorrect or didn't exist, it would show this same stack trace but with a different root error:

```python
ImportError: Entry point ('gunicorn.workers', 'afakeclass') not found
```

Using this startup command as an example - `gunicorn --bind 0.0.0.0 --worker-class afakeclass --timeout 600 --access-logfile '-' --error-logfile '-' app:app`

Further troubleshooting information and additional configuration can be found under [Configure a Linux Python app for Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-language-python).









