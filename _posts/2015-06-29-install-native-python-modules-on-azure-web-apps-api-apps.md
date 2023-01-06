---
title: " Install Python Modules on Azure App Services"
tags:
  - APIAPP
  - azure
  - pycrypto
  - python
  - Python-Wheel
  - WAWS
  - Web Apps
categories:
  - Python
  - How-To
date: 2015-06-29 21:44:00
author_name: Prashanth Madi
---

Installing Python packages in Azure App Services is little tricky using pip. In this blog, I would provide best practice to do that.

Pip Install on Azure App Services might fail because

-   It may simply be that the package is not available on the Python Package Index.
-   It could be that a compiler is missing (Azure App Service is a sandbox environment and does not have all the modules/compilers installed inside it).

Below is one such common scenario

    building 'Crypto.Random.OSRNG.winrandom' extension  
    warning: GMP or MPIR library not found; Not building Crypto.PublicKey._fastmath.  
    error: Microsoft Visual C++ 9.0 is required (Unable to find vcvarsall.bat). Get it from https://aka.ms/vcpython27  

It's recommend to use [wheels](http://pythonwheels.com/) for installing Python dependencies. Many of the popular modules already provide wheel files listed in PyPI.

Let's say if I want to install below list of Python modules

    django<2  
    pycrypto==2.6.1  
    pandas==0.18.1  
    numpy==1.11.1  

#### Creating Wheel Files in Local Environment 

I'm using `Python 3.5.2 x64` for this blog. So i will create wheel files for Python35 x64.

*Note : You don't have to create wheels for all the Python modules. Do this only for modules which have trouble installing in Azure App Services*

-   I have `python35 x64` installed in my local environment @ C:\\Python35 folder
-   Create a **requirements.txt** file and add above modules inside it.
-   Install **wheel** module using below command (we would use this module to create wheels later)

<!-- -->

    > C:\Python35\python.exe -m pip install wheel

-   Use Below Command to create wheel files inside wheelhouse folder in Local environment

<!-- -->

    > C:\Python35\python.exe -m pip wheel -r requirements.txt -w wheelhouse

Above step would have created a **wheelhouse** folder with wheel files for modules listed in requirements.txt file (In my cases it created wheel files for Python35 arch as you can see in file names)\
\
![Creating Wheel Files](/media/2016/12/webjob4.PNG)

-   Alternatively, You can also Download wheel files available online @ <http://www.lfd.uci.edu/~gohlke/pythonlibs/>

#### Upgrade Python version on Web Apps 

Default Python/Pip versions on Azure Web Apps are little old (as of 01/17 -This might change in future). Older version of Python/Pip have few known issues during deployment/run-time.

Follow Below steps to update Python version on your web app.

-   Navigate to [Azure portal](https://portal.azure.com/)
-   Click on App Service blade of Web App, select Extensions and then Add.
-   From the list of extensions, scroll down until you spot the Python logos, then choose the version you need\
    ![Site Extension](/media/2016/11/siteextensions.png)

For this blog I'm choosing `Python 3.5.2 x64`, It would install new version of python @ D:\\home\\Python35

#### Install requirements on Azure App Services 

-   While moving your code to Azure App services make sure to include below line of code as first line in requirements.txt file

<!-- -->

    --find-links wheelhouse

![find links in requirements.txt](/media/2016/12/webjob5.PNG)

##### Install Manually using Kudu 

-   Navigate to kudu console of your app ([https://`Your_app_name`.scm.azurewebsites.net/DebugConsole](https://%3Ccode%3EYour_app_name%3C/code%3E.scm.azurewebsites.net/DebugConsole))
-   Navigate to the folder where you have **requirements.txt** file and run bellow command

<!-- -->

    > D:\home\Python35\python.exe -m pip install --upgrade -r requirements.txt

-   After running above command, all the Python modules listed in **requirements.txt** file would be installed @ `D:\home\Python35\Lib\` folder

You might have different path for python.exe depending on python version you are using.

##### Install using Deployment Script 

If you are using Deployment script, Include below line of code in deploy.cmd

    :: 2. Install packages
    echo Pip install requirements.  
    D:\home\Python35\python.exe -m pip install --upgrade -r requirements.txt  
    IF !ERRORLEVEL! NEQ 0 goto error  

For more details refer [Django app with HttpPlatformHandler in Azure App Services - Windows](/django-app-with-httpplatformhandler-in-azure-app-services-windows/)

##### Install modules in non-default folder 

As I have mentioned earlier, running above command would install modules\
\
@ `D:\home\Python35\Lib\` folder.

-   Use -t option to install dependencies in non-default folder

<!-- -->

    D:\home\Python35\python.exe -m pip install --upgrade -r requirements.txt -t D:\home\site\wwwroot\pymodules  

Above Command would install Python modules @ `D:\home\site\wwwroot\pymodules` folder

-   Set PYTHONPATH in App settings at Azure portal for web app

I have seen few wheel files/Python modules having trouble installing with older version of Pip/Python. Try with newer version's of Python/pip if you have any issues.

