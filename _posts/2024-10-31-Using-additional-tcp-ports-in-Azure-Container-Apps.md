---
title: "Using additional TCP ports in Azure Container Apps"
author_name: "Anthony Salemo"
tags:
    - Configuration
    - Linux
    - Ingress
    - Azure Container Apps
categories:
    - Azure Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-10-31 12:00:00
---

This post will go over some general ways to use the 'additional TCP ports' option on Azure Container Apps

# Overview
You can set up your Container App to use more than just one TCP port when ingress is enabled. This can be used when the ingress type is either 'HTTP' or 'TCP'. Additionally, depending on if the Container App Environment is VNET injected, these additional TCP ports can be externally available. If your Container App Environment is **not** VNET injected, then these ports cannot be called externally, only internally between applications.

Additional information and limitations of this are explained here in [Additional TCP ports](https://learn.microsoft.com/en-us/azure/container-apps/ingress-overview#additional-tcp-ports)

## With a VNET
The biggest difference between using a VNET and without one is the ability to connect to TCP ports from outside of the environment - as denoted by the _"Accepting traffic from anywhere"_

A basic example of using additional TCP ports from the Azure Portal would look like the below:

![Basic TCP with Additional TCP ports example](/media/2024/10/additional-tcp-ports-6.png)

This example infers that the applications main ingress is reacheable over HTTP. It then exposes two additional TCP ports that are accessible over the value defined in `Exposed port` externally.

![HTTP with Additional TCP ports](/media/2024/10/additional-tcp-ports-1.png)

This example infers that the applications main ingress is reacheable over TCP. It then exposes two additional TCP ports that are accessible over the value defined in `Exposed port` externally.

![TCP with Additional TCP ports and exposed ports](/media/2024/10/additional-tcp-ports-2.png)

The different port numbers between `Target port` and `Exposed port` may be interesting, but can be explained as this:
- `Target port` is a required field. At a minimum, if using additional ports, this needs to be set. 
- `Exposed port` is **not** a required field - connections will be made to the value defined in `Target port` if ommitted.
- **If your Container App Environment is VNET injected**, then you can use the value set in `Exposed port` to be what outside applications or clients use to reach the application. Although this doesn't need to be necessarily outside of the environment and can be reached the same way from within the environment.
    - For example, port `8991` is what we can connect to the application from externally, this will essentially forward the request to the `Target port` of `8090`
    - Port `8992` is another example of a port we can connect to, which essentially forwards to port `8080`.


Note, that you do not need to do this. Regardless if you're using `Exposed port` or not - the application should be expected to accept and listen for connections on the value(s) defined in `Target port` for its TCP server(s). If the value in `Exposed port` is different than `Target port` - the application doesn't actually need to listen for connections on `Exposed port` within its code.

The general syntax for reaching these exposed ports would be:
- External and by full FQDN (when VNET is used and ingress is external): `myapp.funnyname-1234abc.region.azurecontainerapps.io:[port_number]`
- Internal and by app name (when VNET is used and ingress is internal only or calling by inter-environment): `myapp:[port_number]`

Be aware that if you use a value for  that's _not_ the same value in `Target port`, connecting directly to the value in `Target port` will time out. Either from externally or internally - since the application is now accessible over what's defined in `Exposed port`

## Without a VNET
As mentioned earlier, if a VNET is not used with the environment, these `Exposed port` TCP ports cannot be accessed externally. However, from an internal/inter-environment standpoint, the functionality mostly remains the same.

You'll notice that changed the _Ingress traffic_ field will be grayed out and limited to "Limited to Container Apps Environment"

- This example shows basic usage with only `Target port` being used

![TCP with Additional TCP ports and no VNET](/media/2024/10/additional-tcp-ports-8.png)


- This example shows basic usage with both `Target port` and `Exposed port` being used

![TCP with Additional TCP ports and no VNET](/media/2024/10/additional-tcp-ports-7.png)

Calling between applications would be done by the application name you want to target. Eg., `nc -v myapp 8080`. Or, using an example with a Go TCP client implementation, would look like the below:

```go
tcpClient, err := net.ResolveTCPAddr("tcp", "myapp:8080")
```

Other language syntax will vary but the concept is the same. 

You can still utilize `Exposed port` _without_ a VNET as long as the calling application or client lives within the environment and is calling by the app name - eg. `nc -v myapp 8991`, which given the above screenshot, will ultimately connecto the applications target port of `8080`.

If you try to call to these `Export port`s from outside the environment, the TCP connection will fail and/or time out.

## Static IP
You can connect to your applications by using the static IP instead of FQDN as well when a VNET is used on the environment. This mimics the same discussion in the above _**With a VNET**_ section.

To find your static IP, go to the Container App Environment -> **Overview** -> _Static IP_. Using the examples above and below in this blog, you'll see the same behavior:

![TCP with Additional TCP ports through a static IP](/media/2024/10/additional-tcp-ports-9.png)

# Examples
We'll use the below Go application to see some of this in action. These examples are using the `Exposed` and `Target` ports set earlier above. In  scenario where `Exposed Port` isn't used - calling the app is straight forward you where just the value defined in `Target Port` is used.

This first example uses Fiber to run an HTTP server and creates two additional TCP servers to listen on ports `8080` and `8090`.

```go
func handleRequest(conn net.Conn, server string) {
	// close conn
	defer conn.Close()
	// write data to response
	time := time.Now().Format(time.ANSIC)
	res := "TCP server " + server + ": Recieved connection at: " + time
	zap.L().Info("TCP server " + server + ": Recieved connection at: " + time)
	conn.Write([]byte(res))

}

func tcpServerOne() {
	HOST := "0.0.0.0"
	PORT := "8080"
	TYPE := "tcp"
	SERVER := "[1]"

	zap.L().Info("TCP server " + SERVER + " is listening on port " + PORT)
	listen, err := net.Listen(TYPE, HOST+":"+PORT)
	if err != nil {
		zap.L().Fatal(err.Error())
	}
	// close listener
	defer listen.Close()
	for {
		conn, err := listen.Accept()
		if err != nil {
			zap.L().Fatal(err.Error())
		}
		go handleRequest(conn, SERVER)
	}
}

func tcpServerTwo() {
	HOST := "0.0.0.0"
	PORT := "8090"
	TYPE := "tcp"
	SERVER := "[2]"

	zap.L().Info("TCP server " + SERVER + " is listening on port " + PORT)
	listen, err := net.Listen(TYPE, HOST+":"+PORT)
	if err != nil {
		zap.L().Fatal(err.Error())
	}
	// close listener
	defer listen.Close()
	for {
		conn, err := listen.Accept()
		if err != nil {
			zap.L().Fatal(err.Error())
		}
		go handleRequest(conn, SERVER)
	}
}

func main() {
... truncating other code
	app := fiber.New()
	app.Get("/", controllers.IndexController)
    // Start multiple tcp servers
	go tcpServerOne()
	go tcpServerTwo()

	zap.L().Info("Fiber (HTTP) server is running on port 3000")
	fiberErr := app.Listen(":3000")

	if fiberErr != nil {
		zap.L().Fatal(fiberErr.Error())
	}
}
```

- TCP server one [1] listens on port `8080`
- TCP server two [2] litens on port `8090`

Using `nc` (or you can use any other TCP client in a client application), we can see the port forwarding in action:

![TCP server 2 response](/media/2024/10/additional-tcp-ports-3.png)
- We can see that connecting to our `Exposed port` on the Container App of `8991` is ultimately connecting to port `8090` on `tcpServerTwo()` within our application.

![TCP server 1 response](/media/2024/10/additional-tcp-ports-4.png)
- We see the same here, where connecting to our `Exposed port` on the Container App of `8992` is ultimately connecting to port `8080` on `tcpServerOne()` within our application.

<br>

![TCP response from inter-environment call](/media/2024/10/additional-tcp-ports-5.png)
- The same behavior is seen for inter-environment calls when just using the name of your target Container App

# Troubleshooting
Below are some common scenarios and potential reasons for them.

**No connection could be made because the target machine actively refused it**:
- Ingress is disabled
- A TCP connection is trying to be made to an ingress type of 'HTTP' and that port requested is not exposed
- The TCP port being connected to is not exposed, in general
- Making a request to an external TCP port but the Ingress and/or specific target port is set to 'internal' - or - the environment is not in a VNET

**No such host is known**:
- The client cannot resolve the DNS name. Ensure the FQDN is not mistyped.
- Check if a custom DNS server is used. These may not be resolving Azure hostnames properly.

**No connection error but no data received from server** or the client "hangs" with no response when connecting:
- Ingress is disabled
- A TCP connection is trying to be made to an ingress type of 'HTTP' and that port requested is not exposed
- The TCP port being connected to is not exposed, in general
- Making a request to an external TCP port but the Ingress and/or specific target port is set to 'internal' - or - the environment is not in a VNET
- The connection is not recieving data and being terminated by the default 240 second timeout limit for ingress.




