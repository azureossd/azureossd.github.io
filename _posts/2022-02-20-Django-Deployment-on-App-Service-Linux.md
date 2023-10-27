---
title: "Django Deployment on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Python
    - Django
    - Deploy
    - Azure DevOps
    - GitHub Actions
categories:
    - Azure App Service on Linux
    - Python
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/django-logo.png
toc: true
toc_sticky: true
date: 2022-02-20 12:00:00
---

This section provides information for creating, configuring, and deploying a Django application on App Service Linux. 

# Local Development 

## Set up your virtual environment.

1. For these examples we'll be creating a basic Django application to get started from the `django-admin` CLI. Start by creating a folder for your application and `cd` into it to create and activate your virtual environment. You can review the official documentation for this [here](https://docs.python.org/3/library/venv.html). For example:

    `mkdir azure-python-django`

    `cd azure-python-django`

2. With our folder now created (or if you're using an existing one), we'll create our virtual environment below:
    
    `python -m venv .venv` 
    > **NOTE**: .venv in the name of our virtual environment, this can be changed to any arbitrary name

3. We can now activate our virtual environment using the below:
    
    `source .venv/Scripts/activate` (Bash, *NIX)
    
    `.\.venv\Scripts\activate` (Windows)

    You should now see your virtual environment name activated in your terminal.

    ![Django App](/media/2022/02/django-deployment-linux-01.png)

4. Next, lets install Django and create our project.

    In your terminal with your activated virtual environment run `pip install Django`. You should now see Django successfully installed after running this:

    ```
    Successfully installed Django-4.0.2 asgiref-3.5.0 sqlparse-0.4.2 tzdata-2021.5
    ```
    > **NOTE**: The above versions may change in the future

    Create your project with the following command:

    `django-admin startproject mysite`

    `mysite` can be any arbitrary name - this is just the name of your project. You can read more on that [here](https://docs.djangoproject.com/en/4.0/intro/tutorial01/).

    This will scaffold out a project structure like the below:

    ```
    mysite/
      manage.py
      mysite/
          __init__.py
          settings.py
          urls.py
          asgi.py
          wsgi.py
    ```

    Going forward, we want to add a `requirements.txt` file in the top level `mysite` folder (or what your project name is), such as the below.

    Within the `requirements.txt` we create, add `Django` within it. This is for proper Azure deployment later on.

    ```
    mysite/
      manage.py
      requirements.txt
      mysite/
          __init__.py
          settings.py
          urls.py
          asgi.py
          wsgi.py
    ```

    > **NOTE**: For the sake of this quickstart, no specific version is pinned. For production scenarios it's highly recommended to pin your dependencies to a specific version.

    

5. To apply our database migrations run the following:

    `python manage.py makemigrations`
    
    `python manage.py migrate`

    You can learn more [here](https://docs.djangoproject.com/en/4.0/topics/migrations/).

6. Run the application with `python manage.py runserver` and browse the site.

    ```
      $ python manage.py runserver
      Watching for file changes with StatReloader
      Performing system checks...

      System check identified no issues (0 silenced).
      ←[31m
      You have 18 unapplied migration(s). Your project may not work properly until you apply the migrations for app(s): admin, auth, contenttypes, sessions.←[0m
      ←[31mRun 'python manage.py migrate' to apply them.←[0m
      February 20, 2022 - 17:12:33
      Django version 4.0.2, using settings 'blog.settings'
      Starting development server at http://127.0.0.1:8000/
      Quit the server with CTRL-BREAK.
      [20/Feb/2022 17:12:36] ←[m"GET / HTTP/1.1" 200 10697←[0m
      [20/Feb/2022 17:12:36] ←[m"GET /static/admin/css/fonts.css HTTP/1.1" 200 423←[0m
      [20/Feb/2022 17:12:36] ←[m"GET /static/admin/fonts/Roboto-Regular-webfont.woff HTTP/1.1" 200 85876←[0m
      [20/Feb/2022 17:12:36] ←[m"GET /static/admin/fonts/Roboto-Light-webfont.woff HTTP/1.1" 200 85692←[0m
      [20/Feb/2022 17:12:36] ←[m"GET /static/admin/fonts/Roboto-Bold-webfont.woff HTTP/1.1" 200 86184←[0m
      Not Found: /favicon.ico
      [20/Feb/2022 17:12:37] ←[33m"GET /favicon.ico HTTP/1.1" 404 2108←[0m
    ```


    ![Django App](/media/2022/02/django-deployment-linux-02.png)

7. You should now be able to browse the site by either going to `localhost:8000` or `127.0.0.1:8000`.

<br>

7. To prep ourselves for deployment later, lets add the following content:


In your `mysite` folder that **contains** manage.py, run the command `python manage.py startapp polls`. This will create a directory in your Django project named `polls`. 'polls' can be any arbitrary name. The command `startapp` creates another Django 'app' within your project. This will generate the following folder **alongside** your existing `mysite` folder:

  ```
  mysite/
    manage.py
    requirements.txt
    mysite/
        __init__.py
        settings.py
        urls.py
        asgi.py
        wsgi.py
    polls/
      __init__.py
      admin.py
      apps.py
      migrations/
          __init__.py
      models.py
      tests.py
      views.py
  ```

  In `polls/view.py` add the following code. This creates a view so we can have some content displayed when we run with `DEBUG=False`:
  ```
  from django.http import HttpResponse

  def index(request):
      return HttpResponse("Hello, world. You're at the polls index.")
  ```

  Create a file named `urls.py` under `polls/` (`polls/urls.py`). Add the following code:
  ```
  from django.urls import path

  from . import views

  urlpatterns = [
      path('', views.index, name='index'),
  ]
  ```

  Lastly, add the following to your existing `mysite/urls.py`:
  > **NOTE**: the path 'polls' below will have our views under localhost:8000/polls. You can put this under our 'root' path by just changing `path('polls/', ...)` to `path('', ...)`

  ```
  from django.contrib import admin
  from django.urls import include, path

  urlpatterns = [
      path('polls/', include('polls.urls')), // alternatively path('', include('polls.urls')) 
      path('admin/', admin.site.urls),
  ]
  ```

8. Run the application again with `python manage.py runserver`. You should now see the content displayed under `localhost:8000/polls` (or just `localhost:8000` if you changed the path to root)
  
    ![Django App](/media/2022/02/django-deployment-linux-03.png)

    If issues are encountered follow the official Django [polls](https://docs.djangoproject.com/en/4.0/intro/tutorial01/#creating-the-polls-app) application on this page to complete your views and url's section.

**Important Pre-deployment checks**:

For us to properly deploy and have a functioning application we need to make some of the following changes:
 
 1. Change `DEBUG` to `false` in `mysite/settings.py` 
 2. Change `ALLOWED_HOSTS` to either allow our host header - for example:

  ```
  ALLOWED_HOSTS = [os.environ['WEBSITE_HOSTNAME']]
  // Or 
  // ALLOWED_HOSTS = ['.azurewebsites'] 
  // Or
  // ALLOWED_HOSTS = ['*']
  ```

  > **NOTE**: Changing `ALLOWED_HOSTS` to ['*'] is a wildcard for all hosts. This is not recommended in production. You can read more [here](https://docs.djangoproject.com/en/4.0/ref/settings/#allowed-hosts).

  3. Add the `whitenoise` package to `requirements.txt` to properly serve static files in production on Azure and make sure both `STATIC_ROOT` and `STATIC_URL` are set in `mysite/settings.py`. Review steps 4 and 5 [here](https://docs.microsoft.com/en-us/azure/app-service/configure-language-python#serve-static-files-for-django-apps) on how to configure `whitenoise`. You can review the other recommended production settings [here](https://docs.microsoft.com/en-us/azure/app-service/configure-language-python#production-settings-for-django-apps).
  

  Example of `STATIC_ROOT` and `STATIC_URL`:

  ```
  STATIC_URL = '/static/'
  STATIC_ROOT = BASE_DIR / 'static'
  
  STATICFILES_STORAGE = ('whitenoise.storage.CompressedManifestStaticFilesStorage')
  ```

  4. Point to a production database. As called out [here](https://docs.microsoft.com/en-us/azure/devops/pipelines/ecosystems/python-webapp?view=azure-devops#considerations-for-django) - if we deploy with our existing sqlite database we may run into file-locking issues. In a product environment we would not want to use this - Django supports these databases noted [here](https://docs.djangoproject.com/en/4.0/ref/databases/#databases) which can be swapped out with sqlite.
  
  5. Make sure any needed environment variables (eg., `SECRET_KEY`, database credentials) are added as [AppSettings](https://docs.microsoft.com/en-us/azure/app-service/configure-common?tabs=portal) to the Azure Portal as well for **runtime** usage. This is in **addition** to the deployment usage below.

# Deployment Options
There are multiple deployment options in Python on App Service Linux such as Continuous Deployment(GitHub Actions, DevOps pipelines), External Git, Local Git, [ZipDeploy with Oryx Builder](https://docs.microsoft.com/en-us/azure/app-service/deploy-zip?tabs=cli#enable-build-automation-for-zip-deploy), etc. We'll be covering 3 of these methods below.

>**NOTE**: For Python on App Service Linux you should **not** use methods like FTP or ZipDeploy (without the use of Oryx) to avoid improper deployment since the Python environment will not be built, thus causing errors like `ModuleNotFound` or others - since `pip install` is not ran in these scenarios. You **do** want to use deployment methods like Local Git, ZipDeploy (with Oryx builder, see above), or pipelines like DevOps or Github Actions since these will all correctly create and activate the virtual environment, and install dependencies as required.

## Local Git 
When using Local Git, you are using `App Service Build Service` also named as ([Oryx](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md)) to build your application.

To setup this option and deploy a Django application follow the below:
> **NOTE**: Deploying from Local Git will likely prompt you for your Git credentials for the Azure Application. You can find it under the FTPS Credentials tab in the screenshot below. 


1. Navigate to your Web App and select `Deployment Center` and then click on `Local Git` and then click on `Save`.

    ![Django App](/media/2022/02/flask-deployment-linux-03.png)
2. Copy the remote git repository from Azure Portal.

    ![Django App](/media/2022/02/flask-deployment-linux-04.png)

3. In your local terminal run the following commands in order:
    ```bash
    git add .
    git commit -m "initial commit"
    git remote add azure https://<sitename>.scm.azurewebsites.net:443/<sitename>.git
    git push azure master
    ```
4. Then Oryx will build the application:
> **NOTE**: It would be advisable to have a .gitignore with your virtual environment name included to avoid commiting this. You can create a `.gitignore` yourself and add the name of the environment, like in our case, '.venv', and/or use this official Github Python .gitignore [here](https://github.com/github/gitignore/blob/main/Python.gitignore)
```
Enumerating objects: 9, done.
Counting objects: 100% (9/9), done.
Delta compression using up to 8 threads
Compressing objects: 100% (4/4), done.
Writing objects: 100% (5/5), 595 bytes | 595.00 KiB/s, done.
Total 5 (delta 3), reused 0 (delta 0), pack-reused 0
remote: Deploy Async
remote: Updating branch 'master'.
remote: Updating submodules.
remote: Preparing deployment for commit id 'd6a60e37a9'.
remote: Repository path is /home/site/repository
remote: Running oryx build...
remote: Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
remote: You can report issues at https://github.com/Microsoft/Oryx/issues
remote:
remote: Oryx Version: 0.2.20210826.1, Commit: f8651349d0c78259bb199593b526450568c2f94a, ReleaseTagName: 20210826.1
remote:
remote: Build Operation ID: |HvgB6fJ7YYs=.45028433_
remote: Repository Commit : d6a60e37a95f8f8557aa20e244b44dfb6650ed2e
remote:
remote: Detecting platforms...
remote: ...
remote: Detected following platforms:
remote:   python: 3.9.7
remote:
remote: Using intermediate directory '/tmp/8d9f4d8c8f5084d'.
remote:
remote: Copying files to the intermediate directory...
remote: Done in 1 sec(s).
remote:
remote: Source directory     : /tmp/8d9f4d8c8f5084d
remote: Destination directory: /home/site/wwwroot
remote:
remote: Python Version: /tmp/oryx/platforms/python/3.9.7/bin/python3.9
remote: Creating directory for command manifest file if it doesnot exist
remote: Removing existing manifest file
remote: Python Virtual Environment: antenv
remote: Creating virtual environment...
remote: ............
remote: Activating virtual environment...
remote: Running pip install...
remote: [01:24:12+0000] Collecting Django
remote: [01:24:12+0000]   Using cached Django-4.0.2-py3-none-any.whl (8.0 MB)
remote: [01:24:13+0000] Collecting whitenoise
remote: [01:24:13+0000]   Downloading whitenoise-6.0.0-py3-none-any.whl (19 kB)
remote: [01:24:13+0000] Collecting sqlparse>=0.2.2
remote: [01:24:13+0000]   Using cached sqlparse-0.4.2-py3-none-any.whl (42 kB)
remote: [01:24:13+0000] Collecting asgiref<4,>=3.4.1
remote: [01:24:13+0000]   Using cached asgiref-3.5.0-py3-none-any.whl (22 kB)
remote: [01:24:14+0000] Installing collected packages: sqlparse, asgiref, whitenoise, Django
remote: ..........
remote: [01:24:28+0000] Successfully installed Django-4.0.2 asgiref-3.5.0 sqlparse-0.4.2 whitenoise-6.0.0
remote: WARNING: You are using pip version 21.2.3; however, version 22.0.3 is available.
remote: You should consider upgrading via the '/tmp/8d9f4d8c8f5084d/antenv/bin/python -m pip install --upgrade pip' command.
remote: 
remote: Content in source directory is a Django app
remote: Running collectstatic...
remote: ...
remote:
remote: 128 static files copied to '/tmp/8d9f4d8c8f5084d/static', 378 post-processed.
remote: 'collectstatic' exited with exit code .
remote: Done in 8 sec(s).
remote: Not a vso image, so not writing build commands
remote: Preparing output...
remote: 
remote: Copying files to destination directory '/tmp/_preCompressedDestinationDir'...
remote: ........
remote: Done in 13 sec(s).
remote: Compressing content of directory '/tmp/_preCompressedDestinationDir'...
remote: ........
remote: Copied the compressed output to '/home/site/wwwroot'
remote: 
remote: Removing existing manifest file
remote: Creating a manifest file...
remote: Manifest file created.
remote: 
remote: Done in 77 sec(s).
remote: Running post deployment command(s)...
remote: Triggering recycle (preview mode disabled).
remote: Deployment successful.
```
5. By default when deploying a Django application with Python on Azure App Services - it looks for a directory containing `wsgi.py` (which is generated by default with Django), which would also have the `wsgi` callable within it named `application`, and runs `gunicorn` against this if found. Since our project contains the typical generated `wsgi.py` file with our `wsgi` callable in it - we do not need to specific a startup command sice this is default behavior. You can read more [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#run).

  > **NOTE**: Gunicorn is the default WSGI server used to run Python applications on Azure App Service unless otherwise specified. See this [documentation](https://docs.microsoft.com/en-us/azure/app-service/configure-language-python#container-characteristics) as well.


  `gunicorn mysite.wsgi`

  `GUNICORN_CMD_ARGS="--timeout 600 --access-logfile '-' --error-logfile '-' --chdir=/tmp/<this_will_be_a_random_value>"`


  ```
  2022-02-21T01:25:39.567155402Z Detected an app based on Django
  2022-02-21T01:25:39.567164202Z Generating `gunicorn` command for 'mysite.wsgi'
  2022-02-21T01:25:40.847061944Z Writing output script to '/opt/startup/startup.sh'
  2022-02-21T01:25:43.460872696Z Using packages from virtual environment antenv located at /tmp/8d9f4d8c8f5084d/antenv.
  2022-02-21T01:25:43.461645224Z Updated PYTHONPATH to ':/tmp/8d9f4d8c8f5084d/antenv/lib/python3.9/site-packages'
  2022-02-21T01:25:49.920008143Z [2022-02-21 01:25:49 +0000] [36] [INFO] Starting gunicorn 20.1.0
  2022-02-21T01:25:49.921229186Z [2022-02-21 01:25:49 +0000] [36] [INFO] Listening at: http://0.0.0.0:8000 (36)
  2022-02-21T01:25:49.921815507Z [2022-02-21 01:25:49 +0000] [36] [INFO] Using worker: sync
  2022-02-21T01:25:49.932850097Z [2022-02-21 01:25:49 +0000] [37] [INFO] Booting worker with pid: 37
  ```

  6. You should now be able to browse the deployed application.

## GitHub Actions

You can quickly get started with GitHub Actions by using the App Service Deployment Center. This will automatically generate a workflow file based on your application stack and commit it to your GitHub repository in the correct directory. You can deploy a workflow manually using deployment credentials. 

![Django App](/media/2022/02/vue-deployment-linux-05.png)

> **NOTE**: If you have numerous repositories that appear in the dropdown, you can search by typing within the text field/dropdown.

You can find more details about these steps documented here:
 - [Use the Deployment Center](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#use-the-deployment-center)
 - [Set up a workflow manually](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#set-up-a-workflow-manually)


After setting up Github actions, it will generate a Github Actions template like the [one seen here](https://github.com/actions/starter-workflows/blob/main/deployments/azure-webapps-python.yml). Since we're using Django we'll have to make changes to this template with the changes called out below:
  1. We add a run command for `python manage.py collectstatic --noinput` for our static files. We add `--noinput` to avoid being prompted incase the `static` folder is pushed and already existing, or else you may encounter the following which will cause a failed deployment:

  ```
  EOFError: EOF when reading a line
  Type 'yes' to continue, or 'no' to cancel:
  ```

  2. We add a command for `python manage.py makemigrations --empty polls` and `python manage.py migrate polls` to run our database migrations. ('polls' is just the name of the Django app as explained above, yours may differ)
  3. If you're pointing to a production database and keeping your credentials in environment variables you'll have to have the Github Actions deployment agent have access to these. The below `.yml` example uses a Postgres example, as seen [here](https://docs.djangoproject.com/en/4.0/ref/settings/#databases).
  4. (Optional) - if using `WEBSITE_HOSTNAME` for the `ALLOWED_HOSTS` value, we need to specificy this in an environment variable in the pipeline, or else you may see `KeyError: 'WEBSITE_HOSTNAME'`

  > **NOTE**: It's heavily advised to not hardcode any secrets needed during the build, you can add these as environment variables by going to your Github Repo for said project -> Settings -> Secrets (expand) -> Actions -> New repository secret

{% raw %}
```yaml
name: Build and deploy Python app to Azure Web App - yoursitename

on:
  push:
    branches:
      - main
  workflow_dispatch:

# OPTIONAL - If using 'WEBSITE_HOSTNAME' environment variable as called out earlier we need to add this variable so it's accessible in our pipeline
# Or else we will encounter a KeyError
# If not using 'WEBSITE_HOSTNAME' we don't need this - such as hardcoding '.azurewebsitse.net' or '*'

# If pointing to a production database and assuming your credentials are stored as environment variables we'll have to add these so our deployment agent has access when running migrations
env:
  WEBSITE_HOSTNAME: ${{ secrets.WEBSITE_HOSTNAME }}
  POSTGRES_ENGINE: ${{ secrets.POSTGRES_ENGINE }}
  POSTGRES_HOST: ${{ secrets.POSTGRES_HOST }}
  POSTGRES_NAME: ${{ secrets.POSTGRES_NAME }}
  POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD }}
  POSTGRES_PORT: ${{ secrets.POSTGRES_PORT }}
  POSTGRES_USER: ${{ secrets.POSTGRES_USER }}

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python version
        uses: actions/setup-python@v1
        with:
          python-version: '3.9'

      - name: Create and start virtual environment
        run: |
          python -m venv venv
          source venv/bin/activate
      
      - name: Install dependencies
        run: pip install -r requirements.txt

      # We add collectstatic to take care of our static files during the Actions run
      # This is not added by default in the generated template, so we include this ourselves
      - name: Collect static
        run: python manage.py collectstatic --no-input

      # We add makemigrations and migrate to run our model/database migrations
      # This is not added by default in the generated template, so we include this ourselves
      - name: Make migrations and run migrations
        run: |
          python manage.py makemigrations --empty polls
          python manage.py migrate polls

      # Optional: Add step to run tests here (PyTest, Django test suites, etc.)
      - name: Zip artifact for deployment
        run: zip release.zip ./* -r

      - name: Upload artifact for deployment jobs
        uses: actions/upload-artifact@v3
        with:
          name: python-app
          path: |
            release.zip 
            !venv/

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v3
        with:
          name: python-app

      - name: Unzip artifact for deployment
        run: unzip release.zip
          
      - name: 'Deploy to Azure Web App'
        uses: azure/webapps-deploy@v2
        id: deploy-to-webapp
        with:
          app-name: 'yoursitename'
          slot-name: 'Production'
          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_000000000000000000000000000000 }}
```
{% endraw %}

If desired, you can pass in a specific `package` name in the `azure/webapps-deploy@v2` task - the `package` being the zip from earlier in the pipeline:

{% raw %}
```yaml
- name: 'Deploy to Azure Web App'
  uses: azure/webapps-deploy@v2
  id: deploy-to-webapp
  with:
    app-name: 'yoursitenamehere'
    slot-name: 'Production'
    package: release.zip
    publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_000000000000000000000000000 }}
```
{% endraw %}

If wanting to use a Service Principal instead of a Publish Profile, follow the walkthrough [here](https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=userlevel). After configuring the Service Principal and the `AZURE_CREDENTIALS` secret, simply change the release portion of your `yaml` to the following:

{% raw %}
```yaml
- uses: azure/login@v1
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}

- name: 'Deploy to Azure Web App'
  uses: azure/webapps-deploy@v2
  id: deploy-to-webapp
  with:
    app-name: 'yoursitenamehere'
    slot-name: 'Production'

- name: logout
  run: |
    az logout
```
{% endraw %}

Below is the output we'd see in the 'Actions' tab on Github after setting up Actions and pushing a new commit to trigger a deployment.

![Django App](/media/2022/02/django-deployment-linux-04.png)

> **NOTE**: This default `.yml` assumes we would have `wsgi.py` and a `wsgi` callable named `application` in that file under the `mysite` folder (the main site folder generated during project creation) - following a typical Django folder structure. 


## Azure DevOps
You can use Azure Pipelines to build your Django application. For Django apps, you can still use your typical `pip` and `python` based commands. You can review more details here: [YAML Pipeline explained](https://docs.microsoft.com/en-us/azure/devops/pipelines/ecosystems/python-webapp?view=azure-devops#yaml-pipeline-explained).

Here is an example in how to implement Azure Pipelines with App Service Linux.

1. Create a new DevOps project then go to `Pipelines` and select `Create Pipeline`.
2. Select your code repository.
3. Select `Python to Linux Web App on Azure` template.
4. Select the web app where you will deploy.
5. A default pipeline `.yaml` definition will be generated:
    - Make sure your Python version matches the App Service Python version. The default yaml for the Python App Service template will have a variable named `pythonVersion` (seen below) set towards the top of the file. Change this as needed.

        ```yaml
            # Python version: 3.9
            pythonVersion: '3.9'
        ```

        It's then included in the UsePythonVersion@0 task

        ```yaml
          - task: UsePythonVersion@0
            inputs:
              versionSpec: '$(pythonVersion)'
            displayName: 'Use Python $(pythonVersion)'
        ```

    - If desired you can change the startup command via the AzureWebApp@1 Deployment task

        ```yaml
          - task: AzureWebApp@1
            displayName: 'Deploy Azure Web App : yourwebappname'
            inputs:
              azureSubscription: $(azureServiceConnectionId)
              appName: $(webAppName)
              appType: webAppLinux
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
              startUpCommand: 'gunicorn --bind 0.0.0.0:8000 --timeout 600 mysite.wsgi'
        ```

  > **NOTE**: To avoid any definition errors in the yaml, add the property `appType` set to `webAppLinux` as seen in the above task.

7. Save and `run` the pipeline.

Here is an example with recommendations:

```yaml
trigger:
- main

variables:
  # Azure Resource Manager connection created during pipeline creation
  azureServiceConnectionId: '0000000-0000-0000-0000-00000000'

  # Web app name
  webAppName: 'yourwebappname'

  # Agent VM image name
  vmImageName: 'ubuntu-latest'

  # Environment name
  environmentName: 'yourwebappname'

  # Project root folder. Point to the folder containing manage.py file.
  projectRoot: $(System.DefaultWorkingDirectory)

  # Python version: 3.9
  pythonVersion: '3.9'
  # If using a production database then we need to specify our credentials as environment variables
  # This is so when running migrations our DevOps agent has access to these and our code can pick it up from the environment, or else our build will fail. The concept is the same as Github Actions
  POSTGRES_ENGINE: $(DEVOPS_POSTGRES_ENGINE)
  POSTGRES_HOST: $(DEVOPS_POSTGRES_HOST)
  POSTGRES_NAME: $(DEVOPS_POSTGRES_NAME)
  POSTGRES_PASSWORD: $(DEVOPS_POSTGRES_PASSWORD)
  POSTGRES_PORT: $(DEVOPS_POSTGRES_PORT)
  POSTGRES_USER: $(DEVOPS_POSTGRES_USER)
  SECRET_KEY: $(DEVOPS_SECRET_KEY)
  WEBSITE_HOSTNAME: $(DEVOPS_WEBSITE_HOSTNAME)

stages:
- stage: Build
  displayName: Build stage
  jobs:
  - job: BuildJob
    pool:
      vmImage: $(vmImageName)
    steps:
    - task: UsePythonVersion@0
      inputs:
        versionSpec: '$(pythonVersion)'
      displayName: 'Use Python $(pythonVersion)'

    # By default the 'collectstatic, makemigrations and migrate' commands are not included in this template by default 
    - script: |
        python -m venv antenv
        source antenv/bin/activate
        python -m pip install --upgrade pip
        pip install setup
        pip install -r requirements.txt
        python manage.py collectstatic --no-input
        python manage.py makemigrations --empty polls
        python manage.py migrate polls
      workingDirectory: $(projectRoot)
      displayName: "Install requirements"

    - task: ArchiveFiles@2
      displayName: 'Archive files'
      inputs:
        rootFolderOrFile: '$(projectRoot)'
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

          - task: UsePythonVersion@0
            inputs:
              versionSpec: '$(pythonVersion)'
            displayName: 'Use Python version'

          - task: AzureWebApp@1
            displayName: 'Deploy Azure Web App : yourwebappname'
            inputs:
              azureSubscription: $(azureServiceConnectionId)
              appName: $(webAppName)
              appType: webAppLinux
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
              # startUpCommand: 'gunicorn --bind 0.0.0.0:8000 --timeout 600 mysite.wsgi' // This is optional unless needing to be added for any specific reason
```
> **NOTE**: Depending on how you set up your pipeline, you may have to authorize permission for deployment. This is a one-time task, below is a screenshot of what you may see:

![Django App](/media/2022/02/vue-deployment-linux-07.png)

![Django App](/media/2022/02/flask-deployment-linux-06.png)


# Troubleshooting

> **NOTE**: Any of the below scenarios would show "Application Error :(" when browsing your App Service. Make sure you have App Service Logs enabled or else troubleshooting these issues will take more time. Review how to enable App Serivce Logs [here](https://docs.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer).

## Container Doesn't Start
- **ModuleNotFoundError: No module named 'somemodulename'**. 
<br>
  This `ModuleNotFound` error may happen in a few different scenarios, for example:
  
  **Scenario**: Using ZipDeploy without the `SCM_DO_BUILD_DURING_DEPLOYMENT` set to `true` AppSetting explained earlier in this article.
   
     - **Resolution**: If using ZipDeploy, make sure `SCM_DO_BUILD_DURING_DEPLOYMENT` is set to `true`. Or else Oryx may not build out the application, which wouldn't run `pip install` - thus causing this error.

  **Scenario**: Missing package within the `requirements.txt`:

    - **Resolution**: Ensure the missing package in the `ModuleNotFound` error is actually added in your `requirements.txt` with its appropriate name.
        
## Requirements.txt or .py files not found during deployment

  **Scenario**: When deploying from you may see a `Could not find setup.py or requirements.txt; Not running pip install`:

  - **Resolution**: Make sure you `cd` into the correct project folder. For example, there is a chance that the deployment was done from a parent directory that contains your project folder. Make sure you are in the project folder containing your `.py` files, `requirements.txt`, etc.:
      
    ```
      mysite/
      manage.py
      requirements.txt
      mysite/
          __init__.py
          settings.py
          urls.py
          asgi.py
          wsgi.py
      ...
      ..
    ```

    > **NOTE**: This may also manifest as by showing the default Azure App Service 'splash'/welcome page and the following message in logging: `No framework detected; using default app from /opt/defaultsite`


## Failed to find attribute 'application' in 'somedjangoapp.wsgi'

**Scenario**: You may see `Failed to find attribute 'application' in 'somedjangoapp.wsgi'` if your WSGI callable in your `wsgi.py` file is not named `application`. Where 'somedjango' app is your main Django app that contains the `wsgi.py` file. For example: 

  ```
  app = get_wsgi_application()
  ```


  - **Resolution**: [Oryx looks for a `wsgi.py` file](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#run) and within it an `wsgi` callable named `application` by default for Django. If you decide to name your WSGI callable something not named `application`, you will need to change your startup command to target this appropriately. The example below assumes you have a file named `wsgi.py` with a WSGI callable named `app` inside of it in your `mysite` (or your relevant main Django app directory):

    `gunicorn --bind 0.0.0.0:8000 --timeout 600 mysite.wsgi:app`


## ModuleNotFoundError: No module named 'mysite.wsgi'

**Scenario**: Oryx is unable to find your `wsgi` callable and file and shows `ModuleNotFoundError: No module named 'mysite.wsgi'`.

  - **Resolution**: Explained above, since Oryx looks for a file named `wsgi.py` by default - this implies the `wsgi.py` file doesn't exist or is named something differently. If your file containing your `wsgi` callable was renamed to something else, you need to manually specific this in your startup command, as below - this example assumes your `wsgi.py` file was renamed to `wsge.py`:

  `gunicorn --bind 0.0.0.0:8000 --timeout 600 mysite.wsge:app`

## SQLite related file-locks

 **Scenario**: When using SQLite a `database is locked` or `sqlite3.OperationalError` error may be seen.

  - **Resolution**: It is **not** recommended to use SQLite in production due to file-locking issues that may be encountered - especially if multiple writes are being attempted or with concurrency. SQLite is normally used for local development. It is recommended to use a production database such as MySQL, Postgres or related.

## HTTP 500's after setting Debug=False

**Scenario**: `An internal server error has occurred (500))` while accessing a specific route or /admin:

  - **Resolution**: This is normally indicative of another application level issue. For instance, not setting `STATIC_ROOT` to a absolute file path (eg., `/static/`) could potentially cause this, as well as invalid or other incorrect settings in `settings.py`. Review this file where needed. If possible, you can either add and configure your [`LOGGING` dictionary in `settings.py`](https://docs.djangoproject.com/en/4.0/ref/settings/#logging) to show the error while `Debug=False` or turn `Debug=True` to see if the error is reproducible.

## Static files are not being served:

**Scenario**: When browsing the deployed application, static content is missing/broken and/or returning a HTTP 404 with MIME-type errors in the DevTools console.

  - **Resolution**:
    Ensure `STATIC_ROOT` and `STATIC_URL` are both set correctly. Also make sure that `whitenoise` is configured correctly as seen [here](https://docs.microsoft.com/en-us/azure/app-service/configure-language-python#serve-static-files-for-django-apps).

    If static content is being pre-built and then deployed under a atypical folder name, ensure that `STATICFILES_DIRS` contains said folder name. 

## Error: Couldn't detect a version for the platform 'python' in the repo.
This would happen during the deployment phase on either Github Actions or Azure Devops. Ensure the following:
- The project structure matches is defined [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#detect)
- If using a .zip (such as in GitHub Actions), ensure the zip if unzipped first (if not using the `package` property) - or - if using the `package` property, pass the correct zip name with the appropriate project structure

## Github Actions
> **NOTE**: The below is now included by default in GitHub Action generated templates when setting up with App Service. If you are manually creating a workflow, you'll need to configure it yourself.

A normal deployment doesn't need to take more than 5-15 mins. If the workflow is taking more than that then you might need to review current implementation. Here is a list of things to check:

- **Running tests**. There are scenarios where GitHub Actions Agent takes more than 360 minutes (6 hrs) to give you a status and fails with: **`The job running on runner Hosted Agent has exceeded the maximum execution time of 360 minutes.`**. Review if any tests are taking an extended amount of time - if these are not needed it would be recommended to remove these.

- **Too many files and slow deployments**. Using `actions/upload-artifact@v2` you can share files between jobs, such as `build` and `deploy`. Sometime it will trigger the following warning `There are over 10,000 files in this artifact, consider creating an archive before upload to improve the upload performance.` - if you have a large project and/or many dependencies. This may cause your deployment to take an extended amount of time. To overcome this you zip your content between jobs to improve deployment time. 

    ![Django App](/media/2022/02/vue-deployment-linux-09.png)

    For those scenarios, you can implement the following:

    1. Zip the content and upload the zip as an artifact to the `deploy` stage:

        ```yaml
        - name: Zip artifact for deployment
          run: zip release.zip ./* -qr

        - name: Upload artifact for deployment jobs
          uses: actions/upload-artifact@v2
          with:
            name: python-app
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
                    name: python-app
                    
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
                name: python-app
                
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

        ![Django App](/media/2022/02/django-deployment-linux-05.png)



