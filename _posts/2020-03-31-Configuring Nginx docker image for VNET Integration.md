---
title: "Configuring a Nginx image for VNET Integration on Azure"
author_name: "Kendrick Dubuisson"
tags:
    - Linux
    - Nginx
    - VNET Integration
categories:
    - Azure App Service on Linux
    - How-To
    - Docker
    - Configuration
    - Nginx
    - VNET Integration
header:
    teaser: "/assets/images/imagename.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2020-03-31 12:00:00
---

## Configuring a Nginx docker image for VNET Integration on Azure
We'll be walking through the changes required with the Nginx docker repo to support vnet Integration & SSH when deployed on Azure.
The repository referenced can be found [here](https://github.com/Kendubu1/nginx-static-docker-vnet)

If you use Web or Function App for Containers, you must modify your docker image to use VNet Integration. 
In your docker image, use the PORT environment variable as the main web server's listening port, instead of using a hardcoded port number.
The PORT environment variable is automatically set by the platform at the container startup time. If you use SSH, the SSH daemon must be configured to listen on the port number specified by the SSH_PORT environment variable when you use regional VNet Integration.

## Getting Started - Dockerfile
   1. We'll start with updated our docker files with the ENV instructions to set the environment variable and this sets the environment for the subsequent build instructions.
   Below we set PORT & SSH_PORT as an environment variable & we then pass the environment variable value.
        ```
            ENV PORT 80
            ENV SSH_PORT 2222
        ```
 
## Updating Nginx Configuration - Nginx.conf
 
   2. Since we will be using the PORT environment variable to account for the dynamic port allocation during container build time we must pass this within our Nginx configuration.
        ```
            server {
            listen PORT default_server;
            server_name _;
        ```

## Updating SSH Configuration - sshd.conf
 
   3. Just as we did for the nginx.conf we will do the same within the ssdh.conf using the SSH_PORT but if initially referencing the azure documentation the sshd file will already be correct. 
   - [Enable SSH Documenation](https://docs.microsoft.com/en-us/Azure/app-service/containers/configure-custom-container#enable-ssh)
        ```
            # This is ssh server systemwide configuration file.
            #
            # /etc/sshd_config

            Port 			SSH_PORT
            ListenAddress 		0.0.0.0
            LoginGraceTime 		180
            X11Forwarding 		yes
        ```


## Updating the Container Start Up - init_container.sh
   4. Here we invoke the substitution command of "sed" during the container start-up to replace the variables with their intended values. 
        ```
            sed -i "s/SSH_PORT/$SSH_PORT/g" /etc/ssh/sshd_config
            sed -i "s/PORT/$PORT/g" /etc/nginx/nginx.conf
        ```

## Saved & Build!
   5. After the changes have been made you can test this build locally & push this to your container registry & deploy to Azure.
     -  Below are snippets from docker startup where we can the PORT variable get assigned the value of 4540. The screenshot below shows in an SSH session using the IP from our VNET & dynamic port opposed to 2222 where we can also see that the PORT value was replaced within the nginx.conf.
        ```
            INFO  -  Status: Downloaded newer image for kedubuis/nginxport:latest
            INFO  - Pull Image successful, Time taken: 1 Minutes and 34 Seconds
            INFO  - Starting container for site
            INFO  - docker run -d -p 4540:4540 --name nginxport_0_541aa740 -e WEBSITES_ENABLE_APP_SERVICE_STORAGE=false -e WEBSITE_SITE_NAME=nginxport -e WEBSITE_AUTH_ENABLED=False -e PORT=4540 -e WEBSITE_ROLE_INSTANCE_ID=0 -e WEBSITE_HOSTNAME=nginxport.azurewebsites.net -e WEBSITE_INSTANCE_ID=9eb2eb6956c7b42e62e3f0701e36efa367f70eed0c94b14abebc2a692715a168 kedubuis/nginxport:latest
        ```
   - ![VNET Integration SSH"](\media\2020\03\VnetIntegration.png)