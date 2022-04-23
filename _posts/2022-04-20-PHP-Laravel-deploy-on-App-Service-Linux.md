---
title: "Laravel deployment on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - PHP
    - Laravel
    - Deploy
    - Azure DevOps
    - GitHub Actions
categories:
    - Azure App Service on Linux
    - PHP
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/laravel-logo.png
toc: true
toc_sticky: true
date: 2022-04-22 12:00:00
---

This post provides information for creating, configuring, and deploying a Laravel application on App Service Linux. 

# Local Development 

**Prerequesites**:
1. If not done so already, create an [App Service on Linux set to PHP 7.4](https://docs.microsoft.com/en-us/azure/app-service/quickstart-php?pivots=platform-linux#create-a-web-app)
2. The above link points to using Cloud Shell, however, this can be created in any number of ways (ex. Azure Portal, Azure CLI, ARM template, etc.).

## Create a quickstart Laravel project.

1. For this example we'll be creating a basic Laravel application to get started from the [Laravel Installation docs](https://laravel.com/docs/9.x/installation) using Composer. Composer can be downloaded [here](https://getcomposer.org/) if not already on your local machine. Run the following, where `example-app` can be any arbitrary name for your project:

```
composer create-project laravel/laravel example-app
 
cd example-app
 
php artisan serve
```

2. After running the above, this should have created a Laravel application named `example-app`(or your name of choice), changed directories into the newly created project folder named `example-app`(or your name of choice) and started the local development server for Laravel. 
    
    This would start Laravel on port 8000. Browsing to `127.0.0.1:8000` or `localhost:8000` should show the following:

    (output in browser)
    ![Laravel App](/media/2022/04/azure-php-laravel-deployment-1.png)

    (output in terminal)
    ```
    Starting Laravel development server: http://127.0.0.1:8000
    [Wed Apr 20 15:58:01 2022] PHP 8.0.17 Development Server (http://127.0.0.1:8000) started
    [Wed Apr 20 15:58:04 2022] 127.0.0.1:50226 Accepted
    [Wed Apr 20 15:58:04 2022] 127.0.0.1:50227 Accepted
    [Wed Apr 20 15:58:04 2022] 127.0.0.1:50226 Closing
    [Wed Apr 20 15:58:05 2022] 127.0.0.1:50227 [200]: GET /favicon.ico
    [Wed Apr 20 15:58:05 2022] 127.0.0.1:50227 Closing
    ```

**Important pre-deployment checks**

1. Set `APP_KEY` as an [App Setting](https://docs.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal) in the Azure Portal for the application. The `.env` file that contains this in the local environment will **not** be commited as it's included in `.gitignore`. Without this set the application will crash on start up.

2. If you're connecting to an external database update the database related values under `config/database.php` accordingly. For example, if using `mysql` as your database make sure to update these values and add any environment variables being used as [App Settings](https://docs.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal) in the Azure Portal:

```
...
.....
'default' => env('DB_CONNECTION', 'mysql'),
....
...
'mysql' => [
    'driver' => 'mysql',
    'url' => env('DATABASE_URL'),
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_DATABASE', 'forge'),
    'username' => env('DB_USERNAME', 'forge'),
    'password' => env('DB_PASSWORD', ''),
    'unix_socket' => env('DB_SOCKET', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'prefix_indexes' => true,
    'strict' => true,
    'engine' => null,
    'options' => extension_loaded('pdo_mysql') ? array_filter([
        PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
    ]) : [],
],
.....
...
```

3. By default, `env` is set to `local` and `debug` is set to `true` - which is located under `config/app.php` and read from `.env` when running locally. When deploying to production we want to update the associated values, eg. `APP_ENV`, `APP_DEBUG`, `APP_URL` to proper values, if desired. If these are left blanks they fall back to their respective defaults in `config/app.php` as seen below:

```
...
.....
'env' => env('APP_ENV', 'production'),
'debug' => (bool) env('APP_DEBUG', false),
'url' => env('APP_URL', 'http://localhost'),
.....
...
```


# PHP 7.x (Apache)
PHP 7.x on Azure App Service Linux use Apache as the Web Server. Since Laravel uses `/public` as the site root we need to use an `.htaccess` to rewrite these requests accordingly. Create an `.htaccess` in the root of your repo with the following:

> **NOTE**: If this is not added or is accidentally included in your `.gitignore` you will still see the default developer page. Ensure this file is commited with your source code.

```
<IfModule mod_rewrite.c>
    RewriteEngine on
    RewriteCond %{REQUEST_URI} ^(.*)
    RewriteRule ^(.*)$ /public/$1 [NC,L,QSA]
</IfModule>
```
More on this can be found [here](https://docs.microsoft.com/en-us/azure/app-service/configure-language-php?pivots=platform-linux).

# PHP 8 (NGINX)

PHP 8 on Azure App Service Linux use NGINX as the Web Server. To have NGINX route requests to `/public` we'll have to configure a custom startup script. We can grab the existing `default.conf` under `/etc/nginx/sites-available/default.conf` and run `cp /etc/nginx/sites-available/default.conf /home`. This will copy the `nginx.conf` we need into `/home` so we can download it with an FTP client or any other tool that allows this.

This `default.conf` has the following line:

`root /home/site/wwwroot;`

We need to change it to the following:

`root /home/site/wwwroot/public;`

Next, under the `location` block we need to change it from:

```
location / {            
        index  index.php index.html index.htm hostingstart.html;
    }
```

to the following:

```
location / {            
        index  index.php index.html index.htm hostingstart.html;
        try_files $uri $uri/ /index.php?$args;
    }
```

Now configure your actual `startup.sh` bash script. Note, the file name is arbitrary as long as it is a Bash (`.sh`) script. Configure the file along the lines of the below:

```
#!/bin/bash

echo "Copying custom default.conf over to /etc/nginx/sites-available/default.conf"

NGINX_CONF=/home/default.conf

if [ -f "$NGINX_CONF" ]; then
    cp /home/default.conf /etc/nginx/sites-available/default
    service nginx reload
else
    echo "File does not exist, skipping cp."
fi
```
> **NOTE**: $query_string can be used as well. See the official documentation [here](https://nginx.org/en/docs/http/ngx_http_core_module.html#var_args).

Our custom `default.conf` should look like the below:

```
server {
    #proxy_cache cache;
	#proxy_cache_valid 200 1s;
    listen 8080;
    listen [::]:8080;
    root /home/site/wwwroot/public;
    index  index.php index.html index.htm;
    server_name  example.com www.example.com; 

    location / {            
        index  index.php index.html index.htm hostingstart.html;
        try_files $uri $uri/ /index.php?$args;
    }

    ........
    .....
    ...all the other default directives that were in this file originally...
}
```


Use an FTP client to upload both your `startup.sh` script and your custom `default.sh` to the `/home` directory for your PHP App Service. 

Next, under 'Configuration' in the portal target `/home/startup.sh` (or whatever the startup script file name is).

![Laravel App](/media/2022/04/azure-php-laravel-deployment-2.png)


**Lastly,** restart the App Service. This should now be using our custom startup script. Use LogStream or the Diagnose and Solve -> Application Logs detector, or other methods, to see the stdout from the script.


This [blog](https://azureossd.github.io/2021/09/02/php-8-rewrite-rule/index.html) can be referenced for further details with NGINX, startup scripts and PHP 8 on Azure App Service Linux.

# Deployment Options 
There are multiple deployment options in PHP on App Service Linux such as Continuous Deployment(GitHub Actions, DevOps pipelines), External Git, Local Git, [ZipDeploy with Oryx Builder](https://docs.microsoft.com/en-us/azure/app-service/deploy-zip?tabs=cli#enable-build-automation-for-zip-deploy), etc. We'll be covering 3 of these methods below.

## Local Git 
When using Local Git, you are using `App Service Build Service` also named as ([Oryx](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md)) to build your application.

To setup this option and deploy a Laravel application follow the below:
> **NOTE**: Deploying from Local Git will likely prompt you for your Git credentials for the Azure Application. You can find it under the FTPS Credentials tab in the screenshot below. 


1. Navigate to your Web App and select `Deployment Center` and then click on `Local Git` and then click on `Save`.

    ![Laravel App](/media/2022/02/flask-deployment-linux-03.png)
2. Copy the remote git repository from Azure Portal.

    ![Laravel App](/media/2022/04/azure-php-laravel-deployment-5.png)

3. In your local terminal run the following commands in order:
    ```bash
    git add .
    git commit -m "initial commit"
    git remote add azure https://<sitename>.scm.azurewebsites.net:443/<sitename>.git
    git push azure master
    ```
4. Then Oryx will build the application. You should see an output along the lines of the below:
> **NOTE**: A `.gitignore` should be present in your repository root to avoid commiting directories like `/vendor`. If commiting this directory, or others like it (ex. `node_modules`) your deployment time can easily increase by minutes or eventually time-out. A Laravel based `.gitignore` can be found [here](https://github.com/github/gitignore/blob/main/Laravel.gitignore) on GitHub.
```
remote: Deploy Async
remote: Updating branch 'master'.
remote: Updating submodules.
remote: Preparing deployment for commit id '2506547978'.
remote: Repository path is /home/site/repository
remote: Running oryx build...
remote: Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
remote: You can report issues at https://github.com/Microsoft/Oryx/issues
remote: 
remote: Oryx Version: 0.2.20211207.1, Commit: 46633df49cc8fbe9718772a3c894df221273b2af, ReleaseTagName: 20211207.1
remote: 
remote: Build Operation ID: |lS2kssz4Jfg=.f73b9183_
remote: Repository Commit : 2506547978b7fe1375500dbc00cab81b49e42493
remote: 
remote: Detecting platforms...
remote: Detected following platforms:
remote:   nodejs: 14.19.1
remote:   php: 7.4.28
remote: Version '14.19.1' of platform 'nodejs' is not installed. Generating script to install it...
remote: Version '7.4.28' of platform 'php' is not installed. Generating script to install it...
remote: 
remote: Using intermediate directory '/tmp/8da23b045ebbd81'.
remote: 
remote: Copying files to the intermediate directory...
remote: Done in 1 sec(s).
remote: 
remote: Source directory     : /tmp/8da23b045ebbd81
remote: Destination directory: /home/site/wwwroot
remote: 
remote: 
remote: Downloading and extracting 'nodejs' version '14.19.1' to '/tmp/oryx/platforms/nodejs/14.19.1'...
remote: Downloaded in 1 sec(s).
remote: Verifying checksum...
remote: Extracting contents...
remote: ....
remote: performing sha512 checksum for: nodejs...
remote: Done in 13 sec(s).
remote: 
remote: 
remote: Downloading and extracting 'php' version '7.4.28' to '/tmp/oryx/platforms/php/7.4.28'...
remote: Downloaded in 1 sec(s).
remote: Verifying checksum...
remote: Extracting contents...
remote: performing sha512 checksum for: php...
remote: Done in 5 sec(s).
remote: 
remote: PHP executable: /tmp/oryx/platforms/php/7.4.28/bin/php
remote: Composer archive: /opt/php-composer/2.0.8/composer.phar
remote: Running 'composer install --ignore-platform-reqs --no-interaction'...
remote:
remote: Installing dependencies from lock file (including require-dev)
remote: Verifying lock file contents can be installed on current platform.
remote: Warning: The lock file is not up to date with the latest changes in composer.json. You may be getting outdated dependencies. It is recommended that you run `composer update` or `composer update <package name>`.
remote: Package operations: 110 installs, 0 updates, 0 removals

<truncating output..package downloads are written here..>

Extracting archive
remote:   - Installing doctrine/lexer (1.2.1): Extracting archive
remote:   - Installing symfony/polyfill-ctype (v1.23.0): Extracting archive
remote:   - Installing webmozart/assert (1.10.0): Extracting archive
remote:   - Installing dragonmantank/cron-expression (v3.1.0): Extracting archive
remote:   - Installing symfony/polyfill-php80 (v1.23.1): Extracting archive
remote:   - Installing symfony/polyfill-mbstring (v1.23.1): Extracting archive
remote:   - Installing symfony/var-dumper (v5.3.7): Extracting archive
remote:   - Installing symfony/polyfill-intl-normalizer (v1.23.0): Extracting archive
remote:   - Installing symfony/polyfill-intl-grapheme (v1.23.1): Extracting archive
remote:   - Installing symfony/string (v5.3.7): Extracting archive
remote:   - Installing psr/container (1.1.1): Extracting archive
remote:   - Installing symfony/service-contracts (v2.4.0): Extracting archive
remote:   - Installing symfony/polyfill-php73 (v1.23.0): Extracting archive
remote:   - Installing symfony/deprecation-contracts (v2.4.0): Extracting archive
remote:   - Installing symfony/console (v5.3.7): Extracting archive
remote:   - Installing psr/log (1.1.4): Extracting archive
remote:   - Installing monolog/monolog (2.3.4): Extracting archive
remote:   - Installing voku/portable-ascii (1.5.6): Extracting archive
remote:   - Installing phpoption/phpoption (1.8.0): Extracting archive
remote:   - Installing graham-campbell/result-type (v1.0.2): Extracting archive
remote:   - Installing vlucas/phpdotenv (v5.3.0): Extracting archive
remote:   - Installing symfony/css-selector (v5.3.4): Extracting archive
remote:   - Installing tijsverkoyen/css-to-inline-styles (2.2.3): Extracting archive
remote:   - Installing symfony/routing (v5.3.7): Extracting archive
remote:   - Installing symfony/process (v5.3.7): Extracting archive
remote:   - Installing symfony/polyfill-php72 (v1.23.0): Extracting archive
remote:   - Installing symfony/polyfill-intl-idn (v1.23.0): Extracting archive
remote:   - Installing symfony/mime (v5.3.7): Extracting archive
remote:   - Installing symfony/http-foundation (v5.3.7): Extracting archive
remote:   - Installing symfony/http-client-contracts (v2.4.0): Extracting archive
remote:   - Installing psr/event-dispatcher (1.0.0): Extracting archive
remote:   - Installing symfony/event-dispatcher-contracts (v2.4.0): Extracting archive
remote:   - Installing symfony/event-dispatcher (v5.3.7): Extracting archive
remote:   - Installing symfony/error-handler (v5.3.7): Extracting archive
remote:   - Installing symfony/http-kernel (v5.3.7): Extracting archive
remote:   - Installing symfony/finder (v5.3.7): Extracting archive
remote:   - Installing symfony/polyfill-iconv (v1.23.0): Extracting archive
remote:   - Installing egulias/email-validator (2.1.25): Extracting archive
remote:   - Installing swiftmailer/swiftmailer (v6.2.7): Extracting archive
remote:   - Installing symfony/polyfill-php81 (v1.23.0): Extracting archive
remote:   - Installing ramsey/collection (1.2.1): Extracting archive
remote:   - Installing brick/math (0.9.3): Extracting archive
remote:   - Installing ramsey/uuid (4.2.1): Extracting archive
remote:   - Installing psr/simple-cache (1.0.1): Extracting archive
remote:   - Installing opis/closure (3.6.2): Extracting archive
remote:   - Installing symfony/translation-contracts (v2.4.0): Extracting archive
remote:   - Installing symfony/translation (v5.3.7): Extracting archive
remote:   - Installing nesbot/carbon (2.53.1): Extracting archive
remote:   - Installing league/mime-type-detection (1.7.0): Extracting archive
remote:   - Installing league/flysystem (1.1.5): Extracting archive
remote:   - Installing nette/utils (v3.2.5): Extracting archive
remote:   - Installing nette/schema (v1.2.1): Extracting archive
remote:   - Installing dflydev/dot-access-data (v3.0.1): Extracting archive
remote:   - Installing league/config (v1.1.1): Extracting archive
remote:   - Installing league/commonmark (2.0.2): Extracting archive
remote:   - Installing laravel/framework (v8.61.0): Extracting archive
remote:   - Installing facade/ignition-contracts (1.0.2): Extracting archive
remote:   - Installing facade/flare-client-php (1.9.1): Extracting archive
remote:   - Installing facade/ignition (2.13.1): Extracting archive
remote:   - Installing fakerphp/faker (v1.16.0): Extracting archive
remote:   - Installing asm89/stack-cors (v2.0.3): Extracting archive
remote:   - Installing fruitcake/laravel-cors (v2.0.4): Extracting archive
remote:   - Installing psr/http-message (1.0.1): Extracting archive
remote:   - Installing psr/http-client (1.0.1): Extracting archive
remote:   - Installing ralouphie/getallheaders (3.0.3): Extracting archive
remote:   - Installing psr/http-factory (1.0.1): Extracting archive
remote:   - Installing guzzlehttp/psr7 (2.0.0): Extracting archive
remote:   - Installing guzzlehttp/promises (1.4.1): Extracting archive
remote:   - Installing guzzlehttp/guzzle (7.3.0): Extracting archive
remote:   - Installing laravel/sail (v1.10.1): Extracting archive
remote:   - Installing laravel/sanctum (v2.11.2): Extracting archive
remote:   - Installing nikic/php-parser (v4.13.0): Extracting archive
remote:   - Installing psy/psysh (v0.10.8): Extracting archive
remote:   - Installing laravel/tinker (v2.6.1): Extracting archive
remote:   - Installing hamcrest/hamcrest-php (v2.0.1): Extracting archive
remote:   - Installing mockery/mockery (1.4.4): Extracting archive
remote:   - Installing filp/whoops (2.14.3): Extracting archive
remote:   - Installing nunomaduro/collision (v5.10.0): Extracting archive
remote:   - Installing phpdocumentor/reflection-common (2.2.0): Extracting archive
remote:   - Installing phpdocumentor/type-resolver (1.5.0): Extracting archive
remote:   - Installing phpdocumentor/reflection-docblock (5.2.2): Extracting archive
remote:   - Installing sebastian/version (3.0.2): Extracting archive
remote:   - Installing sebastian/type (2.3.4): Extracting archive
remote:   - Installing sebastian/resource-operations (3.0.3): Extracting archive
remote:   - Installing sebastian/recursion-context (4.0.4): Extracting archive
remote:   - Installing sebastian/object-reflector (2.0.4): Extracting archive
remote:   - Installing sebastian/object-enumerator (4.0.4): Extracting archive
remote:   - Installing sebastian/global-state (5.0.3): Extracting archive
remote:   - Installing sebastian/exporter (4.0.3): Extracting archive
remote:   - Installing sebastian/environment (5.1.3): Extracting archive
remote:   - Installing sebastian/diff (4.0.4): Extracting archive
remote:   - Installing sebastian/comparator (4.0.6): Extracting archive
remote:   - Installing sebastian/code-unit (1.0.8): Extracting archive
remote:   - Installing sebastian/cli-parser (1.0.1): Extracting archive
remote:   - Installing phpunit/php-timer (5.0.3): Extracting archive
remote:   - Installing phpunit/php-text-template (2.0.4): Extracting archive
remote:   - Installing phpunit/php-invoker (3.1.1): Extracting archive
remote:   - Installing phpunit/php-file-iterator (3.0.5): Extracting archive
remote:   - Installing theseer/tokenizer (1.2.1): Extracting archive
remote:   - Installing sebastian/lines-of-code (1.0.3): Extracting archive
remote:   - Installing sebastian/complexity (2.0.2): Extracting archive
remote:   - Installing sebastian/code-unit-reverse-lookup (2.0.3): Extracting archive
remote:   - Installing phpunit/php-code-coverage (9.2.7): Extracting archive
remote:   - Installing doctrine/instantiator (1.4.0): Extracting archive
remote:   - Installing phpspec/prophecy (1.14.0): Extracting archive
remote:   - Installing phar-io/version (3.1.0): Extracting archive
remote:   - Installing phar-io/manifest (2.0.3): Extracting archive
remote:   - Installing myclabs/deep-copy (1.10.2): Extracting archive
remote:   - Installing phpunit/phpunit (9.5.9): Extracting archive
remote:    0/100 [>---------------------------]   0%
remote:   10/100 [==>-------------------------]  10%
remote:   20/100 [=====>----------------------]  20%
remote:   30/100 [========>-------------------]  30%
remote:   40/100 [===========>----------------]  40%
remote:   49/100 [=============>--------------]  49%
remote:   57/100 [===============>------------]  56%
remote:   67/100 [==================>---------]  67%
remote:   77/100 [=====================>------]  77%
remote:   87/100 [========================>---]  87%
remote:   97/100 [===========================>]  97%
remote:   98/100 [===========================>]  98%
remote:   99/100 [===========================>]  99%
remote:  100/100 [============================] 100%Generating optimized autoload files
remote: ..
remote: > Illuminate\Foundation\ComposerScripts::postAutoloadDump
remote: > @php artisan package:discover --ansi
remote: Discovered Package: facade/ignition
remote: Discovered Package: laravel/tinker
remote: Discovered Package: nesbot/carbon
remote: Discovered Package: nunomaduro/collision
remote: Package manifest generated successfully.
remote: Preparing output...
remote:
remote: Copying files to destination directory '/home/site/wwwroot'...
remote: ...................................................................................................................
remote: Done in 121 sec(s).
remote: 
remote: Removing existing manifest file
remote: Creating a manifest file...
remote: Manifest file created.
remote: 
remote: Done in 183 sec(s).
remote: Running post deployment command(s)...
remote: Triggering recycle (preview mode disabled).
remote: Deployment successful.
```

  6. If using PHP 7.x (Apache - `.htaccess`) or PHP 8 (NGINX - custom startup script) and it is configured correctly, the application should now be viewable.

Build detection, installed System Packages and other information can be found [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/php.md#contents) for PHP deployments on App Service that utilize Oryx (Local Git, ZipDeploy with Oryx Builder). 

## GitHub Actions

You can quickly get started with GitHub Actions by using the App Service Deployment Center. This will automatically generate a workflow file based on your application stack and commit it to your GitHub repository in the correct directory. You can deploy a workflow manually using deployment credentials. 

![Laravel App](/media/2022/02/vue-deployment-linux-05.png)

> **NOTE**: If you have numerous repositories that appear in the dropdown, you can search by typing within the text field/dropdown.

You can find more details about these steps documented here:
 - [Use the Deployment Center](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#use-the-deployment-center)
 - [Set up a workflow manually](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#set-up-a-workflow-manually)


After setting up Github actions, it will generate a Github Actions template like the [one seen here](https://github.com/actions/starter-workflows/blob/main/deployments/azure-webapps-php.yml). The one below is the one automatically generated after setting up GitHub Actions in the Azure Portal for the App Service. The one in the link is slightly different but can be utilized for other approaches that can be integrated with the default one. 

  > **NOTE**: It's heavily advised to not hardcode any secrets needed during the build, you can add these as environment variables by going to your Github Repo for said project -> Settings -> Secrets (expand) -> Actions -> New repository secret

```yaml
name: Build and deploy PHP app to Azure Web App - yourappservicename

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          # NOTE: Change this to the version of PHP needed (ex. 7.x, 8.x)
          php-version: '8.x'

      - name: Check if composer.json exists
        id: check_files
        uses: andstor/file-existence-action@v1
        with:
          files: 'composer.json'

      - name: Run composer install if composer.json exists
        if: steps.check_files.outputs.files_exists == 'true'
        run: composer validate --no-check-publish && composer install --prefer-dist --no-progress

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v2
        with:
          name: php-app
          path: .

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v2
        with:
          name: php-app

      - name: 'Deploy to Azure Web App'
        uses: azure/webapps-deploy@v2
        id: deploy-to-webapp
        with:
          app-name: 'yourappservicename'
          slot-name: 'production'
          publish-profile: ${{ secrets.AzureAppService_PublishProfile_d9402e5f7c954ed3a85c33ba0a300bbe }}
          package: .
````
> **NOTE**: This `.yml` assumes the Laravel project was created with the default Laravel project structure. 

Below is the output we'd see in the 'Actions' tab on Github after setting up Actions and pushing a new commit to trigger a deployment.

![Laravel App](/media/2022/04/azure-php-laravel-deployment-3.png)


### Change the PHP version
If needed, we can specify the PHP version in an environment variable for easy access and the reference it later. The **7.x** or **8.x** syntax chooses the **latest minor of the targetted major**. For example, using 8.x at the time of writing this will use **8.1.4** in GitHub Actions to build the project:

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  # Set this to your application's name
  # This can be referenced is desired in other parts of the Actions file
  AZURE_APPSERVICE_NAME: your-app-name   
  # Set this to the PHP version to use       
  PHP_VERSION: '8.x'                  

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@7c0b4c8c8ebed23eca9ec2802474895d105b11bc
        with:
          php-version: ${{ env.PHP_VERSION }}
```

### Laravel Migrations
Migrations can be ran during the build if desired by adding a script like the following - where `posts` would be the name of the migration you're targeting:

```yaml
- name: Run database migrations
  run: php artisan make:migration posts
```

### Composer version
The latest version of Composer is automatically added with the `shivammathur/setup-php@v2 Action.` This version can be changed if needed, use the following as an example:

```yaml
- name: Setup PHP
  uses: shivammathur/setup-php@v2
  with:
    php-version: ${{ env.PHP_VERSION }}
    tools: composer:2.3.4
```
> **NOTE**: More on this Action and what can be configured can be found [here](https://github.com/shivammathur/setup-php?msclkid=a2983998c27511ec8a485b90aeec7c94#wrench-tools-support)


Further reading on PHP on Azure App Service Linux and GitHub Actions can be seen [here.](https://docs.github.com/en/actions/deployment/deploying-to-your-cloud-provider/deploying-to-azure/deploying-php-to-azure-app-service?msclkid=33cf880fc26611ec83d101ca9cc68c58)

## Azure DevOps
You can use Azure Pipelines to build your Laravel application. 

Here is an example in how to implement Azure Pipelines with App Service Linux.

1. Create a new DevOps project then go to `Pipelines` and select `Create Pipeline`.
2. Select your code repository.
3. Select `PHP as Linux Web App on Azure` template.
4. Select the web app where you will deploy.
5. A default pipeline `.yaml` definition will be generated:
    - Make sure your PHP version matches the App Service PHP version. The default yaml for the PHP App Service template will have a variable named `phpVersion` (seen below) set towards the top of the file. Change this as needed.

```yaml
  variables:
    # Specify the version of PHP that's needed
    phpVersion: '8.0'
```

It's then included in the 'Use PHP version x.x' script

```yaml
steps:
- script: |
    sudo update-alternatives --set php /usr/bin/php$(phpVersion)
    sudo update-alternatives --set phar /usr/bin/phar$(phpVersion)
    sudo update-alternatives --set phpdbg /usr/bin/phpdbg$(phpVersion)
    sudo update-alternatives --set php-cgi /usr/bin/php-cgi$(phpVersion)
    sudo update-alternatives --set phar.phar /usr/bin/phar.phar$(phpVersion)
    php -version
  workingDirectory: $(rootFolder)
  displayName: 'Use PHP version $(phpVersion)'
```

```yaml
- stage: Deploy
  displayName: 'Deploy Web App'
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: DeploymentJob
    pool:
      vmImage: $(vmImageName)
    environment: $(environmentName)
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            displayName: 'Deploy Azure Web App : yourappname'
            inputs:
              azureSubscription: $(azureSubscription)
              appName: $(webAppName)
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
              appType: webAppLinux
```
> **NOTE**: To avoid any definition errors in the yaml, add the property `appType` set to `webAppLinux` as seen in the above task.

7. Save and `run` the pipeline.

Here is an example with recommendations. The below takes the default generated template and adds in a script for Laravel database migrations:

```yaml
# PHP as Linux Web App on Azure
# Build, package and deploy your PHP project to Azure Linux Web App.
# Add steps that run tests and more:
# https://docs.microsoft.com/azure/devops/pipelines/languages/php

trigger:
- main

variables:
  # Azure Resource Manager connection created during pipeline creation
  azureSubscription: '00000000-0000-0000-0000-000000000000'

  # Web app name
  webAppName: 'yourappservicename'

  # Agent VM image name
  vmImageName: 'ubuntu-latest'

  # Environment name
  environmentName: 'yourappservicename'

  # Root folder under which your composer.json file is available.
  rootFolder: $(System.DefaultWorkingDirectory)

stages:
- stage: Build
  displayName: Build stage
  variables:
    phpVersion: '8.0.13'
  jobs:
  - job: BuildJob
    pool:
      vmImage: $(vmImageName)
    steps:
    - script: |
        sudo update-alternatives --set php /usr/bin/php$(phpVersion)
        sudo update-alternatives --set phar /usr/bin/phar$(phpVersion)
        sudo update-alternatives --set phpdbg /usr/bin/phpdbg$(phpVersion)
        sudo update-alternatives --set php-cgi /usr/bin/php-cgi$(phpVersion)
        sudo update-alternatives --set phar.phar /usr/bin/phar.phar$(phpVersion)
        php -version
      workingDirectory: $(rootFolder)
      displayName: 'Use PHP version $(phpVersion)'

    - script: composer validate --no-check-publish && composer install --prefer-dist --no-progress
      workingDirectory: $(rootFolder)
      displayName: 'Composer install'
      
    - script: |
        php artisan make:migration posts
      workingDirectory: $(rootFolder)
      displayName: 'Run Laravel migrations'

    - task: ArchiveFiles@2
      displayName: 'Archive files'
      inputs:
        rootFolderOrFile: '$(rootFolder)'
        includeRootFolder: false
        archiveType: zip
        archiveFile: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
        replaceExistingArchive: true

    - upload: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
      displayName: 'Upload package'
      artifact: drop

- stage: Deploy
  displayName: 'Deploy Web App'
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: DeploymentJob
    pool:
      vmImage: $(vmImageName)
    environment: $(environmentName)
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            displayName: 'Deploy Azure Web App : yourappservicename'
            inputs:
              azureSubscription: $(azureSubscription)
              appName: $(webAppName)
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
              appType: webAppLinux
```
> **NOTE**: Depending on how you set up your pipeline, you may have to authorize permission for deployment. This is a one-time task, below is a screenshot of what you may see:

![Laravel App](/media/2022/02/vue-deployment-linux-07.png)

![Laravel App](/media/2022/04/azure-php-laravel-deployment-4.png)


# Troubleshooting

> **NOTE**: Any of the below scenarios would show "Application Error :(" when browsing your App Service. Make sure you have App Service Logs enabled or else troubleshooting these issues will take more time. Review how to enable App Serivce Logs [here](https://docs.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer).

## Container Doesn't Start
**PHP Fatal error:  require(): Failed opening required '/home/site/wwwroot/public/../vendor/autoload.php' (include_path='.:/usr/local/lib/php') in /home/site/wwwroot/public/index.php**. 

The above error may be seen, which is pointing to a missing `vendor` folder and/or specific package in `vendor/` and can happen in the following below scenarios:

<br>

  **Scenario**: Deploying with `SCM_DO_BUILD_DURING_DEPLOYMENT` set to `false` and/or Oryx not running `composer install`.
    
  - **Resolution**: If using any deployment methods that utilize Oryx (ex. LocalGit, ZipDeploy from a local machine (not GitHub Actions or Azure DevOps)), make sure `SCM_DO_BUILD_DURING_DEPLOYMENT` is set to `true` and **not** false. This setting should be `true` by default. Or else Oryx may not build out the application, which wouldn't run `composer install` - thus causing this error.

  Reviewing deployment logs can indicate if `composer install` is being ran or not.

  **Scenario**: Missing package within `composer.json`:

- **Resolution**: If using any vendor packages in code, ensure that these are properly referenced and installed.
        
## Composer.json  not found during deployment

  **Scenario**: When deploying from you may see a `No 'composer.json' file found; not running 'composer install'.`:

  - **Resolution**: Depending on your deployment method (such as using the VSCode Azure Plugin), Make sure you `cd` into the correct project folder. For example, there is a chance that the deployment was done from a parent directory that contains your project folder. Make sure you are in the project folder containing your `composer.json` file and that `composer.json` actually exists, else this could cause an issue with the container failing to start as well.
  
  If this is occurring in either GitHub Actions or Azure DevOps, this is indicative of `composer install` not running in the correct project directory or `composer.json` missing from the installation location:

  > **NOTE**: This may also manifest as by showing the default Azure App Service 'splash'/welcome page and the following message in logging: `No framework detected; using default app from /opt/defaultsite`


## './composer.json is valid but your composer.lock has some errors'

**Scenario**: During deployment this error message may be seen. This is strictly from the applications `composer.lock`. 

  - **Resolution**: Delete and recreate the `composer.lock` file locally. This issue likely points to an issue with the local project and it's dependencies.


## HTTP 500 error upon deployment with no stderr message(s)

**Scenario**: After a succesful deployment, the Laravel HTTP 500 error message page is shown.

  - **Resolution**: If `debug` is false no further stderr will be written. Therefor to troubleshoot this start by changing `debug` back to `true`:

 After doing so you will likely see the actual error displayed on screen or in `stderr` - an example is the following:

  ```
  Illuminate\Encryption\MissingAppKeyException
No application encryption key has been specified.
```
Add `APP_KEY` as an AppSetting with the appropriate value. This may also occur for other needed environment variables (such as for database environment variables that are needed during run time) but are not set as App Settings. 

## CSS is not updating or being generated if using CSS/UI frameworks:

**Scenario**: If using Laravel with TailwindCSS or another type of CSS framework that expects compilation in parallel, CSS may not be updated on deployment.

  - **Resolution**:
    A separate command will have to be configured to properly generate compiled CSS content. The below example is using [`Laravel mix`](https://laravel-mix.com/?msclkid=2230ccb8c29611ecbed5c7aff5691c96) with GitHub Actions

```
- name: Set up Node.js version
  uses: actions/setup-node@v1
  with:
    node-version: '14.x'
  # Using Yarn to install dependencies and running 'mix --production' for production Laravel Mix
- name: Run Laravel Mix
  run: |
    yarn install
    yarn run production
```
This would be added in **addition** to our GitHub Actions `.yaml` earlier. The same approach can be used for DevOps. For LocalGit or ZipDeploy(with Oryx Builder) a custom startup script may have to be used or pre-compiled before hand.


## php: error while loading shared libraries: libonig.so.4: cannot open shared object file: No such file or directory

**This only occurs using PHP 8 and deployments that use Oryx as the builder (Local Git, ZipDeploy with Oryx builder)**.

At the time of writing this, this issue may occur in this situation. If so, add `SCM_DISABLE_KUDU_BUSTER` set to `true`. After adding this initiate a redeployment. This setting is not needed unless running into this issue.


## Github Actions

A normal deployment doesn't need to take more than 5-15 mins. If the workflow is taking more than that then you might need to review current implementation. Here is a list of things to check:

- **Running tests**. There are scenarios where GitHub Actions Agent takes more than 360 minutes (6 hrs) to give you a status and fails with: **`The job running on runner Hosted Agent has exceeded the maximum execution time of 360 minutes.`**. Review if any tests are taking an extended amount of time - if these are not needed it would be recommended to remove these.

- **Too many files and slow deployments**. Using `actions/upload-artifact@v2` you can share files between jobs, such as `build` and `deploy`. Sometime it will trigger the following warning `There are over 10,000 files in this artifact, consider creating an archive before upload to improve the upload performance.` - if you have a large project and/or many dependencies. This may cause your deployment to take an extended amount of time. To overcome this you zip your content between jobs to improve deployment time. 

    ![Laravel App](/media/2022/02/vue-deployment-linux-09.png)

    For those scenarios, you can implement the following:

    1. Zip the content and upload the zip as an artifact to the `deploy` stage:

        ```yaml
        # If using PHP 7.4 we need to specifically include .htaccess in the zip
        # Since it's a hidden file it will get exluded unless otherwise specified 
        - name: Zip artifact for deployment
          run: zip release.zip ./* .htaccess -qr 

        - name: Upload artifact for deployment jobs
          uses: actions/upload-artifact@v2
          with:
            name: php-app
            path: release.zip
        ```

        **deploy job**: 

        ```yaml
            deploy:
              runs-on: ubuntu-latest
              needs: build
              environment:
                name: 'Production'
                url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

              steps:
                - name: Download artifact from build job
                  uses: actions/download-artifact@v2
                  with:
                    name: php-app
                    
                - name: 'Deploy to Azure Web App'
                  uses: azure/webapps-deploy@v2
                  id: deploy-to-webapp
                  with:
                    app-name: 'yourwebappname'
                    slot-name: 'Production'
                    publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_000000000000000000000000000000 }}
                    package: release.zip        
          ```
          You could additionally extract the .zip, delete it and then deploy the files as normal:

          ```yaml
            steps:
            - name: Download artifact from build job
                uses: actions/download-artifact@v2
                with:
                name: php-app
                
            - name: Unzip files for App Service Deploy
                run: unzip release.zip

            - name: Delete zip file
                run: rm release.zip

            - name: 'Deploy to Azure Web App'
                id: deploy-to-webapp
                uses: azure/webapps-deploy@v2
                with:
                app-name: 'sitename'
                slot-name: 'Production'
                publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_00000000000000000000 }}
                package: .
          ```



