---
title: "Python Function App - Processing Multiple requests"
author_name: "Umang Francis"
tags:
    - python function app
    - process multiple requests
    - FUNCTIONS_WORKER_PROCESS_COUNT
    - PYTHON_THREADPOOL_THREAD_COUNT
categories:
    - Azure Function App #Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Python # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - How-To, Performance, Configuration #How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/pyfunction.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: false
toc_sticky: false
date: 2021-03-11 13:00:00
---

## About

As we know, Python is a single-threaded, synchronous language by default. Hence unless specified, multiple calls to your Python Function App would be executed one after the other. Based on the default behavior of the language, this is an expected behavior. Although, we have different approaches in place to make sure that you are able to run multiple requests to your Function App together. In this article, we look into the possible ways of doing so along with a few examples..

## Async

As mentioned before, Python has been a synchronous language for a long time, until quite recently when async programming became the new buzz and eventually Python adopted it too. Thus you can say that there are two ways of programming your application - either the synchronous or asynchronous way, with different libraries and calling styles but sharing the same syntax and variable definitions.

Using your Python Function App in the async way can help in executing multiple requests in parallel - which get executed together in the event loop, instead of being handled by individual threads.

The following example will demonstrate how:

```Python

    import logging
    import asyncio
    import azure.functions as func
    async def main(req: func.HttpRequest) -> func.HttpResponse:
        logging.info('Python HTTP trigger function processed a request')
        await asyncio.sleep(8)
        # time.sleep(8)
        return func.HttpResponse("Hello World")

```

In the above example, you can notice that apart from the logging statements and the variable definitions, there is a sleep statement - called in the async way. This would make all requests to this function wait for 8 seconds before executing the rest of the script. Although if you uncomment and execute the normal synchronous <b>time.sleep()</b> function, it will essentially make your application synchronous and hence you would not see the requests getting executed in parallel.

Thus the key take away here is to make sure that all pieces of code within your async function are executed in the async way as well. This approach of parellel execution using async can help with faster processing of I/O bound applications.

You can execute a test to check parallel execution of requests using a tool like [Apache JMeter](https://jmeter.apache.org) - which would be able to send multiple requests together and display the time taken and response obtained for those requests. Refer the following image:

![Reviewing responses in Apache JMeter](/media/2021/03/pyfa-multiprocessing-01.png)

## FUNCTIONS_WORKER_PROCESS_COUNT

When we create a Python Function App, we get one Python language worker by default to serve the incoming requests - which as you can imagine, might not be suited for parallel execution of your requests. Thus, you can use the Application Setting: <i><b>FUNCTIONS_WORKER_PROCESS_COUNT</b></i> and increase the number of Python workers serving your requests to a maximum of 10. Thus, when you increase the worker process count value, you would be able to see 10 Python processes running on the SSH session-  something similar to:

![Multiple Python workers spawning up in SSH - top command](/media/2021/03/pyfa-multiprocessing-02.png)

These 10 Python workers would in turn be running individual Function Hosts and thus, at a time 10 max requests can be processed by your function. Although, it might happen that a Function Host is restarting on a worker and the incoming 10 requests might be distributed among the working hosts in a round robin way. Hence it is not always that you would see 10 parallel responses to 10 parallel requests. It highly depends on whether the host was serving a request on the worker in the background.

Similar to the above WorkBench example, you can test the parallel execution for 10 requests using a single Python worker and by using 10 workers - to compare the performance.

Again, the concurrent execution of these requests can be bounded by the resource utilization each request needs and it would be necessary for the developer/user to keep the same in check before increasing the worker count.

## PYTHON_THREADPOOL_THREAD_COUNT

Each of the above mentioned language workers would be running a single thread by default. We can increase this thread value to a maximum of <b>32</b> using the application setting: <i><b>PYTHON_THREADPOOL_THREAD_COUNT</b></i>. Thus, with multiple language workers and multiple threads running within them, one can achieve a great level of concurrency.

A simple test - try executing 50 parallel requests using one worker and 32 threads. Then 2 workers and 32 threads. You will notice that in the first case, around  32 requests will get processed together and the remaining would process after that. While in the second test, all requests would get processed together.

Although, a very important point to note here is that there can be some part of your code that can hinder parallel execution of multiple threads. For example, reading data from a single file - only one thread might be able to read from a single file at a time. Hence as a developer, you might need to check the bottlenecks in your application code.

## CONCLUSION

The above points should help you in getting started with concurrent request execution for a Python Function App specifically. Ofcourse, as a developer you would need to play around with all these settings to understand what is best suited for your app.

- [Improve throughput performance of Python apps in Azure Functions](https://docs.microsoft.com/en-us/dotnet/core/diagnostics/dotnet-trace)
- [App settings reference for Azure Functions](https://docs.microsoft.com/en-us/visualstudio/profiling/cpu-usage?view=vs-2019)
