---
title: "Using Python to interact with and manage Azure AD apps and Azure Service Principals"
author_name: "Anthony Salemo"
tags:
    - Python
    - Azure AD
    - Azure Service Principals
    - SDK
    - Graph
categories:
    - Python
    - Development 
header:
    teaser: /assets/images/yarnlogo.png
toc: true
toc_sticky: true
date: 2022-09-19 12:00:00
---

Sometimes it may be needed to create, edit, manage or do some other operations on Azure AD applications and Service Principals. With Python and Azure, you can do that.


# Available ways to interact
As of writing this, there are a few ways you can go about doing this:

## Azure Active Directory Graph libraries for Python
- [Azure Active Directory Graph libraries for Python](https://learn.microsoft.com/en-us/python/api/overview/azure/microsoft-graph?view=azure-python)

The last release for this [Python package was on 2019](https://pypi.org/project/azure-graphrbac/#history). There has been migrations away from this to use the Graph API - deeming this essentially deprecated. This may still be used, but note if using this SDK with `azure-identity` authentication such as `DefaultAzureCredential`, you may encountered [this issue](https://stackoverflow.com/questions/63384092/exception-attributeerror-defaultazurecredential-object-has-no-attribute-sig) due to the outdated pacakge. 

## Microsoft Graph Core Python Client Library (preview)
- [Microsoft Graph Core Python Client Library (preview)](https://github.com/microsoftgraph/msgraph-sdk-python-core)

The code examples in this post will focus on this library for now. This is a preview library that lets you interact through the Graph REST API endpoints to manage Azure AD applications and Service Principals.


## Microsoft Graph REST API
- [Microsoft Graph REST API v1.0](https://learn.microsoft.com/en-us/graph/api/overview?view=graph-rest-1.0)

The REST API can be used with a Python HTTP client (such as [requests](https://pypi.org/project/requests/)) to call these endpoints, such as the [Applications (Azure AD apps)](https://learn.microsoft.com/en-us/graph/api/resources/application?view=graph-rest-1.0) and [Service Principal](https://learn.microsoft.com/en-us/graph/api/resources/serviceprincipal?view=graph-rest-1.0) ones to manage these resources.

# Examples
The below examples will focus on [Microsoft Graph Core Python Client Library (preview)](https://github.com/microsoftgraph/msgraph-sdk-python-core). This library can directly use the endpoints from the [Microsoft Graph REST API v1.0](https://learn.microsoft.com/en-us/graph/api/overview?view=graph-rest-1.0), which can simplify development. 

## Local Development
> **NOTE**: RBAC and/or organzation restrictions may apply depending on your account set up. This could impact what happens when calling to these API's if your account has certain permission restrictions.

If setting up a local environment with an existing Azure AD application for authentication - follow this link [here](https://learn.microsoft.com/en-us/azure/developer/python/configure-local-development-environment?tabs=windows%2Capt%2Ccmd). Otherwise, you can potentially just use `az login` with the examples below.

## Project set up
Create a folder for your project then create and activate your Python Virtual Environment.

Create the following files:
- `app.py`
- `requirements.txt`.

Add the following two packages into your `requirements.txt`:
- `azure-identity`
- `msgraph-core`

With your Python Virtual Environment created and activated, run `pip install -r requirements.txt`.


### Azure AD application

Add the following to your `app.py` file:

```python
import json

from azure.identity import DefaultAzureCredential
from msgraph.core import GraphClient


auth_credential = DefaultAzureCredential()
client = GraphClient(credential=auth_credential)


def create_azure_ad_app():
    # Display name of the Azure AD app that's being created
    # https://docs.microsoft.com/en-us/graph/api/application-post-applications?view=graph-rest-1.0&tabs=http
    post_body = {
            'displayName': 'newazureadapp'
    }

    result = client.post(
        '/applications',
        data = json.dumps(post_body),
        headers={'Content-Type': 'application/json'}
    )

    print(result.json())


create_azure_ad_app()
```

<br>

Let's walk through the above:
- We import our Azure Identity and Microsoft Graph packages
- We use `DefaultAzureCredential()` for authentication, which we pass into our `GraphClient` to authenticate us. 
- We define the `create_azure_ad_app` function, which creates a new Azure AD application for us.
- From the Graph API requirements, we submit a `POST` request with an optional 'friendly' name for our Azure AD application.
- We print out the result, which is an object in the response body. 

The below response should be seen (truncated for space):

```json
HTTP/1.1 201 Created
Content-type: application/json

{
    "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#applications/$entity",
    "id": "00000000-0000-0000-0000-000000000000",
    "deletedDateTime": null,
    "isFallbackPublicClient": null,
    "appId": "00000000-0000-0000-0000-000000000000",
    .....
    ...
}
```

Assuming our Azure AD application we created was the friendly name of 'newazureadapp', if we got to the Azure Active Directory Portal and look under App Registrations, we'll see the newly created Azure AD app:

![New Azure AD app](/media/2022/09/azure-oss-azure-ad-blog-1.png)

Using the above approach, you can now easily manage the Azure AD application - such as adding or deleting secrets to it, listing, deleting the app, and more - with the [REST API](https://learn.microsoft.com/en-us/graph/api/overview?view=graph-rest-1.0) endpoints you can plug into the above client.


### Service Principal
Additionally, with the Azure AD application created, you can now add **Service Principals** to it.

Using the same exact code above, just replace the `result` variable with the following and add the `body` dictionary:

```python
    body = {
        # This is the appId of the Azure AD app created earlier above
        'appId': '00000000-0000-0000-0000-000000000000'
    }

    result = client.post(
        '/servicePrincipals',
        data = json.dumps(body),
        headers = {'Content-Type': 'application/json'}
    )
```

This again follows the endpoint scheme of the Graph API [here](https://learn.microsoft.com/en-us/graph/api/serviceprincipal-post-serviceprincipals?view=graph-rest-1.0&tabs=http).

This initiates a `POST` request which adds a Service Principal tied to the Azure AD application we created above. 

**For runnable code examples of both Azure AD applications and Service Principals, see [here](https://github.com/azureossd/python-sdk-aad-samples/tree/main/python-sdk-graph-samples)**