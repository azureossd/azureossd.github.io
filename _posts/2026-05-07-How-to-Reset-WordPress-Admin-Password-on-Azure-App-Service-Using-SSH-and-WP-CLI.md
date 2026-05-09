---
title: "How to Reset WordPress Admin Password on Azure App Service Using SSH and WP-CLI"
author_name: "Loai Al-Shakhshir"
tags:
    - Web App(Linux)
    - PHP
    - WordPress
categories:
    - Azure App Service on Linux
    - PHP
    - WordPress
    - MySQL 
    - How-To
header:
    teaser: "/assets/images/imagename.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2026-05-07 00:00:00
---

## Overview
This article provides the steps to reset a WordPress admin password for a site hosted on **Azure App Service** using **SSH and WP-CLI**.  

This method is particularly useful when access to the WordPress admin portal (`/wp-admin`) is not available, or you do not have access to the MySQL database.

## Scope
- Azure App Service (Linux) hosting WordPress
- WordPress deployments with WP-CLI available
- Scenarios where password reset via email or UI is not possible

## Prerequisites
- Access to the **Azure Portal**
- Sufficient permissions to the target Web App
- SSH access enabled on the App Service
- Basic familiarity with command-line usage

## Procedure

### 1. Access Azure Portal
- Sign in to the Azure Portal: https://portal.azure.com  
- Navigate to your **WordPress Web App**


### 2. Open SSH Console
- In the left-hand menu, select:  
  **Development Tools → SSH**
- Click **Go** to open the SSH session


### 3. Navigate to WordPress Root Directory
Run the following command:

```bash
cd /home/site/wwwroot
```

### 4. List WordPress Users
To identify the user account:

```bash
wp user list --allow-root
```
This will display:
- User ID
- Username(user_login)
- Display name
- Email(user_email)
- date of registration(user_registered)
- Roles

![List User Result](/media/2026/05/List_User_Result.png)

### 5. Reset the Password

```bash
wp user update <USER_ID> --user_pass='<NEW_PASSWORD>' --allow-root
```

Example:

```bash
wp user update 1 --user_pass='P@ssw0rd123!' --allow-root
```
![List User Result](/media/2026/05/Reset_Password.png)

## Expected Result

- The password is updated immediately
- No restart of the App Service is required

## Verification Steps

1. Navigate to:
```code
https://<your-site>/wp-admin
```
1. Log in using:
    - Username
    - New password

## Important Notes

- The --allow-root flag is required in Azure App Service environments
- Always use a strong and secure password:
    - At least 12 characters recommended
    - Combination of uppercase, lowercase, numbers, and symbols
- Avoid sharing credentials in plain text

## Troubleshooting
### Issue: wp: command not found
- WP-CLI may not be installed or available in the environment
- Verify your WordPress image or installation
### Issue: Permission errors
- Ensure you are in the correct directory:
```bash
cd /home/site/wwwroot
```
### Issue: Unable to identify correct user

- Re-run:
```bash
wp user list --allow-root
```
- Verify the correct Id before updating

