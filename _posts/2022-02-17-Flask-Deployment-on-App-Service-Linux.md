---
title: "Flask Deployment on App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Python
    - Flask
    - Deploy
    - Azure DevOps
    - GitHub Actions
categories:
    - Azure App Service on Linux
    - Python
    - Deployment 
    - Troubleshooting
header:
    teaser: /assets/images/flask-logo.png
toc: true
toc_sticky: true
date: 2022-02-17 12:00:00
---

This section provides information for creating, configuring, and deploying a Flask application on App Service Linux. 

# Local Development 

## Set up your virtual environment.

1. For these examples we'll be using a basic Flask application to get started. Start by creating a folder for your application and `cd` into it to create and activate your virtual environment. You can review the official documentation for this [here](https://docs.python.org/3/library/venv.html). You can also follow this Flask documentation for [installation and virtual environment creation](https://flask.palletsprojects.com/en/1.1.x/installation/#virtual-environments). For example:

    `mkdir azure-python-flask`

    `cd azure-python-flask`

2. With our folder now created (or if you're using an existing one), we'll create our virtual environment below:
    
    `python -m venv .venv` 
    > **NOTE**: .venv in the name of our virtual environment, this can be changed to any arbitrary name

3. We can now activate our virtual environment using the below:
    
    `source .venv/Scripts/activate` (Bash, *NIX)
    
    `.\.venv\Scripts\activate` (Windows)

    You should now see your virtual environment name activated in your terminal.

    ![Flask App](/media/2022/02/flask-deployment-linux-01.png)

4. Next, lets create our `app.py` and `requirements.txt` files.

    In our `app.py` file add the following content. You can review [this](https://flask.palletsprojects.com/en/1.1.x/quickstart/#a-minimal-application) for another example:

    ```
      from flask import Flask
      app = Flask(__name__)

      @app.route('/')
      def hello_world():
          return 'Hello, World!'
    ```

    In our `requirements.txt` add the following line:

    ```
    Flask
    ``` 
    > **NOTE**: For the sake of this quickstart, no specific version is pinned. For production scenarios it's highly recommended to pin your dependencies to a specific version.

    Lastly, run `pip install -r requirements.txt` 

4. Run the application and browse the site.

    Run the following commands in your terminal to start Flask in development mode

    `export FLASK_ENV=development` (Bash, *NIX)

    `set FLASK_ENV=development` (Windows)

    `flask run`


    ![Flask App](/media/2022/02/flask-deployment-linux-02.png)

5. You should now be able to browse the site by either going to `localhost:5000` or `127.0.0.1:5000`.


# Deployment Options
There are multiple deployment options in Python on App Service Linux such as Continuous Deployment(GitHub Actions, DevOps pipelines), External Git, Local Git, [ZipDeploy with Oryx Builder](https://docs.microsoft.com/en-us/azure/app-service/deploy-zip?tabs=cli#enable-build-automation-for-zip-deploy), etc. We'll be covering 3 of these methods below.

>**NOTE**: For Python on App Service Linux you should **not** use methods like FTP or ZipDeploy (without the use of Oryx) to avoid improper deployment since the Python environment will not be built, thus causing errors like `ModuleNotFound` or others - since `pip install` is not ran in these scenarios. You **do** want to use deployment methods like Local Git, ZipDeploy (with Oryx builder, see above), or pipelines like DevOps or Github Actions since these will all correctly create and activate the virtual environment, and install dependencies as required.

## Local Git 
When using Local Git, you are using `App Service Build Service` also named as ([Oryx](https://github.com/microsoft/Oryx/blob/main/doc/hosts/appservice.md)) to build your application.

To setup this option and deploy a Flask application follow the below:
> **NOTE**: Deploying from Local Git will likely prompt you for your Git credentials for the Azure Application. You can find it under the FTPS Credentials tab in the screenshot below. 


1. Navigate to your Web App and select `Deployment Center` and then click on `Local Git` and then click on `Save`.

    ![Flask App](/media/2022/02/flask-deployment-linux-03.png)
2. Copy the remote git repository from Azure Portal.

    ![Flask App](/media/2022/02/flask-deployment-linux-04.png)
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
Enumerating objects: 3, done.
Counting objects: 100% (3/3), done.
Delta compression using up to 8 threads
Compressing objects: 100% (2/2), done.
Writing objects: 100% (2/2), 229 bytes | 114.00 KiB/s, done.
Total 2 (delta 1), reused 0 (delta 0), pack-reused 0
remote: Deploy Async
remote: Updating branch 'master'.
remote: Updating submodules.
remote: Preparing deployment for commit id '9ded84500f'.
remote: Repository path is /home/site/repository
remote: Running oryx build...
remote: .
remote: Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
remote: You can report issues at https://github.com/Microsoft/Oryx/issues
remote: 
remote: Oryx Version: 0.2.20210826.1, Commit: f8651349d0c78259bb199593b526450568c2f94a, ReleaseTagName: 20210826.1
remote: 
remote: Build Operation ID: |ojQQh8g01yo=.a74f483f_
remote: Repository Commit : 9ded84500f41e81678987248e693afa167dfcea0
remote: 
remote: Detecting platforms...
remote: ....
remote: Detected following platforms:
remote:   python: 3.9.7
remote: Version '3.9.7' of platform 'python' is not installed. Generating script to install it...
remote: 
remote: Using intermediate directory '/tmp/8d9f19d16bb16a6'.
remote: 
remote: Copying files to the intermediate directory...
remote: ........
remote: Done in 12 sec(s).
remote: 
remote: Source directory     : /tmp/8d9f19d16bb16a6
remote: Destination directory: /home/site/wwwroot
remote: 
remote: 
remote: Downloading and extracting 'python' version '3.9.7' to '/tmp/oryx/platforms/python/3.9.7'...
remote: Downloaded in 4 sec(s).
remote: Verifying checksum...
remote: Extracting contents...
remote: ..................
remote: Done in 27 sec(s).
remote: 
remote: Python Version: /tmp/oryx/platforms/python/3.9.7/bin/python3.9
remote: Creating directory for command manifest file if it doesnot exist
remote: Removing existing manifest file
remote: Python Virtual Environment: antenv
remote: Creating virtual environment...
remote: ..................
remote: Activating virtual environment...
remote: Running pip install...
remote: [22:40:09+0000] Collecting Flask
remote: [22:40:09+0000]   Downloading Flask-2.0.3-py3-none-any.whl (95 kB)
remote: [22:40:09+0000] Collecting click>=7.1.2
remote: [22:40:09+0000]   Downloading click-8.0.3-py3-none-any.whl (97 kB)
remote: [22:40:09+0000] Collecting Jinja2>=3.0
remote: [22:40:10+0000]   Downloading Jinja2-3.0.3-py3-none-any.whl (133 kB)
remote: [22:40:10+0000] Collecting itsdangerous>=2.0
remote: [22:40:10+0000]   Downloading itsdangerous-2.0.1-py3-none-any.whl (18 kB)
remote: [22:40:11+0000] Collecting Werkzeug>=2.0
remote: [22:40:11+0000]   Downloading Werkzeug-2.0.3-py3-none-any.whl (289 kB)
remote: [22:40:13+0000] Collecting MarkupSafe>=2.0
remote: [22:40:13+0000]   Downloading MarkupSafe-2.0.1-cp39-cp39-manylinux_2_5_x86_64.manylinux1_x86_64.manylinux_2_12_x86_64.manylinux2010_x86_64.whl (30 kB)
remote: [22:40:14+0000] Installing collected packages: MarkupSafe, Werkzeug, Jinja2, itsdangerous, click, Flask
remote: [22:40:17+0000] Successfully installed Flask-2.0.3 Jinja2-3.0.3 MarkupSafe-2.0.1 Werkzeug-2.0.3 click-8.0.3 itsdangerous-2.0.1
remote: WARNING: You are using pip version 21.2.3; however, version 22.0.3 is available.
remote: You should consider upgrading via the '/tmp/8d9f19d16bb16a6/antenv/bin/python -m pip install --upgrade pip' command.
remote: Not a vso image, so not writing build commands
remote: Preparing output...
remote: 
remote: Copying files to destination directory '/tmp/_preCompressedDestinationDir'...
remote: Done in 4 sec(s).
remote: Compressing content of directory '/tmp/_preCompressedDestinationDir'...
remote: ..
remote: Copied the compressed output to '/home/site/wwwroot'
remote: 
remote: Removing existing manifest file
remote: Creating a manifest file...
remote: Manifest file created.
remote: 
remote: Done in 89 sec(s).
remote: Running post deployment command(s)...
remote: Triggering recycle (preview mode disabled).
remote: Deployment successful.
```
5. Since our entrypoint Python file is named `app.py`, and also contains our WSGI callable named `app` - we do not need to specify a startup command. As [documented here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#run), if our repo root contains `app.py`, `application.py`, `index.py` or `server.py` - with a class callable named `app` in those files - it will run the following [Gunicorn](https://gunicorn.org/) command by default:

  >**NOTE**: Gunicorn is the default WSGI server used to run Python applications on Azure App Service unless otherwise specified. See this [documentation](https://docs.microsoft.com/en-us/azure/app-service/configure-language-python#container-characteristics) as well.


  `gunicorn app:app`

  `GUNICORN_CMD_ARGS="--timeout 600 --access-logfile '-' --error-logfile '-' --chdir=/tmp/<this_will_be_a_random_value"`


  ```
  2022-02-16T22:49:43.687798191Z Detected an app based on Flask
  2022-02-16T22:49:43.689750804Z Generating `gunicorn` command for 'app:app'
  2022-02-16T22:49:44.357049367Z Writing output script to '/opt/startup/startup.sh'
  2022-02-16T22:49:45.255881860Z Using packages from virtual environment antenv located at /tmp/8d9f19d16bb16a6/antenv.
  2022-02-16T22:49:45.257413971Z Updated PYTHONPATH to ':/tmp/8d9f19d16bb16a6/antenv/lib/python3.9/site-packages'
  2022-02-16T22:49:47.348018407Z [2022-02-16 22:49:47 +0000] [36] [INFO] Starting gunicorn 20.1.0
  2022-02-16T22:49:47.355447559Z [2022-02-16 22:49:47 +0000] [36] [INFO] Listening at: http://0.0.0.0:8000 (36)
  2022-02-16T22:49:47.357759475Z [2022-02-16 22:49:47 +0000] [36] [INFO] Using worker: sync
  2022-02-16T22:49:47.366833639Z [2022-02-16 22:49:47 +0000] [37] [INFO] Booting worker with pid: 37
  ```

  6. You should now be able to browse the deployed application.

## GitHub Actions

You can quickly get started with GitHub Actions by using the App Service Deployment Center. This will automatically generate a workflow file based on your application stack and commit it to your GitHub repository in the correct directory. You can deploy a workflow manually using deployment credentials. 

![Flask App](/media/2022/02/vue-deployment-linux-05.png)

> **NOTE**: If you have numerous repositories that appear in the dropdown, you can search by typing within the text field/dropdown.

You can find more details about these steps documented here:
 - [Use the Deployment Center](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#use-the-deployment-center)
 - [Set up a workflow manually](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel#set-up-a-workflow-manually)


Below is the yaml file generated after setting up Github Actions

{% raw %}
```yaml
name: Build and deploy Python app to Azure Web App - yoursitenamehere

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
        
      # Optional: Add step to run tests here (PyTest, Django test suites, etc.)
      - name: Zip artifact for deployment
        run: zip release.zip ./* -r

      - name: Upload artifact for deployment jobs
        uses: actions/upload-artifact@v2
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
        uses: actions/download-artifact@v2
        with:
          name: python-app
          path: .

      - name: Unzip artifact for deployment
        run: unzip release.zip
          
      - name: 'Deploy to Azure Web App'
        uses: azure/webapps-deploy@v2
        id: deploy-to-webapp
        with:
          app-name: 'yoursitenamehere'
          slot-name: 'Production'
          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_000000000000000000000000000 }}
```
{% endraw %}

If desired, you can pass in a specific `package` name in the `azure/webapps-deploy@v2` task:

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
    app-name: 'ansalemo-fast-api'
    slot-name: 'Production'

- name: logout
  run: |
    az logout
```
{% endraw %}

Below is the output we'd see in the 'Actions' tab on Github after setting up Actions and pushing a new commit to trigger a deployment.

![Flask App](/media/2022/02/flask-deployment-linux-05.png)

> **NOTE**: This default `.yaml` assumes we would have `app.py` (or the other `.py` files listed above) in the root of our repo - following a typical Flask folder structure. 


## Azure DevOps
You can use Azure Pipelines to build your Flask application. For Flask apps, you can still use your typical `pip` and `python` based commands. You can review more details here: [YAML Pipeline explained](https://docs.microsoft.com/en-us/azure/devops/pipelines/ecosystems/python-webapp?view=azure-devops#yaml-pipeline-explained).

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
              startUpCommand: 'gunicorn --bind 0.0.0.0:8000 --timeout 600 app:app'
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
              # startUpCommand: 'gunicorn --bind 0.0.0.0:8000 --timeout 600 app:app' // This is optional unless needing to be added for any specific reason
```
> **NOTE**: Depending on how you set up your pipeline, you may have to authorize permission for deployment. This is a one-time task, below is a screenshot of what you may see:

![Flask App](/media/2022/02/vue-deployment-linux-07.png)

![Flask App](/media/2022/02/flask-deployment-linux-06.png)


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
      parentfolder/
        myproject/
          app.py
          requirements.txt
          .gitignore
    ```

    > **NOTE**: This may also manifest as by showing the default Azure App Service 'splash'/welcome page and the following message in logging: `No framework detected; using default app from /opt/defaultsite`


## Failed to find attribute 'app' in 'app'

**Scenario**: You may see `Failed to find attribute 'app' in 'app'` if your WSGI callable in your main `.py` file is not named `app`. For example: 

    `flaskapp = Flask(__name__)`


  - **Resolution**: As mentioned above, [Oryx looks for a WSGI callable named `app`](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#run) for Flask and other WSGI based application. If you decide to name your WSGI callable something not named `app`, you will need to change your startup command to target this appropriately. The example below assumes you have a file named `app.py` with a WSGI callable named `flaskapp` inside of it:

    `gunicorn --bind 0.0.0.0:8000 --timeout 600 app:flaskapp`

## Error: Couldn't detect a version for the platform 'python' in the repo.
This would happen during the deployment phase on either Github Actions or Azure Devops. Ensure the following:
- The project structure matches is defined [here](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md#detect)
- If using a .zip (such as in GitHub Actions), ensure the zip if unzipped first (if not using the `package` property) - or - if using the `package` property, pass the correct zip name with the appropriate project structure


## Github Actions

A normal deployment doesn't need to take more than 5-15 mins. If the workflow is taking more than that then you might need to review current implementation. Here is a list of things to check:

- **Running tests**. There are scenarios where GitHub Actions Agent takes more than 360 minutes (6 hrs) to give you a status and fails with: **`The job running on runner Hosted Agent has exceeded the maximum execution time of 360 minutes.`**. Review if any tests are taking an extended amount of time - if these are not needed it would be recommended to remove these.

- **Too many files and slow deployments**. Using `actions/upload-artifact@v2` you can share files between jobs, such as `build` and `deploy`. Sometime it will trigger the following warning `There are over 10,000 files in this artifact, consider creating an archive before upload to improve the upload performance.` - if you have a large project and/or many dependencies. This may cause your deployment to take an extended amount of time. To overcome this you zip your content between jobs to improve deployment time. 

    ![Flask App](/media/2022/02/vue-deployment-linux-09.png)

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

        ![Flask App](/media/2022/02/flask-deployment-linux-07.png)




