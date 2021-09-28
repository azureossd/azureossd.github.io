---
title: "Deploying React.js application to Azure App Service with Azure DevOps"
author_name: "Susanna Are"
tags:
    - react
    - azure devops
    - app service linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Deployment # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: false
toc_sticky: true
date: 2021-09-21 12:00:00
---

Steps to publish your React Single Page Application into Azure App Service using Azure DevOps

## Intro

This blog would help setting up your Azure DevOps project creation, repository management, configuring the build and release pipeline, and CI/CD enablement.

## Steps

Let’s get started by creating a new React project using the CLI (command line interface), you can navigate to a directory of your choice and run the following command:

`npx create-react-app az-demo`

![create command](/media/2021/09/react_devops_demo1.png)

Once the project gets created, let’s navigate to the project (cd az-demo) from the command line and open it with Visual Studio Code

`code .`

![vscode command](/media/2021/09/react_devops_demo2.png)

The structure of your project should look something like this:

![project structure](/media/2021/09/react_devops_demo3.png)

There is a starter script inside our package.json which will build and run our application. From the command line run the following command:

`npm start`

![npm command](/media/2021/09/react_devops_demo4.png)

Open your browser and access the application via localhost:3000

![localhost](/media/2021/09/react_devops_demo5.png)

Let’s open the App.js file and then modify Devops Demo like below and finally save to reload

![edit app.js](/media/2021/09/react_devops_demo6.png)

Run npm start and then you should see that the application is running

![app run](/media/2021/09/react_devops_demo7.png)

Reload the browser and access the application again to view the modified content via localhost:3000

![localhost:3000](/media/2021/09/react_devops_demo8.png)

Navigate to <a href="https://dev.azure.com/">https://dev.azure.com/</a> and create a new project in your Azure DevOps organization. I’ve named it “React Demo”.

![azure devops project](/media/2021/09/react_devops_demo9.png)

Click on the repo’s tab to navigate to the repo. Once there let’s use the link provided to push our react project.

![Repo](/media/2021/09/react_devops_demo10.png)

## Navigate to pipeline

Let’s click on “create a pipeline” and choose “use the classic editor” 

![classic editor](/media/2021/09/react_devops_demo11.png)

Select the Azure Repos Git option and then click on continue

![Azure Repos Git](/media/2021/09/react_devops_demo12.png)

Select start with an “empty job” option

![Empty Job](/media/2021/09/react_devops_demo13.png)

Click on the Agent job 1 and let’s add two npm tasks and one publish artifacts task.

![Agent Job](/media/2021/09/react_devops_demo14.png)

## Create all the required tasks and then Save each task added to the pipeline

a. npm install: This will install all the react library (dependencies) 

We can leave the npm install task as it is

![npm install](/media/2021/09/react_devops_demo15.png)

b. npm run build: This will create a build folder that we will then use to publish our application.

Let’s rename the second task to “npm build”. Under command choose “custom” from the dropdown and enter “run build” under “Command and arguments”.

![npm run build](/media/2021/09/react_devops_demo16.png)

c.	Publish Artifact: Click on the publish task 

![publish artifact](/media/2021/09/react_devops_demo17.png)

Set the “Path to publish” to build, so that our release pipeline will have access to the generated build.

![path to publish](/media/2021/09/react_devops_demo18.png)

Click on the Run pipeline option. This should create a build archive at the end. Next let’s Save and Run to test it out.

![Run pipeline](/media/2021/09/react_devops_demo19.png)

You should now see the newly created pipeline and its status as queued to be run.

![queue to be run](/media/2021/09/react_devops_demo20.png)

Now that the build pipeline has succeeded, we should be able to see the published artifact.

![build succeeded](/media/2021/09/react_devops_demo21.png)

Click on Edit pipeline option

![edit pipeline](/media/2021/09/react_devops_demo22.png)

Let’s enable Continuous Integration for this pipeline. 

![enable CI](/media/2021/09/react_devops_demo23.png)

And then click on Save & queue

![save and queue](/media/2021/09/react_devops_demo24.png)

I have also created an app service ReactDeleteDemo

![app service](/media/2021/09/react_devops_demo25.png)

Navigate back to your Azure DevOps Pipelines and create a new Release

![release](/media/2021/09/react_devops_demo26.png)

Select the “Azure App Service Deployment” template

![Deploy task](/media/2021/09/react_devops_demo27.png)

You can then give your stage a name. I’ve named mine as “Dev”.

![stage Dev](/media/2021/09/react_devops_demo28.png)

Let’s click on “Add an artifact”. Then choose your pipeline and the artifact that was generated when you ran the pipeline. Once you select the artifact, click the “Add” button

![Add an artifact](/media/2021/09/react_devops_demo29.png)

Double-check to see if CI/CD is enabled properly. 

![CI/CD](/media/2021/09/react_devops_demo30.png)

Now, click on the “1 job, 1 task” option under your stage and select the “Azure App Service Deploy” task

![release](/media/2021/09/react_devops_demo31.png)

Select the appropriate Azure Subscription, Resource Group, App Service Name and required startup commands.

![deploy task](/media/2021/09/react_devops_demo32.jpg)

You could also add any App Settings as required

![app setting](/media/2021/09/react_devops_demo33.png)

Go ahead and create a release from the pipeline created. If you visit the Azure WebApp URL, you should now see your website!!

![web app](/media/2021/09/react_devops_demo34.png)

## Test CI/CD by changing the code

Modify your source code by adding some more text and run npm start

![source snippet](/media/2021/09/react_devops_demo35.png)

Verify the results on your local browser

![localhost](/media/2021/09/react_devops_demo36.png)

To commit the changes to the repository, please run the below commands 

`git add .`

`git status`

`git commit -m “second commit”`

![git commit](/media/2021/09/react_devops_demo37.png)

 `git push -u origin –all` 

The last command will push the source code to the repository 

![git push](/media/2021/09/react_devops_demo38.png)

Upon the push to the repository, we should see the CI/CD has triggered

![trigger CI/CD](/media/2021/09/react_devops_demo39.png)

We should then see that the Build pipeline has succeeded

![build success](/media/2021/09/react_devops_demo40.png)

The release pipeline should automatically be triggered.

![release pipeline](/media/2021/09/react_devops_demo41.png)

The deployment should complete successfully like below

![deployment success](/media/2021/09/react_devops_demo42.png)

Happy Learning!!