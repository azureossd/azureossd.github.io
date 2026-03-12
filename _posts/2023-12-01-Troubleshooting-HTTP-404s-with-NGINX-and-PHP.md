---
title: "Troubleshooting HTTP 404s with NGINX and PHP"
author_name: "Anthony Salemo"
tags:
    - PHP
    - NGINX
    - Performance
    - Azure App Service on Linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-12-01 12:00:00
---

This post will cover why you may see HTTP 404's with PHP "Blessed Images" and NGINX under certain circumstances

# Overview

This post is used as an encapsulation of other blog posts aimed to troubleshoot or explain HTTP 404's seen with PHP "Blessed Images" and NGINX more directly.

When using PHP "Blessed Images" on App Service Linux running 8.x - this uses NGINX. There may be certain circumanstances in which "404s" appear - this typically falls into the three below categories:
- A 404 due actual missing content or an unmapped endpoint (eg., file not found, Controller is not mapped to the endpoint/path name, etc.)
- A 404 due to a HTTP 500
- A 404 due to site root misconfiguration

> **NOTE** These scenarios can happen on PHP applications running with Web Apps for Containers as well - the resolution to these may be diffirent, but the concepts are the same

**A 404 due to a HTTP 500**:

NGINX may show a 404 while application logging indicates a HTTP 5xx was actually returned.

Ultimately, this is due to the fact that the `error_page` directive in NGINX's `default.conf` returns a non existent `/50x.html` when HTTP 5xx's are returned.

```conf
error_page   500 502 503 504  /50x.html;
location = /50x.html {
   root   /html/;
}
```

This is called out in this public blog post - [PHP configuration: Customizing NGINX’s error page handling](https://azureossd.github.io/2023/06/21/PHP-configuration-Customizing-NGINXs-error-page-handling/index.html) - which includes other ways to pass the "real" error through to the client - or ways to configure the `error_page` directive.

When an application returns a HTTP 5xx, typically, that configured error page by NGINX would be returned to the user - however, since that doesn't exist - it is actually returned as a HTTP 404 to the user.

![NGINX 404](/media/2023/12/nginx-404-1.png)

It is important to confirm and understand if the 404's we're seeing from NGINX is actually due to an application-level issue or not - this can be confirmed by enabling [App Service Logging](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) and then reviewing application logs. A common example may be:
- An application encountering an error, but a non-fatal one, on startup - eg., a missing `APP_KEY` with Laravel
- A request made to the site - app logic returns a 500

If App Service Logging is enabled - but debug mode is **not** enabled - the logging may only just show this - and not anything like a error/callstack written to stdout/err:

(Laravel - without debug mode)

```
127.0.0.1 -  21/Jun/2023:16:56:15 +0000 "GET /index.php" 500
```

(Laravel - with debug mode)

```
[2023-12-01 18:42:59] local.ERROR: No application encryption key has been specified. {"exception":"[object] (Illuminate\\Encryption\\MissingAppKeyException(code: 0): No application encryption key has been specified. at /home/site/wwwroot/vendor/laravel/framework/src/Illuminate/Encryption/EncryptionServiceProvider.php:101)
[stacktrace]
```

> **NOTE**: Laravel stores logs in `/home/site/wwwroot/strorage` - if you don't see them logged in `default_docker.log` - check this log location instead

If this is the case, you should enable debug mode/logging - this may also depend entirely on the application and framework used (if any).
- Laravel: See [configuration](https://laravel.com/docs/10.x/configuration#retrieving-environment-configuration):
  - Set `APP_DEBUG` as an App Setting to `true`

- Yii: See [debug mode](https://www.yiiframework.com/doc/guide/2.0/en/tutorial-performance-tuning#disable-debug)
   - Set `YII_DEBUG` as an App Setting to `true`

If the application is configured to write to stdout/err - this should now appear in `default_docker.log`.

**A 404 due to a missing file or unmapped route**:

If it's determined the 404 is truly just due to a missing file (eg., static files like images, .js, etc.) ensure these files actually exist on the file system. Sometimes, if these files are in locations not directly relative to the file requesting it - and the function referencing it has a relative value instead of absolute - this could cause a "file not found" issue.

There are more rare occurrences of a file being in use - such as having an open handle by another process - and it trying to be operated on (eg., CRUD) - which may throw back the equivalent of `file not found`  (or `access denied`).

For `.js` files that may be apart of Front-Ends, like using Vue, React, Angular, or others (being served as production builds to PHP - eg., Laravel and Yii, etc.) - ensure these are on the file system. If not, then the frontends for these may not be built during deployment. Check if `npm run build` or `yarn run build` is expected to be ran - or if the production build folder is set in a `.gitignore`.
  - For example, using Oryx as a deployment method - a custom deployment script may be needed - see [Oryx - Configuration](https://github.com/microsoft/Oryx/blob/main/doc/configuration.md#oryx-configuration) and `POST_BUILD_COMMAND` or `POST_BUILD_SCRIPT_PATH`
  - For CI/CD pipelines, see [Laravel Deployment on App Service Linux - CSS is not updating or being generated if using CSS/UI frameworks](https://azureossd.github.io/2022/04/22/PHP-Laravel-deploy-on-App-Service-Linux/index.html#css-is-not-updating-or-being-generated-if-using-cssui-frameworks) - on how to configure this from Azure Pipelines. This same concept applies to GitHub Actions.
  - For ZipDeploy (without Oryx, ran from a local environment) - the production build should be generated locally prior to zipping the content

For 404's due to endpoints not mapped to controllers - check the source code to ensure these endpoints actually exist in their codebase. This will also depend on the framework used (if any). If a framework is not used, then ensure the relevant `.php` file requested exists on the file system. This should be tested locally prior to deployment.

**404 due to misconfiguration**:

HTTP 404's can come back from NGINX if site root does not match where the application root is. This is defined in the `default.conf` file under `sites-available` with the `root` directive.

A common theme is with frameworks again - such as Laravel and Yii - where the application is served out of `/public/` or `/web/` - which would equate to `/home/site/wwwwroot/public` or `/home/site/wwwroot/web` - whereas NGINX's default `root` is `/home/site/wwwroot`.

The below blog posts cover how to update NGINX to properly set `root` for applications that don't serve directly from `wwwroot`:
- [NGINX Rewrite Rules for Azure App Service Linux PHP 8.x](https://azureossd.github.io/2021/09/02/php-8-rewrite-rule/index.html)
   - [Laravel Deployment on App Service Linux](https://azureossd.github.io/2022/04/22/PHP-Laravel-deploy-on-App-Service-Linux/index.html)
   - [Yii Deployment on App Service Linux](https://azureossd.github.io/2022/05/03/PHP-Yii-deploy-on-App-Service-Linux/index.html) 