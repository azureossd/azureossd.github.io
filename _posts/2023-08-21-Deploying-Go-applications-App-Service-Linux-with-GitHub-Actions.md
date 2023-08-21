---
title: "Deploying Go applications to App Service Linux with GitHub Actions"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Configuration
    - Go
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Deployment # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/go.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-08-21 12:00:00
---

This post will cover deploying Go applications to Azure App Service Linux with Go "Blessed" images using GitHub Actions.

# Overview
**Note**: Go "Blessed Images" are currently marked as _experimental_ - these images and behavior on App Service are subject to change. This is also not recommended for production.


## Prerequisites
### Application Logs
**IMPORTANT:** Ensure that App Service Logs are enabled - review [this document on](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) how to do so.

This is important incase the application crashes due to misconfiguration of any of these profilers - given this is all at the application level, we need these logs enabled to see what may have gone wrong. You can view logging in a few ways:

- Diagnose and Solve Problems -> Application Logs
- Log Stream
- Directly through the Kudu site - such as the /newui endpoint (https://sitename.scm.azurewebsites.net/newui) or the normal Kudu site
- An FTP client to view logfiles under `/home/LogFiles`

### GitHub repository
To enable CI/CD with GitHub Actions, you must have a GitHub account and a GitHub repository for your source code created.

# Quickstart
Go "Blessed Images" expose port 8080 - which Go application HTTP servers should be listening on. For example:

```go
err := http.ListenAndServe(":8080", nil)
```

You can however change this with the `PORT` App Setting - the HTTP listening port in the application would need to be updated. 

If you wanted to listen for `PORT`, you could do the following:

```go
port := ":" + os.Getenv("PORT")
log.Fatal(app.Listen(port))
```

See: [Default exposed ports of Azure App Service Linux Blessed Images](https://azureossd.github.io/2023/03/24/Default-exposed-ports-of-Azure-App-Service-Linux-Blessed-Images/index.html)

For this example, we're going to be using the [Fiber](https://docs.gofiber.io/) example from here [azureossd - go-devops-examples](https://github.com/azureossd/go-devops-examples). You can bring your own code as well.

## Local development
We can quickly get started with a Go project using Fiber with the following:

1. Create a `main.go` file
2. Create a `go.mod` file by running `go mod init yourmodulename`
3. Install Fiber with `go get github.com/gofiber/fiber/v2`
4. In the `main.go` file, add the following:

```go
package main

import (
    "log"

    "github.com/gofiber/fiber/v2"
)

func main() {
    app := fiber.New()

    app.Get("/", func (c *fiber.Ctx) error {
        return c.SendString("Hello, World - From Fiber!")
    })

  log.Fatal(app.Listen(":8080"))
}
```

5. Run the application with `go run .`, you should now see the below in your terminal:

```bash
$ go run .

 ┌───────────────────────────────────────────────────┐
 │                   Fiber v2.48.0                   │
 │               http://127.0.0.1:8080               │
 │       (bound on host 0.0.0.0 and port 8080)       │
 │ Handlers ............. 2  Processes ........... 1 │
 │ Prefork ....... Disabled  PID ............. 24812 │
 └───────────────────────────────────────────────────┘
```

6. You should now be able to access the application over `localhost:8080`

## Create an App Service
Follow this documentation on creating a Go 1.19 App Service on Linux - [Deploy a Go web app to Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/quickstart-golang)

## Enable GitHub Actions (Manual creation)
### Deploy with a Publish Profile
You can deploy to App Service Linux by using a [Publish Profile](https://learn.microsoft.com/en-us/azure/app-service/deploy-configure-credentials?tabs=cli)

1. Go to the Azure Portal for your application and navigate to **Deployment Center**. Download the Publish Profile by selecting "Manage publish profile" and then "Download publish profile". 

![Download publish profile](/media/2023/08/go-ghactions-1.png)

2. Go to the GitHub repository being used for this code and select **Settings** -> **Actions** -> **Secrets and Variables**.
3. Click on **New Repository Secret** - add a variable named `AZUREAPPSERVICE_PUBLISHPROFILE`

![Repository secret](/media/2023/08/go-ghactions-2.png)

4. Copy the entire contents within the Publish Profile `.xml` tha was downloaded and add it as the value to the `AZUREAPPSERVICE_PUBLISHPROFILE` secret on the GitHub side.

5. Next, on the **GitHub side** - under **Actions** - select **New Workflow**.

> **NOTE**: If desired, you can instead manually create a path of `.github/workflows/somework.yaml` in the root of your project - this will kick off a workflow run when commited to your repository

6. Add the following file to your new workflow - replace the App Service name where needed:

```yaml
name: Go

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Set up Go
      uses: actions/setup-go@v3
      with:
        # Change your go version as needed
        go-version: 1.19

    - name: Build
      run: go build -v ./...

    - name: Upload artifact for deployment jobs
      uses: actions/upload-artifact@v2
      with:
        name: go-app
        path: |
          .
          
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
          name: go-app
          path: .

      - name: 'Deploy to Azure Web App'
        uses: azure/webapps-deploy@v2
        id: deploy-to-webapp
        with:
          app-name: 'yourapp'
          slot-name: 'Production'
          publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE }}
```

What does the above file do?:
- It runs `go build` to build the binary
- It uses `actions/upload-artifact@v2` to upload the binary to the "deploy" stage
- It downloads the `actions/download-artifact@v2` binary with the alias "go-app"
- It then deploys the binary to the App Service

### Deploy with a Service Principal
1. Generate a Service Principal by following the documentation here - [Generate deployment credentials](https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=userlevel#generate-deployment-credentials). Save the JSON output for the next step.

2. Following the section above on how to add GitHub Action Secrets, add a secret named `AZURE_CREDENTIALS` with the output from the credential creation in step 1.


3. Use the following `.yaml`, below is a complete example - the only major change we do in this one is to remove the `publish-profile` property from the `azure/webapps-deploy@v2` task and add the `azure/login@v1` task as a replacement for authentication.

```yaml
name: Go

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Set up Go
      uses: actions/setup-go@v3
      with:
        # Change your go version as needed
        go-version: 1.19

    - name: Build
      run: go build -v ./...

    - name: Upload artifact for deployment jobs
      uses: actions/upload-artifact@v2
      with:
        name: go-app
        path: |
          .
          
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
          name: go-app
          path: .

      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: 'Deploy to Azure Web App'
        uses: azure/webapps-deploy@v2
        id: deploy-to-webapp
        with:
          app-name: 'some-app'
          slot-name: 'Production'

      - name: logout
        run: |
          az logout
```

## Enable GitHub Actions (Azure Portal)
At this current time while in _expiremental_ status, using the Azure Portal to set up GitHub Actions and commit a workflow file does not work for Go "Blessed" images. It will not create a GitHub Actions workflow (thus not committing to it the repository to kick off a workflow run).

## Important notes
In the go build section, we don’t specify anything like `-o`, for any named execuable output.

This is because, at the current time, `SCM_DO_BUILD_DURING_DEPLOYMENT` is not honored on Go “Blessed” images. oryxBuilder will always be the builder used.

The executable is built by Oryx - and named `oryxBuildBinary` and placed in `/home/site/wwwroot`.