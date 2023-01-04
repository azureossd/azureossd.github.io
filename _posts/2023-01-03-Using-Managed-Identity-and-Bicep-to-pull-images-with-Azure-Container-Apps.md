---
title: "Using Managed Identity and Bicep to pull images with Azure Container Apps"
author_name: "Anthony Salemo"
tags:
    - Azure Container Apps
    - Managed Identity
    - Docker
    - Kubernetes
categories:
    - Azure Container Apps
    - Managed Identity

header:
   teaser: /assets/images/azure-containerapps-logo.png
toc: true
toc_sticky: true
date: 2023-01-03 12:00:00
---

This post will cover how to set up your Azure Container Apps to pull images from Azure Container Registry with User or System Assigned Identity when using Bicep.

## Overview
Azure Container Apps can pull images from an Azure Container Registry using Managed Identity - the benefit of this is avoid storing credentials and instead rely on an "identity" to do the authentication on your behalf. To open up or lock down access, you can assign "roles" to this identity.

Public documentation on using Managed Identities for applications at runtime and image pulls can be found [here](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull?tabs=azure-cli&pivots=azure-portal).

**Source code for these examples can be found [here](https://github.com/azureossd/Container-Apps/tree/master/ManagedIdentity)**.

## Prerequisites
Disable Admin Credentials on the Azure Container Registry. This can be turned off on the registry by going to **Access Keys** -> **Admin User** -> **Disable**

## Managed Identity - Bicep
### User Assigned Identity
To add an identity, there are a few extra resources in the Bicep file that will need to be created. This can be added into an existing one, or a part of a new one. These two resources, for the **identity** and **role assignment** should be added towards the top of your Bicep file.

```arm
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2022-01-31-preview' = {
  name: userAssignedIdentityName
  location: location 
}

// roleDefinitionId is the ID found here for AcrPull: https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#acrpull
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, azureContainerRegistry, 'AcrPullTestUserAssigned')
  properties: {
    principalId: identity.properties.principalId  
    principalType: 'ServicePrincipal'
    // acrPullDefinitionId has a value of 7f951dda-4ed3-4680-a7ca-43fe172d538d
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', acrPullDefinitionId)
  }
}
```

The `roleDefinitionId` is an ID we pass in that maps to a user-friendly role name, in this case, the **AcrPull** role. We're assigning the role of AcrPull to the identity we created. The full ID would be in the format of `/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/7f951dda-4ed3-4680-a7ca-43fe172d538d`. `resourceId()` is being used as a built-in Bicep helper function.

Next, in our Container App resource, we turn on Managed Identity for the application and set the Container App to pull from the Azure Container Registry in question using this specific User Assigned Identity that we just created.

Note, the below is **only** highliting the changes needed for Managed Identity in the Container App resource.

```arm
resource containerApp 'Microsoft.App/containerApps@2022-06-01-preview' = {
  ...
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    ...
    configuration: {
      ...
      registries: [
        {
          server: '${azureContainerRegistry}.azurecr.io'
          identity: identity.id
        }
      ]
    }
    ...
  }
}
```

The full file in question:

```arm
param environmentName string 
param logAnalyticsWorkspaceName string
param appInsightsName string
param containerAppName string 
param azureContainerRegistry string
param azureContainerRegistryImage string 
param azureContainerRegistryImageTag string
param acrPullDefinitionId string
param userAssignedIdentityName string
param location string = resourceGroup().location

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2022-01-31-preview' = {
  name: userAssignedIdentityName
  location: location 
}

// roleDefinitionId is the ID found here for AcrPull: https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#acrpull
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, azureContainerRegistry, 'AcrPullTestUserAssigned')
  properties: {
    principalId: identity.properties.principalId  
    principalType: 'ServicePrincipal'
    // acrPullDefinitionId has a value of 7f951dda-4ed3-4680-a7ca-43fe172d538d
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', acrPullDefinitionId)
  }
}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
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

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

resource appEnvironment 'Microsoft.App/managedEnvironments@2022-06-01-preview' = {
  name: environmentName
  location: location
  properties: {
    daprAIInstrumentationKey: appInsights.properties.InstrumentationKey
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

resource containerApp 'Microsoft.App/containerApps@2022-06-01-preview' = {
  name: containerAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    environmentId: appEnvironment.id
    configuration: {
      ingress: {
        targetPort: 8080
        external: true
      }
      registries: [
        {
          server: '${azureContainerRegistry}.azurecr.io'
          identity: identity.id
        }
      ]
    }
    template: {
      containers: [
        {
          image: '${azureContainerRegistry}.azurecr.io/${azureContainerRegistryImage}:${azureContainerRegistryImageTag}'
          name: 'dockercontainersshexamples-dotnet-alpine'
          resources: {
            cpu: 1
            memory: '2Gi'
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

We can lastly confirm that the **AcrPull** role has been added to our User Assigned identity by going to the Azure Portal for the Container App -> **Identity** -> **User assigned** -> (select the created identity) -> **Azure Role assignments**

![AcrPull Role](/media/2023/aca-managed-identity-blog-1.png)



### System Assigned Identity
**IMPORTANT**: As discussed [here](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull?tabs=azure-cli&pivots=azure-portal#system-assigned-managed-identity), the approach to using a System Assigned Managed Identity is a two-step process when it comes to **pulling images**. 

We'll need to use a public image first, which we'll do in a Bicep file that we can setup the Container App with. This then can be updated through a few different ways afterwards to point to the private registry.

Setting this to a pulic image **first** lets the deployment succeed, since it's pulling from a public registry, the identity isn't being used to authenticate. If we were to set the image as one that needs authentication - this would timeout and/or fail, since a condition is entered this may be trying to pull the image from the registry requiring authentication prior to the System Assigned Identity being fully set up to be used for the pull - as well as lacking the **AcrPull** role.

1. Create a Container Apps resource in your Bicep file and add the identity property to it.

```arm
resource containerApp 'Microsoft.App/containerApps@2022-06-01-preview' = {
  ...
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    ...
  }
}
```

2. Create a Role Assignment to give our System Assigned Identity the **AcrPull** role.

```arm
// roleDefinitionId is the ID found here for AcrPull: https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#acrpull
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, azureContainerRegistry, 'AcrPullSystemAssigned')
  scope: containerApp
  properties: {
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
    // acrPullDefinitionId has a value of 7f951dda-4ed3-4680-a7ca-43fe172d538d
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', acrPullDefinitionId)
  }
}
```

The `containerApp.identity.principalId` property is only assignable when using System Assigned Identities.

Putting it all together:

```arm
param environmentName string 
param logAnalyticsWorkspaceName string
param appInsightsName string
param containerAppName string 
param azureContainerRegistry string
param acrPullDefinitionId string
param location string = resourceGroup().location

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
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

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

