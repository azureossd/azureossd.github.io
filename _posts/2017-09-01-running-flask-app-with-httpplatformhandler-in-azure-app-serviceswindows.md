---
title: " Running Flask App with HttpPlatformHandler in Azure App Services(Windows)"
tags:
  - Python
  - Flask
categories:
  - Azure App Service on Windows
  - Python
  - Flask
  - Configuration
date: 2017-09-01 11:13:32
author_name: Prashanth Madi
header:
    teaser: /assets/images/flask-logo.png
---

**Flask** is a micro web framework written in Python and based on the Werkzeug toolkit and Jinja2 template engine.

Below are list of steps we would follow

*   Create Sample Project
*   Create Azure WebApp and Use Site Extension to Upgrade Python
*   Create and Change Deployment script
*   Adding web.config (for production app with waitress)
*   Publish App

You can find a Sample Python Flask project with above operations @ [GitHub Link](https://github.com/prashanthmadi/azure-flask-httpplatformhandler)

## Create Sample Project in local environment

*   Create `index.py` file with below content

    from flask import Flask  
    app = Flask(__name__)
    
    @app.route("/")
    def hello():  
        return "Hello World!"
    
    if __name__ == "__main__":  
        app.run()
    

*   Create `requirements.txt` file with below content

    Flask==0.12  
    

*   Install dependencies listed in `requirements.txt` file using below command.

    pip install --upgrade -r requirements.txt  
    

*   Run app in local environment using below command

    $ python index.py 
     * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
    

*   Navigate to [http://127.0.0.1:5000/](http://127.0.0.1:5000/) and you should see app up and running 

## Create Azure WebApp and Use Site Extension to Upgrade Python

Navigate to [Azure portal](https://portal.azure.com/)

*   Create a new web app
*   [Setup Continuous Deployment](https://docs.microsoft.com/en-us/azure/app-service-web/app-service-continuous-deployment)
*   Navigate to your App Service blade, select Extensions and then Add.
*   From the list of extensions, scroll down until you spot the Python logos, then choose the version you need 

For this blog I'm choosing `Python 2.7.12 x64`, It would install new version of python @ D:\\home\\Python27 If you choose `Python 3.5.2 x64`, It would install new version of python @ D:\\home\\Python35

## Create and Change Deployment script

I have explained more on how to utilize deployment script and what it does @ [link](https://prmadi.com/azure-custom-deployment). you can use this script to run commands on Azure App Services after moving code to it. Install Azure Cli using below command

    npm install azure-cli -g
    

Use Below command to create deployment script.

    azure site deploymentscript --python
    

Above step would create below two files

*   .deployment
*   deploy.cmd

**Note: If you haven't used nodejs/npm earlier, Create above files manually and copy content for these files from [https://github.com/prashanthmadi/azure-flask-httpplatformhandler](https://github.com/prashanthmadi/azure-flask-httpplatformhandler)** Replace content of deploy.cmd file with content at [Link](https://github.com/prashanthmadi/azure-flask-httpplatformhandler/blob/master/deploy.cmd) We are changing default deployment script(removing virtual environment creation and others) and adding below content to install packages listed in requirements.txt

    :: 2. Install packages
    echo Pip install requirements.  
    D:\home\Python27\python.exe -m pip install --upgrade -r requirements.txt  
    IF !ERRORLEVEL! NEQ 0 goto error  
    

If you are using Python35 site extension change path from `D:\home\Python27\python.exe` to `D:\home\Python35\python.exe` in `deploy.sh`

    D:\home\Python35\python.exe -m pip install --upgrade -r requirements.txt  
    

## Adding web.config(Production Mode - Using Waitress)

[Waitress](http://docs.pylonsproject.org/projects/waitress/en/latest/) is meant to be a production-quality pure-Python WSGI server with very acceptable performance Create `web.config` file with below content

    <?xml version="1.0" encoding="UTF-8"?>  
    <configuration>  
     <system.webServer>
      <handlers>
       <add name="httpPlatformHandler" path="*" verb="*" 
             modules="httpPlatformHandler" resourceType="Unspecified" />
      </handlers>
    
      <httpPlatform processPath="D:\home\Python27\python.exe"
     arguments="run_waitress_server.py" requestTimeout="00:04:00" startupTimeLimit="120" startupRetryCount="3" stdoutLogEnabled="true">
       <environmentVariables>
        <environmentVariable name="PYTHONPATH" value="D:\home\site\wwwroot" />
        <environmentVariable name="PORT" value="%HTTP_PLATFORM_PORT%" />
       </environmentVariables>
      </httpPlatform>
     </system.webServer>
    </configuration>  
    

If you observe carefully, we have

*   httpplatform arguments section to run `run_waitress_server.py` file
*   Added new evnironmentVariable `PORT` to pass the internal port number we use in waitress

If you use Python35 site extension, change web.config content to use `D:\home\Python35\python.exe` for processPath

     <httpPlatform processPath="D:\home\Python35\python.exe"
     arguments="run_waitress_server.py" requestTimeout="00:04:00" startupTimeLimit="120" startupRetryCount="3" stdoutLogEnabled="true">
    

Add below line at the end in `requirements.txt` file. This would install waitress module during deployment

    waitress==1.0.1  
    

Create a new file `run_waitress_server.py` with below content

    import os  
    from waitress import serve  
    from index import app
    
    serve(app,host="0.0.0.0",port=os.environ["PORT"])  
    

## Publish App

Navigate to your root folder and commit your changes to `WEB_APP_GIT_URL`

    git init  
    git add .  
    git commit -m "initial commit"  
    git remote add sampleflaskapp WEB_APP_GIT_URL  
    git push sampleflaskapp master  
    

You can find a Sample Python Flask project with above operations @ [GitHub Link](https://github.com/prashanthmadi/azure-flask-httpplatformhandler)