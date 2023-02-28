---
title: "App Service Linux security FAQs"
author_name: "Edison Garcia"
tags:
    - App Service Linux
    - Security
    - Policies
categories:
    - Azure App Service on Linux
    - Security
header:
    teaser: /assets/images/azurelinux.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-02-28 12:00:00
---

The platform components of App Service, including Azure VMs, storage, network connections, web frameworks, management and integration features, are actively secured and hardened. App Service goes through vigorous compliance checks on a continuous basis. This article provides a compilation of resources covering the most App Service Linux security FAQs. 

## How to secure applications hosted in Azure App Service?

You can find recommendations to implement and general features available to fulfill the security needed of your applications hosted in App Service. 
- [Secure your app with the built-in App Service features](https://learn.microsoft.com/en-us/azure/app-service/overview-security)
- [Security recommendations for App Service](https://learn.microsoft.com/en-us/azure/app-service/security-recommendations)
- [Azure security baseline for App Service](https://learn.microsoft.com/en-us/security/benchmark/azure/baselines/app-service-security-baseline)
- [How to deploy a secure n-tier web app](https://azure.github.io/AppService/2022/12/02/n-tier-web-app.html)
- [Deploying to Network-secured sites using Azure DevOps and Private Endpoints](https://azure.github.io/AppService/2021/01/04/deploying-to-network-secured-sites.html)
- [Deploying to Network-secured sites using GitHub Actions and Private Endpoints](https://azure.github.io/AppService/2021/03/01/deploying-to-network-secured-sites-2.html) 


## How to edit HTTP headers for aplications hosted in App Service Linux? 
There are several ways to customize response headers depending of the application, it can be done programmatically, using services as Application Gateway or Azure Front Door or implementing any web server as Nginx or Apache.
* [Customize HTTP Headers programmatically](https://azureossd.github.io/2022/05/25/Editing-Response-Headers-on-Linux-App-Service/index.html)
* [How to customize Nginx headers for PHP Linux](https://azureossd.github.io/2023/02/24/how-to-modify-nginx-headers/index.html)
* [Customize Security Headers using Azure Front Door](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-security-headers) and [Configure Rule Sets using Azure Front Door](https://learn.microsoft.com/en-us/azure/frontdoor/standard-premium/how-to-configure-rule-set)
* [Customize HTTP Headers using Application Gateway](https://learn.microsoft.com/en-us/azure/application-gateway/rewrite-http-headers-portal)

##  Is port 2222 secured for Web App Linux SSH?

We use port 2222 for SSH into your app's container, but that doesn't mean that port 2222 is exposed over the Internet. No matter how you use SSH in your app, all SSH traffic is handled through an endpoint on port 443. If you're not using SSH, you don't have to worry about closing port 2222 because it's not exposed to the Internet.

We provide the ability to SSH into your app, but if you're using a custom container, you need to take additional steps in order to add this ability to your app. 
* [App Service enable SSH](https://learn.microsoft.com/en-us/azure/app-service/configure-custom-container?tabs=debian&pivots=container-linux#enable-ssh)

## Why App Service terminates SSL at the Fron-Ends?
App Service terminates SSL/TLS at the network load balancers (front-ends). That means that SSL/TLS requests never get to your app. That's good news for you because it means that you don't need to (and should not) implement any support for SSL/TLS into your app, since all HTTPS requests reach your app as unencrypted HTTP requests. If your app logic needs to check if the user requests are encrypted or not, inspect the `X-Forwarded-Proto` header. Also as stated above, it's important to understand that the front-ends where SSL/TLS is terminated are inside of our Azure data centers. 
* [Handle TLS termination](https://learn.microsoft.com/en-us/azure/app-service/configure-ssl-bindings#handle-tls-termination)

## Which ports are used for App Service Multi-tenant and in ASE (App Service Environment)?
If you scan App Service, you'll find several ports that are exposed for inbound connections. There's no way to block or control access to these ports in the multi-tenant service but you block those in an App Service Environment.

* [App Service ports Multi-tenant](https://learn.microsoft.com/en-us/azure/app-service/networking-features#app-service-ports)
* [Inbound Network Ports Used in an App Service Environment](https://learn.microsoft.com/en-us/azure/app-service/environment/app-service-app-service-environment-control-inbound-traffic#inbound-network-ports-used-in-an-app-service-environment)
 

## How to disable weaker TLS Cipher Suites?
If a customer's organization has restrictions on what cipher suites are not be allowed, they may update their web app's minimum TLS cipher suite property to ensure that the weaker cipher suites would be disabled for their web app. This can be done if you have:

- [Multi-tenant premium App Service Plans](https://azure.github.io/AppService/2022/10/11/Public-preview-min-tls-cipher-suite.html)
- [ASE (App Service Environment)](https://learn.microsoft.com/en-us/azure/app-service/environment/app-service-app-service-environment-custom-settings#change-tls-cipher-suite-order)

## How software updates are handled by App Service?
Azure manages OS patching on two levels, the physical servers and the guest virtual machines (VMs) that run the App Service resources. Both are updated monthly, which aligns to the monthly [Patch Tuesday](https://learn.microsoft.com/en-us/security-updates/) schedule. These updates are applied automatically, in a way that guarantees the high-availability SLA of Azure services. 

You can find more information about OS updates, how Azure deals with significant vulnerabilities and new major and minor versions for language support in [OS and runtime patching in Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/overview-patch-os-runtime). 

For language support timeline: 
- [Node.js runtime support](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/node_support.md)
- [PHP runtime support](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/php_support.md)
- [Python runtime support](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/python_support.md)
- [Java runtime support](https://learn.microsoft.com/en-us/azure/app-service/configure-language-java?pivots=platform-linux#java-runtime-statement-of-support)
- [Ruby runtime support](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/ruby_support.md)
- [.NET runtime support](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/dot_net_core.md)
- [Early access support](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/early_access.md)


## What are the different policies that can be applicable for App Service?

Azure Policy helps to enforce organizational standards and to assess compliance at-scale, depending on the security needs, you can apply policies as AuditIfNotExists (NSAID), DeployIfNotExists (DINE), Modify policies, among others, etc.

- [Azure Policy built-in definitions for Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/policy-reference)
- [Azure Policy Regulatory Compliance controls for Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/security-controls-policy)
- [Why use DINE and Modify policies?](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/enterprise-scale/dine-guidance)
- [Recommendations for managing policies](https://learn.microsoft.com/en-us/azure/governance/policy/overview#recommendations-for-managing-policies)

## What is TLS mutual authentication in App Service?
You can restrict access to your Azure App Service app by enabling different types of authentication for it. One way to do it is to request a client certificate when the client request is over TLS/SSL and validate the certificate. This mechanism is called TLS mutual authentication or client certificate authentication. This article shows how to set up your app to use client certificate authentication. [Configure TLS mutual authentication for Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/app-service-web-configure-tls-mutual-auth?tabs=azurecli)

## How to handle secrets when using App Settings? 
By default, values for app settings are hidden in the portal for security. To see a hidden value of an app setting, click its Value field. You can keep development settings in local files and production secrets as database passwords safely in App Service through [app settings](https://learn.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal#configure-app-settings). 

You can also store your secrets in Azure Key Vault and use [Key Vault references](https://learn.microsoft.com/en-us/azure/app-service/app-service-key-vault-references?tabs=azure-cli) as values for App Settings.
