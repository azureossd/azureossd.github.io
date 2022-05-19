---
title: "How to use a Custom PHP runtime for App Service Windows"
author_name: "Edison Garcia"
tags:
    - PHP
    - App Service Windows
categories:
    - PHP
    - Configuration
    
header:
    teaser: /assets/images/App-Services.png
toc: true
toc_sticky: true
date: 2022-05-18 12:00:00
---

This post provides information on how to setup a custom php runtime for Azure App Service Windows.

# Configuration

Instead of the default PHP runtime, App Service Web Apps (Windows) can use a PHP runtime that you provide to execute PHP scripts. The runtime that you provide can be configured by a `php.ini` file that you also provide. To use a custom PHP runtime with Web Apps, follow the steps below.

1. Obtain a non-thread-safe, VC9 to VC16 compatible version of PHP for Windows. Recent releases of PHP for Windows can be found here: [http://windows.php.net/download/](http://windows.php.net/download/). Older releases can be found in the archive here: [http://windows.php.net/downloads/releases/archives/](http://windows.php.net/downloads/releases/archives/).
2. Modify the `php.ini` file for your runtime. Note that any configuration settings that are system-level-only directives will be ignored by Web Apps. (For information about system-level-only directives, see [List of php.ini directives]).
3. Optionally, add extensions to your PHP runtime and enable them in the `php.ini` file.
4. Add a `bin` directory to your root directory, and put the directory that contains your PHP runtime in it (for example, `bin\php`).
5. Deploy your web app.
6. Browse to your web app in the Azure Portal and click on the **Configuration** button.

    ![Configuration](/media/2022/05/custom-php-windows-00.png)

7. From the **Configuration** blade select **Path mappings** and go to the **Handler mappings** section. Add `*.php` to the Extension field and add the path to the `php-cgi.exe` executable. If you put your PHP runtime in the `bin` directory in the root of you application, the path will be `C:\home\site\wwwroot\bin\php\php-cgi.exe`.

    ![Handler mappings](/media/2022/05/custom-php-windows-01.png)

8. Click the **Save** button at the top of the Configuration settings blade. And then click on **Continue**.

    ![Save](/media/2022/05/custom-php-windows-02.png)


[List of php.ini directives]: http://www.php.net/manual/en/ini.list.php

> For additional configurations for running Composer or any popular automation tool at deployment time, review this [reference](https://docs.microsoft.com/en-us/azure/app-service/configure-language-php?pivots=platform-windows).

# Validation

To validate if the custom php version is being executed, you can create a quick info page with the following code:

```php
<?

phpinfo();
```

