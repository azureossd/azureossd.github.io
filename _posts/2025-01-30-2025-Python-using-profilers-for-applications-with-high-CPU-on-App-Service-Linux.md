---
title: "Profiling Python applications with high CPU on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Python
    - Performance
    - Profiling
categories:
    - Azure App Service on Linux
    - Python
    - Performance 
header:
    teaser: /assets/images/pylinux.png
toc: true
toc_sticky: true
date: 2025-01-30 12:00:00
---

This blog post will go over different toolsets that can be used to profile a Python application experiencing high CPU and/or slowness.

# Overview
There are various ways to get insight into what may be consuming CPU within an application. This can either be profilers through code, CLI, or APM's. This post gives different options for usage with Python "Blessed" images on App Service Linux. 

Note, none of these are installed in these images by default and must either be explicitly added through code or installed.

## Prerequisites
### Logging
In case issues arise when adding a profiler, ensure that [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) are enabled. You can then view logs from various ways:
- Directly on the Kudu site (yoursite.scm.) - look for `YYYY_MM_DD_xxxxxxxxxxxx_default_docker.log`
- Logstream - This will tail logging
- FTP - look for `YYYY_MM_DD_xxxxxxxxxxxx_default_docker.log`
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/webapp/log?view=azure-cli-latest#az-webapp-log-tail) - This will tail logging

### Taking profiles
Always ensure that high CPU (or slowness) is **actually occurring**. If neither of these are, then the data is likely to be useless. Additionally, take more than one profile and/or thread dump - around 3 or so, at least - for consistent data.

It may be helpful to take a "baseline" profile and/or thread dump, when the issue is **not** occurring - to have data to compare _against_.

### Viewing locally
All of these implementations should be able to run in a local application, containerized or not, as long as the application can run on a local machine.

It is best to see if the resource issue reproduces locally. If it's correlated to high request load, a specific flow/request payload that cannot be done locally, or other intensive tasks - setting up a staging environment on App Service a mimicking the scenario to reproduce the issue is a next best step.

# Confirm if there is high CPU (or slowness)
To get relevant information, you want to first ensure there actually is high CPU. There are various metrics for App Service that shows process usage of an application. Some of which can be found below:

- Go to the **Diagnose and Solve Problems** blade on the application and look at either _CPU Usage_ or _Linux CPU Drill Down_
  - Note, these "detectors" aggregate data in 5 minute intervals. Data may not be 1:1 with something like from the **Metrics** blade or APM's (if used)

![100% CPU usage from Gunicorn in top](/media/2025/01/python-profiling-2.png)

This detector views usage from an _instance_ perspective. Note, in terms of single threadedness - you may not see 100% (or close to this) usage, even if `top` / `ps`, etc. is showing 100% while SSH'd into the container. This is especially the case if the SKU you're using has > 1 core. The reasoning for this is explained more, below.

-----

Another foolproof way, assuming the container is not exiting and is actively running, is to go into **SSH** - and use `top` (or `ps`) and see if your application process is the one consuming memory. The process name may vary depending on what kind of Python application you're running, and how you're serving it. The below example is using Gunicorn to serve the application:

![100% CPU usage from Gunicorn in top](/media/2025/01/python-profiling-1.png)

This PID is referencing a Gunicorn worker process (Blessed Python images with a default startup command use Gunicorn with 2 worker processes) - this is what's executing our code - and infering our application is consuming 100% CPU usage. Since this Python application example is single threaded, we can also infer its using 100% of the core it's ran on. Regardless of SKU's that have multiple CPU cores. Even if there are four (4) cores (which can be seen as 400% CPU), the nature of this single threadedness will only use one (1) of these 4 at a time, so 100% of 400% for Gunicorn (or your process name) is still 100% CPU usage.

----

If you're referencing other metrics, such as the **Metrics** blade, or APM's, these also will typically show process CPU usage - or - performance statistics of HTTP requests for the application, in terms of slowness.

# Profilers - through CLI (recommended)
## py-spy (recommended)
[py-spy](https://github.com/benfred/py-spy) is an out-of-process profiler that can be invoked through the terminal via SSH (or other methods like startup commands/scripts). 

This can be very beneficial in the sense that code changes do not need to happen to implement profilers. Sometimes, this can introduce side-effects, like performance issues since most profilers run in the same Python process - and could affect production traffic. In other cases, you'd need to figure out which peice of code to wrap profiler function calls around to properly profile (and assuming it doesn't break the application)

`py-spy`'s implementation negates the above and makes it safe to use.

