---
title: "Deploying a Quart app to Python App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Linux
    - Configuration
    - Python
    - Troubleshooting
categories:
    - Python # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/pylinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-07-17 12:00:00
---

This post will go cover deploying a quickstart Quart application to a Python App Service Linux "Blessed Image".

# Overview
[Quart](https://quart.palletsprojects.com/en/latest/index.html) is an aSGI-based asynchronous Python framework used for building APIs. Quart is very similiar to Flask - in the sense it's a "micro" or "minimalist" Python framework.

This post will cover how to deploy a quickstart Quart app to a Python "Blessed Image" on Azure App Service Linux.

# Local Development 

## Set up your virtual environment.

1. For these examples we'll be creating a basic Quart application to get started. Start by creating a folder for your application and `cd` into it to create and activate your virtual environment. You can review the official documentation for this [here](https://docs.python.org/3/library/venv.html). For example:

    `mkdir quart`

    `cd quart`

2. With our folder now created (or if you're using an existing one), we'll create our virtual environment below:
    
    `python -m venv .venv` 
    > **NOTE**: .venv in the name of our virtual environment, this can be changed to any arbitrary name

3. We can now activate our virtual environment using the below:
    
    `source .venv/Scripts/activate` (Bash, *NIX)
    
    `.\.venv\Scripts\activate` (Windows)

    You should now see your virtual environment name activated in your terminal.

    ![Flask App](/media/2022/02/flask-deployment-linux-01.png)

4. You can follow [Quart Installation Steps here.](https://quart.palletsprojects.com/en/latest/tutorials/installation.html#installation) Run `pip install quart[dotenv]` and then `pip freeze > requirements.txt` to create a `requirements.txt` for deployment later on.

5. Create an `app.py` in your project root with the following:

```python
from quart import Quart

app = Quart(__name__)

@app.route('/')
async def hello():
    return 'hello'
```

6. Next, run `hypercorn app:app`. You should see the following output in your terminal, and then the following when accessing `localhost:8000`:

```shell
$ hypercorn app:app
[2024-07-17 12:36:38 -0400] [27828] [INFO] Running on http://127.0.0.1:8000 (CTRL + C to quit)
```

![Local Quart App](/media/2024/07/quart-deployment-2.png)


**NOTE**: If you follow the _official_ Quart tutorial, this will include `app.run()` in your entrypoint `.py` file and mention to run with the application with `python app.py`. With no arguments, this will default to `localhost` as the host and `5000` as the port.

![Local Quart App](/media/2024/07/quart-deployment-1.png)

This is fine to run locally - but do _not_ use this production. Knowing this is important later on when deploying andtroubleshooting.

# Deployment Options
There are multiple deployment options in Python on App Service Linux such as Continuous Deployment (GitHub Actions, DevOps pipelines), External Git, Local Git, [ZipDeploy with Oryx Builder](https://docs.microsoft.com/en-us/azure/app-service/deploy-zip?tabs=cli#enable-build-automation-for-zip-deploy), etc. We'll be covering 3 of these methods below.

>**NOTE**: For Python on App Service Linux you should **not** use methods like FTP or ZipDeploy (without the use of Oryx) to avoid improper deployment since the Python environment will not be built, thus causing errors like `ModuleNotFound` or others - since `pip install` is not ran in these scenarios. You **do** want to use deployment methods like Local Git, ZipDeploy (with Oryx builder, see above), or pipelines like DevOps or Github Actions since these will all correctly create and activate the virtual environment, and install dependencies as required.

## Prerequsite - Startup Command
Gunicorn, using a `sync` worker, is the default WSGI server used to run Python applications on Azure App Service unless otherwise specified. See this [documentation](https://docs.microsoft.com/en-us/azure/app-service/configure-language-python#container-characteristics) as well. Because of that, we need to change our startup command - otherwise you'll see `Application Error : (` for potentially a few reasons. The main reason would be because `gunicorn` is an `wSGI` server while Quart requires a `aSGI` server to be used.

We want to use `hypercorn` in production - which is what is also recommended by Quart and is also installed as a dependenciy of Quart by default. If `app.run()` is in your `.py` entrypoint - ensure this is not being invoked on startup.

![Startup Command](/media/2024/07/quart-deployment-3.png)

For more information on `hypercorn` usage and configuration, review the docs - [Hypercorn - How to guides](https://hypercorn.readthedocs.io/en/latest/how_to_guides/index.html)

**Note**:
- You can also use `uvicorn`, either directly, or through a `gunicorn` Worker class instead of `hypercorn`. In either case, that would require `uvicorn` being installed as a dependency, otherwise you'll see `ModuleNotFoundError: No module named 'uvicorn'` at runtime
- For example, you could set your startup command to the following: `gunicorn --workers 3 --worker-class uvicorn.workers.UvicornWorker --timeout 600 --access-logfile '-' --error-logfile '-' app:app`

Assuming we have `uvicorn` in our `requirements.txt` and Oryx is used, you'd see the following startup in `default_docker.log` under `/home/LogFiles`:

```
2024-07-17T19:08:26.092466723Z Site's appCommandLine: gunicorn --workers 3 --worker-class uvicorn.workers.UvicornWorker --timeout 600 --access-logfile '-' --error-logfile '-' app:app
2024-07-17T19:08:26.093571607Z Launching oryx with: create-script -appPath /home/site/wwwroot -output /opt/startup/startup.sh -virtualEnvName antenv -defaultApp /opt/defaultsite -userStartupCommand 'gunicorn --workers 3 --worker-class uvicorn.workers.UvicornWorker --timeout 600 --access-logfile '-' --error-logfile '-' app:app'
2024-07-17T19:08:26.098674294Z Found build manifest file at '/home/site/wwwroot/oryx-manifest.toml'. Deserializing it...
2024-07-17T19:08:26.100828657Z Build Operation ID: 970e849269be8b25
2024-07-17T19:08:26.101481206Z Oryx Version: 0.2.20240501.1, Commit: f83f88d3cfb8bb6d3e2765e1dcd218eb0814a095, ReleaseTagName: 20240501.1
2024-07-17T19:08:26.101639118Z Output is compressed. Extracting it...
2024-07-17T19:08:26.103621768Z Extracting '/home/site/wwwroot/output.tar.gz' to directory '/tmp/8dca693c545f48e'...
2024-07-17T19:08:26.558115504Z App path is set to '/tmp/8dca693c545f48e'
2024-07-17T19:08:26.593350573Z Writing output script to '/opt/startup/startup.sh'
2024-07-17T19:08:26.632885669Z Using packages from virtual environment antenv located at /tmp/8dca693c545f48e/antenv.
2024-07-17T19:08:26.632924071Z Updated PYTHONPATH to '/opt/startup/app_logs:/tmp/8dca693c545f48e/antenv/lib/python3.12/site-packages'
2024-07-17T19:08:26.844374292Z [2024-07-17 19:08:26 +0000] [72] [INFO] Starting gunicorn 22.0.0
2024-07-17T19:08:26.845125549Z [2024-07-17 19:08:26 +0000] [72] [INFO] Listening at: http://0.0.0.0:8000 (72)
2024-07-17T19:08:26.845140650Z [2024-07-17 19:08:26 +0000] [72] [INFO] Using worker: uvicorn.workers.UvicornWorker
2024-07-17T19:08:26.847739947Z [2024-07-17 19:08:26 +0000] [73] [INFO] Booting worker with pid: 73
2024-07-17T19:08:26.915835006Z [2024-07-17 19:08:26 +0000] [74] [INFO] Booting worker with pid: 74
2024-07-17T19:08:26.927903721Z [2024-07-17 19:08:26 +0000] [75] [INFO] Booting worker with pid: 75
2024-07-17T19:08:27.996400176Z [2024-07-17 19:08:27 +0000] [73] [INFO] Started server process [73]
2024-07-17T19:08:27.997376350Z [2024-07-17 19:08:27 +0000] [74] [INFO] Started server process [74]
2024-07-17T19:08:27.997390851Z [2024-07-17 19:08:27 +0000] [75] [INFO] Started server process [75]
```


## Local Git/VSCode
You can [Deploy with VSCode](https://learn.microsoft.com/en-us/azure/app-service/quickstart-python?tabs=flask%2Cwindows%2Cazure-portal%2Cvscode-deploy%2Cdeploy-instructions-azportal%2Cterminal-bash%2Cdeploy-instructions-zip-azcli) or [Deploy with Local Git](https://learn.microsoft.com/en-us/azure/app-service/quickstart-python?tabs=flask%2Cwindows%2Cazure-portal%2Clocal-git-deploy%2Cdeploy-instructions-azportal%2Cterminal-bash%2Cdeploy-instructions-zip-azcli).

1. Navigate to your Web App and select `Deployment Center` and then click on `Local Git` and then click on `Save`.

    ![Flask App](/media/2022/02/flask-deployment-linux-03.png)
2. Copy the remote git repository from the Azure Portal.

    ![Flask App](/media/2024/04/streamlit-deployment-2.png)
3. In your local terminal run the following commands in order:
    ```bash
    git add .
    git commit -m "initial commit"
    git remote add azure https://<sitename>.scm.azurewebsites.net:443/<sitename>.git
    git push azure master
    ```
4. Then Oryx will build the application:
> **NOTE**: It would be advisable to have a .gitignore with your virtual environment name included to avoid commiting this. You can create a `.gitignore` yourself and add the name of the environment, like in our case, '.venv', and/or use this official Github Python .gitignore [here](https://github.com/github/gitignore/blob/main/Python.gitignore)

For either Local Git or VSCode - you'll see logging like this. Note, if `pip install` doesn't show when deploying via VSCode, this should be logged in `YYYY_MM_DD_lnxxxxxxxxxxx_default_scm_docker.log` under `/home/LogFiles` - this is assuming that Oryx is actually enabled and being used.

```
12:49:46 PM quart-app: Starting deployment...
12:49:47 PM quart-app: Deploying Local Git repository to "quart-app"...
12:49:51 PM quart-app: Updating branch 'master'.
12:49:52 PM quart-app: Updating submodules.
12:49:52 PM quart-app: Preparing deployment for commit id 'c96ba12a00'.
12:49:53 PM quart-app: PreDeployment: context.CleanOutputPath False
12:49:53 PM quart-app: PreDeployment: context.OutputPath /home/site/wwwroot
12:49:53 PM quart-app: Repository path is /home/site/repository
12:49:53 PM quart-app: Running oryx build...
12:49:53 PM quart-app: Command: oryx build /home/site/repository -o /home/site/wwwroot --platform python --platform-version 3.12 -p virtualenv_name=antenv --log-file /tmp/build-debug.log  -i /tmp/8dca6807afe8938 --compress-destination-dir | tee /tmp/oryx-build.log
12:49:54 PM quart-app: Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
12:49:54 PM quart-app: You can report issues at https://github.com/Microsoft/Oryx/issues
12:49:54 PM quart-app: Oryx Version: 0.2.20240424.1, Commit: d37b2225a252ab2c04b4726024d047cf01ea1318, ReleaseTagName: 20240424.1
12:49:54 PM quart-app: Build Operation ID: f6d196ecf8fdfebc
12:49:54 PM quart-app: Repository Commit : c96ba12a0069fe80a824c38747e69473887dc9be
12:49:54 PM quart-app: OS Type           : bullseye
12:49:54 PM quart-app: Image Type        : githubactions
12:49:54 PM quart-app: Detecting platforms...
12:49:55 PM quart-app: Detected following platforms:
12:49:55 PM quart-app:   python: 3.12.2
12:49:55 PM quart-app: Version '3.12.2' of platform 'python' is not installed. Generating script to install it...
12:49:55 PM quart-app: Using intermediate directory '/tmp/8dca6807afe8938'.
12:49:56 PM quart-app: Copying files to the intermediate directory...
12:49:56 PM quart-app: Done in 1 sec(s).
12:49:56 PM quart-app: Source directory     : /tmp/8dca6807afe8938
12:49:56 PM quart-app: Destination directory: /home/site/wwwroot
12:49:56 PM quart-app: Downloading and extracting 'python' version '3.12.2' to '/tmp/oryx/platforms/python/3.12.2'...
12:49:56 PM quart-app: Detected image debian flavor: bullseye.
12:49:58 PM: Deployment to "quart-app" completed.
```

`pip install` logs:

```
...other pip install logs..
Installing collected packages: python-dotenv, priority, MarkupSafe, itsdangerous, hyperframe, hpack, h11, colorama, click, blinker, aiofiles, wsproto, Werkzeug, Jinja2, h2, Hypercorn, Flask, Quart
Successfully installed Flask-3.0.3 Hypercorn-0.17.3 Jinja2-3.1.4 MarkupSafe-2.1.5 Quart-0.19.6 Werkzeug-3.0.3 aiofiles-24.1.0 blinker-1.8.2 click-8.1.7 colorama-0.4.6 h11-0.14.0 h2-4.1.0 hpack-4.0.0 hyperframe-6.0.1 itsdangerous-2.2.0 priority-2.0.0 python-dotenv-1.0.1 wsproto-1.2.0
..other logs..
```

## GitHub Actions

You can quickly get started with GitHub Actions by using the App Service Deployment Center. This will automatically generate a workflow file based on your application stack and commit it to your GitHub repository under `.github`. You can deploy a workflow manually using a publish profile or service principal, as well. 

![Flask App](/media/2022/02/vue-deployment-linux-05.png)

> **NOTE**: If you have numerous repositories that appear in the dropdown, you can search by typing within the text field/dropdown.

You can find more details about these steps documented here:
 - [Use the Deployment Center](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#use-the-deployment-center)
 - [Set up a workflow manually](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#set-up-a-workflow-manually)

elow is the yaml file generated after setting up Github Actions (using the "User Identity" option in Deployment Center) - with the extra addition of the `startup-command` property under `azure/webapps-deploy@v2`. We manually add that in the below template to avoid our application failing upon startup.

{% raw %}
```yaml
name: Build and deploy Python app to Azure Web App - quart-app

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python version
        uses: actions/setup-python@v1
        with:
          python-version: '3.12'

      - name: Create and start virtual environment
        run: |
          python -m venv venv
          source venv/bin/activate
      
      - name: Install dependencies
        run: pip install -r requirements.txt
        
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
    permissions:
      id-token: write #This is required for requesting the JWT

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v3
        with:
          name: python-app

      - name: Unzip artifact for deployment
        run: unzip release.zip

      
      - name: Login to Azure
        uses: azure/login@v1
        with:
          client-id: ${{ secrets.AZUREAPPSERVICE_CLIENTID_000000000000000000000000000}}
          tenant-id: ${{ secrets.AZUREAPPSERVICE_TENANTID_0000000000000000000000000000 }}
          subscription-id: ${{ secrets.AZUREAPPSERVICE_SUBSCRIPTIONID_00000000000000000000000 }}

      - name: 'Deploy to Azure Web App'
        uses: azure/webapps-deploy@v2
        id: deploy-to-webapp
        with:
          app-name: 'quart-app'
          slot-name: 'Production'
          startup-command: 'hypercorn --bind '0.0.0.0:8000' app:app'
```

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
    startup-command: 'hypercorn --bind '0.0.0.0:8000' app:app'
```
{% endraw %}

If wanting to use a publish profile instead, follow [this](https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel%2Caspnetcore), and use the below in your `.yaml`:

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
    startup-command: "hypercorn --bind '0.0.0.0:8000' app:app"
```
{% endraw %}

Below is the output we'd see in the 'Actions' tab on Github after setting up Actions and pushing a new commit to trigger a deployment.

![Flask App](/media/2022/02/flask-deployment-linux-05.png)

## Azure DevOps
You can use Azure Pipelines to build your Quart application. For Quart apps, you can still use your typical `pip` and `python` based commands. You can review more details here: [YAML Pipeline explained](https://docs.microsoft.com/en-us/azure/devops/pipelines/ecosystems/python-webapp?view=azure-devops#yaml-pipeline-explained).

Here is an example on how to implement Azure Pipelines with App Service Linux.

1. Create a new DevOps project then go to `Pipelines` and select `Create Pipeline`.
2. Select your code repository.
3. Select `Python to Linux Web App on Azure` template.
4. Select the web app where you will deploy.
5. A default pipeline `.yaml` definition will be generated:
    - Make sure your Python version matches the App Service Python version. The default yaml for the Python App Service template will have a variable named `pythonVersion` (seen below) set towards the top of the file. Change this as needed.

        ```yaml
            # Python version: 3.12
            pythonVersion: '3.12'
        ```

        It's then included in the UsePythonVersion@0 task

        ```yaml
          - task: UsePythonVersion@0
            inputs:
              versionSpec: '$(pythonVersion)'
            displayName: 'Use Python $(pythonVersion)'
        ```

    - If desired you can change the startup command via the `AzureWebApp@1` Deployment task

        ```yaml
          - task: AzureWebApp@1
            displayName: 'Deploy Azure Web App : yourwebappname'
            inputs:
              azureSubscription: $(azureServiceConnectionId)
              appName: $(webAppName)
              appType: webAppLinux
              package: $(Pipeline.Workspace)/drop/$(Build.BuildId).zip
              startUpCommand: "hypercorn --bind '0.0.0.0:8000' app:app"
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

  # Python version: 3.12
  pythonVersion: '3.12'

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

    - script: |
        python -m venv antenv
        source antenv/bin/activate
        python -m pip install --upgrade pip
        pip install setup
        pip install -r requirements.txt
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
              startUpCommand: 'hypercorn --bind '0.0.0.0:8000' app:app' 
```
> **NOTE**: Depending on how you set up your pipeline, you may have to authorize permission for deployment. This is a one-time task, below is a screenshot of what you may see:

![Flask App](/media/2022/02/vue-deployment-linux-07.png)

![Flask App](/media/2022/02/flask-deployment-linux-06.png)

# Troubleshooting
## Requirements.txt or .py files not found during deployment

  **Scenario**: When deploying from you may see a `Could not find setup.py or requirements.txt; Not running pip install`:

  - **Resolution**: Make sure you `cd` into the correct project folder. For example, there is a chance that the deployment was done from a parent directory that contains your project folder. Make sure you are in the project folder containing your `.py` files, `requirements.txt`, etc.:
      
    ```
      parentfolder/
        myproject/
          app.py
          requirements.txt
          .gitignore
    ```

    > **NOTE**: This may also manifest as by showing the default Azure App Service 'splash'/welcome page and the following message in logging: `No framework detected; using default app from /opt/defaultsite`

## Failed to find attribute 'app' in 'app'

**Scenario**: You may see `Failed to find attribute 'app' in 'app'` if your aSGI callable in your main `.py` file is not named `app`. For example: 

```python
app = Quart(__name__)
```


  - **Resolution**: As mentioned above, [Oryx looks for a WSGI (or aSGI) callable named `app`](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#run) for these kinds of applications. If you decide to name your aSGI callable something not named `app`, you will need to change your startup command to target this appropriately. The example below assumes you have a file named `app.py` with a aSGI callable named `quart` inside of it:

    `gunicorn --worker-class uvicorn.workers.UvicornWorker --timeout 600 --access-logfile '-' --error-logfile '-' app:quart`

## Error: Couldn't detect a version for the platform 'python' in the repo.
This would happen during the deployment phase on either Github Actions or Azure Devops. Ensure the following:
- The project structure matches is defined [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#detect)
- If using a .zip (such as in GitHub Actions), ensure the zip if unzipped first (if not using the `package` property) - or - if using the `package` property, pass the correct zip name with the appropriate project structure

## hypercorn: not found
If this message is seen - the container is going to be exiting - therefor the application will be crashing with `Application Error : (`

You'd see this message in `default_docker.log`:

```
2024-07-16T18:59:31.479202101Z /opt/startup/startup.sh: 23: hypercorn: not found
```

Some possibilities for this is:
- `hypercorn` is not in `requirements.txt` or is not being installed as a dependency of `quart`
- The `.zip` file for the deployment (if using deployment methods that do ZipDeploy) does not contain the `site-packages` folder
  - Or, build automation via Oryx was disabled and the deployed content did not contain `site-packages`

## TypeError: Quart.__call__() missing 1 required positional argument: 'send'
This message will show in `default_docker.log` - this is generally going to happen for two reasons:
- A startup command to use `hypercorn` or an aSGI server was never provided. Therefor it defaults to using `gunicorn` with a `sync` worker which does not support asynchronous usage
- You are explicitly using a `wSGI` server - not an `aSGI` - which is not compatible with Quart

The resolution would be to set the Startup Command to use an `aSGI` server like `hypercorn`, `uvicorn`, or `gunicorn` with a `uvicorn` worker class

## Container timeout
If no custom Startup Command is used - `gunicorn` and a `sync` worker would be used. In this case, but also in a case that you try to call something like `python -m app.py` via Startup Command - **while also** `app.run()` is in `app.py` or your `.py` entrypoint, it will default to using `127.0.0.1` as the listening address if no arguments for `host` and `port` are passed to `run()`.

This will fail due to obvious reasons - since it cannot accept connections external to itself. You can see this in `default_docker.log`, which would look something like the below:

```
2024-07-16T18:23:01.134592423Z [2024-07-16 18:23:01 +0000] [72] [INFO] Starting gunicorn 22.0.0
2024-07-16T18:23:01.151912415Z [2024-07-16 18:23:01 +0000] [72] [INFO] Listening at: http://0.0.0.0:8000 (72)
2024-07-16T18:23:01.151941817Z [2024-07-16 18:23:01 +0000] [72] [INFO] Using worker: sync
2024-07-16T18:23:01.153595940Z [2024-07-16 18:23:01 +0000] [75] [INFO] Booting worker with pid: 75
2024-07-16T18:23:02.375037783Z [2024-07-16 18:23:02 +0000] [75] [INFO] Running on http://127.0.0.1:5000 (CTRL + C to quit)
```

Note the additional `Running on http://127.0.0.1:5000` message. By default, `run()` will listen on localhost and port will be `5000`. If you wanted to omit "external" `aSGI` server usage you can change `app.run()` to `app.run(host='0.0.0.0', port=8000`. However, it's recommended to use production grade aSGI servers. In both `hypercorn`, `gunicorn` and `uvicorn`, you can pass `--bind '0.0.0.0:8000'` to them to ensure the application is able to accept external connections

## Additional troubleshooting
For additional troubleshooting related to post-deployment errors, review the [Python](https://azureossd.github.io/python/) category on the Azure OSS Developer blog.

This includes topics like:
- [Configuring Gunicorn worker classes and other general settings](https://azureossd.github.io/2023/01/27/Configuring-Gunicorn-worker-classes-and-other-general-settings/index.html)
- [Troubleshooting Python deployments on App Service Linux](https://azureossd.github.io/2023/04/17/troubleshooting-python-deployments-on-appservice-linux/index.html)
- [https://azureossd.github.io/2022/11/24/Python-on-Linux-App-Service-and-ModuleNotFound-Errors/index.html](https://azureossd.github.io/2022/11/24/Python-on-Linux-App-Service-and-ModuleNotFound-Errors/index.html)
- and more