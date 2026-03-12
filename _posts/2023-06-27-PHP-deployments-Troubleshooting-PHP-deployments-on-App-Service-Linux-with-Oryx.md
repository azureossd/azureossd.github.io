---
title: "PHP Deployments: Troubleshooting PHP deployments on App Service Linux with Oryx"
author_name: "Anthony Salemo"
tags:
    - PHP
    - Deployment
    - Azure App Service on Linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Deployment # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-06-27 12:00:00
---

This post will cover common scenarios you may encounter when deploying a PHP application on App Service Linux while Oryx is the builder.


# Identify the build provider 
It is very important to identify if an issue is happening in the deployment process or post deployment (in startup of the application). Sometimes, after a depoyment an application may go down - this is a "post deployment" issue, and, in some cases - one may think this is a "failed deployment", when in reality it is not - the deployment has succeeded. During troubleshooting, it is important to understand this distiction.

Before starting you need to identify **where is your source code** and **which is the build provider**:

| Where is my source code?                   | Which is the build provider?                                                | 
| ------------------------------------------ | ------------------------------------------------------------------------    |  
| GitHub                                     | GitHub Actions or App Service Build Service (Oryx) or Azure Pipelines       |  
| Bitbucket                                  | App Service Build Service (Oryx)                                            | 
| LocalGit                                   | App Service Build Service (Oryx)                                            |
| Azure Repos                                | Azure Pipelines or App Service Build Service (Oryx)                         |
| External Git                               | App Service Build Service (Oryx) or Azure Pipelines                         |
| Local Computer (Using ZipDeploy)           | App Service Build Service (Oryx) or Building Assets locally (Basic builder) |
| Local Computer (Using RunFromPackage)      | Building Assets locally (Basic builder)                                     |
| Local Computer (Using OneDeploy)           | Building Assets locally (Basic builder)                                     |
| Local Computer (FTP)                       | No builder                                                                  | 

> **NOTE** When using `GitHub Actions`, `Azure Pipelines` or `ZipDeploy`, Oryx is not enabled by default since you are using a `Remote/External builder`. If you prefer to enable App Service Build Service (Oryx) then you need to add a new App Setting **`SCM_DO_BUILD_DURING_DEPLOYMENT`= `true`** and redeploy.

> When using `Local Git`, `Bitbucket` or `External Git`, Oryx is enabled by default.

## Builders
- **OryxBuilder**: If OryxBuilder is seen, then Oryx is being used. You can determine the builder from `/home/LogFiles/kudu/trace/yyyy-mm-ddThh-mm-ss_00aabb_000_Background_POST_api-zipdeploy_pending.xml` - or other deployment logging, such as through the Logging tab in the Deployment Center.
- **BasicBuilder**: If BasicBuilder is seen, Oryx is not being used - the application will not be automatically built against a PHP toolset. You can determine the builder through the same methods listed above.

# Using Oryx Builder
## Issues detecting the platform
**Error**:

This will manifest as `Error: Couldn't detect a version for the platform 'php' in the repo.`.

**Reason**:

This means that Oryx couldn't determine a PHP project from the file contents deployed from the logic [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/php.md#detect).

- `composer.json` file exists in the root of the repository.
- Files with `.php` extension in root of repository or in any sub-directories.

**Actions**:

Ensure that either `composer.json` and/or a `.php` file exists in the project.

## php artisan package:discover --ansi handling the post-autoload-dump event returned with error code [code]
**Error**:

```php
Script @php artisan package:discover --ansi handling the post-autoload-dump event returned with error code [code]
```

> **NOTE**: The error code may vary, but it should generally be aligned with Linux standard error codes

**Reason**:

The actual reason will also vary, but the body of the problem will be output _after_ the `php artisan package:discover` script is ran. 

This is apart of the `scripts` property in `composer.json`. 

The body (reason) will typically point to a package under `/vendor`, syntax in relation to a certain PHP or composer version used, deprecated features, etc. This will widely vary, especially with an `exit status` of `1`.

Part of this can be due to the `composer.lock` file and when it was generated - for example, being generated on a different version of PHP or composer.

**Actions**:
- Delete `composer.lock` from the project repository.
  - On a matching major/minor version of PHP and composer, close to what is intended to be deployed on App Service - rerun `composer install`. This will regenerate `composer.lock`.
    - It is possible to avoid this by deploying without `composer.lock`, but this is not recommended.

This can potentially be circumvented if _not_ using Oryx is a possibility. For example, building the project through a pipeline (GitHub Actions, Azure DevOps), or, local ZipDeploy - as long as Oryx is not used - should avoid this problem as well. However, if the issue persists in these environments, it would be important to review the error output and the package it's referring to.

## Error: Platform 'php-composer' version is unsupported
**Issue**:

This will manifest as:

