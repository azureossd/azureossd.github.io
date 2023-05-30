---
title: "Deploying War Files On Windows App Services with GithubActions"
author_name: "Keegan D'Souza"
tags:
    - Java
    - Deployments
    - Windows
categories:
    - Azure App Service on Windows # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Java # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/javawindows.jpg" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-05-30 12:00:00
---

This blog will go over how to deploy your .war file to a Windows App Service using Github Actions. 

# How To
This blog will use a spring-boot application created using spring initializer. 

## Validate and test the application locally.
This section is optional if your team as an already existing project.
If your team already has your application, you can skip to the [deployment section](#configure-deployment-from-github-actions).

1. Navigate to spring initializer and generate your project.
For this project we will use the following parameters.

    - Java Version: 17
    - Spring-Boot: 3.1.0
    - Project Management: Maven
    - Packing: WAR
    - Dependencies: Spring Web

    ![Spring Initializer](/media/2023/05/windows-java-war-github-actions-1.png){: width="60%" height="60%"}

2. Add a Hello World Controller to display a 200 response. This file will be created under **demo\src\main\java\com\example\demo\HelloController.java**

    ~~~
    package com.example.demo;

    import org.springframework.web.bind.annotation.GetMapping;
    import org.springframework.web.bind.annotation.RestController;

    @RestController
    public class HelloController {

        @GetMapping("/")
        public String index() {
            return "Greetings from Spring Boot!";
        }

    }
    ~~~

    **Note** this step is optional, however when testing you will receive a 404 response from spring boot if you do not add this. 
    
    This hello world controller above is built from a reference of the below spring tutorial.
    [Building an Application with Spring Boot](https://spring.io/guides/gs/spring-boot/)

3. Test your application runs successfully by running the below command and navigating to ***http://localhost:8080***. 

    ~~~ 
    mvn spring-boot:run
    ~~~

    ![Application running locally](/media/2023/05/windows-java-war-github-actions-2.png){: width="50%" height="50%"}


    Additionally your team can download [apache tomcat](https://tomcat.apache.org/download-10.cgi) on your local machine and validate the application functions successfully running as a .war file. Below are some ***open source*** tutorials on how to accomplish this.
    - [Apache Docs](https://tomcat.apache.org/tomcat-8.5-doc/setup.html)
    - [Phoenixnap - How to Install Apache Tomcat on Windows](https://phoenixnap.com/kb/install-tomcat-windows)
    - [Geeks for geeks - How to Install Apache Tomcat on Windows?](https://www.geeksforgeeks.org/how-to-install-apache-tomcat-on-windows/)



4. Initialize and push the project to your Github Repo.

    ![GitHub Push](/media/2023/05/windows-java-war-github-actions-8.png){: width="80%" height="80%"}


    This blog will not cover in depth on how to do this, but below is a tutorials on how to accomplish this from Github.
 
    [Adding locally hosted code to GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)

    Here is the link to my github repo I am using: [kedsouza/java-appsvc-windows-github](https://github.com/kedsouza/java-appsvc-windows-github-actions-war)
  
## Configure deployment from Github Actions. 

1. Configure your Windows App Service to use the desired Java and Tomcat Version. These settings can be found under ***Configuration -> General Settings*** 

    ![Windows App Service Settings](/media/2023/05/windows-java-war-github-actions-3.png){: width="60%" height="60%"}


2. Set up your Deployment From Github Actions.

    ![Windows App Service Settings](/media/2023/05/windows-java-war-github-actions-4.png){: width="60%" height="60%"}

    This will automatically create a workflow file for you.


3. If you would like your tomcat application to listen on the '/' endpoint of your app service. Your .war file will have to be named **ROOT.war**.

    By default the Github Actions pipeline will not do this. By default after deployment your application the file system as shown from the [Kudu (Advanced Tools)](https://learn.microsoft.com/en-us/azure/app-service/resources-kudu) Site will look similar to below.

    ![Windows Kudu (Advanced Tools) Settings](/media/2023/05/windows-java-war-github-actions-5.png){: width="50%" height="50%"}

    And you will only be able to access your project with the following url scheme.
    ***https://{your-app-service-name}/{war name}***
    ![Windows App Service Default Behavior](/media/2023/05/windows-java-war-github-actions-6.png){: width="50%" height="50%"}

4. Modify your github-actions.yml file to include the following command to rename the file. This will be under the Deploy Stage.

    ~~~yml
    deploy:
        runs-on: windows-latest
        needs: build
        environment:
            name: 'Production'
            url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}
        
        steps:
            - name: Download artifact from build job
                uses: actions/download-artifact@v2
                with:
                name: java-app

            # ---- Added Task ---- #
            - name: Rename .War file
                run: move *.war ROOT.war

            - name: Deploy to Azure Web 
                id: deploy-to-webapp
                uses: azure/webapps-deploy@v2
                with:
                app-name: 'kedsouza-tomcat'
                slot-name: 'Production'
                publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_748BFF83F97745528F6D14E9E4AFCB70 }}
                package: '*.war'
    ~~~

    This command will rename your .war file to ROOT.war.

5. After you save your changes, and the github action redeploys you should now see your application responding on the '/' endpoint.

    ![Windows App Service Root Behavior](/media/2023/05/windows-java-war-github-actions-7.png){: width="50%" height="50%"}



