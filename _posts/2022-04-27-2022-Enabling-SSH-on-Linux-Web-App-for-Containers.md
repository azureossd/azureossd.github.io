---
title: "Enabling SSH on Linux Web App for Containers"
author_name: "Anthony Salemo"
tags:
    - SSH
    - Docker
    - Deploy
    - Configuration
    - Troubleshooting
categories:
    - Azure App Service on Linux
    - SSH
    - Deployment 
    - Configuration
header:
    teaser: /assets/images/azurelinux.png
toc: true
toc_sticky: true
date: 2022-04-27 12:00:00
---

This post provides information for setting up, configuration and troubleshooting SSH integration with Custom Docker Images that will be ran as Web App for Containers on Azure App Service.

# Introduction

When troubleshooting an application that is containerized sometimes it would be good to have SSH enabled in the container to troubleshoot certain scenarios. For instance, testing network connectivity with `tcpping` or taking `tcpdumps` for network traces, package installations on-the-fly, testing a database client within the container, amongst other issues or reasons.

Azure Web App for Containers expects customers to bring their own containers (Images), therefor, SSH may or may not be enabled out of the box since the Image that would be brought was developed by the Image maintainer/developer (aka., the customer) and it would be up to them to decide if SSH was integrated into the Image originally. 

This is in contrast to the ["Blessed" (built-in) Docker Images](https://docs.microsoft.com/en-us/azure/app-service/overview#built-in-languages-and-frameworks) that are offered on App Service on Linux which does have SSH enabled by default. [This Dockerfile and repo](https://github.com/Azure-App-Service/ImageBuilder/blob/master/GenerateDockerFiles/node/node-template/Dockerfile) can be used as an example of how SSH is installed and configured by default in these built-in images on Azure App Service Linux.

**Important**:

The below sections will be a general guide or starting point for SSH integration. This will be targetting Linux Containers (Alpine and Ubuntu/Debian). SSH integration is generally **language agnostic** in the sense that the same configuration can be used across runtimes since the integration is specifically focused on the container itself and not the runtime language.

## Enable SSH for an Ubuntu/Debian based Linux Container

There will be 3 files which we'll be focusing on:
- `Dockerfile`
- `sshd_config`
- An entrypoint script

### sshd_config
Create a file named `sshd_config` in your project root, relative to your `Dockerfile`. The file contents for this can essentially be copied and pasted into it. There is **no** file extension for this file, and must be named `sshd_config`. The file contents can be copied from [here](https://docs.microsoft.com/en-us/azure/app-service/configure-custom-container?pivots=container-linux#enable-ssh). 

> **NOTE**: The above link also shows how to step through integrating SSH for a Docker Image on Web App for Containers

```
Port 			2222
ListenAddress 		0.0.0.0
LoginGraceTime 		180
X11Forwarding 		yes
Ciphers aes128-cbc,3des-cbc,aes256-cbc,aes128-ctr,aes192-ctr,aes256-ctr
MACs hmac-sha1,hmac-sha1-96
StrictModes 		yes
SyslogFacility 		DAEMON
PasswordAuthentication 	yes
PermitEmptyPasswords 	no
PermitRootLogin 	yes
Subsystem sftp internal-sftp
```
As called out in the above link:
- `Port` must be set to 2222.
- `Ciphers` must include at least one item in this list: `aes128-cbc,3des-cbc,aes256-cbc`.
- `MACs` must include at least one item in this list: `hmac-sha1,hmac-sha1-96`.

After creating this file we can move on to the next step which is setting up an entrypoint to start the SSH service.

### Entrypoint script (ex., init_container.sh, start_container.sh, etc.)

In our entrypoint script we can start the SSH service such as below - assuming this is called `init_container.sh`:

```bash
#!/bin/sh
set -e

echo "Starting SSH ..."
service ssh start

# Start Gunicorn
exec gunicorn -b 0.0.0.0:8000 app:app
```

This example is starting the application with `gunicorn`, **but that doesn't matter here, as we're focused on adding `service ssh start`.** This approach would be the same regardless of application type, for example - with the below entrypoint indicating this is a Java application

```bash
#!/bin/sh
set -e

echo "Starting SSH ..."
service ssh start

echo "Running startup command 'java -jar /app/log4j2-0.0.1-SNAPSHOT.jar'"
java -jar /app/log4j2-0.0.1-SNAPSHOT.jar

```

In the above `init_container.sh` examples we add the following:
- `service ssh start` to start the SSH service

### Dockerfile

The last part of integrating this is the Dockerfile. Assume we have the following Dockerfile which **doesn't** have SSH integrated by default. 

```Dockerfile
FROM python:3.8-slim
WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY ./ /app

EXPOSE 8000 

ENTRYPOINT [ "/app/init_container.sh" ] 
```


We would now need to add the following lines in the below `RUN` instruction.
The username and password combination of "root:Docker!" must be **exactl**y like this as called out [here](https://docs.microsoft.com/en-us/azure/app-service/configure-custom-container?pivots=container-linux#enable-ssh)

> The root password must be exactly Docker! as it is used by App Service to let you access the SSH session with the container. This configuration doesn't allow external connections to the container. Port 2222 of the container is accessible only within the bridge network of a private virtual network and is not accessible to an attacker on the internet.

> **NOTE**: Although the user and password is known, actual access to SSH can only be done through the Kudu site which would further require Azure account credentials. Further reading on authentication can be read [here](https://github.com/projectkudu/kudu/wiki/Accessing-the-kudu-service) and other reading on authorization can be found [here](https://docs.microsoft.com/en-us/azure/app-service/resources-kudu#rbac-permissions-required-to-access-kudu).

```Dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends dialog \
    && apt-get install -y --no-install-recommends openssh-server \
    && echo "root:Docker!" | chpasswd \
    && chmod u+x /app/init_container.sh
```
The full Dockerfile would now look like the following:
> **NOTE**: Make sure port 2222 is also exposed or else you won't be able to connect through SSH

```Dockerfile
FROM python:3.10-slim
WORKDIR /app/

COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY ./ /app/

COPY sshd_config /etc/ssh/

# Start and enable SSH
RUN apt-get update \
    && apt-get install -y --no-install-recommends dialog \
    && apt-get install -y --no-install-recommends openssh-server \
    && echo "root:Docker!" | chpasswd \
    && chmod u+x /app/init_container.sh

EXPOSE 8000 2222

ENTRYPOINT [ "/app/init_container.sh" ] 
```

In the above Dockerfile we add the following:
- We `COPY` `sshd_config` to `/etc/ssh/`
- We add the `RUN` instruction to install `dialog` and `openssh-server`
- In the same `RUN` instruction we set the username and password to "root" and "Docker" and give `init_container.sh` executable permissions under `/app/init_container.sh`
- Lastly, we add port `2222` to be exposed for SSH


With our `init_container.sh`:

```bash
#!/bin/sh
set -e

echo "Starting SSH ..."
service ssh start

# Start Gunicorn
exec gunicorn -b 0.0.0.0:8000 app:app
```

And `sshd_config` file:

```
Port 			2222
ListenAddress 		0.0.0.0
LoginGraceTime 		180
X11Forwarding 		yes
Ciphers aes128-cbc,3des-cbc,aes256-cbc,aes128-ctr,aes192-ctr,aes256-ctr
MACs hmac-sha1,hmac-sha1-96
StrictModes 		yes
SyslogFacility 		DAEMON
PasswordAuthentication 	yes
PermitEmptyPasswords 	no
PermitRootLogin 	yes
Subsystem sftp internal-sftp
```

**The above 3 files is a completed setup for SSH. [This GitHub repository](https://github.com/azureossd/docker-container-ssh-examples) can be referenced for generalized examples for different OS types (Debian, Alpine) for a complete runnable example.**


## Enable SSH for an Alpine based Linux Container

SSH configuration for Alpine is very close to Debian/Ubuntu configuration, with some minor differences.

We'll focus on the same 3 files again:
- `Dockerfile`
- `sshd_config`
- An entrypoint script

### sshd_config

Our `sshd_config` is exactly the same as before and should not be changed. This file is OS agnostic when it comes to setting up SSH between Alpine, Debian, Ubuntu, etc.

```
Port 			2222
ListenAddress 		0.0.0.0
LoginGraceTime 		180
X11Forwarding 		yes
Ciphers aes128-cbc,3des-cbc,aes256-cbc,aes128-ctr,aes192-ctr,aes256-ctr
MACs hmac-sha1,hmac-sha1-96
StrictModes 		yes
SyslogFacility 		DAEMON
PasswordAuthentication 	yes
PermitEmptyPasswords 	no
PermitRootLogin 	yes
Subsystem sftp internal-sftp
```

### Entrypoint script (ex., init_container.sh, start_container.sh, etc.)

For Alpine, the way we start SSH changes in our Entrypoint. We change this to `/usr/sbin/sshd` instead of `server ssh start` as before.

```bash
#!/bin/sh
set -e

echo "Starting SSH ..."
/usr/sbin/sshd

# Start Gunicorn
exec gunicorn -b 0.0.0.0:8000 app:app
```

### Dockerfile

Using the same example earlier, assume our Dockerfile consists of the following:

```Dockerfile
FROM python:3.10-alpine3.15
WORKDIR /app/

COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY ./ /app/

EXPOSE 8000 

ENTRYPOINT [ "/app/init_container.sh" ]  
```

We now need to add the following `RUN` instruction - Alpine uses `apk` as its package manager:

```Dockerfile
# Start and enable SSH
RUN apk add openssh \
     && echo "root:Docker!" | chpasswd \
     && chmod +x /app/init_container.sh \
     && cd /etc/ssh/ \
     && ssh-keygen -A
```

The full Dockerfile put together now looks like this:

```Dockerfile
FROM python:3.10-alpine3.15
WORKDIR /app/

COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY ./ /app/

COPY sshd_config /etc/ssh/

# Start and enable SSH
RUN apk add openssh \
     && echo "root:Docker!" | chpasswd \
     && chmod +x /app/init_container.sh \
     && cd /etc/ssh/ \
     && ssh-keygen -A

EXPOSE 8000 2222

ENTRYPOINT [ "/app/init_container.sh" ] 
```

> **NOTE**: The same applies here as explained earlier, the "root:Docker!" username and password combination **must** remain like this. Port 2222 **must** be exposed. The `sshd_config` configuration is the same as mentioned in the Debian/Alpine section.

In the above Dockerfile we add the following:
- We `COPY` `sshd_config` to `/etc/ssh/`
- We add the `RUN` instruction to install `openssh`
- In the same `RUN` instruction we set the username and password to "root" and "Docker" and give `init_container.sh` executable permissions under `/app/init_container.sh`
- We `cd` into /etc/ssh to run `ssh-keygen -A`, this generates keys related to SSH. The `-A` option creates this on default key paths with other default key related options. More can be found on the [man page](https://www.man7.org/linux/man-pages/man1/ssh-keygen.1.html).
- Lastly, we add port `2222` to be exposed for SSH

With our completed Entrypoint file:

```bash
#!/bin/sh
set -e

echo "Starting SSH ..."
/usr/sbin/sshd

# Start Gunicorn
exec gunicorn -b 0.0.0.0:8000 app:app
```

And our `sshd_config` file:

```
Port 			2222
ListenAddress 		0.0.0.0
LoginGraceTime 		180
X11Forwarding 		yes
Ciphers aes128-cbc,3des-cbc,aes256-cbc,aes128-ctr,aes192-ctr,aes256-ctr
MACs hmac-sha1,hmac-sha1-96
StrictModes 		yes
SyslogFacility 		DAEMON
PasswordAuthentication 	yes
PermitEmptyPasswords 	no
PermitRootLogin 	yes
Subsystem sftp internal-sftp
```

The above 3 files would complete a Alpine SSH configuration. The major differences being the packages being installed, how we start our SSH server, and using the `apk` package manager.

> **NOTE**: Even though this example targeted a Python base Image, the runtimes/languages are decoupled from integrating SSH functionality. The above general methods to enable SSH would be the same between other languages.

**[This GitHub repository](https://github.com/azureossd/docker-container-ssh-examples) can be referenced for generalized examples for different OS types (Debian, Alpine) for a complete runnable example.**

## Troubleshooting
The following scenarios can happen in either **local** or **deployed** environments (Azure Web App for Containers).

On deployed environments - eg. Web App for Containers, you may see a `SSH CONNECTION CLOSED` in red - **some of these scenarios may cause this.**

![SSH Error](/media/2022/04/azure-ssh-blog-1.png)

Before troubleshooting these scenarios on Azure, ensure that [App Service Logging is enabled](https://docs.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer). Logging (stdout/stderr) can then be viewed in either **Logstream**, **Diagnose and Solve Problems -> Application Logs**, or through the **Kudu** site directly.

If troubleshooting **locally** you can run `docker logs <containerID>` or use Docker Desktop and click on the running container to view logging.

### no hostkeys available -- exiting.

**Scenario**: 
- This would likely appear on Alpine base images. This can occur when `ssh-keygen` is missing since no SSH keys are generated. 

 - **Resolution**: 
    Add `ssh-keygen -A` to the `RUN` instruction in the Dockerfile that's installing the SSH server.

### service ssh not found

**Scenario**:
- SSH fails to start with `service ssh not found` - the container may still start but SSH will not.
- **Resolution**:
    This would likely occur if using `service ssh start` in an Alpine Image configured like the above. If so, replace this with `/usr/sbin/sshd` in your entrypoint.

### Container crashes
When a Container crashes/exits - it will show `SSH CONNECTION CLOSED` in red on Azure Web App for Containers SSH terminal screen. This is expected. An SSH session will need a container that is running - if the container has crashed or exited, then there will be no running container to initiate a SSH session to. If this message is encountered also check if the container is successfully running. 

