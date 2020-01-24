---
title: "Using Gulp in Node.js Azure WebApps"
tags:
  - azure
  - gulp
  - nodejs
  - webapp
categories:
  - Azure App Service on Windows
  - Nodejs
  - How-To
date: 2015-10-22 11:28:00
author_name: Prashanth Madi
---

**Gulp** is a toolkit that will help you automate painful or time-consuming tasks in your development workflow. 

Most of the web apps involve below steps before moving web app to production/build process.

*   Compressing new or modified images
*   Concatenate and minify CSS/JS files

you can automate pre-processing steps like above using gulp. 

-   We already have a gulp installed on azure web apps, available @ ‘’D:\\Program Files (x86)\\gulp” but the number of plugins could be very limited in them 

**Using custom version of gulp** 

\- Make sure you have gulp listed in package.json file (dependencies). Sample file below(_devDependencies won’t get installed as its production deployment / you may have to use customer deployment script with production flag for npm install_) 

[![](/media/2019/03/1055.gulp1.jpg)](/media/2019/03/1055.gulp1.jpg) 

\- This would create a gulp folder in node_modules   

[![](/media/2019/03/2350.gulp2.jpg)](/media/2019/03/2350.gulp2.jpg) 

**Automate Gulp build Using Source Control Deployment :**

 Azure Source Control deployment process would involve below steps 
 
 1) Moves content to azure web app 
 
 2) Creates default deployment script, if there isn’t one(deploy.cmd, .deployment files) in web app root folder 
 
 3) Run’s deployment script where it install’s npm modules At Step 2, Instead of deployment process creating a default script. We can include custom deployment script and change it's content to use gulp build.  Below steps would help you generate custom deployment script : 
 
 \- Install the azure-cli tool, it'll also give you some cool features on managing azure related resources directly from the command-line:

           npm install azure-cli -g

\- Go to the root of your repository (from which you deploy your site)

\- Run the custom deployment script generator command:

          azure site deploymentscript --node

\- Above command will generate the files required to deploy your site, mainly: 


` .deployment - Contains the command to run for deploying your site. deploy.cmd - Contains the deployment script.` 

[![](/media/2019/03/8838.custom_deployment.jpg)](/media/2019/03/8838.custom_deployment.jpg) -   

In deploy.cmd file include below lines of code after installing npm packages (after line 107)

        IF EXIST "Gulpfile.js" (
        pushd "%DEPLOYMENT_TARGET%"
        call .\node_modules\.bin\gulp imagemin
        IF !ERRORLEVEL! NEQ 0 goto error
        popd
        
        )

Sample Screenshot 

[![](/media/2019/03/3326.gulp3.jpg)](/media/2019/03/3326.gulp3.jpg) 

In my sample app I was minifying few images, here is my output after deployment 

[![](/media/2019/03/5710.gulp4.jpg)](/media/2019/03/5710.gulp4.jpg)