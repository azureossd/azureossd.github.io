---
title: "App Service recommendations for PHP version upgrades and end of life"
author_name: "Christopher Maldonado"
tags:
    - EOF
    - PHP
    - Migration
categories:
    - Azure App Service on Linux, Azure App Service on Windows #, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - PHP # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Configuration # Django, Spring Boot, CodeIgnitor, ExpressJS
header:
    teaser: "/assets/images/phplinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-06-19 12:00:00
---

It is important to keep PHP version up to date. Newer version will contain new features, bug fixes and security updates. There are three phases that a supported PHP version can be in: **Active Support**, **Security Fixes Only**, and **End of Life (EOL)**. Currently supported versions and their phases can be found in [PHP Supported Versions](https://www.php.net/supported-versions.php).

## App Service recommendations

In App Service, PHP updates are installed side by side with the existing versions. You can check the [Support Timeline](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/php_support.md#support-timeline) and the OS support for existing versions.

Once a version of PHP has reached it's end of life (EOL), it will no longer be available from Runtime Stack selection dropdown.

**Existing applications configured to target a runtime version that has reached EOL should not be affected**, although it is recommended to review the differences between PHP versions and migrate your application to the next supported version available.

Here are some recommendatios to take in consideration:

1. Select the PHP version you want to update from [PHP Supported Versions](https://www.php.net/supported-versions.php).

2. Run `composer update` or `composer install` to install and update your application dependencies to their latest versions.

3. If you have a local environment, you can also check to ensure all PHP modules and settings are set properly for your application's dependencies using the `composer check-platform-reqs`

4. Test your application and validate if your application is not throwing any error at startup or runtime phases.

5. It is recommended to follow the **[App Service deployment best practices](https://learn.microsoft.com/en-us/azure/app-service/deploy-best-practices)** to have an efficient deployment and migration update, as using deployment/stating slots for testing before switching to production. To update your app to target a different version of PHP in App Service (Linux), you can follow this [article](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/php_support.md#how-to-update-your-app-to-target-a-different-version-of-php).

6. If you are using Azure DevOps, GitHub Actions or any other automation provider, make sure to change the PHP version in the pipelines to match the runtime version.

7. Redeploy your application and validate.

8. Always check for updates in [PHP 8 ChangeLog](https://www.php.net/ChangeLog-8.php) to keep your applications secured.

## Additional References

- [OS and runtime patching in Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/overview-patch-os-runtime)
- [PHP support on App Service](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/php_support.md#php-on-app-service)
- [How do I turn on PHP logging to troubleshoot PHP issues?](https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/php_support.md#php-on-app-service)
