---
title: "Gunicorn Update HTTP Headers on Azure App Service"
author_name: "Arjun Baliga"
tags:
    - Azure App Service
    - Python
    - HTTP Header
    - Hide Server Name
categories:
    - Azure App Service
    - Python

header:
   teaser: /assets/images/flask-logo.png
toc: true
toc_sticky: true
date: 2022-08-03 12:00:00
---
Please refer to the steps below on how to update Gunicorn HTTP headers as a Security best practice.<br>
Check the document below on exhaustive list of settings for Gunicorn.<br> Some settings are only able to be set from a configuration file.
https://docs.gunicorn.org/en/latest/settings.html<br/>

1. In the application root directory, create a file  config.py with the server configurations.<br>
```
import gunicorn
gunicorn.SERVER ="undisclosed"
```
>![Gunicron Config code](/media/2022/12/Gunicron_config_code.png)

 2.	In the Azure portal, within the Configurations tab, add the below start-up command. Restart the App Service.<br> 
 gunicorn -c config.py --bind=0.0.0.0 --timeout 600 app:app
>![Gunicorn start up command](/media/2022/12/Gunicorn_startup_command.png)

3. Verify that the HTTP header changes are reflected via the Browser Developer Tools. 
>![Gunicorn Hide Server Name](/media/2022/12/Gunicorn_check_server_name_hidden.png)
 
