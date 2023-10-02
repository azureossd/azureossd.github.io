---
title: "Container Apps: Profiling Python applications for performance issues"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Troubleshooting
    - Configuration
    - Container Apps
    - Python
categories:
    - Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Troubleshooting
    - Python
header:
    teaser: "/assets/images/azure-containerapps-logo-1.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-10-02 12:00:00
---
This post will cover using troubleshooting tools to help profile performance issues on Container Apps with Python applications.

# Overview
Sometimes, applications may encounter issues due to poor performance - either high CPU usage, high memory (or out of memory), generally slow performance due to code execution logic, or others.

In these scenarios, if it's been determined this _is_ likely an application problem, you can use troubleshooting tooling to profile or take dumps of the application.

This post will explain how to view or download profile/dump files - and show a few libraries that can be used to help with CPU and/or memory profiling/dumps.

Note, that this post does not cover any specific web framework or web library in terms of Python Web-based applications. The packages discussed in this post are in terms of generalized usage.

# Important Prerequisites
Some **important** prerequisites is to be able to:
- Being able to connect to the container through the **Console** blade or use the [`az containerapp exec`](https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest#az-containerapp-exec) command. See console documentation [here](https://learn.microsoft.com/en-us/azure/container-apps/container-console?tabs=bash)
- Able to download files from the container

There is no out-of-the-box method to profile/generate a dump for an application container on Container Apps. To understand if there is application slowness, either due to high CPU, high memory, dependency problems, or other reasons - a profiler typically specific to the language/runtime you're using should be used.

In the case of Python - most profilers are installed as packages and used through code. This should be validated and tested locally to ensure this works before testing on Container Apps.

## Console access
You can use either the Azure CLI or the portal for console access. Below is what portal access would look like:

![Console access from portal](/media/2023/08/aca-java-ts-1.png)

These commands for capturing profiles and dumps require access to a terminal - so console access is required.

## Download files from the container
You'll need a way to download files from the container. By default, there is no way to get files generated at runtime by a container in Container Apps without some additional configuration.

The most simplistic way is to mount a volume from an Azure File Share with an Azure Storage Account.

For a quickstart on how to add a volume, follow [Use storage mounts in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?pivots=azure-portal)

**NOTE**: It is advised to add this mount _before_ testing or generating files. If you do this _after_ testing (and in single revision mode, for instance) then a new pod will be created and previous files would be lost.

You can validate that the volume is mounted with the `df -h` command:

![Storage volume check](/media/2023/08/aca-java-ts-2.png)

# Determining high CPU or memory
## Diagnose and Solve problems
You can use the following detectors in the **Diagnose and Solve Problems** blade to diagnose these issues:
- **Container App Memory Usage**
- **Container App CPU usage**

## Metrics blade
You can use the following metric breakdowns in the **Metrics** blade to diagnose these issues:
- **CPU usage**
- **Memory Working Set Bytes**
- **Reserved Cores**
- **Total Reserved Cores**

## cgroupv2 change
See this GitHub issue - [Mitigate Potential Memory Pressure Effects With cgroup v2](https://github.com/microsoft/azure-container-apps/issues/724) - With the change for cgroupv2 from cgroupv1 can introduce unexpected memory management issues for applications. 

# Generating dumps or profiling
## Best practices
When taking a heap dump, thread dump, or profiling - it is recommended to take a few of these while reproducing the issue for consistent data.

Taking only (1) may show data that is ultimately not relevant - taking multiple of these will show a more consistent theme in terms of what the problem may be - and would be easier to troubleshoot.

There are times when taking multiple dumps/profiles, you may notice one has a variation of data - if this happened to be the one dump/profile you took (if only taking one total), this can cause the investigation to go down the wrong path.

> **NOTE**: When profiling an application, there is the chance this creates further negative performance impact (while profiling is occurring). This should be noted, especially for production environments. 

## High CPU
### cProfile
[cProfile](https://docs.python.org/3/library/profile.html) is a C-based profiler a part of the Python standard library. No external packages are needed.

If you have identified some specific functions, chunk of code or routes where the problem can be, you can run the profiler to those targeted functions instead of run the profiler in the whole script.

> **NOTE**: If you _don't_ have an idea as to what may be causing slowness/high CPU usage, then this may not be an entirely good option.

To use this package, do the following:

1. Import the libraries:

```python
import cProfile, pstats, io
from pstats import SortKey
```

2. Select the function/method or route that you think it is taking more CPU time. To enable/disable the profile you will need the following code:

```python
pr = cProfile.Profile()
pr.enable()
# ... do something in your code ...
result = firstMethod()

pr.disable()

s = io.StringIO()
sortby = SortKey.CUMULATIVE
ps = pstats.Stats(pr, stream=s).sort_stats(sortby)
ps.dump_stats("/path/to/volume/profiles/profile.txt")
```

3. Use the `ps.dump_stats()` function to point this to where your mounted volume path is to save and persist your profiling data. You can later download this from the Azure File Share to review.

An example of the output from this profiler is the below:

```
Thu Sep 28 15:04:27 2023    profile.txt

         13530 function calls (2 primitive calls) in 0.004 seconds

   Ordered by: cumulative time

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
  13529/1    0.004    0.000    0.004    0.004 /app/app.py:21(fibonacci)
        1    0.000    0.000    0.000    0.000 {method 'disable' of '_lsprof.Profiler' objects}
```

#### Using cprofilev to view file output
If you try to directly open the profile file - it will likely not display properly. Instead, you can use this `cprofilev` to view this in a browser.

1. Install the library with `pip install cprofilev`
2. Run the command against the profile file - eg., `cprofilev -f profile.txt`
3. This will now listen at `http://127.0.0.1:4000`. Open a tab to that address on your local machine - this should look something like the following:

![cprofilev output](/media/2023/09/aca-py-profile-1.png)

For definitions on `ncalls`, `percall`, and others - view [Instant User’s Manual](https://docs.python.org/3/library/profile.html#instant-user-s-manual)

#### cProfile analysis

In order to review a cProfile output, you will need to understand the structure of the output:

- **function calls in time** - The first line indicates the number of calls that were monitored. How many calls were **primitive**, meaning that the call was not induced via recursion and the time in seconds.
- **ordered by** - If you don't specify any parameter it will take the **standard name**.

Then you will find several columns:

- **ncalls**. Number of calls for that specific line of code.
- **tottime**. Total time spent in the function (and excluding the time made in calls to sub-functions)
- **percall**. This is the result of dividing tottime by ncalls.
- **cumtime**. Cumulative time spent in this and all subfunctions (from invocation till exit)
- **percall**. This is the result of dividing cumtime by primitive calls.
- **filename:lineno(function)** - Data of each function profiled.

### pyinstrument
[pyinstrument](https://github.com/joerick/pyinstrument) is a profiler focused on showing the callstack from script execution. You can generally either print the output of the profile to `stdout`/console - or - render this into an `.html` file.

To view how pyinstrument works in terms of profiling, review the [how it works](https://pyinstrument.readthedocs.io/en/latest/how-it-works.html) section.

**NOTE**: If deciding to render this into an `.html` file for viewing and this is on Container Apps - this could pose security risks, depending on the logic of your application. [Considering locking down application traffic to well-known traffic](https://learn.microsoft.com/en-us/azure/container-apps/firewall-integration), if the Container App Environment is in a VNET.

1. To install this library run the following:

```shell
pip install pyinstrument 
```

2. Import the package as seen below:

```python
from pyinstrument import Profiler
```

3. To profile your code, use the following methods imported from `profiler`. The below example uses Flask - consult the [User Guide](https://pyinstrument.readthedocs.io/en/latest/guide.html) for more specific usage with Flask and other frameworks:

```python
from pyinstrument import Profiler 
profiler = Profiler() 

@route('/')
def index():
    profiler.start() 
    # ... defined chunk of code to profile ...
    # ... defined chunk of code to profile ...
    profiler.stop()
    print(profiler.output_text(unicode=True, color=True))
    return jsonify({"message": "Running Fibonacci sequence.."})
```

Depending on the logic being profiled, application would generally look something like the below:

```python
2023-09-29T17:29:05.610219985Z   _     ._   __/__   _ _  _  _ _/_   Recorded: 17:29:05  Samples:  3
2023-09-29T17:29:05.610229984Z  /_//_/// /_\ / //_// / //_'/ //     Duration: 0.004     CPU time: 0.004
2023-09-29T17:29:05.610257656Z /   _/                      v4.5.3
2023-09-29T17:29:05.610264369Z 
2023-09-29T17:29:05.610270941Z Program: /usr/local/bin/gunicorn -b 0.0.0.0:8000 app:app --timeout 600 --access-logfile - --error-logfile -
2023-09-29T17:29:05.610276241Z 
2023-09-29T17:29:05.610281300Z 0.003 fib_console  app.py:11
2023-09-29T17:29:05.610286540Z └─ 0.003 fibonacci  app.py:16
2023-09-29T17:29:05.610291720Z    └─ 0.003 fibonacci  app.py:16
2023-09-29T17:29:05.610296609Z       └─ 0.003 fibonacci  app.py:16
2023-09-29T17:29:05.610302430Z          └─ 0.003 fibonacci  app.py:16
2023-09-29T17:29:05.610308010Z             └─ 0.003 fibonacci  app.py:16
2023-09-29T17:29:05.610313641Z                └─ 0.003 fibonacci  app.py:16
2023-09-29T17:29:05.610318981Z                   └─ 0.003 fibonacci  app.py:16
2023-09-29T17:29:05.610324081Z                      └─ 0.003 fibonacci  app.py:16
2023-09-29T17:29:05.610329451Z                         └─ 0.003 fibonacci  app.py:16
2023-09-29T17:29:05.610335392Z                            └─ 0.003 fibonacci  app.py:16
2023-09-29T17:29:05.610341283Z                               └─ 0.003 fibonacci  app.py:16
2023-09-29T17:29:05.610346633Z                                  └─ 0.003 fibonacci  app.py:16
2023-09-29T17:29:05.610351853Z                                     ├─ 0.002 fibonacci  app.py:16
2023-09-29T17:29:05.610357574Z                                     │  ├─ 0.001 fibonacci  app.py:16
2023-09-29T17:29:05.610362723Z                                     │  └─ 0.001 [self]  app.py
2023-09-29T17:29:05.610367562Z                                     └─ 0.001 [self]  app.py
```

If you instead want to render this into an `.html` page, you'll need to change your code to the below - for web frameworks, like Django, Flask, and others - the return value of the function would need to be the `.html` page being rendered:

> This snippet is using Flask
```python
profiler.stop()
p = profiler.output_html("profile.html")
return p
```

The output would look like this:

![pyinstrument html render](/media/2023/09/aca-py-profile-2.png)

Examples of using pyinstrument with various web frameworks can be found in the [User Guide](https://pyinstrument.readthedocs.io/en/latest/guide.html):
- [Django and pyinstrument](https://pyinstrument.readthedocs.io/en/latest/guide.html#profile-a-web-request-in-django)
- [Flask and pyinstrument](https://pyinstrument.readthedocs.io/en/latest/guide.html#profile-a-web-request-in-flask)
- [FastAPI and pyinstrument](https://pyinstrument.readthedocs.io/en/latest/guide.html#profile-a-web-request-in-fastapi)
- [Falcon and pyinstrument](https://pyinstrument.readthedocs.io/en/latest/guide.html#profile-a-web-request-in-falcon)

#### Analyzing pyinstrument output
Some notable output from pyinstrument is as follows:
- **Duration**: Time it took to profile the program - eg., 0.004     
- **CPU time**: CPU time spent with the program - 0.004
- **Program**: The executable that started the program - eg., `/usr/local/bin/gunicorn -b 0.0.0.0:8000 app:app --timeout 600 --access-logfile - --error-logfile -`

```python
0.003 fib_console  app.py:11
└─ 0.003 fibonacci  app.py:16
    └─ 0.003 fibonacci  app.py:16
```

The first row (0.003), indicates time spent on that particular function. This is followed by the function name, and then the location of the function in reference to source code. The above example points to functions named `fib_console` in `app.py` on line 11 and `finbonacci` in `app.py` on line 16.

For a good walkthrough of pyinstrument and interpreting the output, review [calmcode.io - pyinstrument: scripts](https://calmcode.io/pyinstrument/scripts.html)

### Other profilers
Below is a list of other potential profilers to use, that were not covered more specifically above.

- [yappi](https://github.com/sumerc/yappi)
- [palanteer](https://github.com/dfeneyrou/palanteer)
- [py-spy](https://github.com/benfred/py-spy)
- [vprof](https://github.com/nvdv/vprof)

## High Memory
### tracemalloc
[tracemalloc](https://docs.python.org/3/library/tracemalloc.html), like cProfile, is a part of the python standard library.

From the tracemalloc documentation:

_The tracemalloc module is a debug tool to trace memory blocks allocated by Python. It provides the following information:_

- _Traceback where an object was allocated_
- _Statistics on allocated memory blocks per filename and per line number: total size, number and average size of allocated memory blocks_
- _Compute the differences between two snapshots to detect memory leaks_


1. To use tracemalloc, import the package:

```python
import tracemalloc
```

2. Then add code for it - this example takes a snapshot of memory used and uses a loop to output the top 10 consumers of memory. Use `tracemalloc` in the parts of your program that is potentially causing memory issues. 

```python
@app.route("/mem")
def fib():
    tracemalloc.start() 

    for i in range(100):
        o = [0] * i

    snapshot = tracemalloc.take_snapshot()
    top_stats = snapshot.statistics('lineno')
    print("[ Top 10 ]") 
    for stat in top_stats[:10]:
        print(stat)

    return jsonify({"message": "Allocating memory.."})
```

Basic output from this would look like:

```
[ Top 10 ]
/app/app.py:39: size=792 B, count=1, average=792 B
/app/app.py:41: size=416 B, count=1, average=416 B
```

You can additionally use the `display_top` (pretty top) function [here](https://docs.python.org/3/library/tracemalloc.html#pretty-top) to try and pretty-print the output, which would look like the below - note, that this output will vastly differ based on your application and logic:

```
 Top 10 lines
 #1: /usr/local/lib/python3.10/linecache.py:137: 337.2 KiB
     lines = fp.readlines()
 #2: /usr/local/lib/python3.10/tracemalloc.py:67: 14.6 KiB
     return (self.size, self.count, self.traceback)
 #3: /usr/local/lib/python3.10/tracemalloc.py:193: 11.6 KiB
     self._frames = tuple(reversed(frames))
 #4: /usr/local/lib/python3.10/abc.py:123: 2.7 KiB
     return _abc_subclasscheck(cls, subclass)
 #5: /usr/local/lib/python3.10/site-packages/werkzeug/routing/matcher.py:116: 2.4 KiB
     rv = _match(state.static[part], parts[1:], values)
 #6: /usr/local/lib/python3.10/site-packages/gunicorn/http/wsgi.py:154: 2.2 KiB
     environ['REMOTE_PORT'] = str(client[1])
 #7: /usr/local/lib/python3.10/site-packages/gunicorn/http/message.py:106: 1.8 KiB
     value = ''.join(value).rstrip()
 #8: /usr/local/lib/python3.10/site-packages/gunicorn/http/wsgi.py:136: 1.8 KiB
     key = 'HTTP_' + hdr_name.replace('-', '_')
 #9: /usr/local/lib/python3.10/site-packages/gunicorn/http/message.py:92: 1.6 KiB
     name = name.upper()
 #10: /usr/local/lib/python3.10/tracemalloc.py:558: 1.4 KiB
     traces = _get_traces()
 242 other: 84.2 KiB
 Total allocated size: 461.5 KiB
```

In the "pretty printed" method, we can see a more specific function call location - including file and line number. This includes memory used per-function displayed in more human readable format.

So far, all of the above writes to the console/`stdout`. If you wanted to write to a specific file, use the `snapshot.dump` method.

```python
snapshot.dump("/app/profiles/snap.out")
```

To be able to download this for later viewing, make sure that the path specified in `dump()` is pointing to a mounted volume path as described earlier in this blog post.

### memray 
[memray](https://github.com/bloomberg/memray) is a Python memory profiler developed by Bloomberg. This library can track memory allocations in Python-based code as well as native code (C/C++), which can help with certain Python libraries that rely on native code or modules.

> **NOTE**: memray does not work directly on windows, but will work in containerized or WSL2 environments on Windows. See below on ways to view generated output.

1. Install the library:

```python
pip install memray
```

2. You can directly invoke `memray` in your startup command for consistent profiling.

    - 2a - **Using this on an application using a wSGI server like gunicorn**:

   ```
    memray run --follow-fork -o /app/profiles/profile.bin -m gunicorn app:app -b 0.0.0.0:8000 --timeout 600 --access-logfile "-" --error-logfile "-"
   ```

   - `--follow-fork` follows forked/children processes to track memory allocation. This is needed in gunicorn usage where there is a master process and then potential multiple workers. See [How to use memray with Gunicorn and Django? #56](https://github.com/bloomberg/memray/discussions/56)

   - 2b - **Using this directly against a `.py` file**:

   ```
   memray run -o /app/profiles/profile.bin -m python app.py
   ```

**Writing to a file or location**:

The `-o` flag is used to tell memray where to write the profile files to. Note, specifying a name like `profile.bin` will potentially generate a new profile roughly every x seconds with a new file depending on the application load and how fast the files fill up in size. Eg., `profile.bin`, `profile.bin.9`, `profile.bin.18`. These are all readable profile files.

In certain cases, many profile files may be generated. Using something like [Azure Storage Explorer](https://azure.microsoft.com/en-us/products/storage/storage-explorer/) may be good to manage these profile files.

> **NOTE**: If you try to write to an already existing file (such as when restarting an app but `someprofile.bin` already exists, it will throw `Could not create output file /some/path/profile.bin: File exists` - **this will cause the container to crash** - take care that prior profiles are deleted upon restarting if not using unique naming.

To get around the issue of potential container crashes - in your `ENTRYPOINT` or a custom startup script - use an approach like the following approach:

```bash
PROFILE_FILE=$(date "+%d-%b-%Y-%H:%M")-profile.bin

memray run --follow-fork -o /app/profiles/$PROFILE_FILE -m gunicorn app:app -b 0.0.0.0:8000 --timeout 600 --access-logfile "-" --error-logfile "-"
# or memray run -o /app/profiles/$PROFILE_FILE -m python app.py
```
`$PROFILE_FILE` will create a profile file in the format of `dd-mm-yy-mm:hh.profile.bin` - to keep the file generally unique in name.

#### Analyzing output
**IMPORTANT**: memray does _not_ work on Windows. If testing in a containerized or WSL2 based environment - run a container with a mount option from your local machine - (ex., `docker run -d -p 8000:8000 -v "%cd%"\profiles:/app/profiles container-apps-python-profilers-memray:latest`) - in the container you can generate the below reports to view as tabular or `.html` format.

##### memray summary
`memray summary [profile_file.bin]` provides a nice tabular and easy to read output when ran against a profile file. Below is an example - we can see that function calls (highlighted) `make_two_arrays()` at `/app/app.py` and the numpy method `np.ones` is allocating and using the most out of the ones in this output. 

![memray summary output](/media/2023/09/aca-py-profile-3.png)

For more documentation on summary reporter usage, see [memray - summary reporter](https://bloomberg.github.io/memray/summary.html).

##### memray flamegraph
You can generate a flamegraph with the `memray flamegraph [profile_file.bin]` command. This will create an `.html` file in the name of `meray-flamegraph-[nameofprofilefile].bin.html`. You can then view this locally in your browser or through a IDE browser extension.

![memray summary output](/media/2023/09/aca-py-profile-4.png)

You can click on the top portion of the page which represents heap and RSS size at the time of profiling. This will open a modal with a more defined with:

![memray summary output](/media/2023/09/aca-py-profile-5.png)

For more documentation on memray flamegraph usage and how to interpret the flamegraph, see [memray - flamegraph](https://bloomberg.github.io/memray/flamegraph.html).

### Other memory profile tooling
- [guppy3](https://github.com/zhuyifei1999/guppy3)
- [pympler](https://github.com/pympler/pympler)
- [scalene](https://github.com/plasma-umass/scalene)
- [mempry_profiler](https://github.com/pythonprofilers/memory_profiler) (deprecated, but has easy to read tabular output)

# Application Performance Monitoring tools (APM's) and Observability

There are third-party tools that can also be used - the majority of these tools are not free, but the advantage can be huge, since these tools are specifically designed to gather extra information and present it in an understandable way for memory, cpu, and other scenarios.

You can find the most common APMs for Python:

1. [New Relic](https://docs.newrelic.com/docs/agents/python-agent/)
2. [AppDynamics](https://docs.appdynamics.com/appd/21.x/21.12/en/application-monitoring/install-app-server-agents/python-agent)
3. [Dynatrace](https://www.dynatrace.com/news/blog/a-practical-guide-to-monitoring-python-applications-with-dynatrace/)
4. [Scout](https://scoutapm.com/docs/python)
5. [Retrace](https://stackify.com/retrace-apm-python/)
6. [Datadog](https://docs.datadoghq.com/tracing/setup_overview/setup/python/?tab=containers)
7. [OpenTelemetry](https://opentelemetry.io/)