resource appEnvironment 'Microsoft.App/managedEnvironments@2022-06-01-preview' = {
  name: environmentName
  location: location
  properties: {
    daprAIInstrumentationKey: appInsights.properties.InstrumentationKey
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

resource containerApp 'Microsoft.App/containerApps@2022-06-01-preview' = {
  name: containerAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    environmentId: appEnvironment.id
    configuration: {
      ingress: {
        targetPort: 80
        external: true
      }
    }
    template: {
      containers: [
        {
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          name: 'dotnet'
          resources: {
            cpu: 1
            memory: '2Gi'
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

// roleDefinitionId is the ID found here for AcrPull: https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#acrpull
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, azureContainerRegistry, 'AcrPullSystemAssigned')
  scope: containerApp
  properties: {
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
    // acrPullDefinitionId has a value of 7f951dda-4ed3-4680-a7ca-43fe172d538d
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', acrPullDefinitionId)
  }
}
```

You can confirm the **AcrPull** role was added to the System Assigned Identity we created by going to the Azure Portal for the Container App -> **Identity** -> **System assigned** -> (select the created identity) -> **Azure Role assignments**

![AcrPull Role](/media/2023/aca-managed-identity-blog-1.png)


If you then decide to update the application to point to the new registry through Bicep, you would add this registry properties change in to the Container App resource:

```arm
registries: [
    {
        server: 'yourregistry.azurecr.io'
        identity: 'system'
    }
]
```

From the description of the `identity` property:

_A Managed Identity to use to authenticate with Azure Container Registry. For user-assigned identities, use the full user-assigned identity Resource ID. For system-assigned identities, use 'system'_

## Troubleshooting
### Deployment timing out when deploying with System Assigned Identity
Ensure that when setting up the System Assigned Identity, that a public image is initially being used. Otherwise this will enter the time-out condition described earlier

### Deployment fails with InvalidRoleDefinitionId 
Ensure the definition ID matches the ID in the [built-in roles link](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#acrpull). If an invalid value is put in, this will be output in the terminal. Review the value for further troubleshooting.

### The language expression property 'principalId' doesn't exist
Check that the `identities` property is set on the Container App resource.









