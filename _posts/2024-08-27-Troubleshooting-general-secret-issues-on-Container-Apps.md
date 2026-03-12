---
title: "Troubleshooting general secret issues on Container Apps"
author_name: "Anthony Salemo"
tags:
    - Container Apps
    - Configuration
    - Troubleshooting
    - Secrets
categories:
    - Azure Container App # Azure App Service on Linux, Azure App Service on Windows,  
    - How To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azure-containerapps-logo.png"
toc: true
toc_sticky: true
date: 2024-08-27 12:00:00
---

This post will cover a few scenarios with troubleshooting secret fetch and sync issues on Container Apps, mostly when using Managed Identity.

# Overview
You can use secrets on Container Apps to store sensitive data. You can use these in connection strings or other values for various aspects - like Dapr, KEDA, and referencing secrets througn environment variables.

You can either manually create secrets with their respective values, or, [import secrets that are stored in Azure Key Vault](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets?tabs=azure-portal#reference-secret-from-key-vault). When importing secrets from Azure Key vault you'll need to enable Managed Identity.

This post will cover a few issues that may be seen when setting this up.

# Failure to add secret or update secrets
This refers to explicitly trying create a secret on the Container Apps resource - which needs to make an outbound call to Azure Key Vault to retrieve the secret.

When using Managed Identity, and at the  time of writing this, this message will typically always be surfaced back to the client:

> "client" refers to whatever was initiating the deployment. eg., portal, IaC (ARM, Bicep, Terraform, etc.), Azure Pipelines, etc.

`Failed to update secrets: Failed to provision revision for container app 'myapp': Error details: The following field(s) are either invalid or missing. Field 'configuration.secrets' is invalid with details: 'Invalid value: "somesecret": Unable to get value using Managed identity system for secret somesecret. Error: unable to fetch secret 'somesecret' using Managed identity 'identity'':..`

![Key vault secret error with managed identity and container apps](/media/2024/08/akv-secrets-1.png)

This unfortunately will not (at this time) contain the _real_ reason why that a secret failed to be added. But below are a few common reasons why this likely has happened:

**Access policies**:
- Your identity doesn't have the _Get_ "Secret Permissions" set for the Managed Identity
    - Ensure this is set to a minimum of "Get"

    ![Key vault Access policies](/media/2024/08/akv-secrets-2.png)

**Permissions set for the wrong identity**:
- The wrong identity was added to access policies.
    - You can cross compare the "application name" listed in Access Policies to what's shown in Microsoft Entra to see the _Object (principal) ID_. Going back to the **Identity** blade on the Container App will confirm if you have the correct ID or not.

**Non-existent secret/wrong or invalid identifier**:
- Trying to reference a non existing secret, a mispelled name, an incorrect identifier, or a generally malformed Key Vault URI will cause this error:
    - Ensure all of these are correct. To make it more simplistic, you can drop the identifier in the Key Vault secret URI and just use `https://myakv.vault.azure.net/secrets/mysecret` if able to do so for testing purposes.

**User-assigned identities**:
- Through some deployment clients you may see `Error: managed Identity with resource Id [some_id] was not found when trying to get secret [secretname] from Azure Key Vault`
    - Ensure the identity has been added to the **Identity** -> **User assigned** blade.

**Networking**:
- If you're using a UDR you will either need to add the `AzureKeyVault` service tag with Azure Firewall - or - allow `login.microsoft.com` to the allow list on any other firewalls. This is called out [here](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets?tabs=azure-cli#reference-secret-from-key-vault). Otherwise, this will prevent secrets from being added/updating
- Custom DNS server(s) that can't resolve Key Vault or to `login.microsoft.com` host names will also cause this problem. You can use `nslookup` / `dig`, etc. from a test container to see if it's resolvable. You can also use `curl` / `nc` / `tcpping` / `etc.` for general connectivity if the FQDN for either Key Vault or `login.microsoft.com` is on a deny list. You can install these tools in a test container or a custom container by following [Installing troubleshooting tools in a Container Apps ‘hello-world’ image](https://azureossd.github.io/2023/11/20/Installing-troubleshooting-tools-in-a-Container-Apps-helloworld-image/index.html)

# Sync issues
"sync" issues can be thought of as passive failures - eg., not explicitly trying to create secrets - but needing to call to Key Vault in the background during various lifecycle events. This however can still affect the application at runtime.

At the time of writing this, compared to explicit create/update operations, reasons for failure are logged out in the `ContainerAppSystemLogs_CL` table (if using Log Analytics) or `ContainerAppSystemLogs` (if using Azure Monitor) - which is generally "system logs" for all other log streaming.

The below query can be used:

```
ContainerAppSystemLogs_CL
| where Reason_s == "SyncingSecretFromAzureKeyVaultForContainerAppFailed"
| project TimeGenerated, Log_s, Reason_s, ReplicaName_s
```

> Successful syncs with show as `SyncingSecretFromAzureKeyVaultForContainerAppSucceeded` with a message of `Sync with secrets from Azure Key Vault was successful for container app [yourapp]`

The message format for these errors is typically something like the below:

```
Error happened when syncing secret [somesecret] from Azure Key Vault https://myakv.vault.azure.net/secrets/[somesecret] for ContainerApp myaca: GET request to Azure Key Vault https://myakv.vault.azure.net/secrets/[somesecret] returned error status: some error reason.
```

Below are some error examples and potential reasons:

```
 Error happened when syncing secret connstringvalue from Azure Key Vault https://someakv.vault.azure.net/secrets/somesecret for ContainerApp my-app: GET request to Azure Key Vault https:/someakv.azure.net/secrets/somesecret returned error status: 403. body: {"error":{"code":"Forbidden","message":"Caller is not authorized to perform action on resource.\r\nIf role assignments, deny assignments or role definitions were changed recently, please observe propagation time.\r\nCaller: appid=00000000-0000-0000-0000-0000000000000;oid=00000000-0000-0000-0000-0000000000000;iss=https://sts.windows.net/00000000-0000-0000-0000-0000000000000/\r\nAction: 'Microsoft.KeyVault/vaults/secrets/getSecret/action'\r\nResource: '/subscriptions/00000000-0000-0000-0000-0000000000000/resourcegroups/some-rg/providers/microsoft.keyvault/vaults/someakv/secrets/somesecret'\r\nAssignment: (not found)\r\nDenyAssignmentId: null\r\nDecisionReason: 'DeniedWithNoValidRBAC' \r\nVault: someakv;location=eastus\r\n","innererror":{"code":"ForbiddenByRbac"}}}.
```

- RBAC is enabled and this identity was likely not added under an assignment who has proper access to the Key Vault

```
Error happened when syncing secret somesecret from Azure Key Vault https://someakv.vault.azure.net/secrets/somesecret/0000000000000000000000000000 for ContainerApp some-app: GET request to Azure Key Vault https://someakv.vault.azure.net/secrets/somesecret/0000000000000000000000000000  returned error status: 403. body: {"error":{"code":"Forbidden","message":"The user, group or application 'appid=00000000-0000-0000-0000-0000000000000;oid=00000000-0000-0000-0000-0000000000000;iss=https://sts.windows.net/00000000-0000-0000-0000-0000000000000/' does not have secrets get permission on key vault 'someakv;location=germanywestcentral'. For help resolving this issue, please see https://go.microsoft.com/fwlink/?linkid=2125287","innererror":{"code":"AccessDenied"}}}.
```

- The "Get" Secret Permssion on the Key Vault was not added for this identity

```
Error happened when syncing secret somesecret from Azure Key Vault https://someakv.vault.azure.net/secrets/somesecret/0000000000000000000000000000 for ContainerApp some-app: GET request to Azure Key Vault https://someakv.vault.azure.net/secrets/somesecret/0000000000000000000000000000 returned error status: 404. body: {"error":{"code":"SecretNotFound","message":"A secret with (name/id) somesecret/0000000000000000000000000000 was not found in this key vault. If you recently deleted this secret you may be able to recover it using the correct recovery command. For help resolving this issue, please see https://go.microsoft.com/fwlink/?linkid=2125182"}}. 
```
- The secret was not found. The secret may have been deleted.

```
Error happened when syncing secret testname from Azure Key Vault https:/someakv.vault.azure.net/secrets/somesecret/0000000000000000000000000000 for ContainerApp some-app: GET request to Azure Key Vault https://someakv.vault.azure.net/secrets/somesecret/0000000000000000000000000000 returned error status: 403. body: {"error":{"code":"Forbidden","message":"Request was not allowed by NSP rules and the client address is not authorized and caller was ignored because bypass is set to None\r\nClient address: xx.xx.xxx.xx\r\nCaller: appid=00000000-0000-0000-0000-0000000000000;oid=00000000-0000-0000-0000-0000000000000\r\nVault: someakv;location=westeurope","innererror":{"code":"ForbiddenByFirewall"}}
```

```
Error happened when syncing secret somesecret from Azure Key Vault https://someakv.vault.azure.net/secrets/somesecret/0000000000000000000000000000 for ContainerApp some-app: GET request to Azure Key Vault https://someakv.vault.azure.net/secrets/somesecret/0000000000000000000000000000 returned error status: 403. body: {"error":{"code":"Forbidden","message":"Public network access is disabled and request is not from a trusted service nor via an approved private link.\r\nCaller: appid=00000000-0000-0000-0000-0000000000000;oid=00000000-0000-0000-0000-0000000000000;iss=https://sts.windows.net/00000000-0000-0000-0000-0000000000000/;xms_mirid=/subscriptions/00000000-0000-0000-0000-0000000000000/resourcegroups/some-rg/providers/Microsoft.App/containerApps/some-app;xms_az_rid=/subscriptions/00000000-0000-0000-0000-0000000000000/resourcegroups/some-rg/providers/Microsoft.App/containerApps/some-app\r\nVault: someakv;location=southafricanorth","innererror":{"code":"ForbiddenByConnection"}}}
```

- Public access is disabled. The client (identity) is not apart of the whitelisted IP's in the firewall, a trusted Azure service, or connecting from a subnet that has access to the Private Endpoint (if added)

```
Error happened when syncing secret somesecret from Azure Key Vault https://someakv.vault.azure.net/secrets/somesecret/0000000000000000000000000000 for ContainerApp some-app: failed to send GET request to Azure Key Vault https://someakv.vault.azure.net/secrets/somesecret/0000000000000000000000000000 to update secret for App test-containerapp: Get "https://someakv.vault.azure.net/secrets/somesecret/0000000000000000000000000000?api-version=7.3": dial tcp: lookup someakv.vault.azure.net on xx.xxx.xxx.xx:xx: no such host.
```
- The Key Vault may have been deleted, they Key Vault FQDN is incorrect, or there is a custom DNS server(s) on the environment and they're unable to resolve the DNS name for this Azure Key Vault. Private DNS zones may also be misconfigured.

Given that Key Vault is the one returning these errors - and others that may not be listed here - various public documentation from the Key Vault team exists regarding the more common ones:
- [Troubleshooting Azure Key Vault access policy issues](https://learn.microsoft.com/en-us/azure/key-vault/general/troubleshooting-access-issues)
- [REST API - Key Vault error codes](https://learn.microsoft.com/en-us/azure/key-vault/general/rest-error-codes)
- [Common error codes for Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/general/common-error-codes)

# General
In Container Apps and Kubernetes - two `$` signs collapse into one (1) `$` sign. This can pose a problem for customers using randomly generated passwords that contain `$$`. 

This is related to a Kubernetes issue: https://github.com/kubernetes/website/issues/27936