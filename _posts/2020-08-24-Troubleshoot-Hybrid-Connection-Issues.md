---
title: "Troubleshoot Hybrid Connection Issues - Windows/Linux"
author_name: "Anand Anthony Francis"
tags:
    - Hybrid Connections
    - Hybrid
    - Azure Hybrid Connections
    - Troubleshooting Hybrid Connections
categories:
    - Azure App Service on Windows
    - Azure App Service on Linux #Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Azure Hybrid Connection # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - How-To
    - Diagnostics
    - Configuration
    - Troubleshooting #How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/App-Services.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2020-07-24 13:00:00
---

## About

We will primarily discuss about some basic steps to investigate connectivity issues related to Azure Hybrid Connections in this article. Though, just for reference, we have also added a note on "What is" Azure Hybrid Connections and the components involved in an Hybrid Connection.

```Note
This article does not specifically focus on App Services Windows or Linux, since the troubleshooting steps are almost the same, though wherever required we have marked it as Linux or Windows only.
```

## Azure Hybrid Connections

1. Azure Hybrid Connections use Azure Relay Hybrid Connections protocol. More information on this can be found [here](https://docs.microsoft.com/en-us/azure/azure-relay/relay-hybrid-connections-protocol). Hybrid Connections have the capability of Relay which is a secure medium for endpoints to talk to each other.
2. Hybrid Connections communication is bi-directional, using binary stream and simple datagram flow between two Applications in their respective networks.
3. On Azure App Services we can leverage the benifit of Hybrid Connections to communicate to an endpoint (like a database server) on an On-Prem machine, which may be having it's own set of firewall rules.
4. For Azure App Services to talk to an endpoint using Hybrid Connections, we need to install the Hybrid Connection Manager on the on-prem (machine) end.
5. The on-prem resource itself should be able to communicate with the Azure App Service over port 443. Hybrid Connections use a HOSTNAME:PORT

Please refer [App Service Hybrid Connection](https://docs.microsoft.com/en-us/azure/app-service/app-service-hybrid-connections) for steps to configure Hybrid Connection with Azure App Service.

## Components Involved

In order for an App Service to communicate with an on-prem resource (for ex., MySQL Database) the components involved when using a Hybrid Connection are:

- Azure App Service
- Hybrid Connectio Manager
- On-Prem Machine (hosting the endpoint)

  ![Hybrid Conneciton](/media/2020/08/hybridConnectionComponents.PNG)

## Troubleshooting Steps

### Check Hybrid Connection Manager Service

- The first time or any time when we configure a new [Hybrid Connection on our Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/app-service-hybrid-connections#add-and-create-hybrid-connections-in-your-app) and add the connection on our on-prem machine via the [Hybrid Connection Manager UI](https://docs.microsoft.com/en-us/azure/app-service/app-service-hybrid-connections#hybrid-connection-manager), in case we see "Not Connected" (refer Image) even after following all the steps correctly, it is always good to start the investigation by stopping and starting the "Azure Hybrid Connection Manager Service" from the Services Application.

  ![Hybrid Connection Manager - Not Connected](/media/2020/08/hybrid-notConnected-error.PNG)

- Access the 'Services' Application by running pressing **Windows + R** key and restart the "Azure Hybrid Connection Manager Service" service

  ![Azure Hybrid Connection Manager Servce](/media/2020/08/hybrid-con-mgr-svc.PNG)

After restarting the Azure Hybrid Connection manager service, the connection should show as Connected.

### Check Event Viewer logs for errors

- From an on-prem investigation standpoint we can also look into the Event Viewer application to check any events (errors, warnings, information) for getting more information about the respective Hybrid Connection.
- Since Azure Hybrid Connections leverage Service Bus internally the logs can be seen in Event Viewer under: Applications and Services > Microsoft > Service Bus > Client.
- The Operational Logs can show different levels for information for the specific Hybrid Connections and this information can be used to further resolve/address the connectivity issue being faced.

  ![Hybrid Connections - Event Viewer](/media/2020/08/hybrid-con-eventViewer.PNG)

### Using System.Net Logging

- Since Hybrid Connection Manager leverages the System.Net library of .NET Framework to interact with Service Bus Relay, we can use System.Net traces to isolate issues related to connectivity using these traces/logs.
- Enabling System.Net tracing is fairly easy, though it requires that we give carefully update the Hybrid Connection Manager's configuration. Steps to update the configuration are given below:

    1. Firstly, stop the Hybrid Connection Manager UI, we can do this by simply going to the Services Application (services.msc) and do a right-click > stop for the 'Azure Hybrid Connection Manager Service'.
    2. Navigate to path - 'C:\Program Files\Microsoft\HybridConnectionManager 0.7' in the file explorer and open the file - 'Microsoft.HybridConnectionManager.Listener.exe.config' in a notepad (Administrator mode).
    3. Add the below given XML code at the end of the file, just before the closing tag (</configuration>).

        ```XML
        <system.diagnostics>
            <trace autoflush="true" />
            <sources>
                <source name="System.Net">
                    <listeners>
                        <add name="System.Net"/>
                    </listeners>
            </source>
            <source name="System.Net.HttpListener">
                <listeners>
                    <add name="System.Net"/>
                </listeners>
            </source>
            <source name="System.Net.Sockets">
                <listeners>
                    <add name="System.Net"/>
                </listeners>
            </source>
            <source name="System.Net.Cache">
                <listeners>
                    <add name="System.Net"/>
                </listeners>
            </source>
        </sources>
        <sharedListeners>
            <add name="System.Net" type="System.Diagnostics.TextWriterTraceListener" initializeData="c:\temp\System.Net.trace.log" traceOutputOptions = "ProcessId, DateTime" />
        </sharedListeners>
        <switches>
            <add name="System.Net" value="Verbose" />
            <add name="System.Net.Sockets" value="Verbose" />
            <add name="System.Net.Cache" value="Verbose" />
            <add name="System.Net.HttpListener" value="Verbose" />
        </switches>
        </system.diagnostics>
        ```

    4. Save the file & Restart the Azure Hybrid Connection Manager service.
    5. Now, once the issue is reproduced, we will see System.Net.trace.log being written to C:/temp.

**NOTE:** Please ensure that the added XML configuration to enable System.Net traces are disabled after collecting the logs since it would keep on writing to the C:/temp folder if not disabled.

### (Windows) Adding App Setting - HYBRIDCONNECTIVITY_LOGGING_ENABLED

- Another way to get logs for Hybrid Connections in our Azure App Service is to add the App Setting - **HYBRIDCONNECTIVITY_LOGGING_ENABLED** and set it's value to **1**.
- This would restart the respective App Service and once the issue is reproduced we will start getting logs for Hybrid Connections under *D:/home/Logfiles* folder.
- The file created would have the following naming format - HybridConnectivity_UserLog_yyyy-mm-dd-hh.log.

### Checking connectivity between App Service and On-Prem endpoint using TCPPING (Windows) & TELNET (Linux)

- One of the most basic steps to find if the connectivity between Hybrid Connection from the App Service to endpoint (on-prem) is established - is to do a TCPPING or run the telnet command in Windows & Linux App Service respectively.

1. For running the TCCPING command, we can simply go to the KUDU site for our App Service (Windows) and under the Debug Console > CMD option, in the command prompt run the following command:

   ```Command
   TCPPING HOSTNAME:PORT
   ```

2. The telnet command is leveraged in App Services (Linux) where you can go to the KUDU site for the respective App Service and in the SSH shell:

   ```Command
   curl -v telnet://HOSTNAME:PORT
   ```

**NOTE:** Please note that TCPPING & telnet are just to check if the hybrid connections are configured properly and does not ensure a successfully connectivity between the endpoints.

Hope that the above steps help in troubleshooting Hyrid Connection issues on Azure App Services.
