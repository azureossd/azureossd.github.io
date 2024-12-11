---
title: "Whats the difference between PORT and WEBSITES_PORT"
author_name: "Anthony Salemo"
tags:
    - Docker
    - Configuration
    - Troubleshooting
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Docker # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Configuration 
header:
    teaser: /assets/images/azurelinux.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-02-15 12:00:00
---

This post will cover the difference between using the PORT and WEBSITES_PORT App Setting - and when to use them

# Overview
When running Containers on App Service - you have two general options. Either "built in" so called "Blessed" Docker Images, which are Microsoft maintained - these are the ones associated with the **Stack** dropdown under **Configuration** -> **General Settings**.

The other option are **Custom Images** (eg., Web Apps for Containers) which are Images you provide and we run as a container.

These two variables, PORT and WEBSITES_PORT, have different effects based on what type of images you're using. The idea of this post is to clearly explain which has an effect and where.

# Where can I see these changes?
When changing port settings - you'll see these in your container logs. Specifically, `docker.log` - which is the "platform" log file, meaning `docker` client based commands will be logged here. 

What appears in these logs is the `docker run` command for your container, which should look like the following:

```
docker run -d -p 9519:8080 --name somesite_1_c51f434a -e -e WEBSITE_SITE_NAME=somesite -e WEBSITE_AUTH_ENABLED=False -e WEBSITE_ROLE_INSTANCE_ID=0 -e WEBSITE_HOSTNAME=somesite.azurewebsites.net -e WEBSITE_INSTANCE_ID=0000000000000000000000000000000000000000000000000 -e HTTP_LOGGING_ENABLED=1 -e WEBSITE_USE_DIAGNOSTIC_SERVER=True appsvc/someblessedimage:someblessedimagetag
```

Let's break the important parts of this. The parts that really matter are:

```
docker run -d -p <hostport>:<containerport>
```

