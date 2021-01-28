---
title: "AKS deployment with ACR public endpoint disabled"
author_name: "Christopher Maldonado"
tags:
    - azure
    - aks
    - kubernetes
    - container registry
categories:
    - Azure Kubernetes Service # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/Kubernetes.svg" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
toc: true
toc_sticky: true
date: 2021-01-28 12:00:00
---

Deploying Azure Kubernetes Service with Azure Container Registry public endpoint disabled.

This excercise will guide you through the process of creating both an Azure Kubernetes Service managed cluster and an Azure Container Registry. Additionally, we will configure a Private Link to ACR as we will be disabling the public endpoint. This may be required for some environments per compliance requirements.

## Before we begin

You will need the following for this excercise:

1. Azure Subscription
2. Azure CLI - [Install](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
3. Docker Desktop - [Install](https://www.docker.com/products/docker-desktop)
    - Only if you will be building your Docker image locally.

We will be using these variables throught this excercise:

```json
ResourceGroup   = AKSACRResourceGroup
Location        = eastus
Virtual Network = AKSACRVNet
AKS Name        = AKSCluster
ACR Name        = ACRegistry
```

### Run the Azure CLI

Run the `login` command.

```batch
az login
```

This will open your default browser and load the Azure sign-in page.

If you have multiple Azure subscriptions you may will need to ensure the subscription you would like to work on is the active subscription.

To list your subscriptions use the `az account list` command:

```batch
az account list --output table
```

Set your subscription with the `az account set` command:

```batch
az account set --subscription "Name or SubscriptionID"
```

### Create a resource group

This will be the default resource group we will be using through this exercise.
Be sure to rename anything within `< >` as these are just placeholders.

```batch
az group create --name <AKSACRResourceGroup> --location <eastus>
```

## Deploying ACR

Create an Azure Container Registry. If you already have an ACR created, be sure it is on the Premium tier as this will allow for Firewall settings.

```batch
az acr create --resource-group <AKSACRResourceGroup> --name <ACRegistry> --sku Premium
```

## Configuring ACR

### Enable Admin User

Once we have our ACR deployed, we will need to enable the admin user. This is required as it allows you to the Docker CLI to push your image to your registry.

```batch
az acr update --resource-group <AKSACRResourceGroup> --name <ACRegistry> --admin-enabled
```

### Upload Images

Login to your Azure Container Registry with the Docker CLI.

```batch
docker login <acregistry>.azurecr.io
```

If you are building your application again be sure to tag your image with the appropriete registry and image name.

```batch
docker build -t <acregistry>.azurecr.io/<image-name>:<tag> <dockerfile location>
```

If you already have a built image and just want to retag the image use the following command.

```batch
docker tag <old-image> <acregistry>.azurecr.io/<image-name>:<tag>
```

Once you have your image, push the image to your container registry.

```batch
docker push <acregistry>.azurecr.io/<image-name>:<tag>
```

### Disable Public Access

Once you have pushed all your required images to your registry, we can now disable public access to your container registry.

```batch
az acr update --resource-group <AKSACRResourceGroup> --name <ACRegistry> --public-network-enabled false
```

## Deploying AKS

Since we are going to be using a Private Link with out AKS cluster, we will need to setup a virtual network for the services to communicate over. The following command will create a virtual network with the address prefix of `10.0.0.0/16` with a subnet named `default` that has a prefix of `10.0.0.0/22`.

```batch
az network vnet create --name <AKSACRVNet> --resource-group <AKSACRResourceGroup> --address-prefix 10.0.0.0/16 --subnet-name default --subnet-prefix 10.0.0.0/22
```

Once the virtual network and subnet have been completed, we will need to query the resource id that we will use in our AKS deployment command.

```batch
az network vnet subnet show --name default --resource-group <AKSACRResourceGroup> --vnet-name <AKSACRVNet> --query id --output tsv
```

We are now ready to create our Azure Kubernetes Service cluster. We will be using a preview extension as this allows us to change the name of the default node resource group.

```batch
az extension add --name aks-preview
```

We will now create the Azure Kubernetes Service. The following command is using virtual machine size of `Standard_B2s`. You could find more sizes that fit your need [here](https://docs.microsoft.com/en-us/azure/virtual-machines/sizes). We are also using a cluster size of `4` nodes, service-cidr of `10.2.0.0/16` and DNS service IP of `10.2.0.10`. For more info on networking, [read here](https://docs.microsoft.com/en-us/azure/aks/concepts-network).

```batch
az aks create --resource-group <AKSACRResourceGroup> --name <AKSCluster> --node-resource-group <AKSClusterResources> --node-vm-size Standard_B2s --node-count 4 --network-plugin azure --vnet-subnet-id <AKSACRVNet-Subnet-ID> --dns-name-prefix <AKSACRCluster-dns> --attach-acr <ACRegistry> --service-cidr 10.2.0.0/16 --dns-service-ip 10.2.0.10 --docker-bridge-address 172.17.0.1/16
```

## Setting up Private Link

Now that the cluster has deployed successfully, we will start working on the Private Link. There are quite a few steps for this one. If you would like to use the Azure Portal to make it easier, you can go [here](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-private-link#set-up-private-link---portal) for those steps.

Update the subnet configuration to disable network polices such as security groups for the private endpoint.

```batch
az network vnet subnet update --name default --resource-group <AKSACRResourceGroup> --vnet-name <AKSACRVNet> --disable-private-endpoint-network-policies
```

Create a private DNS zone for the private Azure Container Registry domain. In later steps we will populate the zone with records. The zone MUST be named `privatelink.azurecr.io`.

```batch
az network private-dns zone create --resource-group <AKSACRResourceGroup> --name "privatelink.azurecr.io"
```

Associate the private zone to your virtual network.

```batch
az network private-dns link vnet create --resource-group <AKSACRResourceGroup> --zone-name "privatelink.azurecr.io" --name <ACRDNSLink> --virtual-network <AKSACRVNet> --registration-enabled false
```

The following command with output the Azure Container Registry's ID which will be used in the following command.

```batch
az acr show --name <ACRegistry> --query id --output tsv
```

We will now create the endpoint and service connection for the container registry resource.

```batch
az network private-endpoint create --name <ACRPrivateEndpoint> --resource-group <AKSACRResourceGroup> --vnet-name <AKSACRVNet> --subnet default --private-connection-resource-id <ACRegistry-ID> --group-id registry --connection-name <PEConnection>
```

We will need to query a few values in the next commands to used to create our DNS records.

NetworkInterfaceID

```batch
az network private-endpoint show --name <ACRPrivateEndpoint> --resource-group <AKSACRResourceGroup> --query networkInterfaces[0].id --output tsv
```

Private_IP

```batch
az resource show --ids <NetworkInterfaceID> --api-version 2019-04-01 --query properties.ipConfigurations[1].properties.privateIPAddress --output tsv
```

DataEndPoint_Private_IP

```batch
az resource show --ids <NetworkInterfaceID> --api-version 2019-04-01 --query properties.ipConfigurations[0].properties.privateIPAddress --output tsv
```

Create the DNS A record sets for the registry endpoint and data endpoint.

```batch
az network private-dns record-set a create --name <ACRegistry> --zone-name privatelink.azurecr.io --resource-group <AKSACRResourceGroup>
```

```batch
az network private-dns record-set a create --name <<ACRegistry>.<Location>.data> --zone-name privatelink.azurecr.io --resource-group <AKSACRResourceGroup>
```

Create the DNS A records for the registry endpoint and data endpoint.

```batch
az network private-dns record-set a add-record --record-set-name <ACRegistry> --zone-name privatelink.azurecr.io --resource-group <AKSACRResourceGroup> --ipv4-address <Private_IP>
```

```batch
az network private-dns record-set a add-record --record-set-name <<ACRegistry>.<Location>.data> --zone-name privatelink.azurecr.io --resource-group <AKSACRResourceGroup> --ipv4-address <DataEndPoint_Private_IP>
```

You now have a private Azure Container Registry that is accessible via your virtual network linked to your Azure Kubernetes Service.

## Deploy application to AKS

In order to deploy and run commands against the AKS cluster, we will need to gather the credentials to do so.

```batch
az aks get-credentials --resource-group <AKSACRResourceGroup> --name <AKSCluster>
```

Once you have the credentials saved, you will need to create a deployment yaml which will be used the Kubernetes to create PODs and Services. For more info on Kubernetes, you can navigate [here](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/). Below is an example yaml file used for deploying an application and creating a load balancer for external access.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <deployment-or-app-name>
spec:
  replicas: 1
  selector:
    matchLabels:
      app: <deployment-or-app-name>
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  minReadySeconds: 5 
  template:
    metadata:
      labels:
        app: <deployment-or-app-name>
    spec:
      nodeSelector:
        "beta.kubernetes.io/os": linux
      containers:
      - name: <deployment-or-app-name>
        image: <ACRegistry>.azurecr.io/<image-name>:<tag>
        ports:
        - containerPort: <app-port>
        resources:
          requests:
            cpu: 250m
          limits:
            cpu: 500m
---
apiVersion: v1
kind: Service
metadata:
  name: <deployment-or-app-name>
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: <app-port>
  selector:
    app: <deployment-or-app-name>
```

Once you have your yaml file ready, you can now apply it to your AKS Cluster.

```batch
kubectl apply -f <deployment.yaml>
```

Once this has been applied, you can `watch` the service as it starts up. This will also give you the Public IP so you could access this deployment.

```batch
kubectl get service <deployment-or-app-name> --watch
```

## Conclusion

This exercise can be used for a proof of concept for whatever fits your need. For more references on some of the topics discussed, feel free to browse the following.

[What is Kubernetes?](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/)
[Introduction to Azure Kubernetes Service](https://docs.microsoft.com/en-us/azure/aks/intro-kubernetes)
[Introduction to private Docker container registries in Azure](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-intro)
[kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
[Setting up Private Link to Azure Container Registry](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-private-link)