```
remote: Error: Platform 'php-composer' version 'x.x.x' is unsupported. Supported versions: 1.10.0, 1.10.1, 1.10.10, 1.10.11, 1.10.12, 1.10.13, 1.10.14, 1.10.15, 1.10.16, 1.10.17, 1.10.18, 1.10.19, 1.10.2, 1.10.4, 1.10.5, 1.10.6, 1.10.7, 1.10.8, 1.10.9, 1.9.2, 1.9.3, 2.0.0, 2.0.1, 2.0.2, 2.0.3, 2.0.4, 2.0.5, 2.0.6, 2.0.7, 2.0.8, 2.2.9, 2.3.4, 1.10.0, 1.10.1, 1.10.10, 1.10.11, 1.10.12, 1.10.13, 1.10.14, 1.10.15, 1.10.16, 1.10.17, 1.10.18, 1.10.19, 1.10.2, 1.10.4, 1.10.5, 1.10.6, 1.10.7, 1.10.8, 1.10.9, 1.9.2, 1.9.3, 2.0.0, 2.0.1, 2.0.2, 2.0.3, 2.0.4, 2.0.5, 2.0.6, 2.0.7, 2.0.8, 2.2.9, 2.3.4
```

**Reason**:

If encountering this, likely the `PHP_COMPOSER_VERSION` App Setting is targeting a Composer version not in the list here under `versionsToBuild.txt` for the OS-type being used - [Oryx - PHP - Composer versions](https://github.com/microsoft/Oryx/blob/main/platforms/php/composer/versions/bullseye/versionsToBuild.txt).

Such as, `remote: Error: Platform 'php-composer' version '2.3.2' is unsupported`

**Actions**:

Choose a Composer version from the list defined in the error message.

## Uncaught Error: Failed opening required '/home/site/wwwroot/public/../vendor/autoload.php' 
**Issue**:

The full error seen may look something like this:

```
NOTICE: PHP message: PHP Warning:  require(/home/site/wwwroot/public/../vendor/autoload.php): Failed to open stream: No such file or directory in /home/site/wwwroot/public/index.php on line 34
NOTICE: PHP message: PHP Fatal error:  Uncaught Error: Failed opening required '/home/site/wwwroot/public/../vendor/autoload.php' (include_path='.:/usr/local/lib/php') in /home/site/wwwroot/public/index.php:34
  Stack trace:
  #0 {main}
    thrown in /home/site/wwwroot/public/index.php on line 34
NOTICE: PHP message: PHP Warning:  require(/home/site/wwwroot/public/../vendor/autoload.php): Failed to open stream: No such file or directory in /home/site/wwwroot/public/index.php on line 34
127.0.0.1 -  22/Jun/2023:20:58:56 +0000 "GET /index.php" 500
NOTICE: PHP message: PHP Fatal error:  Uncaught Error: Failed opening required '/home/site/wwwroot/public/../vendor/autoload.php' (include_path='.:/usr/local/lib/php') in /home/site/wwwroot/public/index.php:34
Stack trace:
#0 {main}
    thrown in /home/site/wwwroot/public/index.php on line 34
```

**Reason**:

Either the `/vendor` folder as a whole is missing, or, a specific package that is being referenced by the application but is _not_ in `/vendor` is missing.

`/vendor`, when using Composer - holds all the packages or dependencies needed by the application.


**Action**:

- If using Azure DevOps or GitHub Actions, validate that `composer install` is being ran on the pipeline side and that the generated `/vendor` folder is included in the artifact. 
  - If wanting to build with Oryx when using Azure DevOps or GitHub Actions, ensure that `SCM_DO_BUILD_DURING_DEPLOYMENT` is `true`
- If using Local Git, validate that the project meets Oryx and PHP detection logic [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/php.md#detect).
- If using ZipDeploy (with Oryx) - ensure that `SCM_DO_BUILD_DURING_DEPLOYMENT` is `true`
- If using ZipDeploy (without Orxy) - `/vendor` _must_ be included in the Zip being deployed.
- If using FTP - `/vendor` _must_ included in the contents being deployed

If `/vendor` exists on the file system under `/home/site/wwwroot`, then review if a specific package is missing from `composer.json` under the `require` or `require-dev` properties.

## [RuntimeException] Failed to execute git clone
**Issue**:

When building a PHP application with Oryx, the following message may show when referencing a private repository or package.

```
[RuntimeException]                                                                                                                                                                                                                                                                                             
Failed to execute git clone --mirror [repositoryURI]

Cloning into bare repository '/home/.cache/composer/[rest_of_location]'
fatal: Authentication failed for [repositoryURI]

install [--prefer-source] [--prefer-dist] [--dry-run] [--dev] [--no-suggest] [--no-dev] [--no-autoloader] [--no-scripts] [--no-progress] [--no-install] [-v|vv|vvv|--verbose] [-o|--optimize-autoloader] [-a|--classmap-authoritative] [--apcu-autoloader] [--apcu-autoloader-prefix APCU-AUTOLOADER-PREFIX] [--ignore-platform-req IGNORE-PLATFORM-REQ] [--ignore-platform-reqs] [--] [<packages>]...
```

**Reason**:

Composer may not be able to authentication with the package hosted in the private repository.

**Action**:
You can also follow the "http-basic" and Personal Access Token (PAT) examples for various repository providers from Composer's official docs - [Authentication for privately hosted packages and repositories](https://getcomposer.org/doc/articles/authentication-for-private-packages.md#:~:text=To%20fix%20this%20you%20need%20to%20open%20the,in%20your%20favorite%20editor%20and%20fix%20the%20error).

For example, for the "http-basic" scenarios, copy the JSON representation of the object and past the full value into an App Setting named `COMPOSER_AUTH`. An examle would be a value of the following for the App Setting value:

```json
{     
   "http-basic": {     
        "github.com": {   
            "username": "sample",      
            "password": "[TOKEN]" 
        }              
    }  
}
```

## Git index lock file exists
**Error**:

* `Unable to create '/home/site/repository/.git/index.lock': File exists.`

**Reason**:

Whenever you run a git process, git creates an `index.lock` file within the .git directory. if you run the command `git add .` to stage all local changes within your current repository, git will create this `index.lock` file while the git add command is running. Upon successful completion of the git add process, the index.lock file is removed. 

What this does is ensure that simultaneous changes to your local git repo do not occur, as this would cause your git repo to be in an indeterminate state. 

The `index.lock` file prevents changes to your local repository from happening from outside of the currently running git process so as to ensure multiple git processes are not altering or changing the same repository internals at the same time.

**Actions**:

* Remove file.lock from remote repository and also from `/home/site/repository/.git/index.lock` and redeploy

## Kudu Parent process crashed

**Errors**:
- `GetParentProcessLinux (id) failed.: Could not find a part of the path '/proc/id/stat'`

**Actions**:
- Redeploy, if the issue continues, then stop the site and redeploy, then start site.
- If issue continues, scale up and down to replace the instance.

##  Unexpected Error

**Error**
- `Error: Oops... An unexpected error has occurred.`

**Reason**
- Unhandled exception when running Oryx build

**Actions**
- SSH into Kudu using `https://<your_sitename>.scm.azurewebsites.net/newui/kududebug` and review `/tmp/build-debug.log` for insights.
- Also review if you have any of the [App Settings](https://github.com/microsoft/Oryx/blob/main/doc/configuration.md) that Oryx uses and validate if the settings are correct.
- If you are using VNET integration and getting the following errors:
    - `Http request to retrieve the SDKs available to download from 'https://oryx-cdn.microsoft.io' failed. Please ensure that your network configuration allows traffic to required Oryx dependencies  as documented in 'https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md#network-dependencies'`
    - `Error: System.AggregateException: One or more errors occurred. (A task was canceled.)
 ---> System.Threading.Tasks.TaskCanceledException: A task was canceled.
   --- End of inner exception stack trace ---
   at System.Threading.Tasks.Task`1.GetResultCore(Boolean waitCompletionNotification)
   at System.Threading.Tasks.Task`1.get_Result()
   at Microsoft.Oryx.BuildScriptGenerator.SdkStorageVersionProviderBase.GetAvailableVersionsFromStorage(String platformName)`

        Review if the [Oryx CDN endpoint](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md#network-dependencies) is whitelisted in VNET.

## Oryx build was aborted after 60 seconds

**Error**
- `oryx build ...' was aborted due to no output nor CPU activity for 60 seconds`

**Reason**
* Timeout building waiting on previous command to get a response

**Actions**
* VNET? Review connectivity to [Oryx CDN](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md#network-dependencies). Allow outbound access from the webapp to `oryx-cdn.microsoft.io` on port `443`
- Ensure that [packagist.org](https://packagist.org/) for `composer` package installation is able to be reached.
  - For frameworks that rely on NPM packages - ensure that the [NPM registry](https://www.npmjs.com/) is reachable as well.

## NPM, node, or node_module issues
Since there are some frameworks, libraries, or implementations that may rely on Node-based frameworks and JavaScript in general for building the UI - please see [Troubleshooting Node.js deployments on App Service Linux](https://azureossd.github.io/2023/02/09/troubleshooting-nodejs-deployments-on-appservice-linux/index.html)

# Post Deployment scenarios
- [PHP Deployments: cannot open shared object file: no such file or directory](https://azureossd.github.io/2023/06/14/PHP-Deployments-could-not-open-object-file-no-such-file-or-directory/index.html)

# Deploying Frameworks
- [Laravel Deployment on App Service Linux](https://azureossd.github.io/2022/04/22/PHP-Laravel-deploy-on-App-Service-Linux-copy/index.html#php-7x-apache)
- [Yii Deployment on App Service Linux](https://azureossd.github.io/2022/05/03/PHP-Yii-deploy-on-App-Service-Linux/index.html)