When we add PORT or WEBSITES_PORT (depending if you're using a Blessed or Custom Image), this solely updates the **containerport** port part of the `docker run` command. This does not affect the **hostport** part - this will be random, and is completely fine and should be ignored. In the context of these App Settings and blog, the rest of the command doesn't matter. 

You can view these log files in a few ways:
- Diagnose and Solve Problems -> Application Logs (detector)
- Logstream
- Directly via the Kudu site and browsing Log Files
- Through an FTP client to view Log Files
- etc.

# Sidecar container support
With the introduction of [Sidecar containers](https://learn.microsoft.com/en-us/azure/app-service/tutorial-custom-container-sidecar#differences-for-sidecar-enabled-apps), the way that `WEBSITES_PORT` used to work has now changed. This now **no longer** alters the containers exposed port in which it's used to run. From the portal perspective, you can tell when it's set for a net-new App Service (custom container) creation through the below:

1. ![Basic creation tab](/media/2023/02/azure-oss-blog-port-websites-port-6.png)

2. ![Container creation tab](/media/2023/02/azure-oss-blog-port-websites-port-7.png)

In short, instead of using **Environment Variables** (previously App Settings) to change the container run port, you can now directly change this through a site property


Now on, when you want to change the container exposed port, do the following:
1. Go to **Deployment Center** -> Click on the container in question and change the _Port_ field:

2. ![Deployment Center tab](/media/2023/02/azure-oss-blog-port-websites-port-8.png)

3. ![Deployment Center tab](/media/2023/02/azure-oss-blog-port-websites-port-9.png)

Again, this is only relevant for **custom container** (Web Apps for Containers) created with "sidecar support". You can, however, still utilize **Environment Variables** for other aspects regarding port configuration that the app may use at runtime - but this will not influence the actual _exposed_ port of the container when ran.

If the App Service was not created with the likes of the above - then use the _Non-sidecar container support_ section

# Non-sidecar container support
All of the below pertains to apps that were **not** created with "sidecar support". For an explaination of this, review to the above section.

The below section is also relevant to "Blessed Images".

# WEBSITES_PORT
**Tldr**: If you're running a custom container with Web App for Containers, always use **WEBSITES_PORT**. Make sure this is set to the port that's also exposed in your Dockerfile through the `EXPOSE` instruction (or if that isn't set, the port your application listens on)

<br>
<br>

`WEBSITES_PORT` is designed to help with the following:
- If you're running a custom Docker Image (and thus custom container)
    - and/or if your `Dockerfile` does **NOT** have the `EXPOSE` instruction set in it (using a custom container)

Take this Dockerfile for instance:

```Dockerfile
FROM node:18.9.0-alpine3.15

WORKDIR /app
COPY package.json ./
RUN npm i

COPY . ./

CMD [ "node", "/app/server.js" ]
```

We're using this as a custom image. If we deploy this to a Web App for Containers application, there is a chance this just may timeout on startup - because our application may actually be listening on port `8090` - but the platform doesn't know that. 

This may work locally, but that's because we'd run it with something like `docker run -d -p 8080:8090 ...`

That's exactly what `WEBSITES_PORT` is used for. If we added this as an App Setting to this same exact custom Image deployed, we'd see the following ran:

![WEBSITES_PORT](/media/2023/02/azure-oss-blog-port-websites-port-1.png)

Irregardless of this, even if you have a Dockerfile that looks like this:

```Dockerfile
FROM node:18.9.0-alpine3.15

WORKDIR /app
COPY package.json ./
RUN npm i

COPY . ./
# Note the addition of EXPOSE compared to the first example
EXPOSE 8080

CMD [ "node", "/app/server.js" ]
```

You should **still** add `WEBSITES_PORT` set to 8080 (or what is exposed in your Dockerfile) to avoid any port specific issues when the container is started.


## Does Port have any meaning here?
Yes and no. `PORT` does not directly have the same meaning as `WEBSITES_PORT` when using Web App for Containers. But does directly alter the `docker run` command in regards to the container port if `WEBSITES_PORT` is **not** set. The meaning of `WEBSITES_PORT` is to tell which port the platform needs to run `docker run` against. 

`PORT` also may have specific meaning to your application if this is referenced in your codebase. So it may be needed to add both `WEBSITES_PORT` and `PORT`.

Therefor, it is possible to just only use `PORT` or both `PORT` and `WEBSITES_PORT`.

**IMPORTANT**: If both `WEBSITES_PORT` and `PORT` are set as App Settings, `WEBSITES_PORT` will take precedence. 

# Port (Blessed Images)
**tldr:** On App Service Linux, using Blessed Images - `PORT` directly influences the **container port** of the `docker run` command. Just like what is explained in the `WEBSITES_PORT` section. However, most times, you most likely don't need to alter it.

<br>
<br>

If for some reason you need to change the default container port (that your application would be listening on), you can use the `PORT` variable.



`WEBSITES_PORT` has no effect here. Adding this as an App Setting will not change the port - if you need to change the port from the default port being ran, then you must use the `PORT` App Setting.

The following are the default ports for Blessed Image stacks (possibly subject to change):
- Node: 8080
- Python: 8000
- Java SE / Tomcat: 80
- Go (experimental): 8080
- .NET: 8080
- Ruby: 8080
- PHP: 8080

Given the above, let's take PHP as an example. 8000 is the default port in `docker run`, we'll see that if we add the following `PORT` App Setting with 9999, that this influences the command:

![PORT](/media/2023/02/azure-oss-blog-port-websites-port-2.png)

![PORT](/media/2023/02/azure-oss-blog-port-websites-port-3.png)

Let's now remove `PORT` and test with `WEBSITES_PORT`, we'll see this doesn't do anything and will fall back to the default port value, as expected:

![PORT](/media/2023/02/azure-oss-blog-port-websites-port-4.png)

![PORT](/media/2023/02/azure-oss-blog-port-websites-port-5.png)


# Summary
`WEBSITES_PORT` is for Web App for Containers and should ideally always be used. `PORT` can be used as well, however the idea for `WEBSITES_PORT` on Web Apps  for Containers is to tell which container port to always run `docker run` against. If both `WEBSITES_PORT` and `PORT` are set as App Settings, `WEBSITES_PORT` will take precedence. 

`PORT` is for App Service on Linux "Blessed" Images.






