---
title: "Adding SSH support to Asp.Net Core Docker Container created in Visual Studio 2017"
tags:
  - app service
  - azure
  - azure app service web app
  - Azure webapp
  - Container
  - Docker
  - Linux
author_name: kamil.sykora
categories:
  - Web App for Containers
  - Docker
  - .NET Core
  - How-To
date: 2018-02-22 15:31:33
header:
    teaser: /assets/images/netcorelogo.png
---

When creating a Docker container used in Azure App Service Web App for Containers, a common requirement is to add SSH support so that we can log into the application container from the Kudu console. There are various different methods to make this work and the general process is documented here: <https://docs.microsoft.com/en-us/azure/app-service/containers/app-service-linux-ssh-support>. This blog shows how to incorporate these basic requirements into an Asp.Net Core Docker Container that was created by Visual Studio 2017.

Visual Studio 2017 offers a wizard to create an Asp.Net Core Docker Container suitable for use in Azure App Service Web App for Containers. This wizard is available under the .Net Core group of templates: Other Languages – Visual C\# - .NET Core – ASP.NET Core Web Application. 

[![](/media/2018/02/VSWizard.png)](/media/2018/02/VSWizard.png) Make sure to select Linux support on the next screen: 

[![](/media/2018/02/VsWizardOsLinux.png)](/media/2018/02/VsWizardOsLinux.png) 

The created Dockerfile is very basic and does not have SSH support to begin with:

    FROM microsoft/aspnetcore:2.0
    ARG source
    WORKDIR /app
    EXPOSE 80
    COPY ${source:-obj/Docker/publish} .
    ENTRYPOINT ["dotnet", "DockerHelloWorld.dll"]

You can take the following steps to add SSH support using the above template.

1.  Create a new file named sshd\_config (no extension) in the directory where the .csproj for your web app is and paste in the content below into it. The file will show up in your Solution Explorer automatically and does not need to be modified in Visual Studio anymore. We borrowed the contents of this file from the following location: <https://github.com/Azure-App-Service/node/blob/master/8.2.1/sshd_config>

2.  In Solution Explorer, expand the Dockerfile to expose .dockerignore and add the following line to the bottom of the file to unignore the sshd_config file:
    
    !sshd_config
    
    [![](/media/2018/02/DockerIgnore.png)](/media/2018/02/DockerIgnore.png)
3.  Modify the Dockerfile from the original to look like the Dockerfile below. Replace the name of the dll with the appropriate dll name that matches your project.
4.  Build and deploy the project to an Azure App Service Web App for Containers. Once you start the application successfully, you should be able to go to the Kudu console and select the SSH option to connect to the application container.![](/media//2018/02/SshPrompt.png)



        # This is ssh server systemwide configuration file.
        #
        # /etc/sshd_config

        Port                2222
        ListenAddress              0.0.0.0
        LoginGraceTime             180
        X11Forwarding              yes
        Ciphers aes128-cbc,3des-cbc,aes256-cbc
        MACs hmac-sha1,hmac-sha1-96
        StrictModes         yes
        SyslogFacility             DAEMON
        PasswordAuthentication    yes
        PermitEmptyPasswords      no
        PermitRootLogin     yes

 

Final Dockerfile contents:

        FROM microsoft/aspnetcore:2.0
        ARG source
        WORKDIR /app
        EXPOSE 2222 80

        RUN apt update \
          && apt install -y --no-install-recommends openssh-server \
          && mkdir -p /run/sshd \
          && echo "root:Docker!" | chpasswd

        COPY ${source:-obj/Docker/publish} .

        COPY sshd_config /etc/ssh/sshd_config

        ENTRYPOINT ["/bin/bash", "-c", "/usr/sbin/sshd && dotnet DockerHelloWorld.dll"]
