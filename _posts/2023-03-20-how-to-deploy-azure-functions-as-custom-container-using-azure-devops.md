---
title: "How to deploy Azure Functions as Custom Docker container using Azure DevOps"
author_name: "Edison Garcia"
tags:
    - Azure Functions
    - Azure DevOps
categories:
    - Function App # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Nodejs # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/Function_Apps.svg" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-03-20 12:00:00
---

In this blog post, we are covering a simple way to build a custom container for your function app and use Azure DevOps for CI/CD with public or self-hosted agents.  

## Prepare Docker and Run Locally
### Create Dockerfile
- You can create a Dockerfile to an existing function or create a new function and Dockerfile with the following command (E.g. Javascript):

    **`func init --worker-runtime node --language javascript --docker`**

    >Note: Same command will apply for all the runtime stacks supported [here](https://learn.microsoft.com/en-us/azure/azure-functions/functions-create-function-linux-custom-image?tabs=in-process%2Cbash%2Cazure-cli%2Cv1&pivots=programming-language-javascript).
- By default the function images don't contain SSH configuration, but if you want to add this configuration you can enable ssh and remote debugging changing the base image to `-appservice`.

    Here is a quick example of a current Dockerfile:

    ```shell
    # To enable ssh & remote debugging on app service change the base image to the one below
    #FROM mcr.microsoft.com/azure-functions/node:4-node16-appservice
    FROM mcr.microsoft.com/azure-functions/node:4-node16

    ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
        AzureFunctionsJobHost__Logging__Console__IsEnabled=true

    COPY . /home/site/wwwroot

    RUN cd /home/site/wwwroot && \
        npm install
    ```

- If you want to use a different tag, you can find the available tags and OS versions for each tag [here](https://github.com/Azure/azure-functions-docker).
- All the function images are hosted into the Microsoft Container Registry (MCR). To retrieve the list of all available tags for specific azure function stack you can use `https://mcr.microsoft.com/v2/azure-functions/<stack-here>/tags/list`. 
    
    E.g. Node: `https://mcr.microsoft.com/v2/azure-functions/node/tags/list`.


### Running function container locally

1. If you have Windows, you can install [Docker Desktop](https://www.docker.com/products/docker-desktop/), or you can use it with [WSL2 Ubuntu](https://docs.docker.com/desktop/windows/wsl/) as well or use Linux and install it from [package manager](https://docs.docker.com/engine/install/ubuntu/).

2. In the same folder where your function files and Dockerfile are located, build the image with following command:
    
    **`docker build --tag your_image_name:your_tag .`**

3. To run the container you can use any external port but keep *port 80* as internal for the container, since the *Azure Function Host* will be listening on that port, you can use the following command to run:

    **`docker run -d -p 8080:80 mynodefunctionapp:v1`**

4. To review if your container is up and running you can use **`docker ps`**.

    >Note: In case your container is not running, you can use `docker ps -a` and then grab the container id and run `docker logs container_id` to investigate the reason.

    ![Running locally](/media/2023/03/docker-local-1.png)

5. You can access to the running container using **`docker exec -it container_id /bin/bash`**

    ![Running docker exec](/media/2023/03/docker-local-2.png)

## Deploy to Azure DevOps

### Push code

There are several ways to push your code to Azure DevOps, you can check this [reference](https://learn.microsoft.com/en-us/azure/devops/repos/git/share-your-code-in-git-vs?view=azure-devops&tabs=command-line), here is one using command line with git commands.

```bash
git init
git add .
git commit -m "Initial Commit"
git remote add devops "<azure-devops-git-url>"
git push devops master
```


### Create a Pipeline

In this section, we are using Azure Container Registry to host our image.

1. Select `Pipelines`, then click in `New pipeline`.
2. Select `Azure Repos Git`, then select a repository.
3. Pick `Docker - Build and push an image to Azure Container Registry` template.
    ![Pipeline](/media/2023/03/devops-docker-01.png)
4. Select an `Azure Subscription` and then select a `Container Registry`, followed by `Image Name` and `Dockerfile` location.
    ![Pipeline](/media/2023/03/devops-docker-02.png)
5. After the yaml template is created, you can click on `Show assistant` and add new task `Azure Functions for container` and set the values for app name, image and subscription.

    >Note: You can review all the available inputs for this task [here](https://learn.microsoft.com/en-us/azure/devops/pipelines/tasks/reference/azure-function-app-container-v1?view=azure-pipelines).

    ![Pipeline](/media/2023/03/devops-nodejs-05-1.png)
6. You can use variables to handle better secrets or avoid hardcoding in the template. Click on `Variables` to add.
    ![Pipeline](/media/2023/03/devops-docker-03.png)
7. You can customize your template replacing values with values. Here is a final template:
    ```yaml
        trigger:
        - master

        resources:
        - repo: self

        variables:
        # Container registry service connection established during pipeline creation
        dockerRegistryServiceConnection: '$(service_connection)'
        imageRepository: '$(image_name)'
        containerRegistry: '$(container_registry)'
        dockerfilePath: '$(Build.SourcesDirectory)/Dockerfile'
        tag: '$(tag_version)'

        # Agent VM image name
        vmImageName: 'ubuntu-latest'

        stages:
        - stage: Build
          displayName: Build and push stage
          jobs:
          - job: Build
            displayName: Build
            pool:
              vmImage: $(vmImageName)
            steps:
            - task: Docker@2
              displayName: Build and push an image to container registry
              inputs:
                command: buildAndPush
                repository: $(imageRepository)
                dockerfile: $(dockerfilePath)
                containerRegistry: $(dockerRegistryServiceConnection)
                tags: |
                  $(tag)
            - task: AzureFunctionAppContainer@1
              inputs:
                azureSubscription: $(subscription)
                appName: '$(app_name)'
                appSettings: '-DOCKER_REGISTRY_SERVER_URL $(registry_url) -DOCKER_REGISTRY_SERVER_USERNAME $(registry_username) -DOCKER_REGISTRY_SERVER_PASSWORD $(registry_password)'
                imageName: '$(container_registry)/$(imageRepository):$(tag_version)'
    ```
8. Final step will be to set up `DOCKER_REGISTRY_SERVER_URL`, `DOCKER_REGISTRY_SERVER_USERNAME` and `DOCKER_REGISTRY_SERVER_PASSWORD` appsettings for authentication with azure container registry and be able to pull the image correctly into the hosting plan, for this you need first to enable `Admin Credentials` in the ACR side.

   >Note: There are several ways to pull container images from ACR like using User/System Assigned MSI, check this [reference](https://github.com/Azure/app-service-linux-docs/tree/master/HowTo/Configure%20ACR%20with%20Managed%20Identities) for best practices.

9. Run pipeline to build/push and deploy your container.

   >Note: For the first time, it will require authorization for the service connection to access the resource.

### Create a Release Pipeline

If you don't prefer to combine the docker build and push tasks with the Azure Function Deploy task in same pipeline using YAML, then you can create a classic release pipeline and use the same task.

1. Click on `Create a new release pipeline`, then select `Empty job`.
2. In the default stage, create a task.
3. Select `Azure Functions for container` from the list.

    ![Release Pipeline](/media/2023/03/devops-nodejs-06.png)
4. Select from Subscription the function app name, and set the image and tag, as well as the AppSettings for authentication with azure container registry and be able to pull the image correctly into the hosting plan. You can use variables.

    ![Release Pipeline](/media/2023/03/devops-nodejs-07.png)

    >**Note**: If you are using Azure Container Registry, follow this syntax for image name:  `<container_registry_name>.azurecr.io/<image_name>:<tag>`
5. Finally deploy your custom container

## Deploy to Azure DevOps with Self-Hosted agent in Docker

>**Note**: This article will cover the basic configuration you can follow for setting up an environment, but it is not intended to be applicable for production environments. Every app's purpose is different and will require network security validation and best practices, please consider configure into a dev/test scenario.

### Configuring SKU and Azure Container Registry

#### VNET and Private DNS Zone
>If you are looking for steps using az cli, check this [reference](https://azure.github.io/AppService/2021/07/03/Linux-container-from-ACR-with-private-endpoint.html#1-create-network-infrastructure).

1. Create a [VNET (Virtual Network)](https://portal.azure.com/#create/Microsoft.VirtualNetwork-ARM). For this example you can leave address space by default to (10.0.0.0/16)

    ![VNET 1](/media/2023/03/vnet-1.png)

2. We need create two subnets, one for the regional VNET integration and one for the private endpoints. The address-prefix size must be at least **/28** for both subnets. 
    >Note: Small subnets (CIDR block size) can affect scaling limits and the number of private endpoints. You can review the [subnet requirements](https://learn.microsoft.com/en-us/azure/app-service/overview-vnet-integration#subnet-requirements) for VNET integration with App Service. It is recommended to set up with /26 or /24 for both subnets.

    ![VNET 2](/media/2023/03/vnet-2.png)
3. Designate a subnet to be used by App Service, and delegate it to `Microsoft.Web/serverFarms`
    ![VNET 3](/media/2023/03/vnet-3.png)

4. Create a [Private DNS Zone](https://ms.portal.azure.com/#create/Microsoft.PrivateDnsZone-ARM) to host the DNS records for [private endpoints](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview). Use **`privatelink.azurecr.io`** for the name.
   
   ![VNET 4](/media/2023/03/vnet-4.png)

5. Link the Private DNS Zone to your VNET. 
   - In the Private DNS Zone, click on `Virtual network links` and then click on `Add`. 
   - Set a `link name`, then select your created `vnet` and disable `Auto-Registration`.

    ![VNET 5](/media/2023/03/vnet-5.png)

#### Azure Container Registry

1. Create a [Container Registry](https://portal.azure.com/#create/Microsoft.ContainerRegistry), in the same region where you will be hosting your App Service and select Premium to enable private endpoints. 

    ![ACR](/media/2023/03/acr-1.png)

2. In the `Networking tab`, select `Public access` for now, to add your ip address before securing the registry.
3. Review and Create the resource.
4. Once created, go to `Networking` blade and under `Public access` click on `Selected networks` and then add your `ip address`, this is to allow you access to the ACR repositories through the portal for any configuration. Click on `Save`.

    ![ACR](/media/2023/03/acr-2.png)
5. Go to `Private access` tab:
   - Click on **`Create a private endpoint connection`**.
   - Set a private endpoint `name` and NIC name
   
      ![ACR](/media/2023/03/acr-3.png)

   - Pick `registry` as  Target sub-resource.
   - Select your `VNET` and `subnet` created for private endpoints.
   - Finally click Yes to `Integrate with private DNS Zone` and select your private DNS Zone.

     ![ACR 2](/media/2023/03/acr-4.png)
6. Review and create the resource.

>Note: It is important to review if the PE connection was approved and provision state was succeeded.

### Configuring Self-Hosted Agent

#### Virtual Machine

1. Create a new subnet in your VNET for Virtual Machines. In this example, we are using a small subnet size /27. 

     ![VNET](/media/2023/03/vnet-6.png)

2. Create a [Virtual Machine](https://portal.azure.com/#create/Microsoft.VirtualMachine-ARM). For this lab we are selecting `Ubuntu Server 20.04 LTS`. It is important that you validate the [prerequisites for Self-hsoted Linux Agents](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/v2-linux?view=azure-devops#check-prerequisites).
3. Follow steps, set a user and select authentication type (SSH public key or password).
4. In `Networking` tab, select the new subnet you createad for VM.

    ![VNET](/media/2023/03/vm-1.png)
5. It is important you allow SSH port on the NSG to continue setting up the agent in the next step.
6. After created, you can use several tools as `Putty` or `openssh` included in git tools. If you choose SSH public key, you can download and pass that file as parameter:

    **`ssh -i .\docker-selfhosted-agent_key.pem <user>@<vm-ip-address>`**

    Here is a quick reference to [how to connect to a Linux Virtual Machine using SSH keys](https://learn.microsoft.com/en-us/azure/virtual-machines/linux-vm-connect?tabs=Linux).

#### Configure Authentication

In this lab, we are using personal access token (PAT) but validate and read carefully the security information for self-hosted agents [here](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/v2-linux?view=azure-devops#information-security-for-self-hosted-agents). 

1. Access to your Azure DevOps organization through `(https://dev.azure.com/<your_organization>).`
2. From default page, open user settings and then click on `Personal access tokens`:
    ![VNET](/media/2023/03/devops-self-agent-01.png)
3. Create a new personal access token and select `Agent Pools (read, manage)` as scope. If this is a deployment group agent, select `Deployment group (read, manage)`.

    ![VNET](/media/2023/03/devops-self-agent-02.png)

4. Copy your token since Azure DevOps doesn't store it and you will not be able to see it again.

#### Configure Agent Pool

There are different ways to configure an agent, you can do [runing in Docker](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/docker?view=azure-devops) or installing directly in the Self-hosted Linux box. For this lab, we are going to install directly on the Linux machine.

1. Go to `Organization settings`, and then under `Pipelines` click on `Agent Pools`.
2. Click on `Default` and then click on `Agents` and add a `New agent`.
    
    ![VNET](/media/2023/03/devops-self-agent-03.png)
3. This will prompt you the steps to download the agent. In this lab, select `Linux-x64` and copy the download link.
4. In your SSH session on your Linux VM, use `wget` to download the tar.gz file and extract it.

    **`cd ~ && mkdir myagent && wget -c https://vstsagentpackage.azureedge.net/agent/3.218.0/vsts-agent-linux-x64-3.218.0.tar.gz -O - | tar -xz -C ~/myagent`**

5. Configure the agent with:

    **`cd ~/myagent && bash ./config.sh`**

    Follow the steps to accept Team Explorer Everywhere license, enter server url `https://dev.azure.com/<your_organization>`, PAT as authentication, your token, agent name and work folder.

    ![VNET](/media/2023/03/devops-self-agent-04.png)

6. There are different ways to run the agent. In this lab, we running as a systemd service. You can check other options as [run interactively](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/v2-linux?view=azure-devops#run-interactively), [run once](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/v2-linux?view=azure-devops#run-once).

    - A `./svc.sh` script was generated after configuring the agent.
    - Run the following commands:
        ```bash
        cd ~/myagent
        sudo ./svc.sh install [username]
        ```
    - To start/get status/stop the service you can use:
        ```bash
        sudo ./svc.sh start
        sudo ./svc.sh status
        sudo ./svc.sh stop
        ```
    - You can ls this folder `ls /etc/systemd/system` and check for systemd service file `/etc/systemd/system/vsts.agent.{tfs-name}.{agent-name}.service` that was created in the install process. Then you can use **`sudo ./svc.sh start`** or `systemctl start vsts.agent.{tfs-name}.{agent-name}.service` to start the service.

      ![VNET](/media/2023/03/devops-self-agent-05.png)
7. After doing that, you can see the self-hosted agent Online.
      
      ![VNET](/media/2023/03/devops-self-agent-06.png)

#### Installing Docker on Agent
1. Follow steps to install Docker in Ubuntu 20.04. Steps can vary, please validate always updated information.

    ```bash
    cd ~
    sudo apt update
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
    apt-cache policy docker-ce

    sudo apt-get install -y docker-ce docker-ce-cli
    sudo groupadd docker
    sudo usermod -aG docker $USER
    sudo usermod -aG sudo $USER
    sudo chmod 666 /var/run/docker.sock
    sudo systemctl start docker
    ```
2. To apply the new group membership, you need to type **`sudo su`** and then type **`su {your-username}`**
3. To check if docker is running use **`docker -v`** or **`docker info`**.


### Create Function App and VNET integration

>Note: These steps will also apply for [Web Apps for Containers(WafC)](https://portal.azure.com/#create/Microsoft.WebSite), here is another reference for [WafC and Azure DevOps](https://azureossd.github.io/2023/02/06/Deploying-Web-App-for-Containers-with-CI-CD-pipelines/index.html#azure-devops-pipelines).

1. Create [Function Custom Container App](https://ms.portal.azure.com/#create/Microsoft.FunctionApp).
2. For now select `Enable public access - On` and `Single Container - Quickstart`.
3. Create and Review
4. After created, go to `Networking` tab, click on `VNET integration` under `Outbound Traffic`.
5. Click on `Add VNet` and select `Virtual Network` created before.
6. Finally add appsetting **`WEBSITE_PULL_IMAGE_OVER_VNET=true`** to avoid pulling the container over outbound ip address instead of vnet ip.

### ACR Authentication

You can use several ways to authenticate, using Admin user, System assigned or User Assigned. For the purpose of this lab, we will use `Admin user`. 

1. Go to your ACR and click on `Access keys` and then enable `Admin user`.
2. Copy username, password and login server for next step.


### Configure Pipeline with Agent

1. Follow the same steps described in [Create a pipeline section](https://azureossd.github.io/2023/03/20/how-to-deploy-azure-functions-as-custom-container-using-azure-devops/index.html#create-a-pipeline).
2. In this pipeline set the `pool` name to 'Default' or custom pool configured, also set `vmImage` to the name of your docker self-hosted agent. Also you can add [DOCKER_BUILDKIT:1](https://docs.docker.com/build/buildkit/) to improved build's performance

   >Note: If you don't set a pool name it will use the `Azure Pipelines` by default.

    ```yaml
        trigger:
        - master

        resources:
        - repo: self

        variables:
        # Container registry service connection established during pipeline creation
        dockerRegistryServiceConnection: '$(service_connection)'
        imageRepository: '$(image_name)'
        containerRegistry: '$(container_registry)'
        dockerfilePath: '$(Build.SourcesDirectory)/Dockerfile'
        tag: '$(tag_version)'
        DOCKER_BUILDKIT: 1

        stages:
        - stage: Build
          displayName: Build and push stage
          jobs:
        -   job: Build
            displayName: Build
            pool:
              name: 'Default'
              vmImage: '$(vmImageName)'
            steps:
            - task: Docker@2
              displayName: Build and push an image to container registry
              inputs:
                command: buildAndPush
                repository: $(imageRepository)
                dockerfile: $(dockerfilePath)
                containerRegistry: $(dockerRegistryServiceConnection)
                tags: |
                  $(tag)
            - task: AzureFunctionAppContainer@1
              inputs:
                azureSubscription: '$(subscription)'
                appName: '$(app_name)'
                imageName: '$(container_registry)/$(imageRepository):$(tag_version)'
                appSettings: '-DOCKER_REGISTRY_SERVER_URL $(registry_url) -DOCKER_REGISTRY_SERVER_USERNAME $(registry_username) -DOCKER_REGISTRY_SERVER_PASSWORD $(registry_password)'
    ```
>Note: Ensure that pipeline yaml has acess to the Pool. An easy shortcut it is to go under Pool Security tab and open or restrict access to pipelines.
3. Run pipeline to deploy.

### Assign Private Endpoint and Restrict Public Access

To secure your function app and scm sites with Private endpoints and Access restrictions disabling public network access.

1. Select `Networking` and under `Inbound Traffic`, select `Private endpoints`, select `Express`.
2. Select `VNET` and private endpoints `subnet`. Then integrate with `private DNS Zone`.
    
    ![PE](/media/2023/03/function-pe-01.png)

3. Under `Inbound Traffic`, select `Access restriction` and uncheck `Allow public access`

    ![PE](/media/2023/03/function-pe-00.png)
4. You can use the same VM that is linked to the VNET or any other computer on the same VNET. 

    ![PE](/media/2023/03/function-pe-02.png)

# Troubleshooting

First thing is to identify what type of issue you are troubleshooting. Is this a deployment issue or post-deployment issue? Here is a list of the most common scenarios deploying from Azure DevOps to Linux SKU.

## Deployment issues

### 400 errors
- **Error**: 
    -  `Failed to patch App Service '<function_name>' configuration. Error: BadRequest - The parameter LinuxFxVersion has an invalid value. (CODE: 400)`
- **Action Plan**: 
    - Review for syntax on the image name, if you are using ACR, it needs to follow `<container_registry_name>.azurecr.io/<image_name>:<tag>`
- Other possible scenarios when ocurring 400 errors are due to several reasons:
    - [High density](https://learn.microsoft.com/en-us/azure/app-service/overview-hosting-plans#should-i-put-an-app-in-a-new-plan-or-an-existing-plan), too many applications hosted in the same SKU (App Service Plan). Split your apps into several SKUs. 
    - High resource consumption (CPU, Memory, High latency, etc) that can be affecting the deployment process. 

### 403 errors
- **Errors**: 
    - `Failed to fetch Kudu App Settings. Error: Ip Forbidden (CODE: 403)`
    - `Failed to patch App Service '<function_name>' configuration. Error: BadRequest - The parameter DOCKER_REGISTRY_SERVER_URL has an invalid value. Unexpected error when connecting to the registry. Cannot find available registry. https://<acr_name>.azurecr.io (CODE: 400) Error: Failed to update deployment history. Error: Ip Forbidden (CODE: 403)`
- **Action Plan**: 
    - Mainly reason is that Azure DevOps Agent can't access Kudu endpoint.
    - Validate if there is any IP Restrictions rules under scm site. 
    - Using VNET and private endpoint?
      - You need a self-hosted agent and add a private DNS entry for the web app and scm sites in DNS private zone or custom DNS Server, check [reference](https://learn.microsoft.com/en-us/azure/app-service/networking/private-endpoint#dns).
      - Review if the self-hosted agent is not blocked by NSG rules. 
      - If your self-hosted agent is running behind a web proxy, check this [reference](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/proxy?view=azure-devops&tabs=unix).

### 409 errors
- Usually when you get 409 errors means that there is a deployment in progress or after swapping slots the container is not startup up and timing out, or a restart was ocurring in between Azure DevOps with multiple requests.
- **Action Plan**: 
  - If you are swapping check this [reference](https://azureossd.github.io/2023/03/15/Troubleshooting-Failed-Slot-Swaps-on-App-Service-Linux/index.html).
  - Validate any restart in between your deployment process. (E.g. App Settings update)


## Post deployment issues (Startup)

- You can check the following references for most common scenarios when pulling and starting up containers on App Service Linux, which applies the same for Function Apps Custom Containers:
    - [Docker Pull errors on Linux Web App for Containers](https://azureossd.github.io/2023/02/28/Troubleshooting-common-Docker-Pull-errors-on-Linux-Web-App-for-Containers/index.html)
    - [Docker User Namespace remapping issues](https://azureossd.github.io/2022/06/30/Docker-User-Namespace-remapping-issues/index.html)
    - [App Settings empty and Manifest not found, etc](https://azureossd.github.io/2023/02/06/Deploying-Web-App-for-Containers-with-CI-CD-pipelines/index.html#troubleshooting)


# Additional References
- [Create a function on Linux using a custom container](https://learn.microsoft.com/en-us/azure/azure-functions/functions-create-function-linux-custom-image?tabs=in-process%2Cbash%2Cazure-cli%2Cv1&pivots=programming-language-javascript)
- [Deploy with the Azure Function App for Container task](https://learn.microsoft.com/en-us/azure/azure-functions/functions-how-to-azure-devops?tabs=dotnet-core%2Cyaml%2Ccsharp#deploy-a-container)
- [Deploying Linux custom container from private Azure Container Registry](https://azure.github.io/AppService/2021/07/03/Linux-container-from-ACR-with-private-endpoint.html)
- [Deploying to Network-secured sites](https://azure.github.io/AppService/2021/01/04/deploying-to-network-secured-sites.html)