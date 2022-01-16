---
title: "Node.js and Redirects or Rewrite scenarios on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Node.js
    - Redirect
    - Rewrite
categories:
    - Azure App Service on Linux
    - Nodejs
    - Configuration 
    - Troubleshooting
header:
    teaser: /assets/images/nodejslogo.png
toc: true
toc_sticky: true
date: 2022-01-16 12:00:00
---

Sometimes due to specific needs, you may want to implement a URL redirect or rewrite on the server side. For instance, redirecting from www to non-www, or the same between HTTP and HTTPS. 

It is important to note, in general, that with Node [App Service on Linux](https://docs.microsoft.com/en-us/azure/app-service/overview#app-service-on-linux) that the environment is a Docker Container which includes Node itself (along with your code) and also [PM2](https://docs.microsoft.com/en-us/azure/app-service/configure-language-nodejs?pivots=platform-linux#configure-nodejs-server), a production process manager. Also called our ["Blessed Images"](https://github.com/microsoft/Oryx/tree/main/images/runtime/node).

However, these Node 'Blessed Images' do **not** include resources that can utilize other typical redirect/rewrite methods such as `.htaccess` or `web.config`, since `.htaccess` is for Apache, which is not included in these Images and `web.config` is for IIS, which runs on Windows.

Knowing that we can still utilize some other methods for what we need, mentioned below:

<br>
<br>


## Code-based approach

> NOTE: This approach assumes you're running a typical Node server or framework, like the native http/s module, Express, Hapi, or related.


  If using something like Express.js and have your controllers set up for routing, the below approach can be used, which is using an exported function that we can pass back into our routing middleware. `req, res, next` will be available since this function can be passed as an argument directly to Express middleware. This example is redirecting from non-www to www:

  ```
      const redirectController = (req, res, next) => {
        try {
          const host = req.headers.host;
          if (host.match(/^www\..*/i)) {
            next();
          } else {
            res.redirect(301, `${req.protocol}://www.` + host + req.url);
          }
        } catch (error) {
          console.log("An error has occurred: ", error);
          next(error);
        }
      };

      module.exports = redirectController;
  ``` 

### **What the code is doing**
  - We assigned the variable `host` to the value of `host` in our request headers (optional)
  - We use regular expressions to see if `host` contains `www.`
  - If it does, we call `next()` to process the rest of our middleware chain and skip any redirect logic
  - If it does **not** contain `www.`, we redirect with a HTTP 301 to our intended URL
  
  
  And then in our entrypoint `.js` file (which can be any file, i.e `index.js`, `server.js`, `app,js`, etc.), we have it structured as the following:

  ```
    ... other code

      const express = require("express");
      const app = express();

      ... controller imports
      ... other code

      // Controller to capture our redirect logic
      app.use(redirectController);
      // Home '/' controller
      app.use(homeController);
      // API controllers
      app.use("/api/todo/all", getTodoController);
      app.use("/api/todo/find/", getTodoByIdController);
      app.use("/api/todo/delete/", deleteTodoController);
      app.use("/api/todo/add", addTodoController);
      app.use("/api/todo/update", updateTodoController);
      // Catches all non matching routes and redirects it back to the root - must be  placed last in the chain of middleware
      app.use(catchAllController);

     ... other code
  ```

> **NOTE**: Order matters here. It's important to understand your placement of these middleware components can affect your application logic. In the above example, if you're using a 'catch all' (optional) route which is seen in the last of the chain, it needs to remain on the bottom. Our non-www to www logic is placed in the beginning so it can be processed first and then the rest of the flow is executed.

Using the above approach you should now able to have non-www requests redirect to www while preserving the existing path, if any. You can change this as desired in your code as needed, simply be changing the regular expression pattern. 

**For more context you can refer to these StackOverflow posts which cover different approaches as well:**
- [redirect-non-www-to-www-with-node-js-and-express](https://stackoverflow.com/questions/9132891/redirect-non-www-to-www-with-node-js-and-express)
- [node-js-www-non-www-redirection](https://stackoverflow.com/questions/7013098/node-js-www-non-www-redirection)

This same logic can be used with either HTTP <-> HTTPS redirection.

**Key Takeaways**
- You can use regular expressions plus Node's default routing logic or other middleware such as Express's to redirect as need based on the logic you write
- Be mindful of how you write your code for this, since all logic for this routing is within the application layer
- Try to avoid hardcoding values in the redirect function logic, Node offers the `req` object and from that we can extract essentially all parts of the URL as needed
- If you have a high trafficked application, this may incur a performance hit as all requests are routed **within** the middleware or logic flow and **not** before it hits the application code, such as with an [Application Gateway](https://docs.microsoft.com/en-us/azure/application-gateway/overview)

<br>
<br>

## Single Page Application (SPA) approach using a 'Blessed Image'

The 'code based' approach will handle most scenarios with Node as long as there is a live Node server running. But what happens if you have a Single Page Application and have those same requirements? This makes it more tricky. But it is still possible without the use of another product placed in front of the App Service.

This approach should work for most Single Page Applications, since most generate a compiled folder of static files (i.e `/build`, `/dist`, etc.) which is our main focus, and should be, as these are the assets recommended to serve in production.

### Using a PHP 7.x 'Blessed Image' to make use of `.htaccess` with our SPA

<br>

> **NOTE**: Since we're mixing a PHP 'Blessed Image' with Javascript(Node), there will be various tweaks/changes that will need to be done for this to work. Therefor a typical deployment (i.e Local Git) will not work out of the box.

### **Sample code**: 
  1. This example is intended for a [PHP 7.x 'Blessed Image'](https://docs.microsoft.com/en-us/azure/app-service/quickstart-php?pivots=platform-linux) and in this case, using [React](https://reactjs.org/). No `php` files should be deployed.
  2. **For a walkthrough and a code sample - you can review [this Github Repo](https://github.com/azureossd/react-apache-webserver-htaccess).** This contains a description on how to deploy and run this on Azure App Services.

**Key Takeaways**
- The sample in the link above is using React, but other SPAs (Angular, Vue, etc.) should be valid to use as well, as long as `DocumentRoot` in `apache2.conf` is updated to match your production folder name.
- Typical deployments, eg. Local Git will not be able to be done as [Oryx with Node](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/nodejs.md) looks for particular files and additionally since this is PHP - this logic will not apply.
- This is not intended to cover 'live' Node servers, rather static applications (SPAs).
- You can get a copy of `apache2.conf` by SSH'ing into your application container, this will be under `/etc/apache2/apache2.conf`. For PHP 8.x 'Blessed Images', you can get a copy of `nginx.conf` by navigating to `/etc/nginx/nginx.conf`.

> **NOTE**: Our PHP 8.x 'Blessed Images' use NGINX. The above can also be done but specifically with NGINX rather than Apache.

<br>
<br>

## Custom Docker Image
A custom Docker Image that you can bring with [Azure Web App for Containers](https://azure.microsoft.com/en-us/services/app-service/containers/) can be used. Using your own custom Docker Image, you can build your image using either something like NGINX or Apache to implement your redirects or rewrites as needed instead of relying upon 'Blessed Images'.

With this approach, you can make this work with either SPA based apps or server running apps. Below are two examples, but of course there are many other ways of doing this:
- [Express.js with NGINX](https://github.com/azureossd/nginx-nodejs-reverseproxy-supervisord) 
- [React with Apache](https://github.com/azureossd/react-apache-webserver-htaccess/tree/main/react-apache-webserver-containerized)

**Key Takeaways**
- Custom Images give more flexibility since you can pick and choose the software desired 
- This however also requires time spent to develop these Docker Images with your intended software stack

<br>
<br>

## Azure Application Gateway

[Azure Application Gateway](https://docs.microsoft.com/en-us/azure/application-gateway/) can also be used for [URL based routing](https://docs.microsoft.com/en-us/azure/application-gateway/url-route-overview), [rewrites](https://docs.microsoft.com/en-us/azure/application-gateway/rewrite-http-headers-url) and [redirection](https://docs.microsoft.com/en-us/azure/application-gateway/redirect-overview), amongst others. The benefit of using this is that Application Gateway is placed **infront** of the application itself. So any rewrites, redirects, or others - or all done prior to hitting the application. Which can help as opposed to doing these same things through code, which could have a possible performance impact, or having to take a roundabout way for this approach

### **Restrict Access to *.azurewebsites.net***

One other good benefit of using this is that since we don't have the benefits of a `web.config` on Linux to redirect away from the bare *.azurewebsites.net domain and needing to use Apache or NGINX either requires a lot of changes or using a custom Image, we can utilize Application Gateway to handle the incoming traffic through the gateway - while restricting access to the App Service so the Application Gateway VIP is the only one with access.

This is called out [here](https://docs.microsoft.com/en-us/azure/application-gateway/configure-web-app-portal#restrict-access), which also utilizes [built-in Azure App Service access restrictions](https://docs.microsoft.com/en-us/azure/app-service/app-service-ip-restrictions). Additional documentation for App Service and Application Gateway can be located [here](https://docs.microsoft.com/en-us/azure/application-gateway/configure-web-app-portal).

<br>

**Key Takeaways**
- Azure Application Gateway to handle redirects, rewrites and URL based routing.
- This can be placed in front of the application to which changes to code or using a non-typical approach for the above can be avoid.
- It additionally can be a method of sending traffic only through the Application Gateway while restricting access to the default *.azurewebsites.net domain name.

<br>
<br>

## In summary
- You can use a code centric approach for dynamic redirects if using a live Node.js based server.
- If using a Single Page Application with static, client-side content - you can utilize a PHP 7.x 'Blessed Image' to make use of Apache and PHP 8.x 'Blessed Images' to make use of NGINX - with additional configuration, you can override the `apache2.conf` and `nginx.conf` files respectively to get what you need.
- You can bring your own custom Docker Image to build it to include Apache, NGINX, or others to help with redirects and/or rewrites
- If none of the above suite you - Azure Application Gateway can do all of the above and additionally, if configured, force traffic through the gateway to block traffic to *.azurewebsites.net for your App Service.
- There is also the option of using Node on Windows to make use of a `web.config`, in the case that Linux App Service and Node.js can't do what you need regarding the above.
