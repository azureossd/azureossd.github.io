---
title: " Azure App Service Linux - PHP Custom Startup Script"
author_name: Toan Nguyen
categories:
  - PHP
  - Azure App Service on Linux
  - Configuration
  - How-To
date: 2020-01-23 11:50:06
tags:
header:
    teaser: /assets/images/phplinux.png
toc: true
toc_sticky: true
---

Azure App Service on Linux runs on Docker.  You can create a custom startup script if any addition settings need to be applied and persisted after restarts.  Below are steps for creating, configuring, and testing your script for our PHP images.

## Create a Bash Script

### Modified Apache Header Sample

In this example, I'll be enabling Apache's Header module, updating the Apache configuration file to add a new header and remove the "X-Powered-By" header, and then starting Apache.

1. Go to the Kudu site for your App (i.e. https://\<sitename\>.azurewebsites.net) and select SSH from the menu.
2. Using SSH, go to "/home" directory and create a file called "test.sh" using your favorite editor.
3. Add the following content.

```bash
#!/bin/bash
	
a2enmod headers
echo "Header set MyHeader \"%D %t"\" >> /etc/apache2/apache2.conf
echo "Header always unset \"X-Powered-By\"" >> /etc/apache2/apache2.conf
echo "Header unset \"X-Powered-By\"" >> /etc/apache2/apache2.conf
/usr/sbin/apache2ctl -D FOREGROUND
```
4. Save the file.

### Installing MySQL Client Sample

Another example but with MySQL Client installed as well.

```bash
#!/bin/bash
	
a2enmod headers
echo "Header set MyHeader \"%D %t"\" >> /etc/apache2/apache2.conf
echo "Header always unset \"X-Powered-By\"" >> /etc/apache2/apache2.conf
echo "Header unset \"X-Powered-By\"" >> /etc/apache2/apache2.conf
apt-get update
apt-get install mysql-client -y
/usr/sbin/apache2ctl -D FOREGROUND
```
**NOTE:**  Always ensure that "/usr/sbin/apache2ctl -D FOREGROUND" is in the script or your container will not start.

### Mod Security to Remove Server header

```bash
#!/bin/bash
	
a2enmod headers
echo "Header set MyHeader \"%D %t"\" >> /etc/apache2/apache2.conf
echo "Header always unset \"X-Powered-By\"" >> /etc/apache2/apache2.conf
echo "Header unset \"X-Powered-By\"" >> /etc/apache2/apache2.conf
	
apt-get update
apt-get install libapache2-modsecurity -y
sed -i '/^<\/IfModule>/i SecRuleEngine On' /etc/apache2/mods-enabled/security2.conf
sed -i '/^<\/IfModule>/i SecStatusEngine On' /etc/apache2/mods-enabled/security2.conf
sed -i '/^<\/IfModule>/i ServerTokens Full' /etc/apache2/mods-enabled/security2.conf
sed -i '/^<\/IfModule>/i SecServerSignature " "' /etc/apache2/mods-enabled/security2.conf
	
/usr/sbin/apache2ctl -D FOREGROUND
```
## Saving the Changes

1. In the Azure Portal, go to Configuration then the "General settings" section for your PHP Linux App.
2. In the "Startup Command" section, add "/home/test.sh" and press save.

## Testing the Changes

Prior to updating the Application Settings for our App, the headers returned for any calls made to my PHP site returned the following highlighted header.

```yaml	
Content-Encoding: gzip
Content-Length: 29220
Content-Type: text/html; charset=UTF-8
Date: Tue, 02 Apr 2019 22:09:01 GMT
Server: Apache
Vary: Accept-Encoding
X-Powered-By: PHP/7.0.33
```	
After the changes, you can see the new header and the removed header.

```yaml
Content-Encoding: gzip
Content-Length: 29221
Content-Type: text/html; charset=UTF-8
Date: Tue, 02 Apr 2019 22:18:46 GMT
MyHeader: D=865306 t=1554243525454549
Server: Apache
Vary: Accept-Encoding
X-Content-Type-Options: nosniff
```

## FAQ's/Troubleshooting

### Adding a "Command" In Startup File Prevents My Site from Starting 

You'll always need to use a shell script if you intend to make any adjustments to Azure App Service on Linux images.  For example, if a user tries to add just "a2enmod headers", only this command will run.  This will be an issue because Apache also needs to startup.   So any changes will need to be in a shell script and end with **"/usr/sbin/apache2ctl -D FOREGROUND"** so that Apache can startup after the changes are made.

### What Happens By Default?
If no "Startup File" is specified, the default startup command will be **"/usr/sbin/apache2ctl -D FOREGROUND"**.

### How Can I Troubleshoot My Custom Script?

#### Enable Diagnostic Logs

Enable Diagnostic Logs to see the startup command that is running.  Information regarding the shell script will also be printed and can normally help with troubleshooting.    Example output below.

```log
    2019-04-02T22:10:20.124899804Z   _____                               
    2019-04-02T22:10:20.124950905Z   /  _  \ __________ _________   ____  
    2019-04-02T22:10:20.124961705Z  /  /_\  \___   /  |  \_  __ \_/ __ \ 
    2019-04-02T22:10:20.124966305Z /    |    \/    /|  |  /|  | \/\  ___/ 
    2019-04-02T22:10:20.124970905Z \____|__  /_____ \____/ |__|    \___  >
    2019-04-02T22:10:20.124975605Z         \/      \/                  \/ 
    2019-04-02T22:10:20.124979905Z A P P   S E R V I C E   O N   L I N U X
    2019-04-02T22:10:20.124984005Z 
    2019-04-02T22:10:20.124988005Z Documentation: http://aka.ms/webapp-linux
    2019-04-02T22:10:20.124991905Z PHP quickstart: https://aka.ms/php-qs
    2019-04-02T22:10:20.124996005Z PHP version : 7.0.33
    2019-04-02T22:10:20.316877912Z Starting OpenBSD Secure Shell server: sshd.
    2019-04-02T22:10:20.316930912Z Running /home/test.sh
    2019-04-02T22:10:20.478652555Z Enabling module headers.
    2019-04-02T22:10:20.509020720Z To activate the new configuration, you need to run:
    2019-04-02T22:10:20.509035720Z   service apache2 restart
    2019-04-02T22:10:20.794898927Z AH00526: Syntax error on line 63 of /etc/apache2/apache2.conf:
    2019-04-02T22:10:20.797728533Z Unknown parameter: %t
    2019-04-02T22:10:20.813059165Z Action '-D FOREGROUND' failed.
    2019-04-02T22:10:20.815994072Z The Apache error log may have more information.
```
NOTE: Always make sure that the script is starting Apache as seen in the last line below.

```log
2019-04-02T22:18:32.179448369Z   _____                               
2019-04-02T22:18:32.179504969Z   /  _  \ __________ _________   ____  
2019-04-02T22:18:32.179511669Z  /  /_\  \___   /  |  \_  __ \_/ __ \ 
2019-04-02T22:18:32.179515769Z /    |    \/    /|  |  /|  | \/\  ___/ 
2019-04-02T22:18:32.179519669Z \____|__  /_____ \____/ |__|    \___  >
2019-04-02T22:18:32.179523769Z         \/      \/                  \/ 
2019-04-02T22:18:32.179527569Z A P P   S E R V I C E   O N   L I N U X
2019-04-02T22:18:32.179531370Z 
2019-04-02T22:18:32.179535070Z Documentation: http://aka.ms/webapp-linux
2019-04-02T22:18:32.179539370Z PHP quickstart: https://aka.ms/php-qs
2019-04-02T22:18:32.179543070Z PHP version : 7.0.33
2019-04-02T22:18:32.787322622Z Starting OpenBSD Secure Shell server: sshd.
2019-04-02T22:18:32.909041713Z Running /home/test.sh
2019-04-02T22:18:33.547386039Z Enabling module headers.
2019-04-02T22:18:33.636235852Z To activate the new configuration, you need to run:
2019-04-02T22:18:33.636252352Z   service apache2 restart
2019-04-02T22:18:34.223869056Z AH00558: apache2: Could not reliably determine the server's fully qualified domain name, using 11.0.3.3. Set the 'ServerName' directive globally to suppress this message
2019-04-02T22:18:34.293904223Z AH00558: apache2: Could not reliably determine the server's fully qualified domain name, using 11.0.3.3. Set the 'ServerName' directive globally to suppress this message
2019-04-02T22:18:34.780720587Z [Tue Apr 02 22:18:34.773847 2019] [mpm_prefork:notice] [pid 52] AH00163: Apache/2.4.25 (Debian) PHP/7.0.33 configured -- resuming normal operations
2019-04-02T22:18:34.793733818Z [Tue Apr 02 22:18:34.793676 2019] [core:notice] [pid 52] AH00094: Command line: '/usr/sbin/apache2 -D FOREGROUND'
```

#### Test the Shell Script using SSH

1. Remove the shell script from the Application Settings.
2. After the App container restarts, SSH into the container using KUDU or Remote SSH.
3. Locate the script and run "bash <script_name>"
4. Reload Apache by running "service apache2 reload" to test changes affecting Apache.
5. If the script is installing packages, check to see if those packages are installed.

#### Creating a Shell Script on Windows

Creating a shell script using a text editor on Windows will likely not be formatted correctly since they use different end of line characters to Unix/Linux systems.  One way to workaround this is to use Notepad++ -> Edit Menu -> EOL Conversion -> Unix.

