---
title: "Using custom startup commands with Web App for Containers"
author_name: "Anthony Salemo"
tags:
    - App Service Linux
    - Docker
    - Configuration
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Docker # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Configuration # Django, Spring Boot, CodeIgnitor, ExpressJS
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-04-13 12:00:00
---

This post will cover how to use the "Startup Command" option to quickly change the startup entrypoint or command for your custom container on Web Apps for Containers.

# Overview
The "Startup Command" option is available on both App Service Blessed Images and Web App for Containers - however, there are some important differences here.

"Blessed Images" are prebuilt containers which mount a volume to `/home` to run your code. The Dockerfile used for these images are configured in a way that this command can easily integrate with your code, since the architecture here is designed to just deploy and run code and not focus on the nuances of configuring the image itself.

On the other hand, Web App for Containers have the expectation set that the customer would be building their own custom Docker Image - and bringing that for Azure to run as a container. With this, most people have an already set and defined container entrypoint, through the `ENTRYPOINT` instruction, or the CMD command to run their application through `CMD`.

If you add a "Startup Command", this may cause issues unknowingly, as it may override your command in the same way you can do `docker run -it [someimage] [somecommand]`.

# Good to knows
If your custom Docker Image already has a `ENTRYPOINT` or `CMD` set, setting this custom startup command option may break your application, as it's essentially trying to override your entrypoint or command execution.

Take the below example. We have a quickstart `nginx:latest` image being used - which runs fine on it's own. If we add a command of `echo "Hello"` as the Startup Command, we see it execute - but ultimately the container fails because it's overriding NGINX's entrypoint.



![NGINX](/media/2023/04/azure-oss-blog-wafc-custom-startup-1.png)

![Startup Command](/media/2023/04/azure-oss-blog-wafc-custom-startup-2.png)

![Echo Command](/media/2023/04/azure-oss-blog-wafc-custom-startup-3.png)

![Container Crash](/media/2023/04/azure-oss-blog-wafc-custom-startup-4.png)

Knowing this, we will go through a setup below to successfully use this option for a Web App for Container.

# Custom Startup Commands
## Use a command
1. To be able to start a container with this method, do not have a `CMD` or `ENTRYPOINT` in your `Dockerfile`. See the below example. We're just copying in our application source and exposing the port. If you have a `CMD` or `ENTRYPOINT` already set, there is a likely chance this may crash the container, as seen above, if you put a command that your application is not expecting.

```Dockerfile
FROM node:18.9.0-alpine3.15

WORKDIR /app
COPY package.json ./
RUN npm i

COPY . ./

EXPOSE 8080 
```

2. In the "Startup Command" field, add your command.

![Startup Command](/media/2023/04/azure-oss-blog-wafc-custom-startup-5.png)

3. We can now validate the container has started:

![Startup Command](/media/2023/04/azure-oss-blog-wafc-custom-startup-6.png)

This approach can be used an alternative to the typical `ENTRYPOINT` or `CMD` methods with containerized applications.

## Use a file
### Prerequisites
Compared to the [Use a command](#use-a-command) section, to reference a `.sh` file directly to invoke your container entrypoint, you must have App Service persistant storage enabled. This is done through the `WEBSITES_ENABLE_APP_SERVICE_STORAGE` App Setting.

On Web App for Containers, this defaults to false. Set this to true to proceed, otherwise this will not work.

![Startup Command](/media/2023/04/azure-oss-blog-wafc-custom-startup-7.png)

## Set Up
1. Assuming `WEBSITES_ENABLE_APP_SERVICE_STORAGE` is now `true`, we can continue. Next, using an FTP client of your choice - add your entrypoint container script to a location under `/home`.

    In this example, we're going to add the below `init_container.sh` to `/home/site/wwwroot` (This is where FTP clients default to when connected under App Service remote storage)

    ```sh
    #!/bin/sh
    set -e

    # Get env vars in the Dockerfile to show up in the SSH session
    eval $(printenv | sed -n "s/^\([^=]\+\)=\(.*\)$/export \1=\2/p" | sed 's/"/\\\"/g' | sed '/=/s//="/' | sed 's/$/"/' >> /etc/profile)

    echo "Starting SSH ..."
    /usr/sbin/sshd

    node /app/server.js
    ```

    ![Remote Storage](/media/2023/04/azure-oss-blog-wafc-custom-startup-8.png)

    > **NOTE**: It's important to understand that FTP clients **only** connect to the remote storage's file system. You cannot browse the container filesystem like you would do with an SSH session.

2. Just as in the "Use a command" section - do not have an existing `ENTRYPOINT` or `CMD` command in your `Dockerfile`. Notice this is the case in the below file as well.

    As an example, we'll be using the below Dockerfile

    ```Dockerfile
    FROM node:18.9.0-alpine3.15

    WORKDIR /app
    COPY package.json ./
    RUN npm i

    COPY . ./

    # Start and enable SSH
    RUN apk add openssh \
        && echo "root:Docker!" | chpasswd \
        && chmod +x /app/init_container.sh \
        && cd /etc/ssh/ \
        && ssh-keygen -A

    COPY sshd_config /etc/ssh/

    EXPOSE 8080 2222
    ```

3. In the portal under **Configuration** -> **General Settings**, set the "Startup Command" to `/home/site/wwwroot/init_container.sh`

    ![Init Script](/media/2023/04/azure-oss-blog-wafc-custom-startup-9.png)

    You can alternatively do this in the **Deployment Center**:

    ![Init Script](/media/2023/04/azure-oss-blog-wafc-custom-startup-10.png)


4. Save the configuration. The container should now be using the `.sh` file being referenced for container start up.







