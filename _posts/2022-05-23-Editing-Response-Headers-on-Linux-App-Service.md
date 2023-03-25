---
title: "Editing Response Headers on Linux App Service"
author_name: "Anthony Salemo"
tags:
    - Azure App Service on Linux
    - Configuration
categories:
    - Azure App Service on Linux    
    - How-To
    - Configuration
header:
    teaser: "/assets/images/azurelinux.png" 
toc: true
toc_sticky: true
date: 2022-05-25 12:00:00
---
Sometimes when working with applications, you may want to customize the response headers - maybe the application you're working with depends on it, or another service or application that is calling it depends on that header in the response.

On Linux App Services, there is no **'turn-key'** solution to customizing response headers, but there are other ways that this can be done. Either programatically or through other products that can be used with it.

# Programmatically
A quick way that response headers can be changed as needed is through the application itself. With some bit of code added into the functions handling the response, we can append new response headers. It also may be possible to write this so all requests programatically send back custom response headers.

> **NOTE**: There is multiple ways to add response headers for each language. Below is just a select few ways.

## Node
Headers can easily be added to any controllers or routes that are set up. The below example uses `express` and can be added like the following:

```javascript
const headerController = router.get("/", (req, res) => {
  res.header("Foo", "Bar");
  res.json({ message: "Adding a custom header.." });
});
```

In plain Node, the following can be done to set headers - the below can be further abstracted into seperate routes:

```javascript
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

We can now see the added header:

![Node Response Header](/media/2022/05/azure-response-headers-1.png)

Here is [documentation](https://nodejs.org/api/http.html#responsesetheadername-value) for plain Node.

Here is [documentation](https://expressjs.com/en/5x/api.html#res.set) for Express.

### Static Javascript applications/SPA's
- For **Static Javascript applications/SPA's** being hosted on a Linux App Service - like Angular, React, Vue, etc. - either something such as an AppGateway would need to be placed in front of the application, ran ontop of a Node server, a custom Docker Image (bringing your own Web Server to serve the static files), or [served through a Web Server on a PHP Blessed Image](https://azureossd.github.io/2022/05/18/Serving-SPAs-with-PHP-Blessed-Images/index.html) to accomplish this. 

This is because SPA's are typically client-side code, executed in the browser, and have no notation of anything server side - **which means they can't change headers without additional configuration.** This concept is nothing Azure specific, but rather programmatic in general.

**NOTE**: Node Blessed Images on App Service Linux comes with PM2 as a process-manager, but this does **not** handle changes to request or response headers.

## Python

Adding a new response header with Flask:

```python
@app.route('/api/headers')
def headers():
    json_res = jsonify({ "message": "Adding custom header.." })
    res = make_response(json_res)
    res.headers['Foo'] = 'bar'
    return res
```

![Python Response Header](/media/2022/05/azure-response-headers-2.png)

Flask [documentation](https://flask.palletsprojects.com/en/2.1.x/api/?highlight=headers#response-objects) on response headers.

Django [documentation](https://docs.djangoproject.com/en/4.0/ref/request-response/#setting-header-fields-1) on response headers.

## Java

Using Spring Boot, we can add them like the below:

```java
@RestController
public class HeadersController {
    @GetMapping("/api/headers")
    public ResponseEntity<String> addCustomerHeader() {
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set("Foo", "Bar");
        ResponseEntity<String> responseEntity = new ResponseEntity<String>("Adding a custom header..", responseHeaders,
                HttpStatus.OK);
        return responseEntity;
    }
}
```

![Java Response Header](/media/2022/05/azure-response-headers-3.png)

Spring documentation on adding [headers](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/HttpHeaders.html#set-java.lang.String-java.lang.String-) to a [Response Entity](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ResponseEntity.html).

## ASP NET Core (6)

In a ASP NET Core 6 MVC based project, you can add response headers like the below:

```c#
public class HeaderModel : PageModel
{
    private readonly ILogger<HeaderModel> _logger;

    public HeaderModel(ILogger<HeaderModel> logger)
    {
        _logger = logger;
    }

    public void OnGet()
    {
        Response.Headers.Add("Foo", "Bar");
    }
}
```
![ASP Dotnet Core Response Header](/media/2022/05/azure-response-headers-4.png)

Documentation on the ResponseHeaders class can be found [here](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.http.headers.responseheaders.headers?view=aspnetcore-6.0#microsoft-aspnetcore-http-headers-responseheaders-headers).

## PHP

Using Laravel a simple example, we can add response headers like the below:

```php
Route::get('/', function () {
    $content = view('welcome');
    return response($content)->header('Foo', 'Bar');
});
```
![Laravel Response Header](/media/2022/05/azure-response-headers-5.png)

With plain PHP we do it like this:

```php
<?php

header('Foo: Bar');
echo('Adding a custom header..');
```

![PHP Response Header](/media/2022/05/azure-response-headers-5.png)

Laravel's response object documentation can be found [here](https://laravel.com/docs/9.x/responses#attaching-headers-to-responses)

PHP header [documentation](https://www.php.net/manual/en/function.header.php)

# Azure Application Gateway
Response headers can be rewritten by following this [guide](https://docs.microsoft.com/en-us/azure/application-gateway/rewrite-http-headers-portal). Note that using an Application Gateway would place this infront of your application and header rewriting would happen through here.

Further information on editing headers (adding, deleting, or others) with Azure Application Gateway can be seen [here](https://docs.microsoft.com/en-us/azure/application-gateway/rewrite-http-headers-url#delete-unwanted-headers).

**Some programatic examples seen here can be found in this [GitHub repo](https://github.com/azureossd/custom-response-header-examples)**.

# Web Servers
## Blessed Images
- If using the **PHP 7.4** or **PHP 8.0** Blessed Images, these will come with Apache and NGINX as its respective Web Servers.

    If you'd rather add or change response headers through here, a custom startup script would need to be used. This can be done following either of this blog posts:
    1. [PHP Custom Startup Script - App Service Linux - Apache](https://azureossd.github.io/2020/01/23/php-custom-startup-script-app-service-linux/index.html) - this post also includes a way to include headers into Apache.
    2. [PHP Custom Startup Script - App Service Linux - NGINX](https://azureossd.github.io/2021/09/02/php-8-rewrite-rule/index.html)
    3. For the current PHP 8.x Blessed Images - NGINX is the default, but adding the App Setting `WEBSITES_DISABLE_FPM` will pull a PHP 8.x image using Apache as the Web Server.

- For **Tomcat containers** - bringing your own `web.xml` or [custom Tomcat Installation](https://azureossd.github.io/2022/05/20/Custom-Tomcat-Configuration-on-Azure-App-Service-Linux/index.html) may need to be done to do this through the Web Server itself. Embedded Tomcat in Spring Boot applications would be able to do this without the need for a custom installation. 

> **NOTE**: `web.config` files would **NOT** work in any of these scenarios since this is specific to IIS. Additionally, Apache and NGINX are **only** available on PHP Blessed Images and not available in any other images. 

## Custom Docker Images
If you'd rather have more control over how to set up a Web Server to change response headers, rather than programatically, or through an additioanl service in front like App Gateway, another recommendation would be to bring your own Custom Docker Image. 

You have more of a choice on which Web Server to use and additional configuration through this.