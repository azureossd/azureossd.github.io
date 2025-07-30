---
title: "Python - Slow execution / high CPU - wSGI/aSGI multi-worker strategy"
author_name: "Anthony Salemo"
tags:
    - Python
    - Configuration
    - aSGI
    - wSGI
    - gunicorn
    - hypercorn
    - uvicorn
categories:
    - Azure App Service on Linux
    - Python
    - Configuration 
    - Performance
header:
    teaser: /assets/images/pylinux.png
toc: true
toc_sticky: true
date: 2025-01-28 12:00:00
---

This post will generally go over using multiworker strategies to help with performance with wSGI/aSGI-based applications and Python "Blessed Images"

# Overview
In terms of Python "Blessed Images" - Gunicorn is used as the wSGI server to run Python applications. In some cases, users may override the default startup command with their own, which may be because its required (eg. for aSGI applications applications) or for other reasons. 

Some may unknowingly override this default startup command used with Python Blessed Images with ones with ones that may be more adverse to performance. This is typically related to workers (eg. `--workers`). Note this flag and any shorthand flags for this will vary based on wSGI/asGI web server used.

This post and what is being discussed right now is generally referencing:
- Slowness
- High CPU
- Both

This may be more common where the startup command is omitting adding additional workers, thus defaulting to one (1) - and some cases, falling back to a default of one (1) thread per worker (in scenarios with Gunicorn and gthread is used). Note, aSGI/asynchronous applications handle this differently so threads will not apply - this will likely be one thread of execution per worker, by design, since an event loop is used here

Common scenarios where this may apply:

- High request load is corelating to application slowness and/or high CPU from either the web server process (gunicorn, uvicorn, hypercorn, etc. or child Python processes)
- Slowness during application logic execution:
  - Common themes here are ML/AI-based applications, computational-heavy applications (which are typically more CPU intensive), I/O based applications, chatbots, or others.
  - Making a request to retrieve data from an external resource, in which this request is long running and/or synchronous
  - These typically coincide with logic that is usually more longer running

# Potential ways to help with performance
Workers can be increased in these ways:

