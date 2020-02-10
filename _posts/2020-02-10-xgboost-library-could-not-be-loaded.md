---
title: " Azure App Service Linux - Python - XGBoost Library (libxgboost.so) could not be loaded"
author_name: Toan Nguyen
categories:
  - Python
  - Azure App Service on Linux
  - Configuration
  - How-To
date: 2020-01-23 12:50:06
tags:
header:
    teaser: /assets/images/pylinux.png
---
If you're attempting to run XGBoost on Azure App Service on Linux, you may receive the following error.

```bash
Traceback (most recent call last):
  File "app.py", line 1, in <module>
    import xgboost as xgb
  File "/opt/python/3.7.5/lib/python3.7/site-packages/xgboost/__init__.py", line 11, in <module>
    from .core import DMatrix, Booster
  File "/opt/python/3.7.5/lib/python3.7/site-packages/xgboost/core.py", line 161, in <module>
    _LIB = _load_lib()
  File "/opt/python/3.7.5/lib/python3.7/site-packages/xgboost/core.py", line 152, in _load_lib
    'Error message(s): {}\n'.format(os_error_list))
xgboost.core.XGBoostError: XGBoost Library (libxgboost.so) could not be loaded.
Likely causes:
  * OpenMP runtime is not installed (vcomp140.dll or libgomp-1.dll for Windows, libgomp.so for UNIX-like OSes)
  * You are running 32-bit Python on a 64-bit OS
Error message(s): ['libgomp.so.1: cannot open shared object file: No such file or directory', 'libgomp.so.1: cannot open shared object file: No such file or directory']

```

GCC will need to be installed using a custom startup script which is covered in my other article [Azure App Service Linux - Custom Startup Script for Nodejs & Python](/2020/01/23/custom-startup-for-nodejs-python).

## Modifying the Startup Script

Instead of using the example provided in step #3, use the following to install GCC.

```bash
apt-get update && apt-get install -y gcc
```

## Saving the Changes
In the Azure Portal configurations, add "/home/startup.sh" as the Startup Command and restart the site.
