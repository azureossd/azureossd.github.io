---
title: " Run NPM, Bower, Composer, Gulp & Grunt In Azure App Services During Deployment"
tags:
  - bower
  - composer
  - deployment
  - grunt
  - gulp
  - nodejs
  - npm
categories:
  - Azure App Service on Windows
  - Nodejs
  - Deployment
date: 2016-08-12 09:44:39
author_name: Prashanth Madi
toc: true
toc_sticky: true
---

Azure Source Control deployment process would involve below steps

1.  Moves content to azure web app
2.  Creates default deployment script, if there is no .deployment file in web app root folder
3.  Run’s deployment script. In case of a nodejs app it would do `npm install` here

At Step 2, Instead of deployment process creating a default script. We can include custom deployment script and change it’s content to

1.  Install modules listed in package.json file.
2.  Install modules listed in bower.json file
3.  Install modules listed in composer.json file
4.  Run Gulp Tasks
5.  Run Grunt Tasks
6.  Unzip files

You can find a Sample Nodejs project with above operations @ [GitHub Link](https://github.com/prashanthmadi/azure-customdeployment)

Below steps would help you generate custom deployment script :

*   Install the azure-cli tool, it’ll also give you some cool features on managing azure related resources directly from the command-line:

`npm install azure-cli -g`

*   Go to the root of your repository (from which you deploy your site).
*   Run the custom deployment script generator command: (i have used --node option but you can choose others)

`azure site deploymentscript --node`

*   Above command will generate the files required to deploy your site, mainly:
    
    `.deployment` \- Contains the command to run for deploying your site. `deploy.cmd` \- Contains the deployment script.
    

![project with deploy file](http://prmadi.com/content/images/2016/07/Screen-Shot-2016-07-30-at-6-51-38-PM.png)

Modify your deploy.cmd/deploy.sh file based on your requirement with below content.

[Link for Sample deploy.sh file at Github with below modifications](https://github.com/prashanthmadi/azure-customdeployment/blob/master/deploy.sh)

#### 1\. Install modules listed in package.json file.

    # 3. Install NPM packages
    if [ -e "$DEPLOYMENT_TARGET/package.json" ]; then
      cd "$DEPLOYMENT_TARGET"
      eval $NPM_CMD install --production
      exitWithMessageOnError "npm failed"
      cd - > /dev/null
    fi
    

#### 2\. Install modules listed in bower.json file.

*   Make sure you have bower listed in package.json file

   Here's the code:

    # 4. Install Bower modules
    if [ -e "$DEPLOYMENT_TARGET/bower.json" ]; then
      cd "$DEPLOYMENT_TARGET"
      eval ./node_modules/.bin/bower install
      exitWithMessageOnError "bower failed"
      cd - > /dev/null
    fi
    

#### 3\. Install modules listed in composer.json file.

*   [Download composer.phar](https://getcomposer.org/composer.phar) and include it in root folder

   Here's the code:

    # 5. Install Composer modules
    if [ -e "$DEPLOYMENT_TARGET/composer.json" ]; then
      cd "$DEPLOYMENT_TARGET"
      eval php composer.phar install
      exitWithMessageOnError "composer failed"
      cd - > /dev/null
    fi
    

#### 4\. Run Gulp

*   Make sure you have gulp listed in package.json file

   Here's the code:

    # 6. Run Gulp Task
    if [ -e "$DEPLOYMENT_TARGET/gulpfile.js" ]; then
      cd "$DEPLOYMENT_TARGET"
      eval ./node_modules/.bin/gulp imagemin
      exitWithMessageOnError "gulp failed"
      cd - > /dev/null
    fi
    

#### 5\. Run Grunt

*   Make sure you have grunt listed in package.json file

   Here's the code:

    # 7. Run Grunt Task
    if [ -e "$DEPLOYMENT_TARGET/Gruntfile.js" ]; then
      cd "$DEPLOYMENT_TARGET"
      eval ./node_modules/.bin/grunt
      exitWithMessageOnError "Grunt failed"
      cd - > /dev/null
    fi
    

#### 6\. Unzip Files

    #7. Unzip file
    cd "$DEPLOYMENT_TARGET"
    eval unzip -o Archive.zip
    cd - > /dev/null
    

#### Final Output

As you can see in below screenshot, After deployment it has created

*   bower_components(Bower output)
*   node_modules(NPM output)
*   vendor(Composer Output)
*   build(output of image-min task in gulp)

![Final Output](http://prmadi.com/content/images/2016/07/Screen-Shot-2016-07-30-at-7-36-04-PM.png)

You can find a Sample Nodejs project with above operations @ [GitHub Link](https://github.com/prashanthmadi/azure-customdeployment)

### Troubleshoot

*   If deployment fails, check for **View log** in Azure Portal as below image
*   Navigate to Azure portal
*   click on your app
*   Click on Deployment Options
*   Select your recent deployment
*   Click on **View log** for Running Deployment Script. ![Troubleshoot](http://prmadi.com/content/images/2016/10/deploytrouble.PNG)

#### Azure Site command is not working

If you fail to generate deployment script using azure cli. please make sure you are in asm mode.

     azure config mode asm
    

![ASM Mode](http://prmadi.com/content/images/2016/10/asmmode.jpg)