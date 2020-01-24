---
title: " Profile Python Applications in Azure App Services"
tags:
  - Python
  - Flask
  - Django
categories:
  - Azure App Service
  - Python
  - Flask
  - Django
  - Debugging
date: 2017-09-01 11:15:27
author_name: Prashanth Madi
header:
    teaser: /assets/images/pythonlogo.png
---

Slow application performance issues tend to be challenging to troubleshoot regardless of the platform in which your application is running. This is due in great part to the sometimes random nature of these issues. These types of issues also often do not result in a specific error being logged.

If you think your Python application is running slow and takes more than few seconds to receive response. Below info may help you analyze where it's taking longer time and also checks for memory leaks If you are running Python App on Azure App Services(Windows). I would recommend to use HttpPlatform Handler instead of fastcgi. Follow my blogs below for details

*   [Django app with HttpPlatformHandler in Azure App Services (Windows)](https://prmadi.com/django-app-with-httpplatformhandler-in-azure-app-services-windows/)
*   [Running Flask app with HttpPlatformHandler in Azure App Services](https://prmadi.com/running-flask-app-with-httpplatformhandler-in-azure-app-services/)

## Django

**Sample Project:** I followed instructions in my Django blog listed above to deploy a sample app. Later I have added below two functions to calculate nth Fibonacci number. [Change Commit Info](https://github.com/prashanthmadi/azure-django-httphandler/commit/7654e83b659b11deb62fdce536bbe5c3009399b5)

    def fibnonci_normal(n):  
        if n == 0:
            return 0
        elif n == 1:
            return 1
        else:
            return fibnonci_normal(n - 1) + fibnonci_normal(n - 2)
    
    def fibnonci_easy(n):  
        return ((1 + sqrt(5))**n - (1 - sqrt(5))**n) / (2**n * sqrt(5))
    

As you can see below, each request takes longer with higher the number of query param. With below profilers we would try to find where our web app is spending its time and catch Fibonacci functions we included. 

1. [Pyinstrument](https://github.com/joerick/pyinstrument): _A Python profiler that records the call stack of the executing code, instead of just the final function in it_

*   Install Pyinstrument using pip and create a `profiles` folder in wwwroot. 
*   Add below two variables to settings.py

    PYINSTRUMENT_PROFILE_DIR = 'profiles'  
    PYINSTRUMENT_USE_SIGNAL = False  
    

*   Add `pyinstrument.middleware.ProfilerMiddleware` to MIDDLEWARE_CLASSES
*   There is a known issue in Pyinstrument while running in newer versions of Django. I have sent a [Pull request](https://github.com/joerick/pyinstrument/pull/28) that should fix this. Meanwhile make these changes manually in `D:\home\Python27\Lib\site-packages\pyinstrument\middleware.py` file

Above changes would write .html files in profiles folder which we created earlier in wwwroot folder.

Open .html files in your favorite browser and you should see something like below which should help you  

2. [Silk](https://github.com/django-silk/silk): _A live profiling and inspection tool for the Django framework. Silk intercepts and stores HTTP requests and database queries before presenting them in a user interface for further inspection._ Below is the sample screenshot of all the requests I had and time taken for each. None of my url's were interacting with database so queries show 0ms. If you click on a request, it would take you to individual request level details and with profiling enabled using decorators it would provide time spent at each function level. You can follow steps @ [https://github.com/django-silk/silk](https://github.com/django-silk/silk) to configure it. Their documentation is good and it was really easy. 

3. [django-dowser](https://github.com/munhitsu/django-dowser) : This is based on [dozer](https://github.com/mgedmin/dozer) that can be used directly with Django app, except that this module gives you option to filter based on number of objects ([issue](https://github.com/mgedmin/dozer/issues/2) tracking it). you might have to make little changes in original module and use below to install module instead of normal pip install from PyPl

    pip install git+git://github.com/munhitsu/django-dowser.git  
    

Other Approaches, I haven't tried and looks promising

*   [django-debug-toolbar](https://django-debug-toolbar.readthedocs.io/en/stable/#)
*   [pyringe](https://github.com/google/pyringe) (stale project but liked idea of attaching to process)
*   [objgraph](https://pypi.python.org/pypi/objgraph)
*   [Pympler](https://pythonhosted.org/Pympler/tutorials/muppy_tutorial.html)
*   [guppy](https://www.toofishes.net/blog/using-guppy-debug-django-memory-leaks/)

## Flask

[ProfilerMiddleware](http://werkzeug.pocoo.org/docs/0.12/contrib/profiler/): Simple WSGI profiler middleware for finding bottlenecks in Flask web application. Below is my sample Flask App using ProfilerMiddleware. It generates pstat files in profiles folder, later can be visualized using tools like [snakeviz](https://jiffyclub.github.io/snakeviz/), [runsnakerun](http://www.vrplumber.com/programming/runsnakerun/).

    from flask import Flask  
    from werkzeug.contrib.profiler import ProfilerMiddleware
    
    app = Flask(__name__)
    
    @app.route("/")
    def hello():  
        fibnonci_normal(10)
        return "Hello World!"
    
    def fibnonci_normal(n):  
        if n == 0:
            return 0
        elif n == 1:
            return 1
        else:
            return fibnonci_normal(n - 1) + fibnonci_normal(n - 2)
    
    app = ProfilerMiddleware(app,profile_dir="profiles")
    
    if __name__ == "__main__":  
        app.run()
    

If you remove profile_dir, it would write logs to STDOUT. Check their documentation on details for adding restrictions/sort data. Other Approaches, I haven't tried and looks promising

*   [flask-debugtoolbar](https://github.com/mgood/flask-debugtoolbar)
*   [dozer](https://github.com/mgedmin/dozer) (Works for Django too)