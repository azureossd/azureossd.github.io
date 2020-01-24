---
title: "How to send emails through Azure Web Apps using Google / Gmail"
tags:
  - Azure Web App email send
  - Azure web apps gmail
  - Azure Web Apps Send Email gmail
  - 'C#'
  - 'C# MailKit'
categories:
  - Azure App Service Web App
  - Email
date: 2019-02-02 12:29:38
author_name: bledwards1
header:
    teaser: "/assets/images/Gmail_Icon.svg"
---

## Part I – Configuring Google to use App Passwords

 

***Two quick notes before proceeding: This is not a ‘once and done’ secret or app generation concept, this is unique to the gmail address and will need to be done for each and every email address that you wish to send emails from.***

***Next, this sample uses the C\# Open Source MailKit library. You can find more details about this here:***

***<https://github.com/jstedfast/MailKit>***

### Step 1

Login to your google account and setup your Google App Password through the security center.

<https://gmail.com> then click in the upper right on your avatar and click “Google Account”

![](/media/2019/02/Gmail_Account_Display-300x179.png)

Click Security. If you already have 2 step verification and app passwords enabled, click on App Passwords to generate a new one. If you do not, then you will need to enable these to complete this walkthrough / guide.

![Google profile details](/media/2019/02/Google_Security_Display-221x300.png)

**On the step below if you do not have 2 factor authentication enabled and verified with your phone, you will need to do that, first.**

Next you will need to generate the password to use:

![](/media/2019/02/Gmail_Security_Center-1-300x160.png)

Now to generate the actual password. Use whichever name you are comfortable with.

![](/media/2019/02/Gmail_Security_Center_Generate_Code-300x190.png)

Take note of the password (put it in your clipboard or notepad of choice). It will look like this:

![](/media/2019/02/App_Password-300x260.png)

### Step 2

Install Visual Studio (if needed).

## Part II – Copying / Programming

### Step 1 

Clone the GitHub Repository [https://github.com/bledwards1/MailKit\_AzureWebApps\_Demo](https://github.com/bledwards1/MailKit_AzureWebApps_Demo)

### Step 2 

Update the variables inside of the code sample downloaded as shown in the screenshots. The only file you should have to modify is the Default.aspx

Lines to modify: 30, 31, and 32 (optional), 37. Feel free to edit any of the others if you’d like to modify such as the subject line, etc. They are also commented clearly in the repository above if you forget...

### Step 3

Run the code and check for an email sample!
