---
title: "Accessing Microsoft Graph with App Service Auth V2"
author_name: "Your Name"
tags:
    - easyauth
    - msgraph
    - auth
categories:
    - Azure App Service # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/App-Services.svg" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2021-06-07 12:00:00
---

How to connect to Microsoft Graph using Azure App Service Authentication V2.

## Intro

We will be using the 'Azure CLI' to call the Azure REST Api in order to collect and update the settings needed to access MS Graph. This is an expansion to [Tutorial: Access Microsoft Graph from a secured app as the user](https://docs.microsoft.com/en-us/azure/app-service/scenario-secure-app-access-microsoft-graph-as-user).

## Steps

Be sure to login to Azure CLI before moving on.

```bash
az login
```

### Gathering your existing 'config/authsettingsv2' settings

Capture your existing v2 settings using the following command. Ensure you are updating **SUBSCRIPTION_ID**, **RESOURCE_GROUP**, and **WEBAPP_NAME** with your own site info.

```bash
az rest --method GET --url '/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RESOURCE_GROUP}/providers/Microsoft.Web/sites/{WEBAPP_NAME}/config/authsettingsv2/list?api-version=2020-06-01' > authsettings.json
```

### Update the authsettings file

Open the **authsettings.json** file using your preferred text editor.

Navigate all the way down to the **login** section of **azureActiveDirectory**.

Add the following **loginParameters** into this section.

```json
{
  "properties": {
    "identityProviders": {
      "azureActiveDirectory": {
        "enabled": true,
        "login": {
          "disableWWWAuthenticate": false,
          "loginParameters":[
            "response_type=code id_token",
            "resource=00000003-0000-0000-c000-000000000000"
          ]
        }
      }
    }
  },
  "type": "Microsoft.Web/sites/config"
}
```

***Please note that content has been omitted from the preview of this file. DO NOT remove any other content.***

### PUTing changes to app

Once the require changes have been made, you can now update them to the application.

```bash
az rest --method PUT --url '/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RESOURCE_GROUP}/providers/Microsoft.Web/sites/{WEBAPP_NAME}/config/authsettingsv2?api-version=2020-06-01' --body @./authsettings.json
```

Once changes have been updated, you should be able to now login to your App Service as well as Microsoft Graph with the same access token.

### Check Issuer URL

In the **Azure Portal**, navigate to your **App Service > Authentication** blade.

Click the **Edit** link next to the **Microsoft** identity provider.

If the **Issuer URL** contains `/v2.0` at the end of it, remove this and click **Save**.

## Testing via Curl

Create a page on your app that will display the following header **HTTP_X_MS_TOKEN_AAD_ACCESS_TOKEN**. This can be a phpinfo() page or anything similar.

```bash
curl -H "Authorization: Bearer {ACCESS_TOKEN}" https://graph.microsoft.com/v1.0/me
```