- Gunicorn: `--workers (-w)`. Also see [Configuring Gunicorn worker classes and other general settings](https://azureossd.github.io/2023/01/27/Configuring-Gunicorn-worker-classes-and-other-general-settings/index.html#setting-worker-counts) -  and [Settings — Gunicorn 23.0.0 documentation](https://docs.gunicorn.org/en/latest/settings.html#workers)
   - Increasing threads with a worker of sync (default) will change this to `gthread`. `threads` is only applicable to `gthread`
- Uvicorn: `--workers`. See: [Server Workers - Uvicorn with Workers - FastAPI](https://fastapi.tiangolo.com/deployment/server-workers/)
Hypercorn: `--workers (-w)`. [See Configuring — Hypercorn 0.17.3 documentation](https://hypercorn.readthedocs.io/en/latest/how_to_guides/configuring.html#configuration-options)

As example with Gunicorn is:
- `gunicorn --bind 0.0.0.0 -w 4 --access-logfile '-' --error-logfile '-' --timeout 600 app:app`
- If increasing threads per worker: `gunicorn --bind 0.0.0.0 -w 4 --threads 4 --access-logfile '-' --error-logfile '-' --timeout 600 app:app`

An example with Uvicorn is:
- `uvicorn app:app --host '0.0.0.0' --workers 5`

If using a Python Blessed Image with a wSGI application where Gunicorn is able to be used, you can also increase workers by adding the App Setting `PYTHON_GUNICORN_CUSTOM_WORKER_NUM = n`, where `n` is a number of workers.

If an application startup command is directly invoking a `.py` entrypoint through something like `python -m app.py`, and, it happens to be a wSGI or aSGI-based application (eg. Flask, FastAPI, Quart, etc.) - then it is **heavily recommended** to use one of the above production grade web servers. Otherwise, this is a bad practice and is potentially limiting the applications own performance.

Since Python is technically single threaded (although aSGI-based asynchronous applications use an event loop for callbacks, but still with singular main thread of execution), this is where bottlenecks can occur depending on the type of logic being executed.

If more workers are scheduled, this means that this work (logic execution) is "distributed" to other individual workers and threads for execution - which can significantly help in scenarios for multiprocessing or logic that is inherently blocking. The below gist shows how this is structured, using Gunicorn as an example:

> **Tip**: In terms of high request load, doing the above, plus scaling _out_ the App Service Plan, can further help

[difference bwtween gunicorn workers(sync/eventlet/gevent/thread/tornado)](https://gist.github.com/zpoint/022250cc00fbd6c5c55514536d613673)

> **NOTE**: The below gist gives a very good read into an overview of how these servers field requests for Gunicorn

The below images are also pulled from the above GitHub repository.

Below is a sync worker overview for Gunicorn where it's assumed `--workers 2`:

![Gunicorn sync worker with 2](/media/2025/01/multi-worker-strategy-1.png)

Below is a `gthread` overview for Gunicorn - this assumes there is one (1) worker with two (2) threads. Assuming this was increased to 4 workers and 3 threads, this would then replicate the below, where you'd see 4 Thread workers and 3 threads for each respective queue assigned to each worker

![Gunicorn gthreadw orker](/media/2025/01/multi-worker-strategy-2.png)

For other implementations like Hypercorn/Uvicorn, it will more or less conceptually look like the sync worker example. However, these use eventloops - per worker. Each eventloop has a queue for callbacks and threadpools to the main thread. These aSGI servers may have different eventloop implementations that can be used, but this completely depends on the server used. Application code may also be able tie into this eventloop, however that's outside the scope of this section.

## Worker count recommendations
See the _Common scenarios_ where this may apply section above on scenarios that this may be beneficial for

There is a concept of "too many workers" - see [How Many Workers?](https://docs.gunicorn.org/en/stable/design.html#how-many-workers). You should not configure an arbitrary high number of workers. Most external documentation points to Gunicorns algorithm, which is `(2 x $num_cores) + 1`. For example, on a 4 core machine, this would be 9 workers. This can be set with something like:
- Gunicorn: `gunicorn --workers 9 ....`
- Hypercorn: `hypercorn --workers 9 ....`
- Uvicorn: `uvicorn --workers 9 ....`

When using Blessed Images with Gunicorn, you can specify [PYTHON_ENABLE_GUNICORN_MULTIWORKERS=true](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#gunicorn-multiple-workers-support) in App Settings to implicitly use Gunicorn with this algorithm. 

You can alternative manually set this as desired.

## Thread count recommendations
In the context of gunicorn, this should be reviewed: [How Many Threads?](https://docs.gunicorn.org/en/stable/design.html#how-many-threads)

With Gunicorn (and potentially other wSGI) services, you can specify a `--threads` option in addition to `--workers`.  You can have both multiple workers and multiple threads per worker.

WIth Gunicorn, if `--threads` is supplied as an argument, this will infer `gthread` worker usage. 

As described in the _How Many Threads?_ link - a mixture of mutiple workers and multiple threads (depending on what your application does - such as heavy I/O based applications) can potentially help extract further performance. 

# Scenarios where this may not be useful
Scenarios where this blog and conceptual approach may not help or be relevant is:
- If application logic is inherently slow/poorly written. Or, if a dependency/3rd party is organically responding slow (although the above can potentially help here to some degree)
- If application logic is doing something that causes constant CPU intensive execution, especially in cases where CPU usage starts to hit critical percentage levels. For example, many loops/nested loops/poorly written logic for loops

If you implemented a multi-worker strategy with a aSGI/wSGI app - and slowness/high CPU continues to occur - and a external dependency is not a factor in slowness, then you should profile the application, while reproducing the issue, to gain insight where time or resource usage may be spent.

