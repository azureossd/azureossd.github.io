---
title: "Troubleshooting 'failed to find attribute' errors on Python Linux App Services"
author_name: "Anthony Salemo"
tags:
    - Python
    - WSGI
    - Troubleshooting
    - Configuration
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Python # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/pylinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-01-30 00:00:00
---

In this post we'll cover troubleshooting "failed to find attribute 'app' in 'app'" based messages for Python on App Service Linux.

## Overview
`failed to find attribute 'app' in 'app'` is an error thrown back by Gunicorn letting us know it cannot find the `wsgi` or `asgi` callable that it expects to find in the code that you're deploying.

Although, this can be any combination of names (like 'test' in 'somefile'), as it's based on the reasons we cover later.

Python Blessed Images on App Service Linux use [Oryx](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#run) to run applications, by default. Therefor, the startup command, unless otherwise configured, is slightly opinionated on what it expects to run by default. 

Oryx uses the following logic to find this callable's file, which expects to be in the root of your project being deployed:

```
1. If user has specified a start script, run it.
2. Else, find a WSGI module and run with gunicorn.
    i. Look for and run a directory containing a wsgi.py file (for Django).
    ii. Look for the following files in the root of the repo and an app class within them (for Flask and other WSGI frameworks).
        - application.py
        - app.py
        - index.py
        - server.py
```

## What is a wsgi or asgi callable?
Taking Flask and an example, it is simply the following:

```python
app = Flask(__name__)
```

Per Flasks documentation:

_The flask object implements a WSGI application and acts as the central object. It is passed the name of the module or package of the application. Once it is created it will act as a central registry for the view functions, the URL rules, template configuration and much more._

Or, with FastAPI:

```python
app = FastAPI()
```

This is more or less the same for most wSGI-based (Flask, Django, Hug, Dash) and aSGI-based applications (FastAPI, Quart).

## Why does this happen?
As mentioned above, this is because Gunicorn cannot find the wSGI or aSGI callable. This means either:
- The callable is **not** named `app`
- The file in which the callable lives is **not** in the root of your project
- If relying on Oryx for the startup command, then your callable **file name** is not one of the following: `application.py`, `app.py`, `index.py` or `server.py` (in addition to points 1 and 2)

Oryx runs a Gunicorn command on startup that is generally like this:

```
gunicorn --bind 0.0.0.0 --timeout 600 --access-logfile '-' --error-logfile '-' app:app
```

The contributor to this error is the last entry in this particular command, which equates to:

```
gunicorn --bind 0.0.0.0 --timeout 600 --access-logfile '-' --error-logfile '-' <the_file_that_has_your_callable>:<your_callable_varialbe_name>
```

`app:app` would mean:
- `app.py` - in the current directory this is executing from (Left side of the colon (:))
- `app = SomeCallable()` - the variable name of the callable **within** `app.py` (Right side of the colon (:))

Take another example, for instance:

```
gunicorn --bind 0.0.0.0 --timeout 600 --access-logfile '-' --error-logfile '-' application:call
```

`application:call` would mean:
- `application.py` - in the current directory this is executing from (Left side of the colon (:))
- `call = SomeCallable()` - the variable name of the callable **within** `app.py` (Right side of the colon (:))

If your project was set up like this, it would surface as `Failed to find attribute 'app' in 'application'.`, or the following, if the file name doesn't match any of the ones Oryx expects:

```
No framework detected; using default app from /opt/defaultsite
Generating `gunicorn` command for 'application:app'
```

## Resolution
### If using Oryx-provided startup 
If you're relying on Oryx (which means **not** having a custom startup command), then ensure you're following the criteria covered above and within the [Oryx Python run detector documentation](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#run).

### If using a custom startup command
If you're using a custom startup command, or, needing to use one - such as if have a wSGI/aSGI file not in the root or in a nested folder, or a non-standard Oryx named file, ensure the startup command is updated appropriately.

#### Example - non-root directory 
Take the below file structure as an example.

```
| -- .gitignore
| -- README.md
| -- requirements.txt
| -- parentdir
    | -- app.py
```

This would obviously fail to run with Oryx's current logic. Therefor we'd have to update our Gunicorn startup command to the following:

```
gunicorn --bind 0.0.0.0 --timeout 600 --access-logfile '-' --error-logfile '-' --chdir parentdir app:app
```

This is changing the directory to run the callable under `parentdir` and then executing against `app.py`, assuming the callable itself is named `app`. 

#### Example - targetting different file and module names
Take the below file structure as an example.

```
| -- .gitignore
| -- README.md
| -- requirements.txt
| -- appservice.py
```

Where `appservice.py` contains the following callable based on Dash:

```
lib = dash.Dash(__name__, server=server, external_stylesheets=external_stylesheets)
```

This would need to have a custom startup command set to the following:

```
gunicorn --bind 0.0.0.0 --timeout 600 --access-logfile '-' --error-logfile '-' appservice:lib
```

#### Example - Django 
For Django specific examples and explanation on changing your command for either the callable file name or callable itself, see [here](https://azureossd.github.io/2022/02/20/Django-Deployment-on-App-Service-Linux/index.html#failed-to-find-attribute-application-in-somedjangoappwsgi).