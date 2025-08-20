---
title: "Increasing file upload size on App Service Linux PHP"
author_name: "Anthony Salemo"
tags:
    - App Service
    - Configuration
    - Linux
    - PHP
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows,  
    - How To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplinux.png"
toc: true
toc_sticky: true
date: 2024-12-05 12:00:00
---

This post will cover how to increase the default file upload size on App Service Linux PHP images

# Overview
Before starting, this is specifically for PHP 8.x "Blessed images" on App Service Linux - eg: [Create a PHP web app in Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/quickstart-php?tabs=cli&pivots=platform-linux). These use **NGINX** and php-fpm to serve PHP scripts.

If you're looking to use/host Wordpress - consider using the Docker Image on App Service that's offered specifically for Wordpress - you can get started by following [App Service Linux - Create a WordPress site](https://learn.microsoft.com/en-us/azure/app-service/quickstart-wordpress). This Wordpress image already has file upload size increased to a reasonable amount.

The "PHP Blessed image" described earlier above is more-so for running typical PHP applications or frameworks like Laravel, Yii, or others. 

---------

When doing file uploads, there's a couple of things to know and consider:

**Default upload sizes** - the default file uploads on the PHP App Service Linux images are set to the following:
- NGINX: Since NGINX is used, this has it's own consideration of `client_max_body_size`, which is **not** set in any NGINX config in these images. Therefor, the default is `1MB`
- PHP: `upload_max_filesize` is set to `2MB`
- Application: Your application may have its own file size validation, like seen below

You can check PHP "core" defaults by adding a `<?php phpinfo(); ?>` to a `phpinfo.php` file under `/home/site/wwwroot` or call this via the PHP CLI.

> **NOTE**: If file uploads are slow, you may want to consider increasing `max_execution_time` through a custom `.ini` file. The default for this is 30 seconds. 

The typical behavior seen when **not** increasing this is that file sizes over `1MB` will return a HTTP 413 from NGINX. For example, if we use try to upload a `2.2MB` file, as seen below:

![2.2MB text file CLI output](/media/2024/12/php-increase-file-upload-size-6.png)

![Upload file form with Laravel](/media/2024/12/php-increase-file-upload-size-7.png)

We'll end up encountering the below HTTP 413 from NGINX:

![NGINX HTTP 413 error](/media/2024/12/php-increase-file-upload-size-1.png)

For this to succeed - you need to increase both **NGINX's** and **PHP's** file size upload limits.

# Configuration
We'll use a real world example with Laravel.

(`routes/web.php`)

```php
Route::get('/', function () {
    return view('upload');
});

Route::post('/api/upload', [UploadController::class, 'uploadFile'])->name('uploadFile');
```

(`app/Http/Controllers/UploadController.php`)

```php
class UploadController extends Controller
{
    public function uploadFile(Request $request)
    {
        // Max file size: 10MB
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);
        // Store file in storage/app/uploads directory
        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $file->storeAs('uploads', $fileName); 

        return redirect()->back()->with('message', 'File uploaded successfully.');
    }
}
```

(`resources/views/upload.blade.php`)

```php
<form action="/api/upload" method="post" enctype="multipart/form-data">
    @csrf
    <input type="file" name="file">
    <button type="submit">Upload</button>
</form>
@if (session('message'))
    <div class="mt-5">
        <p class="text-green-400">{% raw %}{{ session('message') }}{% endraw %}</p>
    </div>
@endif
```

**Increase NGINX's file size**:
1. You can generally follow [NGINX Rewrite Rules for Azure App Service Linux PHP 8.x](https://azureossd.github.io/2021/09/02/php-8-rewrite-rule/index.html) on how to override NGINX's `default` file under `/etc/nginx/sites-avaialable/default` or follow the below.
    - a) Go into an SSH session within the application container and run `cp /etc/nginx/sites-available/default /home/default`
    - b) Update the `default` file to include `client_max_body_size` in the server block as seen below. Set this to a sensible value:

        ```nginx
        server {
            #proxy_cache cache;
                #proxy_cache_valid 200 1s;
            listen 8080;
            listen [::]:8080;
            # This was changed from /home/site/wwwroot to /home/site/wwwroot/public for Laravel
            root /home/site/wwwroot/public;
            index  index.php index.html index.htm;
            server_name  example.com www.example.com; 
            port_in_redirect off;
            # IMPORTANT: Add this in. 10M is 10MB. Change as needed
            client_max_body_size 10M;   

            ... rest of other nginx content
        }   
        ```
    - c) Either create a `startup.sh` file under `/home` (or elsewhere) or use the in-line version for your custom Startup Command

        If using `startup.sh`, add the following:

        ```sh
        #!/bin/sh

        echo "Copying default to /etc/nginx/sites-available/default"
        cp /home/default /etc/nginx/sites-available/default

        echo "Reloading NGINX.."
        service nginx reload
        ```

        Then, in the Azure Portal -> **Configuration** for your PHP application, add the location of your `startup.sh` file:

        ![Startup command file](/media/2024/12/php-increase-file-upload-size-2.png)

        Or, if opting to use an in-line command, just add `cp /home/default /etc/nginx/sites-available/default && service nginx reload`

        ![Inline startup command](/media/2024/12/php-increase-file-upload-size-3.png)

    - d) Click "Save" at the top when finished

**Increase PHP's default upload size**:
1. You can follow [Configure a PHP app for Azure App Service - Customize php.ini settings](https://learn.microsoft.com/en-us/azure/app-service/configure-language-php?pivots=platform-linux#customize-phpini-settings) or follow the below
    - a) In an SSH session within the application container, create an `ini` folder. We'll create one with `mkdir /home/site/ini`
    - b) Create an custom `.ini` file to increase the upload size with `echo "upload_max_filesize=50M" >> /home/site/ini/extensions.ini`
    - c) Then, in the Azure Portal -> **Configuration** for your PHP application, add the environment variable `PHP_INI_SCAN_DIR` to load this custom `.ini` in. Set this to the value of `/home/site/ini/`:

    ![PHP environment variable for custom ini file](/media/2024/12/php-increase-file-upload-size-4.png)

    - d) Click "Save" at the top when finished

---------

At this point, after increasing **both** PHP's and NGINX's max allowed file size values - you should now be able to upload files greater than `1MB` for NGINX and `2MB` for PHP.

![PHP file upload success](/media/2024/12/php-increase-file-upload-size-5.png)

# Summary
You need to increase NGINX's `client_max_body_size` (which has a default of 1MB) and PHP's `upload_max_filesize` (which h as a default of 2MB) - otherwise, you may encounter an HTTP 413, or, an error returned from PHP - when uploading files greater than 1MB for NGINX and 2MB for PHP.