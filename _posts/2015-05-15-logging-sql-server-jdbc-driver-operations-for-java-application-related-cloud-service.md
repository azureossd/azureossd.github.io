---
title: "Logging SQL Server JDBC driver operations for Java application related cloud service"
tags:
  - azure
  - Cloud
  - Java
  - JDBC
  - Log
  - SQL
  - SQL Server
categories:
  - Java
  - Debugging
date: 2015-05-15 08:51:00
author_name: Prasad K.
---

To enable the logging of JDBC driver, please follow these steps -

1\. Select your cloud service on Azure portal and open the Instances tab.

2\. Select the instance and click on the connect button to initiate the remote desktop session.

[![](/media/2019/03/6318.Connect%20to%20VM.jpg)](/media/2019/03/6318.Connect%20to%20VM.jpg)

3\. You can use the existing logging.properties file from default location or you can create a new one and use it for logging.

**Using the existing default logging.properties file -**

1\. Once you log in to your virtual machine, open the file explorer and traverse to JRE/lib in your environment.

2\. You should find the logging.properties file. Just open it and edit it according to your logging needs. Sample properties file shown below.

**Using your own logging.properties file -**

1\. Create a new logging.properties and place in the folder of your choice. Make sure the folder has required permission for access.

2\. Add the JVM parameter **"-Djava.util.logging.config.file=&lt;drive>:&lt;your folder path>/logging.properties"** in your server configuration for launching.

After enabling these settings, you should see logs on console or a new log file is getting generated in your specified directory (default directory is your home directory. eg C:\\Users\\&lt;your login name>\\), depending on the handler that you enabled in the properties file.

Sample logging.properties file (Log file related settings are highlighted) -  

    \# The set of handlers to be loaded upon startup.

    \# Comma-separated list of class names.

    **handlers=java.util.logging.FileHandler, java.util.logging.ConsoleHandler**

    \# Default global logging level.

    \# Loggers and Handlers may override this level

    **.level=ALL**

    \# Loggers

    \# ------------------------------------------

    \# Loggers are usually attached to packages.

    \# Here, the level for each package is specified.

    \# The global level is used by default, so levels

    \# specified here simply act as an override.

    \# myapp.ui.level=ALL

    \# Handlers

    \# -----------------------------------------

    \# --- ConsoleHandler ---

    \# Override of global logging level

    **java.util.logging.ConsoleHandler.formatter=java.util.logging.SimpleFormatter**

    \# --- FileHandler ---

    \# Override of global logging level

    **java.util.logging.FileHandler.level=ALL**

    \# Naming style for the output file:

    \# (The output file is placed in the directory

    \# defined by the "user.home" System property.)

    **java.util.logging.FileHandler.pattern=%h/java%u.log**

    \# Limiting size of output file in bytes:

    **java.util.logging.FileHandler.limit=50000**

    \# Number of output files to cycle through, by appending an

    \# integer to the base file name:

    **java.util.logging.FileHandler.count=5**

    \# Style of output (Simple or XML):

**java.util.logging.FileHandler.formatter=java.util.logging.SimpleFormatter**

Sample Output -  

    May 14, 2015 3:22:18 PM com.microsoft.sqlserver.jdbc.Util parseUrl  
    FINE: Property:serverName Value:<your Server name>  
    May 14, 2015 3:22:18 PM com.microsoft.sqlserver.jdbc.Util parseUrl  
    FINE: Property:portNumber Value:1433  
    May 14, 2015 3:22:18 PM com.microsoft.sqlserver.jdbc.Util parseUrl  
    FINE: Property:databaseName Value:<your db name>  
    May 14, 2015 3:22:18 PM com.microsoft.sqlserver.jdbc.Util parseUrl  
    FINE: Property:encrypt Value:true  
    May 14, 2015 3:22:18 PM com.microsoft.sqlserver.jdbc.Util parseUrl  
    FINE: Property:hostNameInCertificate Value:*.net  
    May 14, 2015 3:22:18 PM com.microsoft.sqlserver.jdbc.Util parseUrl  
    FINE: Property:loginTimeout Value:30  
    May 14, 2015 3:22:18 PM com.microsoft.sqlserver.jdbc.SQLServerConnection <init>  
    FINE: ConnectionID:1 created by (SQLServerDriver:1)  
    May 14, 2015 3:22:18 PM com.microsoft.sqlserver.jdbc.SQLServerConnection login  
    FINE: ConnectionID:1 This attempt server name: <your Server name> port: 1433 InstanceName: null useParallel: false  
    May 14, 2015 3:22:18 PM com.microsoft.sqlserver.jdbc.SQLServerConnection login  
    FINE: ConnectionID:1 This attempt endtime: 1431634968867  
    May 14, 2015 3:22:18 PM com.microsoft.sqlserver.jdbc.SQLServerConnection login  
    FINE: ConnectionID:1 This attempt No: 0  
    May 14, 2015 3:22:18 PM com.microsoft.sqlserver.jdbc.SQLServerConnection connectHelper  
    FINE: ConnectionID:1 Connecting with server: <your Server name> port: 1433 Timeout slice: 30000 Timeout Full: 30  
    May 14, 2015 3:22:19 PM com.microsoft.sqlserver.jdbc.SQLServerConnection Prelogin  
    FINE: ConnectionID:1 ClientConnectionId: e655dbf0-203e-4700-8b46-36a5de29039f Server returned major version:11