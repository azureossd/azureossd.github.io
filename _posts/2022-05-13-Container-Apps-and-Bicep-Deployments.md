---
title: "Container Apps and Bicep deployments"
author_name: "Anthony Salemo"
tags:
    - Container Apps
    - Kubernetes
    - Deploy
    - Bicep
categories:
    - Container Apps
    - Kubernetes
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/azure-containerapps-logo.png
toc: true
toc_sticky: true
date: 2022-05-13 12:00:00
---

This post provides information for deploying Container Apps with Bicep. 

# Getting started

[Azure Container Apps](https://docs.microsoft.com/en-us/azure/container-apps/overview) enables you to run microservices and containerized applications on a serverless platform. There is a few ways currently to deploy your applications to it, either from [Bicep](https://docs.microsoft.com/en-us/azure/container-apps/microservices-dapr-azure-resource-manager?tabs=bash&pivots=container-apps-bicep) and [ARM templates](https://docs.microsoft.com/en-us/azure/container-apps/microservices-dapr-azure-resource-manager?tabs=bash&pivots=container-apps-arm), GitHub Actions, [Azure Portal](https://docs.microsoft.com/en-us/azure/container-apps/get-started-existing-container-image-portal?pivots=container-apps-private-registry), [Azure CLI](https://docs.microsoft.com/en-us/azure/container-apps/get-started-existing-container-image?tabs=bash&pivots=container-apps-private-registry), [Visual Studio](https://docs.microsoft.com/en-us/azure/container-apps/deploy-visual-studio), and [Visual Studio Code](https://docs.microsoft.com/en-us/azure/container-apps/deploy-visual-studio).

We'll be focusing on Bicep in this post.

**Prerequesites**:
1. If not done so already, install Bicep via the AZ CLI, PowerShell or manually. You can follow [this documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/install) for further details.
2. Add the [Visual Studio Code Bicep extension](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/install#vs-code-and-bicep-extension). This can be helpful as having this extension can help validate your Bicep file through language support and resource autocompletion.
3. **(Optional)**: If developing in Visual Studio Code, you can add the [Azure Container Apps extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurecontainerapps) as well for your development environment.

After successfully installing Bicep, you can check the current version to verify installation by running [`az bicep version`](https://docs.microsoft.com/en-us/cli/azure/bicep?view=azure-cli-latest)

```shell
$ az bicep version
Bicep CLI version 0.6.1 (73193aa4c4)
```

## Create a quickstart template
The below template will be used as a quickstart using the public [NGINX DockerHub image](https://hub.docker.com/_/nginx/) to get us started.

The below template will create the following:
- A Log Analytics workspace. The name of it comes from the `logAnalyticsWorkspaceName` variable. Denoted by the `resource logAnalyticsWorkspace'Microsoft.OperationalInsights/workspaces@2020-03-01-preview'` declaration.
- A Container Apps environment. Denoted by the `resource environment 'Microsoft.App/managedEnvironments@2022-01-01-preview'` declaration.
- Our Container App itself. Denoted by the `resource nginxcontainerapp 'Microsoft.App/containerApps@2022-01-01-preview'` declaration.

> **NOTE**: You can review the current API versions [here](https://docs.microsoft.com/en-us/azure/templates/microsoft.app/2022-03-01/containerapps?tabs=bicep). API specifications may change while in preview.

Name this file to one of your choosing, make sure it ends with `.bicep`. For this scenario, we can name it `nginx.bicep`.


```arm
param environment_name string
param location string 

var logAnalyticsWorkspaceName = 'logs-${environment_name}'

resource logAnalyticsWorkspace'Microsoft.OperationalInsights/workspaces@2020-03-01-preview' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: any({
    retentionInDays: 30
    features: {
      searchVersion: 1
    }
    sku: {
      name: 'PerGB2018'
    }
  })
}

resource environment 'Microsoft.App/managedEnvironments@2022-03-01' = {
  name: environment_name
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: reference(logAnalyticsWorkspace.id, '2020-03-01-preview').customerId
        sharedKey: listKeys(logAnalyticsWorkspace.id, '2020-03-01-preview').primarySharedKey
      }
    }
  }
}

resource nginxcontainerapp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'nginxcontainerapp'
  location: location
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 80
      }
    }
    template: {
      containers: [
        {
          image: 'nginx'
          name: 'nginxcontainerapp'
          resources: {
            cpu: '0.5'
            memory: '1.0Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}

```

**Some takeaways**:

1. It is also advised to deploy an Application Insights instance but in this scenario it's removed for simplicitly. 
2. Since this image is public we don't need to specify any `registries`, this will also pull from DockerHub automatically.  
3. For applications that need to be accessed from external clients (eg., browsers, other clients, applications hosted somewhere else) - set `external` in `ingress` to `true`. **Note that `targetPort` should be set to the exposed port for the Docker Image**.
4. The `name` property under `containers` can be any arbitrary name. However, the **`name` property directly under `resource` within the object will be the actual name of your resource**.
5. The other values under `resources`, `scale`, and the Log Analytics Workspace resource can be changed or tweaked as needed. These are set to simple defaults following [this](https://docs.microsoft.com/en-us/azure/container-apps/microservices-dapr-azure-resource-manager?tabs=bash&pivots=container-apps-bicep#create-azure-bicep-templates.)

> **NOTE**: If the Bicep extension is installed then hovering over properties or other objects within the file should present a tooltip with the description of what you're inspecting. This can be useful for debugging or learning.

> **TIP**: Some values in the above Bicep file can be hardcoded instead of parameterized, but it's recommended to set these are parameters instead for flexibility.


To deploy this, run the following in your terminal:

```shell
export RESOURCE_GROUP="yourresourcegroup"
export CONTAINERAPPS_ENVIRONMENT="yourcontainerappenvironment"
export LOCATION="eastus"
```

With these variables set, we can now run the actual deployment command.

```shell
az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file ./nginx.bicep \
  --parameters \
    environment_name="$CONTAINERAPPS_ENVIRONMENT" \
    location="$LOCATION" \
```

> **NOTE**: The following message may be seen and can be ignored: `Warning BCP036: The property "cpu" expected a value of type "int | null" but the provided value is of type "'0.5'". If this is an inaccuracy in the documentation, please report it to the Bicep Team. [https://aka.ms/bicep-type-issues]`

This command may take a few minutes to run. After a successful deployment a large JSON output should show in the terminal showing your newly provisioned resources. Any non-successful deployments will be output as errors.

Navigate to the Azure Portal for your Container App and click on the Application URL, you should now see the Container App running.

# Using Private Container Registries

Private Container Registries can be used, such as DockerHub or Azure Container Registry. 

## Azure Container Registry
The below file is using Azure Container Registry - note the following points:

1. We use the `@secure()` decorator for our Azure Container Registry password - more information [here](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/scenarios-secrets#use-secure-parameters).
2. We add the `registries` property, which is an array of objects under the `configuration` object.
3. We change the `image` property to reflect the full value of the image we're pulling, in the format of mycontainerregistry.azurecr.io/myacrimage:tagname
4. Aside from the decorator and paramterizing any values, these changes are **only** done in the Container App resource in the Bicep file. 

```arm
resource customimagecontainerapp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'customimagecontainerapp'
  location: location
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      secrets: [
        {
          name: 'containerregistrypasswordref'
          value: azureContainerRegistryPassword
        }
      ]
      ingress: {
        external: true
        targetPort: 8080
      }
      registries: [
        {
          // server is in the format of myregistry.azurecr.io
          server: azureContainerRegistry
          username: azureContainerRegistryUsername
          passwordSecretRef: 'containerregistrypasswordref'
        }
      ]
    }
    template: {
      containers: [
        {
          // This is in the format of myregistry.azurecr.io
          image: '${azureContainerRegistry}/customimagecontainerapp:latest'
          name: 'customimagecontainerapp'
          resources: {
            cpu: '0.5'
            memory: '1.0Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}
```

## DockerHub
If we wanted to target DockerHub instead of Azure Container Registry we would change this to the below. We're just updating the **registries** and **containers** array from the above template.:

```arm
...
other code..
...
  registries: [
      {
        server: 'index.docker.io'
        username: dockerContainerRegistryUsername
        passwordSecretRef: 'containerregistrypasswordref'
      }
    ]
  }
...
....
...
  containers: [
    {
      image: '${dockerContainerRepository}/someprivatedockerhubimage:tag'
      name: 'someprivatedockerhubimage'
      resources: {
        cpu: '0.5'
        memory: '1.0Gi'
      }
    }
  ]
...
other code..
...
```

# Managed Identity integration
We can specify our Container Apps to now use [Managed Identities](https://docs.microsoft.com/en-us/azure/container-apps/managed-identity?tabs=portal%2Cdotnet). Below we'll assume our Image we're deploying is configured to reach out to a KeyVault to retrieve secrets.

This assumes the KeyVault is already existing. 

## System Assigned Identity
Within our Container Apps `resource` we add the following property at the topmost level within the Container Apps resource object:

```arm
identity: {
    type: 'SystemAssigned'
}
```

If desired, environment variables for the Key Vault name and Secret can be added to the `containers` array if application code is expecting this. The `values` are parameterized:

```arm
env: [
    {
      name: 'KEY_VAULT_NAME'
      value: keyVaultName
    }
    {
      name: 'SECRET_NAME'
      value: secretName
    }
  ]
```
Lastly, we add the actual Access Policy for our Key Vault so this is configured during deployment and is ready to go when the container starts up to reach out for the secret.

```arm
resource keyVaultPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2021-11-01-preview' = {
  name: '${keyVaultName}/add'
  properties: {
    accessPolicies: [
      {
        objectId: reference('Microsoft.App/containerApps/${pythonmanagedidentitykv.name}', '2022-01-01-preview', 'Full').identity.principalId
        permissions: {
          secrets: [
            'get'
          ]
        }
        tenantId: subscription().tenantId
      }
    ]
  }
}
```
A full example can be found [here](https://github.com/azureossd/Container-Apps/tree/master/ManagedIdentity/python/system-assigned)
## User-Assigned Identities
User-Assigned Identites can be configured as well with the below steps:

1. Add a resource to create a User-Assigned identity during deployment. Note that `userAssignedIdentityName` is paramerized in this example:

```arm
resource userAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2018-11-30' = {
  location: location
  name: userAssignedIdentityName
}
```

2. Change the `identities` object we referenced in the System Assigned example to the following:
> **NOTE** `userAssignedIdentities` value of the key/value pair [can take an empty object](https://docs.microsoft.com/en-us/azure/templates/microsoft.app/containerapps?tabs=bicep#managedserviceidentity)

```arm
identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${resourceId('Microsoft.ManagedIdentity/userAssignedIdentities', userAssignedIdentity.name)}': {}
    }
  }
```

3. Depending on what SDK is being used for User Assigned Managed Identity - for example, if using Python and referencing [this example on how to get the AZURE_CLIENT_ID value](https://docs.microsoft.com/en-us/python/api/overview/azure/identity-readme?view=azure-python#specify-a-user-assigned-managed-identity-for-defaultazurecredential), you can add the Client ID of the Identity to the environment variable expected the by application like the below:

```arm
env: [
    {
      name: 'KEY_VAULT_NAME'
      value: keyVaultName
    }
    {
      name: 'SECRET_NAME'
      value: secretName
    }
    {
      name: 'AZURE_CLIENT_ID'
      value: reference(resourceId('Microsoft.ManagedIdentity/userAssignedIdentities', userAssignedIdentity.name)).clientId
    }
```
This will populate the AZURE_CLIENT_ID environment variable with the Client ID and can be referenced at runtime by the application needing to use the specific User Assigned Identity.

A full example can be found [here](https://github.com/azureossd/Container-Apps/tree/master/ManagedIdentity/python/user-assigned).


# Dapr
Dapr configuration can enabled as seen [here](https://docs.microsoft.com/en-us/azure/container-apps/microservices-dapr-azure-resource-manager?tabs=bash&pivots=container-apps-bicep).

The bare minimum for enabling Dapr is adding the following to the `configuration` object for the Container App resource itself:

```arm
dapr: {
    enabled: true
    appId: 'daprcontainerappsstatemanagement'
    appPort: 8000
  }
```

As seen in the above documentation link, if desired, you can instead add a Bicep `resource` for Dapr Components as a completely separate resource like [this](https://docs.microsoft.com/en-us/azure/templates/microsoft.app/managedenvironments/daprcomponents?tabs=bicep#template-format) as opposed to being a 'child' resource of the Managed Environment itself.

After deploying with a Dapr enabled application you can verify the components that get loaded. By default, the Secret Store component is loaded. In the above links, the State Store component is used as an example. Using [the approach seen here](https://docs.microsoft.com/en-us/azure/container-apps/monitor?tabs=bash#viewing-logs) to query logs via Log Analytics, we can comfirm this would be loaded after deployment:

`level=info msg="component loaded. name: statestore, type: state.azure.blobstorage/v1"`

**Important**:
When using Dapr components, you want to specify the names of the application that can use said component. In the Container App resource, the `daprId` should match the `scopes` property within the component being defined, like the below:

```arm
dapr: {
    enabled: true
    appId: 'daprcontainerappsstatemanagement'
    appProtocol: 'http'
    appPort: 8000
  }
```

```arm
..other component properties..
...
scopes: [
    'daprcontainerappsstatemanagement'
  ]
..
```
If these do not match then the application relying on this component may fail since it's not registered to use it.

The Bicep definition for scopes can be found [here](https://docs.microsoft.com/en-us/azure/templates/microsoft.app/managedenvironments/daprcomponents?tabs=bicep#daprcomponentproperties).

## Switching out components

Components can be switched out as needed. Using [this example](https://docs.microsoft.com/en-us/azure/container-apps/microservices-dapr-azure-resource-manager?tabs=bash&pivots=container-apps-bicep#create-azure-bicep-templates) which uses a State Storage component, we can effectively just replace a few values to switch to use another component, like the one below - which uses PubSub with Azure EventHubs.

```arm
resource daprComponent 'Microsoft.App/managedEnvironments/daprComponents@2022-03-01' = {
  name: 'pubsub'
  parent: environment
  properties: {
    componentType: 'pubsub.azure.eventhubs'
    version: 'v1'
    ignoreErrors: false
    initTimeout: '5s'
    secrets: [
      {
        name: 'storageaccountkey'
        value: listKeys(resourceId('Microsoft.Storage/storageAccounts/', storageAccountName), '2021-09-01').keys[0].value
      }
    ]
    metadata: [
      {
        name: 'connectionString'
        value: 'Endpoint=sb://someeventhub.servicebus.windows.net/;SharedAccessKeyName=someeventhub-policy;SharedAccessKey=0000000aabbbcc0000000000000=;EntityPath=someeventhub-partition'
      }
      {
        name: 'storageAccountName'
        value: storageAccountName
      }
      {
        name: 'storageAccountKey'
        secretRef: 'storageaccountkey'
      }
      {
        name: 'storageContainerName'
        value: storageContainerName
      }
    ]
    scopes: [
      'checkout'
      'order-processor'
    ]
  }
}
```
If we deploy the above component, we can query `ContainerAppConsoleLogs_CL` and see this component would be loaded as the following in Dapr - `level=info msg="component loaded. name: pubsub, type: pubsub.azure.eventhubs/v1"`

Comparing this with the State Compenent, we can see these are effectively the same. The major takeaways here is making sure to replace `componentType` with the approviate value and matching the `metaData` values with the component you intend to use from Dapr. Here is a reference that can be used from Dapr for the [PubSub component with Azure Eventhub](https://docs.dapr.io/reference/components-reference/supported-pubsub/setup-azure-eventhubs/#component-format).

# Deploy to a VNET

## Deploy to an existing VNET
To deploy a Container App Environment to an existing we can add the `vnetConfigurationProperties` object into our Container App **Environment** `resource`, like the below:

```arm
vnetConfiguration: {
  internal: false
  infrastructureSubnetId: resourceId('Microsoft.Network/virtualNetworks/subnets', vnetName, infraSubnetName)
  dockerBridgeCidr: '10.2.0.1/16'
  platformReservedCidr: '10.1.0.0/16'
  platformReservedDnsIP: '10.1.0.2'
  runtimeSubnetId: resourceId('Microsoft.Network/virtualNetworks/subnets', vnetName, runtimeSubnetName)
}
```

> **NOTE**: `vnetName`, `runtimeSubnetName` and `infraSubnetName` are parameretized here. `vnetName` is the VNET that you intend to deploy into as well as the infrastructure Subnet name.

**infrastructureSubnetId**:
- Resource ID of a subnet for infrastructure components. This subnet must be in the same VNET as the subnet defined in runtimeSubnetId. Must not overlap with any other provided IP ranges.

**runtimeSubnetId**:
- Resource ID of a subnet that Container App containers are injected into. This subnet must be in the same VNET as the subnet defined in infrastructureSubnetId. Must not overlap with any other provided IP ranges

For `platformReservedCidr`, `platformReservedDnsIP` and `dockerBridgeCidr`, please see [this](https://docs.microsoft.com/en-us/azure/container-apps/vnet-custom?tabs=bash&pivots=azure-cli#networking-parameters) documentation. These properties are optional on this object during creation.

Read [this](https://docs.microsoft.com/en-us/azure/container-apps/networking#restrictions) for Subnet restrictions. For full Bicep type documentation on these properties, you can read this [here](https://docs.microsoft.com/en-us/azure/templates/microsoft.app/managedenvironments?tabs=bicep#vnetconfiguration).

## Deploy to a new VNET

To deploy to a new VNET, one that would be created in the same deployment, we can create a `resource` for our Virtual Network with a template like [this](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/scenarios-virtual-networks#virtual-networks-and-subnets). This may look something like the below:

```arm
resource virtualNetwork 'Microsoft.Network/virtualNetworks@2021-08-01' = {
  name: 'mynewvnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: infraSubnetName
        properties: {
          addressPrefix: '10.0.16.0/21'
        }
      }
      {
        name: runtimeSubnetName
        properties: {
          addressPrefix: '10.0.8.0/21'
        }
      }
    ]
  }
}
```

We can then directly reference the names of the created resource, eg. Virtual Network name and Subnet names

```arm
vnetConfiguration: {
  internal: false
  infrastructureSubnetId: resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, virtualNetwork.properties.subnets[0].name)
  dockerBridgeCidr: '10.2.0.1/16'
  platformReservedCidr: '10.1.0.0/16'
  platformReservedDnsIP: '10.1.0.2'
  runtimeSubnetId: resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, virtualNetwork.properties.subnets[1].name)
}
```

> **NOTE**: The above addresses are just used as examples. Replace yours as needed.

# Storage
## Setting and mounting Volumes

Volumes can be mounted in conjunction with Azure Storage. Applications can then use these mounts to read or write files from the path specified.

Under the Managed Environment resource, add the below as a child resource:

```yaml
resource azurefilestorage 'storages@2022-03-01' = {
    name: 'azurefilestorage'
    properties: {
      azureFile: {
        accountKey: azureStorageAccountKey
        accountName: azureStorageAccountName
        shareName: azureFileShareName
        accessMode: 'ReadWrite'
      }
    }
  }
```

> **NOTE**: Take note of 'azurefilestorage', this will be needed later

In the `template` property, add the following:

```yaml
template: {
      containers: [
        {
          image: '${azureContainerRegistry}/azurefilescontainerapps:latest'
          name: 'azurefilescontainerapps'
          resources: {
            cpu: '0.5'
            memory: '1.0Gi'
          }
          volumeMounts: [
            {
              mountPath: '/azurefiles'
              volumeName: 'azurefilemount'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
      volumes: [
        {
          name: 'azurefilemount'
          // https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/child-resource-name-type#within-parent-resource
          storageName: environment::azurefilestorage.name
          storageType: 'AzureFile'
        }
      ]
    }
  }
```

Points to note:
- `storageName` should match the Storage Resource defined above that resides as a child resource of the Managed Environment.
- `storageType` is set to AzureFile
- `name` is an arbitrary name for the volume mount that should match `name` under `volumeMounts` 
- `mountPath` is the path of where the volume will be mounted and the application can access said files

Documentation can be found [here](https://docs.microsoft.com/en-us/azure/container-apps/storage-mounts?pivots=aca-arm)

A deployable example can be found [here](https://github.com/azureossd/Container-Apps/tree/master/Storage).

