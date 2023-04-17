---
title: "Python Deployment could not open shared object file: no such file or directory"
author_name: "Keegan D'Souza"
tags:
    - Python
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Python # Python, Java, PHP, Nodejs, Ruby, .NET Core
header:
    teaser: "/assets/images/pylinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.

# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-04-17 12:00:00
---

This post will cover troubleshooting a specific deployment startup message for python app services on Linux.

# Overview
When deploying your python application to a linux app service, you may encounter the below error message, or one similar on startup.

~~~
    /  _  \ __________ _________   ____  
   /  /_\  \\___   /  |  \_  __ \_/ __ \ 
  /    |    \/    /|  |  /|  | \/\  ___/ 
  \____|__  /_____ \____/ |__|    \___  >
         
  a p p   s e r v i c e   o n   l i n u x

  documentation: http://aka.ms/webapp-linux
  python 3.7.12
  note: any data outside '/home' is not persisted
  starting openbsd secure shell server: sshd.
  app command line not configured will attempt auto-detect
  starting periodic command scheduler: cron.
  launching oryx with: create-script -apppath /home/site/wwwroot -output /opt/startup startup.sh -virtualenvname antenv -defaultapp /opt/defaultsite
  found build manifest file at '/home/site/wwwroot/oryx-manifest.toml'. deserializing it...
  build operation id: |nr6yejtusqq.a76a26b0_
  oryx version: 0.2.20220308.4 commit: c92fa6a2d6fc14dc9646f80e2bb2e393a5cdc258 releasetagname: 20220308.4
  output is compressed. extracting it...
  extracting '/home/site/wwwroot/output.tar.gz' to directory '/tmp/8d9626ecb0528f4'...
  app path is set to '/tmp/8d9626ecb0528f4'
  detected an app based on flask
  generating `gunicorn` command for 'app:app'
  writing output script to '/opt/startup/startup.sh'
  using packages from virtual environment antenv located at /tmp/8d9626ecb0528f4/antenv.
  updated pythonpath to '/opt/startup/app_logs:/tmp/8d9626ecb0528f4/antenv/lib/python3.7/site-packages'
  [2023-02-15 01:06:36 +0000] [76] [info] starting gunicorn 20.1.0
  [2023-02-15 01:06:36 +0000] [76] [info] listening at: http://0.0.0.0:8000 (76)
  [2023-02-15 01:06:36 +0000] [76] [info] using worker: sync
  [2023-02-15 01:06:36 +0000] [81] [info] booting worker with pid: 81
  [2023-02-15 01:06:37 +0000] [81] [error] exception in worker process
  traceback (most recent call last):
    file "/opt/python/3.7.12/lib/python3.7/site-packages/gunicorn/arbiter.py" line 589 in spawn_worker
      worker.init_process()
    file "/opt/python/3.7.12/lib/python3.7/site-packages/gunicorn/workers/base.py" line 134 in init_process
      self.load_wsgi()
    file "/opt/python/3.7.12/lib/python3.7/site-packages/gunicorn/workers/base.py" line 146 in load_wsgi
      self.wsgi  self.app.wsgi()
    file "/opt/python/3.7.12/lib/python3.7/site-packages/gunicorn/app/base.py" line 67 in wsgi
      self.callable  self.load()
    file "/opt/python/3.7.12/lib/python3.7/site-packages/gunicorn/app/wsgiapp.py" line 58 in load
      return self.load_wsgiapp()
    file "/opt/python/3.7.12/lib/python3.7/site-packages/gunicorn/app/wsgiapp.py" line 48 in load_wsgiapp
      return util.import_app(self.app_uri)
    file "/opt/python/3.7.12/lib/python3.7/site-packages/gunicorn/util.py" line 359 in import_app
      mod  importlib.import_module(module)
    file "/opt/python/3.7.12/lib/python3.7/importlib/__init__.py" line 127 in import_module
      return _bootstrap._gcd_import(name[level:] package level)
    file "<frozen importlib._bootstrap>" line 1006 in _gcd_import
    file "<frozen importlib._bootstrap>" line 983 in _find_and_load
    file "<frozen importlib._bootstrap>" line 967 in _find_and_load_unlocked
    file "<frozen importlib._bootstrap>" line 677 in _load_unlocked
    file "<frozen importlib._bootstrap_external>" line 728 in exec_module
    file "<frozen importlib._bootstrap>" line 219 in _call_with_frames_removed
    file "/tmp/8d9626ecb0528f4/app.py" line 8 in <module>
      import cv2
    file "/tmp/8d9626ecb0528f4/antenv/lib/python3.7/site-packages/cv2/__init__.py" line 5 in <module>
      from .cv2 import *
  importerror: libgl.so.1: cannot open shared object file: no such file or directory
  [2023-02-15 01:06:37 +0000] [81] [info] worker exiting (pid: 81)
  ~~~

# Explanation and Solution
This will happen when a python dependency you are using requires a library not installed on app services python images.

The workaround for this would be to create an app service [startup script](https://azureossd.github.io/2020/01/23/custom-startup-for-nodejs-python/index.html) to install these libraries. 

# Custom Startup Script Steps:
 - First review your latest app service default docker log files and take note of the generated gunction command. 

   ![Gunicorn Startup Command](/media//2023/04/python-startup-cannot-open-shared-object-file-01.png)

   You can access your default docker log files by reviewing the following documentation: [Access Log Files](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#access-log-files)

 - Create a file named startup.sh, with the following file structure. 

    `#!/bin/sh`
    
    `apt update`

    `apt-get <required package names>`
    
    `<oryx generated gunicorn startup commands>`

    For example, here is an example for a startup script for all the xgboost libraries to work.
    ~~~bash
    #!/bin/sh

    apt update
    apt-get install -y libgl1 libglib2.0-0 libsm6 libxrender1 libxext6

    gunicorn app:app
    ~~~

    Once created make sure to upload this file anywhere under the */home* folder. You can also use the *bash* feature from the [Kudu New UI](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/new-kudu-ui-for-app-service-on-linux-preview/ba-p/3212270) to create this file directly using a text editor (vim / emacs). 
    ![Startup File](/media/2023/04/python-startup-cannot-open-shared-object-file-02.png)

# Most common packages / installation commands.
Below is a table of the most commam libraries currently missing and some of popular python packages currently reliant on them.

| Library              | Common Package              
| -------              | --------------              | 
|  libgl.so.1          | cv2                         | 
|  libgomp.so.1        | xgboost, numpy_pickly, dash |  
|  libtk8.6.so         | importlib                   | 





