---
title: "Authenticating Azure Resource Management REST API requests using Java"
tags:
  - java adal rest api arm
author_name: Srikanth S.
categories:
  - Java
  - How-To
date: 2015-06-23 15:45:00
---

This blog talks about how to authenticate Azure Resource Manager requests through REST API using Java. All the tasks that are used to manage resources that are deployed in resource groups with the Azure Resource Manager will need to be authenticated using Azure Active Directory. There are multiple ways to setup authentication with .NET, but with java there are two ways, you can authenticate requests.

Both require that you have co-administrator access to the Azure Account and also global admin access to the active directory which we will use to make REST API requests.

You would first need to create a Service Principal with Azure Resource Manager. For this you will need to

1.  Download and configure Azure Active Directory Module for Windows PowerShell or CLI.
2.  Then follow instructions [here](https://azure.microsoft.com/en-us/documentation/articles/powershell-azure-resource-manager/) to switch to Azure Resource Manager Mode.
3.  Once you are ready to use PowerShell/CLI with Azure Active Directory, follow the steps provided [here](https://azure.microsoft.com/en-us/documentation/articles/resource-group-authenticate-service-principal/) to create a service principal.

Note down the ApplicationID and the password used to create the service principal. Now you will need to download multiple java modules to make this work. Here is the list:

-   ADAL for Java: This can be downloaded from [here](https://github.com/AzureAD/azure-activedirectory-library-for-java). This module has multiple dependencies, which are:
    -   oauth2-oidc-sdk (Nimbus)
    -   gson (Google)
    -   slf4j-api (Apache)
    -   httpclient (Apache)

Once you download these and configure them in build path, add this code to request access tokens from Azure Resource Management REST API’s. You can add this code into a function and call the function to return the results. Please note that there are some parameters like tenant\_id, password, client\_id, subscription\_id that will need to be replaced for this to work.

``` {.scroll}
import java.io.BufferedReader;
 import java.io.InputStreamReader;
 
 import java.util.concurrent.ExecutorService;
 import java.util.concurrent.Executors;
 import java.util.concurrent.Future;
 
 import javax.naming.ServiceUnavailableException;
 
 import com.microsoft.aad.adal4j.AuthenticationContext;
 import com.microsoft.aad.adal4j.AuthenticationResult;
 import com.microsoft.aad.adal4j.ClientCredential;
 
 import org.apache.http.HttpResponse;
 import org.apache.http.client.HttpClient;
 import org.apache.http.client.methods.HttpGet;
 import org.apache.http.impl.client.DefaultHttpClient;
 
 
 public class PublicClient {
 
 /*tenant_id can be found from your azure portal. Login into azure portal and browse to active directory and choose the directory you want to use. Then click on Applications tab and at the bottom you should see "View EndPoints". In the endpoints, the tenant_id will show up like this in the endpoint url's: https://login.microsoftonline.com/{tenant_id} */
 private final static String author_nameITY = "https://login.windows.net/{tenant_id}";
 
 public static void main(String args[]) throws Exception {
 
 AuthenticationResult result = getAccessTokenFromUserCredentials();
 System.out.println("Access Token - " + result.getAccessToken());
 HttpClient client = new DefaultHttpClient();
 
 /* replace {subscription_id} with your subscription id and {resourcegroupname} with the resource group name for which you want to list the VM's. */
 
 HttpGet request = new HttpGet("https://management.azure.com/subscriptions/{subscription_id}/resourceGroups/{resourcegroupname}/providers/Microsoft.ClassicCompute/virtualMachines?api-version=2014-06-01");
 request.addHeader("author_nameization","Bearer " + result.getAccessToken());
 HttpResponse response = client.execute(request);
 BufferedReader rd = new BufferedReader (new InputStreamReader(response.getEntity().getContent()));
 String line = "";
 while ((line = rd.readLine()) != null)
 {
 System.out.println(line);
 }
 }
 
 private static AuthenticationResult getAccessTokenFromUserCredentials() throws Exception {
 AuthenticationContext context = null;
 AuthenticationResult result = null;
 ExecutorService service = null;
 try 
 {
 service = Executors.newFixedThreadPool(1);
 context = new AuthenticationContext(author_nameITY, false, service);
 /* Replace {client_id} with ApplicationID and {password} with password that were used to create Service Principal above. */
 ClientCredential credential = new ClientCredential("{client_id}","{password}");
 Future<AuthenticationResult> future = context.acquireToken("https://management.azure.com/", credential, null);
 result = future.get();
 } finally 
 {
 service.shutdown();
 }
 if (result == null) {
 throw new ServiceUnavailableException("authentication result was null");
 }
 return result;
 }
 }
```

The REST API endpoints can be found [here](https://msdn.microsoft.com/en-us/library/azure/dn948464.aspx) which can be used to manage your resources on Azure Resource Manager.