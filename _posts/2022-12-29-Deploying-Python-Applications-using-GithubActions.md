---
title: "Deploying Python Applications using Github Actions"
author_name: "Keegan D'Souza"
tags:
    - Python
    - App Service
    - Github Actions
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Python # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/pylinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2022-12-29 00:00:00
---

## In this blog post we will cover Github Actions Deployment to a Python App Service.


By default when you configure your workflow file using the Deployment Center the build happens still happens using the [app service build system (oryx)](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/python.md).

The goal of this blog, is to demonstration how to switch the build process to only occur on Github Actions.

You can follow along by forking the following Azure Sample Repository:
[Azure-Samples/python-docs-hello-world(A simple python application for docs (github.com)](https://github.com/Azure-Samples/python-docs-hello-world)

## Set Up Initial Deployment:

1. Sync your Github Repository to the app service deployment center.

    ![Deployment Center](/media/2022/12/azure-blog-python-github-actions-2.png)


    After doing so you will see the app service will have the below app setting enabled automatically.
    ```
    SCM_DO_BUILD_DURING_DEPLOYMENT = 1
    ```
    This will enable the app service build system oryx, however for the purpose of this article we would like to **disable** this as we want the build to only occur on Github Actions.

2. Disable the oryx build system by changing this to 0 or false and save your changes.
     ```
    SCM_DO_BUILD_DURING_DEPLOYMENT = 0
    ```

    ![App Settings](/media/2022/12/azure-blog-python-github-actions-1.png)



## Modify Workflow file

1. Navigate to your Github Actions Repository and open your generated github actions .yml file. It will be located under *.github/workflows/{branch_name}_{app service name}.yml.*

2. Modify the following sections in your workflow file.
    
    Rename the virtual environment to *antenv*
    
    Before:
    ```yaml
    - name: Create and start virtual environment
        run: |
          python -m venv venv
          source venv/bin/activate
    ```
    
    After: 
    ```yaml
    - name: Create and start virtual environment
        run: |
          python -m venv antenv
          source antenv/bin/activate
    ```
    <details>
        <summary>Explanation</summary>
        Currently the default value of the virtual environment the app service looks for is named antenv, we can view this by navigating to the app service startup script under /opt/startup/startup.sh
        <pre>
        
        echo 'export VIRTUALENVIRONMENT_PATH="/home/site/wwwroot/antenv"' >> ~/.bashrc
        echo '. antenv/bin/activate' >> ~/.bashrc
        PYTHON_VERSION=$(python -c "import sys; print(str(sys.version_info.major) + '.' + str(sys.version_info.minor))")
        echo Using packages from virtual environment 'antenv' located at '/home/site/wwwroot/antenv'.
        export PYTHONPATH=$PYTHONPATH:"/home/site/wwwroot/antenv/lib/python$PYTHON_VERSION/site-packages"
        echo "Updated PYTHONPATH to '$PYTHONPATH'"

	    </pre>


    </details>

    Include the virtual environment in the archive.

    Before:
    ```yaml
    - name: Upload artifact for deployment jobs
        uses: actions/upload-artifact@v2
        with:
          name: python-app
          path: |
            . 
            !venv/
    ```
    After: 
    ```yaml
    - name: Upload artifact for deployment jobs
        uses: actions/upload-artifact@v2
        with:
          name: python-app
          path: .
    ```
    <details>
    <summary>Explanation</summary>
    Since the build is not occuring on the app service side we need to include the created virtual enviornment in the .zip archive.
    
    Previously this was being exculding and the virtual environment was being built by the app service build system again.

    You can validate that your virtual environment is included inside the article by downloading it and extracting the content to see if the virtual environment was included.

    https://docs.github.com/en/actions/managing-workflow-runs/downloading-workflow-artifacts
    
    https://github.com/actions/upload-artifact

    </details>

## Commit your changes and test.

1. Commit your changes and monitor your deployment.
2. Your app service should be able to startup successfully using the virtual environment created on Github Actions. 

    ![App Settings](/media/2022/12/azure-blog-python-github-actions-3.png)

    Depending on your project structure you may need to modify your startup command. 
    
    More information here: [Configure a Linux Python app for Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-language-python#customize-startup-command )


   
## Reasoning
- Simplifies the deployment process by removing the app service oryx build process. By default the pip install is running twice, once on Github Actions and once during the oryx build process.
- Allows users to take of Advantage of Github Actions Features, such as a build cache to possibly improve deployment times.

    More information here: [Caching dependencies to speed up workflows](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)