The only that is required is to install `py-spy` into the current activated virtual environment. You can either:
- Explicitly add `py-spy` into your `requirements.txt`
- Or, go into SSH (**NOT** _Bash_) and run `pip install py-spy`
- If using a non-standard approach like [Deploying your own virtual environment with Python and App Service Linux](https://azureossd.github.io/2024/07/25/Deploying-your-own-virtual-environment-with-Python-and-App-Service-Linux/index.html) - ensure this package is appropriately added/installed into `site-packages` for your virtual environment

## Usage
### pyspy-top ("top" like output)
Go into **SSH**, and run `top` or `ps` to get the PID of the Python process consuming the most CPU. Using Gunicorn again, we can see it's consuming 100% CPU. The pid here is `93`

![Gunicorn process PID](/media/2025/01/python-profiling-4.png)

You can use the `py-spy top --pid [appprocesspid]` which essentially displays a `top`-like output through `py-spy`. In this case, we'd run `py-spy top --pid 93`. The output looks like this:

![py-spy top output](/media/2025/01/python-profiling-5.png)

Using `py-spy top`, we can see in this case the function `cpu_intensive_task` being called in `app.py` is consuming the most time.


### Continuous recording
This method lets you continuously record a sample profiler of the application.


If you want to output this to a file, you can use a flamegraph. The command `py-spy record` will run a sample with a default of 100 times a second - this will write out to the file when cancelled with `CTRL + C`. Write the file to some location under `/home` so it can be downloaded.

The command to use is `py-spy record -o /home/profile.svg --pid [appprocesspid]`. In this case, `py-spy record -o /home/profile.svg --pid 93`. Output of running the command is below:

![py-spy top output](/media/2025/01/python-profiling-6.png)

Download the generate file, in this case, `profile.svg`, and then open it locally in your browser:

![py-spy recorder output](/media/2025/01/python-profiling-7.png)

Each call can be clicked on and drilled into.

### Thread dump
You can use `py-spy dump --pid [appprocesspid]` to do a thread dump of the process in question. This will write to stdout in the terminal by default. 

The below example runs ``py-spy dump --pid 94`

![py-spy thread dump output](/media/2025/01/python-profiling-8.png)

This gives more insight into what code is executed, per thread - and can be helpful in multipthreading Python applications (and others). This can also be useful in generally "slow" applications where high CPU is not present, but persistent slowness is.


# Profilers - through code
## cProfile
This library is already installed by default in Python versions. Since it is a C extension it helps for profiling long-running programs. This profiler gives you the total running time and tells the function call frequency, also it is helpful to read events from I/O.

Usage of this builtin profiler will depend on the application and logic of it:
- If the application has several layers or calls other processes different from the main thread, you will probably need to specify chunk of codes or functions in order to isolate the problematic code. 
- If you are using a single script it may be better to profile when executing Python from the command line. Although this has drawbacks since this will need to alter the **[Startup Command](https://azureossd.github.io/2020/01/23/custom-startup-for-nodejs-python/index.html)** - which may not work for certain applications. If high CPU usage is reproducible locally while running the application in a container, then this can be more easily attempted - or - from a non-production environment in App Service (Linux)

### Usage
1. Import the following where relevant in your codebase:

    ```python
    import cProfile, pstats, io
    from pstats import SortKey
    ```

2. Select the function/method or route that you think it is taking more CPU time. To enable/disable the profile you will need the following code:

    ```python
    pr = cProfile.Profile()
    pr.enable()
    # ... do something in your code ...
    somefunctioncall()
    otherlogic()

    pr.disable()

    s = io.StringIO()
    sortby = SortKey.CUMULATIVE
    ps = pstats.Stats(pr, stream=s).sort_stats(sortby)
    ps.print_stats()
    print(s.getvalue())
    ```

    You can also write the console output to a file instead with the following:

    ```python
    ps.dump_stats('output.txt')
    ```

If you wanted to execute this via a Startup Command, instead of explicitly through code, you'd need to change your startup command to something like this:

- `python -m cProfile [-o output_file] [-s sort_order] yourscript.py`

### Reviewing the profile
If you're writing output to console, then see the **prerequisites** section. The `default_docker.log` will need to be reviewed (or logstream)

If writing explicitly to a file, you can install `cprofilev` locally and review the file output. Run `pip install cprofilev` (with a virtual environment activated) and then `cprofilev -f nameoffile.txt`

**Writing to console**:
- Output in `default_docker.log` (or logstream/log tailing) would look something like this:

```
2025-01-29T21:07:30.3650209Z          9713 function calls (9689 primitive calls) in 104.209 seconds
2025-01-29T21:07:30.3650889Z 
2025-01-29T21:07:30.3650925Z    Ordered by: cumulative time
2025-01-29T21:07:30.3650951Z 
2025-01-29T21:07:30.3650981Z    ncalls  tottime  percall  cumtime  percall filename:lineno(function)
2025-01-29T21:07:30.3651012Z         1   99.937   99.937  100.018  100.018 {built-in method time.sleep}
2025-01-29T21:07:30.3651045Z     32/20    4.187    0.131    4.154    0.208 {method 'acquire' of '_thread.lock' objects}
2025-01-29T21:07:30.3651076Z         4    0.000    0.000    4.041    1.010 /opt/python/3.12.2/lib/python3.12/threading.py:1115(join)
2025-01-29T21:07:30.3651148Z         4    0.000    0.000    4.041    1.010 /opt/python/3.12.2/lib/python3.12/threading.py:1153(_wait_for_tstate_lock)
2025-01-29T21:07:30.3651180Z       8/4    0.000    0.000    0.113    0.028 /opt/python/3.12.2/lib/python3.12/threading.py:973(start)
2025-01-29T21:07:30.3651209Z       8/4    0.000    0.000    0.113    0.028 /opt/python/3.12.2/lib/python3.12/threading.py:637(wait)
2025-01-29T21:07:30.3651237Z       8/4    0.000    0.000    0.112    0.028 /opt/python/3.12.2/lib/python3.12/threading.py:323(wait)
```

**Writing to a file - and reviewing with cprofilev**:
- Run `cprofilev -f nameoffile.txt` on your local machine with the profile file that was downloaded and then navigate to `127.0.0.1:4000`

![cprofilev output of cProfile file](/media/2025/01/python-profiling-1.png)

## pyinstrument
[pyinstrument](https://github.com/joerick/pyinstrument) is a library that can be installed and used to profile through code. To install it, run `pip install pyinstrument`. Ensure this is added to your `requirements.txt`. 

### Usage
After adding `pyinstrument` to `requirements.txt`, and ensuring its installed in the current virtual environment, you can use it in code much like how cProfile is used above.

1. Import the module in the relevant section of codebase:

    ```python
    from pyinstrument import Profiler
    ```

2. Add the profiler - start and stop it so that it's wrapped around the sections that need investigation:

    ```python
    profiler = Profiler()
    profiler.start()

    # code you want to profile

    profiler.stop()

    print(profiler.output_text(unicode=True, color=True))
    ```

3. This example assumes it's being sent to stdout - which will be viewable in log streaming or `default_docker.log`. Below is an example of output through `default_docker.log`

    ```log
    2025-01-30T15:18:31.025365035Z   _     ._   __/__   _ _  _  _ _/_   Recorded: 15:16:50  Samples:  3
    2025-01-30T15:18:31.025371436Z  /_//_/// /_\ / //_// / //_'/ //     Duration: 101.016   CPU time: 97.973
    2025-01-30T15:18:31.025376836Z /   _/                      v5.0.1
    2025-01-30T15:18:31.025382036Z 
    2025-01-30T15:18:31.025386936Z Profile at /tmp/8dd4140747cd842/app.py:39
    2025-01-30T15:18:31.025392037Z 
    2025-01-30T15:18:31.025396937Z [31m101.016[0m [48;5;24m[38;5;15mcpu[0m  [2mapp.py:36[0m
    2025-01-30T15:18:31.025402737Z └─ [31m100.005[0m sleep[0m  [2m<built-in>[0m
    2025-01-30T15:18:31.025408737Z 
    2025-01-30T15:18:31.025413637Z 
    ```

    > **NOTE**: Viewing output when profiling in a local terminal may show better printed results. The log file may not format it correctly

    You can alternatively return the response as HTML. Although this wouldn't be ideal in a public or production environment. This can be done with:

    ```python
    output_html = profiler.output_html()
    return output_html
    ```

    pyinstruments GitHub repository has [examples for specific frameworks](https://github.com/joerick/pyinstrument/tree/main/examples) like Flask and Falcon - for most other wSGI/aSGI-based applications, the above approach will work fine. If you want to use this with Django, add the following in your `MIDDLEWARE` array within `settings.py`:

    ```python
    MIDDLEWARE = [
        'django.middleware.security.SecurityMiddleware',
        #....Other middlewares
        "pyinstrument.middleware.ProfilerMiddleware",
    ]
    ```

## Others
Below are some other profilers that can be added through code.

### yappi
- [GitHub Repository](https://github.com/sumerc/yappi)

### palanteer 
- [GitHub Repository](https://github.com/dfeneyrou/palanteer)


# APM's
APM's refer to Application Performance Monitoring integrations. These are typical through third parties (aside from Azure Application Insights). Some of these may allow a "codeless" integration, or addtional configuration and usage through an SDK.

APM's typically include e2e observability, performance monitoring and metrics breakdown, resource usage, amongst much others.

These are some of the more common APMs/Observability integrations for Python:

1. [New Relic](https://docs.newrelic.com/docs/agents/python-agent/)
2. [AppDynamics](https://docs.appdynamics.com/appd/21.x/21.12/en/application-monitoring/install-app-server-agents/python-agent)
3. [Dynatrace](https://www.dynatrace.com/news/blog/a-practical-guide-to-monitoring-python-applications-with-dynatrace/)
4. [Scout](https://scoutapm.com/docs/python)
5. [Retrace](https://stackify.com/retrace-apm-python/)
6. [Datadog](https://docs.datadoghq.com/tracing/setup_overview/setup/python/?tab=containers)
7. [OpenTelemetry](https://opentelemetry.io/)



