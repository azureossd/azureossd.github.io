---
title: "Yii Deployment on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - PHP
    - Yii
    - Deploy
    - Azure DevOps
    - GitHub Actions
categories:
    - Azure App Service on Linux
    - PHP
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/yii-logo.png
toc: true
toc_sticky: true
date: 2022-05-03 12:00:00
---

This post provides information for creating, configuring, and deploying a Yii application on App Service Linux. 

# Local Development 

**Prerequesites**:
1. If not done so already, create an [App Service on Linux set to PHP 7.4](https://docs.microsoft.com/en-us/azure/app-service/quickstart-php?pivots=platform-linux#create-a-web-app)
2. The above link points to using Cloud Shell, however, this can be created in any number of ways (ex. Azure Portal, Azure CLI, ARM template, etc.).

## Create a quickstart Yii project.

1. Yii is a PHP MVC framework. For this example we'll be creating a basic Yii application to get started from the [Yii Start Installation docs](https://www.yiiframework.com/doc/guide/2.0/en/start-installation#installing-from-composer) using Composer. Composer can be downloaded [here](https://getcomposer.org/) if not already on your local machine. Run the following, where `basic` can be any arbitrary name for your project - this will create a directory with that name:

```bash
composer create-project --prefer-dist yiisoft/yii2-app-basic basic
 
cd basic
 
php yii serve
```

> **NOTE**: You may see a message like this during installation:

```bash
yiisoft/yii2-composer contains a Composer plugin which is currently not in your allow-plugins config. See https://getcomposer.org/allow-plugins
Do you trust "yiisoft/yii2-composer" to execute code and wish to enable it now? (writes "allow-plugins" to composer.json) [y,n,d,?]
```
> Enter 'y' in your terminal to accept this

2. After running the above, this should have created a Yii application named `basic`(or your name of choice), changed directories into the newly created project folder named `basic`(or your name of choice) and started the local development server for Yii. 
    
    This would start Yii on port 8080. Browsing to `localhost:8080` should show the following:

    (output in browser)

    ![Yii App](/media/2022/05/azure-ossd-yii-deployment-1.png)

    (output in terminal)

    ```
    Server started on http://localhost:8080/
    Document root is "DRIVE:\PATH\TO\YOUR\DOCUMENT\ROOT\basic/web"
    Quit the server with CTRL-C or COMMAND-C.
    [Fri Apr 29 18:53:28 2022] PHP 8.0.17 Development Server (http://localhost:8080) started
    [Fri Apr 29 18:53:33 2022] [::1]:57343 Accepted
    [Fri Apr 29 18:53:33 2022] [::1]:57344 Accepted
    [Fri Apr 29 18:53:34 2022] [::1]:57343 [200]: GET /
    [Fri Apr 29 18:53:34 2022] [::1]:57343 Closing
    ```

**Important pre-deployment checks**

1. Under `config/web.php` there is a property named `cookieValidationkey`. By default this comes with a hardcoded string. In production the value for this should be set as an environment variable and the value of the key within it.

Add an [App Setting](https://docs.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal) with the value of `cookieValidationKey` in the Azure Portal named `APP_KEY` (or your name of preference) and replace the following from:

```php
...
..
'components' => [
        'request' => [
            // !!! insert a secret key in the following (if it is empty) - this is required by cookie validation
            'cookieValidationKey' => 'somehardcodedrandomvalue',
            
        ],
..
...
```

To:

```php
...
..
'components' => [
        'request' => [
            // !!! insert a secret key in the following (if it is empty) - this is required by cookie validation
            'cookieValidationKey' => getenv('APP_KEY'),
            
        ],
..
...
```

2. If you're connecting to an external database update the database related values under `config/db.php` accordingly. For example, if using `mysql` as your database make sure to update these values and add any environment variables being used as [App Settings](https://docs.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal) in the Azure Portal. Supported databases for Yii can be found [here.](https://www.yiiframework.com/doc/guide/2.0/en/db-dao#database-access-objects)

3. When deploying to Azure, comment out the lines in `web/index.php` containing `define` and `defined` for `YII_DEBUG` and `YII_ENV` constants. This will set the environment to `prod`. More on this can be read [here](https://www.yiiframework.com/doc/guide/2.0/en/structure-entry-scripts#entry-scripts):

```php
<?php

// comment out the following two lines when deployed to production
defined('YII_DEBUG') or define('YII_DEBUG', true);
defined('YII_ENV') or define('YII_ENV', 'dev');

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../vendor/yiisoft/yii2/Yii.php';

$config = require __DIR__ . '/../config/web.php';

(new yii\web\Application($config))->run();
```

In **production** we comment out those lines:

```php
<?php

// comment out the following two lines when deployed to production
// defined('YII_DEBUG') or define('YII_DEBUG', true);
// defined('YII_ENV') or define('YII_ENV', 'dev');

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../vendor/yiisoft/yii2/Yii.php';

$config = require __DIR__ . '/../config/web.php';

(new yii\web\Application($config))->run();
```



# PHP 7.x (Apache)
PHP 7.x on Azure App Service Linux use Apache as the Web Server. Since Yii uses `/web` as the site root we need to override the default existing `apache2.conf` with our on following [Yii's recommendations on how to configure the site root](https://www.yiiframework.com/doc/guide/2.0/en/start-installation#configuring-web-servers).

We can do this with the following:

1. In an SSH session with the App Service run `cp /etc/apache2/apache2.conf /home`. This will copy the default `apache2.conf` to `/home` so this can be downloaded with an FTP client or any other tool that allows this.
2. Download this to your **local project root** **or edit this directly in your edit FTP client** and add the following to the **existing content** in the `apache2.conf` file:

```apache
DocumentRoot /home/site/wwwroot/web
....
....
..
<Directory "home/site/wwwroot/web">
    # use mod_rewrite for pretty URL support
    RewriteEngine on
    # if $showScriptName is false in UrlManager, do not allow accessing URLs with script name
    RewriteRule ^index.php/ - [L,R=404]
    # If a directory or a file exists, use the request directly
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    # Otherwise forward the request to index.php
    RewriteRule . index.php
</Directory>
....
...
```
In the existing `apache2.conf` file we copy over and change, we add the **Directory** element and change **DocumentRoot** to point to `/home/site/wwwroot/web`.

3. Next, we create a custom start up script - let's assume the name is `startup.sh`. Use an FTP client or alike to upload this to `/home` - it will contain the following content:

```bash
#!/bin/bash 

echo "Copying custom apache2.conf to /etc/apache2/apache2.conf.."
cp /home/apache2.conf /etc/apache2/apache2.conf
```

> **NOTE**: `apache2 -D FOREFOUND` is run regardless so it is not needed to specify it in the startup script. 

In the above script, this copies our custom `apache2.conf` over the existing `apache2.conf` to apply our changes.

4. This [blog post](https://azureossd.github.io/2020/01/23/php-custom-startup-script-app-service-linux/index.html) be referenced for additional help with configuring custom startup scripts.
5. After ensuring our custom `apache2.conf` and `startup.sh` is uploaded under `/home`, specify the startup script in the portal:

![Yii App](/media/2022/05/azure-ossd-yii-deployment-2.png)

# PHP 8 (NGINX)

PHP 8 on Azure App Service Linux use NGINX as the Web Server. To have NGINX route requests to `/web` we'll have to configure a custom startup script. We can grab the existing `default.conf` under `/etc/nginx/sites-available/default.conf` and run `cp /etc/nginx/sites-available/default.conf /home`. This will copy the `default.conf` we need into `/home` so we can download it with an FTP client or any other tool that allows this.

This `default.conf` has the following line:

`root /home/site/wwwroot;`

We need to change it to the following:

`root /home/site/wwwroot/web;`

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

```bash
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

```nginx
server {
    #proxy_cache cache;
	#proxy_cache_valid 200 1s;
    listen 8080;
    listen [::]:8080;
    root /home/site/wwwroot/web;
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


Use an FTP client to upload both your `startup.sh` script and your custom `default.conf` to the `/home` directory for your PHP App Service. 

Next, under 'Configuration' in the portal target `/home/startup.sh` (or whatever the startup script file name is).

![Yii App](/media/2022/04/azure-php-laravel-deployment-2.png)


**Lastly,** restart the App Service. This should now be using our custom startup script. Use LogStream or the Diagnose and Solve -> Application Logs detector, or other methods, to see the stdout from the script.


This [blog](https://azureossd.github.io/2021/09/02/php-8-rewrite-rule/index.html) can be referenced for further details with NGINX, startup scripts and PHP 8 on Azure App Service Linux.

# Deployment Options 
There are multiple deployment options in PHP on App Service Linux such as Continuous Deployment(GitHub Actions, DevOps pipelines), External Git, Local Git, [ZipDeploy with Oryx Builder](https://docs.microsoft.com/en-us/azure/app-service/deploy-zip?tabs=cli#enable-build-automation-for-zip-deploy), etc. We'll be covering 3 of these methods below.

## Local Git 
When using Local Git, you are using `App Service Build Service` also named as ([Oryx](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md)) to build your application.

To setup this option and deploy a Yii application follow the below:
> **NOTE**: Deploying from Local Git will likely prompt you for your Git credentials for the Azure Application. You can find it under the FTPS Credentials tab in the screenshot below. 


1. Navigate to your Web App and select `Deployment Center` and then click on `Local Git` and then click on `Save`.

    ![Yii App](/media/2022/02/flask-deployment-linux-03.png)
2. Copy the remote git repository from Azure Portal.

    ![Yii App](/media/2022/05/azure-ossd-yii-deployment-5.png)

3. In your local terminal run the following commands in order:
    ```bash
    git add .
    git commit -m "initial commit"
    git remote add azure https://<sitename>.scm.azurewebsites.net:443/<sitename>.git
    git push azure master
    ```
4. Then Oryx will build the application. You should see an output along the lines of the below:

> **NOTE**: A `.gitignore` should be present in your repository root to avoid commiting directories like `/vendor` and `protected/runtime`. If commiting this directory, or others like it (ex. `node_modules`) your deployment time can easily increase by minutes or eventually time-out. A Yii based `.gitignore` can be found [here](https://github.com/github/gitignore/blob/main/Yii.gitignore) on GitHub.


```
remote: Deploy Async
remote: Updating branch 'master'.
remote: Updating submodules.
remote: Preparing deployment for commit id '202b2adb2c'.
remote: Repository path is /home/site/repository
remote: Running oryx build...
remote: ..
remote: Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
remote: You can report issues at https://github.com/Microsoft/Oryx/issues
remote: 
remote: Oryx Version: 0.2.20211207.1, Commit: 46633df49cc8fbe9718772a3c894df221273b2af, ReleaseTagName: 20211207.1
remote: 
remote: Build Operation ID: |vfTwslpEbLE=.78a47fa5_
remote: Repository Commit : 202b2adb2c886a33981f3641747131af2cc875de
remote: 
remote: Detecting platforms...
remote: Detected following platforms:
remote:   php: 7.4.28
remote: Version '7.4.28' of platform 'php' is not installed. Generating script to install it...
remote: 
remote: Using intermediate directory '/tmp/8da2c51250bf5f0'.
remote: 
remote: Copying files to the intermediate directory...
remote: Done in 1 sec(s).
remote: 
remote: Source directory     : /tmp/8da2c51250bf5f0
remote: Destination directory: /home/site/wwwroot
remote: 
remote: 
remote: Downloading and extracting 'php' version '7.4.28' to '/tmp/oryx/platforms/php/7.4.28'...
remote: Downloaded in 1 sec(s).
remote: Verifying checksum...
remote: Extracting contents...
remote: performing sha512 checksum for: php...
remote: Done in 4 sec(s).
remote: 
remote: PHP executable: /tmp/oryx/platforms/php/7.4.28/bin/php
remote: Composer archive: /opt/php-composer/2.0.8/composer.phar
remote: Running 'composer install --ignore-platform-reqs --no-interaction'...
remote: 
remote: Installing dependencies from lock file (including require-dev)
remote: Verifying lock file contents can be installed on current platform.
remote: Package operations: 85 installs, 0 updates, 0 removals
remote:   - Downloading yiisoft/yii2-composer (2.0.10)
remote:   - Downloading behat/gherkin (v4.9.0)
remote:   - Downloading bower-asset/jquery (3.6.0)
remote:   - Downloading bower-asset/inputmask (3.3.11)
<ommiting output for readability>
remote:   0/85 [>---------------------------]   0%
remote:   1/85 [>---------------------------]   1%
remote:   5/85 [=>--------------------------]   5%
remote:   6/85 [=>--------------------------]   7%
remote:   8/85 [==>-------------------------]   9%
remote:   9/85 [==>-------------------------]  10%
remote:  10/85 [===>------------------------]  11%
remote:  15/85 [====>-----------------------]  17%
remote:  18/85 [=====>----------------------]  21%
remote:  20/85 [======>---------------------]  23%
remote:  23/85 [=======>--------------------]  27%
remote:  24/85 [=======>--------------------]  28%
remote:  25/85 [========>-------------------]  29%
remote:  26/85 [========>-------------------]  30%
remote:  27/85 [========>-------------------]  31%
remote:  28/85 [=========>------------------]  32%
remote:  29/85 [=========>------------------]  34%
remote:  30/85 [=========>------------------]  35%
remote:  31/85 [==========>-----------------]  36%
remote:  37/85 [============>---------------]  43%
remote:  38/85 [============>---------------]  44%
remote:  40/85 [=============>--------------]  47%
remote:  41/85 [=============>--------------]  48%
remote:  43/85 [==============>-------------]  50%
remote:  46/85 [===============>------------]  54%
remote:  48/85 [===============>------------]  56%
remote:  51/85 [================>-----------]  60%
remote:  52/85 [=================>----------]  61%
remote:  53/85 [=================>----------]  62%
remote:  55/85 [==================>---------]  64%
remote:  60/85 [===================>--------]  70%
remote:  62/85 [====================>-------]  72%
remote:  63/85 [====================>-------]  74%
remote:  64/85 [=====================>------]  75%
remote:  66/85 [=====================>------]  77%
remote:  68/85 [======================>-----]  80%
remote:  69/85 [======================>-----]  81%
remote:  70/85 [=======================>----]  82%
remote:  71/85 [=======================>----]  83%
remote:  73/85 [========================>---]  85%
remote:  74/85 [========================>---]  87%
remote:  75/85 [========================>---]  88%
remote:  76/85 [=========================>--]  89%
remote:  77/85 [=========================>--]  90%
remote:  78/85 [=========================>--]  91%
remote:  80/85 [==========================>-]  94%
remote:  81/85 [==========================>-]  95%
remote:  82/85 [===========================>]  96%
remote:  83/85 [===========================>]  97%
remote:  84/85 [===========================>]  98%
remote:  85/85 [============================] 100%  - Installing yiisoft/yii2-composer (2.0.10): Extracting archive
remote:   - Installing behat/gherkin (v4.9.0): Extracting archive
remote:   - Installing bower-asset/jquery (3.6.0): Extracting archive
<ommiting output for readability>
remote:   0/73 [>---------------------------]   0%
remote:  10/73 [===>------------------------]  13%
remote:  20/73 [=======>--------------------]  27%
remote:  29/73 [===========>----------------]  39%
remote:  39/73 [==============>-------------]  53%
remote:  49/73 [==================>---------]  67%
remote:  59/73 [======================>-----]  80%
remote:  68/73 [==========================>-]  93%
remote:  69/73 [==========================>-]  94%
remote:  73/73 [============================] 100%Package swiftmailer/swiftmailer is abandoned, you should avoid using it. Use symfony/mailer instead.
remote: Package phpunit/php-token-stream is abandoned, you should avoid using it. No replacement was suggested.
remote: Generating autoload files
remote: 51 packages you are using are looking for funding.
remote: Use the `composer fund` command to find out more!
remote: > yii\composer\Installer::postInstall
remote: Preparing output...
remote: 
remote: Copying files to destination directory '/home/site/wwwroot'...
remote: ..........................................................................................
remote: Done in 94 sec(s).
remote: 
remote: Removing existing manifest file
remote: Creating a manifest file...
remote: Manifest file created.
remote: 
remote: Done in 126 sec(s).
remote: Running post deployment command(s)...
remote: Triggering recycle (preview mode disabled).
remote: Deployment successful.
```

  6. If using PHP 7.x (Apache - `.htaccess`) or PHP 8 (NGINX - custom startup script) and it is configured correctly, the application should now be viewable.

Build detection, installed System Packages and other information can be found [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/php.md#contents) for PHP deployments on App Service that utilize Oryx (Local Git, ZipDeploy with Oryx Builder). 

## GitHub Actions

You can quickly get started with GitHub Actions by using the App Service Deployment Center. This will automatically generate a workflow file based on your application stack and commit it to your GitHub repository in the correct directory. You can deploy a workflow manually using deployment credentials. 

![Yii App](/media/2022/02/vue-deployment-linux-05.png)

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
          # NOTE: Depending on the PHP version upon integrating with GitHub Actions it may show either 8.0 or 7.4
          php-version: '8.0'

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
          app-name: 'yourappservicename'
          slot-name: 'Production'
          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_0000000000000000000000 }}
          package: .
```

> **NOTE**: This `.yml` assumes the Yii project was created with the default Yii project structure. 

Below is the output we'd see in the 'Actions' tab on Github after setting up Actions and pushing a new commit to trigger a deployment.

![Yii App](/media/2022/05/azure-ossd-yii-deployment-6.png)

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

### Yii Migrations
Migrations can be ran during the build if desired by adding a script like the following - where `create_user_table` would be the name of the migration you're creating and applying:

```yaml
- name: Run database migrations
  run: php yii migrate/create create_user_table --interactive 0 && php yii migrate --interactive 0
```

> **NOTE**: Console prompts, eg. [y/n] from a command during a GitHub Action build may fail the run. To avoid this we set --interactive 0 to default to applying 'yes' for migrations. See more [here](https://www.yiiframework.com/doc/guide/2.0/en/db-migrations#database-migration) and by running `php yii help migrate/up` or `php yii help migrate/create`. 

To be able apply these migrations during an Actions run, your database credentials will need to be accessible to the environment, or else it will fail with `Exception 'yii\base\InvalidConfigException' with message 'Connection::dsn cannot be empty.'`

We can do this by adding GitHub Actions secrets. **Go to your GitHub repository -> Settings -> Secrets -> Actions -> New repository secret**. More on Secrets can be found [here](https://docs.github.com/en/actions/security-guides/encrypted-secrets#about-encrypted-secrets).

After these are added to your repository, we can reference them like the below:

```yaml
env:
  # MYSQL_DSN is in the format of mysql:host=mydbhostname;dbname=mydbname
  # replace mysql: with your driver of choice
  MYSQL_DSN: ${{ secrets.MYSQL_DSN }}   
  MYSQL_PASSWORD: ${{ secrets.MYSQL_PASSWORD }}
  MYSQL_DATABASE: ${{ secrets.MYSQL_DATABASE }}
  MYSQL_USER: ${{ secrets.MYSQL_USER }}
```

After adding the above to our .yaml, a successful migration should show the following - and also appear in your database:

```bash
New migration created successfully.
***Yii Migration Tool (based on Yii v2.0.45)

Creating migration history table "migration"...Done.
Total 1 new migration to be applied:
	m220503_200207_create_user_table

*** applying m220503_200207_create_user_table
    > create table {{user}} ... done (time: 0.168s)
*** applied m220503_200207_create_user_table (time: 0.252s)
```

> **NOTE**: If you commited local migrations under the `migrations/` directory and try to rerun migrations, you may have your build fail with `create table {{ user}} ...Exception: SQLSTATE[42S01]: Base table or view already exists: 1050 Table 'sometablename' already exists`

**Important**: Make sure to also add your needed environment variables as App Settings to the application in the Azure Portal. These are two separate environments. Failing to add these same database environment variables may have your container crash on start up.

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
You can use Azure Pipelines to build your Yii application. 

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

Here is an example with recommendations. The below takes the default generated template and adds in a script for Yii database migrations. The same notion mentioned in the GitHub Actions migrations applies here, [add your DevOps secrets](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch) and reference them in your `azure-pipelines.yaml`. If not done, the build will fail, assuming these credentials are not hardcoded:

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

  MYSQL_DSN: $(DEVOPS_MYSQL_DSN) 
  MYSQL_PASSWORD: $(DEVOPS_MYSQL_PASSWORD)
  MYSQL_DATABASE: $(DEVOPS_MYSQL_DATABASE)
  MYSQL_USER: $(DEVOPS_MYSQL_USER)

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

    - script: composer install --no-interaction --prefer-dist
      workingDirectory: $(rootFolder)
      displayName: 'Composer install'
    
    - script: |
        php yii migrate/create create_user_table --interactive 0 && php yii migrate --interactive 0
      workingDirectory: $(rootFolder)
      displayName: 'Run Yii migrations'

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

![Yii App](/media/2022/02/vue-deployment-linux-07.png)

![Yii App](/media/2022/05/azure-ossd-yii-deployment-7.png)


# Troubleshooting

> **NOTE**: Any of the below scenarios would show "Application Error :(" when browsing your App Service. Make sure you have App Service Logs enabled or else troubleshooting these issues will take more time. Review how to enable App Serivce Logs [here](https://docs.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer).

## Container Doesn't Start
**NOTICE: PHP message: PHP Fatal error:  Uncaught Error: Failed opening required '/home/site/wwwroot/web/../vendor/autoload.php' (include_path='.:/usr/local/lib/php') in /home/site/wwwroot/web/index.php:7**. 

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


## HTTP 500 error upon deployment

**Scenario**: After a succesful deployment, 'Internal Server Error' is shown.

  - **Resolution**: [Ensure that App Service Logs are enabled](https://docs.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) and review these. With Yii, the general error should still be written to `stderr`. Any number of scenarios can cause this generic HTTP 500 response. For example:


  ```
NOTICE: PHP message: PHP Warning:  session_set_cookie_params(): Session cookie parameters cannot be changed after headers have already been sent in /home/site/wwwroot/vendor/yiisoft/yii2/web/Session.php on line 430
``` 

The above error could be thrown due to an `echo()` function in certail locations, such as in `config/db.php`. 

If you see:

```php
yii\web\Request::cookieValidationKey must be configured with a secret key
```

This means your `cookieValidationKey` is not set or missing in `config/web.php`.

## php: error while loading shared libraries: libonig.so.4: cannot open shared object file: No such file or directory

**This only occurs using PHP 8 and deployments that use Oryx as the builder (Local Git, ZipDeploy with Oryx builder)**.

At the time of writing this, this issue may occur in this situation. If so, add `SCM_DISABLE_KUDU_BUSTER` set to `true`. After adding this initiate a redeployment. This setting is not needed unless running into this issue.


## Github Actions

A normal deployment doesn't need to take more than 5-15 mins. If the workflow is taking more than that then you might need to review current implementation. Here is a list of things to check:

- **Running tests**. There are scenarios where GitHub Actions Agent takes more than 360 minutes (6 hrs) to give you a status and fails with: **`The job running on runner Hosted Agent has exceeded the maximum execution time of 360 minutes.`**. Review if any tests are taking an extended amount of time - if these are not needed it would be recommended to remove these.

- **Too many files and slow deployments**. Using `actions/upload-artifact@v2` you can share files between jobs, such as `build` and `deploy`. Sometime it will trigger the following warning `There are over 10,000 files in this artifact, consider creating an archive before upload to improve the upload performance.` - if you have a large project and/or many dependencies. This may cause your deployment to take an extended amount of time. To overcome this you zip your content between jobs to improve deployment time. 

    ![Yii App](/media/2022/02/vue-deployment-linux-09.png)

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



