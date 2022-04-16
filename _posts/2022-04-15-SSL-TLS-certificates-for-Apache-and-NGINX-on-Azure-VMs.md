---
title: "Adding SSL/TLS certificates for Apache and NGINX on Azure Virtual Machines"
author_name: "Anthony Salemo"
tags:
    - Apache
    - NGINX
    - Azure Virtual Machine
    - Linux
categories:
    - Azure Virtual Machine
    - Apache
    - NGINX 
    - Configuration
header:
    teaser: /assets/images/azurelinux.png
toc: true
toc_sticky: true
date: 2022-04-16 12:00:00
---

This post will be an overview of how to add an TLS/SSL certificates to your Apache or NGINX Web Server running on an [Azure Virtual Machine](https://azure.microsoft.com/en-us/services/virtual-machines/linux/). These examples will be using an Ubuntu 20.04 machine and an [App Service Certificate](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-certificate?tabs=apex%2Cportal) for the certificate that we want to secure our Web Servers with.

# Prerequisites
This post will assume you have at least bought the App Service Certificate already and have a domain pointed to the Virtual Machine. If you do not already have an App Service Certificate, you can follow [these steps](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-certificate?tabs=apex%2Cportal#start-certificate-order). Make sure that steps 1-3 (Import to Key Vault, Verify Domain ownership, certificate ready to use) are completed prior to this.

For purchasing a domain, an [App Service domain can be purchased](https://docs.microsoft.com/en-us/azure/app-service/manage-custom-dns-buy-domain) and assigned to the Virtual Machine being used. This [blog post](https://azure.github.io/AppService/2017/07/31/Assign-App-Service-domain-to-Azure-VM-or-Azure-Storage) can be followed for an Azure Virtual Machine specifically.

> **NOTE**: The UI in the above blog post has changed since the post was created, but the method of assigning the domain remains the same.


# Download the App Service Certificate and extract the cert files 

After successfully following the above steps with the App Service Certificate and importing into the Key Vault, the certificate should be stored as a 'secret'. We'll want to [export the certificate from our Key Vault](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-certificate?tabs=apex%2Cportal#export-certificate). Follow the steps in the link. The below can be followed along as well:

1. Go to your Key Vault and select 'Secrets' 

![Key Vault Secrets](/media/2022/04/azure-ssl-vm-ws-1.png)

2. Click on your Certificate name

![Key Vault Secrets](/media/2022/04/azure-ssl-vm-ws-2.png)

3. Click on the 'Current Version'

![Key Vault Secrets](/media/2022/04/azure-ssl-vm-ws-3.png)

4. Click 'Download as a certificate' and keep the Content type as 'application/x-pkcs12'

![Key Vault Secrets](/media/2022/04/azure-ssl-vm-ws-4.png)

At this point the certificate should be downloaded to your machine.

## Extracting the key (.key) and certificate (.pem) - *NIX terminals
If you're using some bash-type shell (eg. Git Bash) or have WSL2 installed on your machine then it is likely that [OpenSSL](https://www.openssl.org/) is already available. We'll be using this to extract the files we need from the `.pfx` file.

1. Navigate to the directory that contains the downloaded `.pfx` file, which is the certificate we downloaded in the above step.
2. Run the following to extract the certificate: `openssl pkcs12 -in <yourDownloadedKeyVaultCert>.pfx -nocerts -out <yourExtractedPem>.pem` 

    You'll be prompted for a Import Password and a PEM pass phrase.

    ```
    Enter Import Password:
    Enter PEM pass phrase:
    Verifying - Enter PEM pass phrase:
    ```

    The Import Password is empty by default as called out [here](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-certificate?tabs=apex%2Cportal#export-certificate) when downloaded the certificate from Azure initially. 

    The `PEM pass phrase` must be set and cannot be left blank. Set a pass phrase and enter it again to verify it.

3. Next run `openssl rsa -in <yourExtractedPem>.pem -out <yourNewKey>.key` to get the `.key` file. You'll be prompted with a `pass phrase` again which should be the same one set in step 2.

4. Lastly, get the server certificate with `openssl pkcs12 -in <yourDownloadedKeyVaultCert>.pfx -clcerts -nokeys -out <serverCert>.pem`. You'll be prompted for a `Import Password` again, which is the one for the original Key Vault certificate. As mentioned above, this is empty by default so leave the prompt blank and press enter.

5. In total you should have 4 files, 2 of which we'll need to bring to our Virtual Machine.
    - `<yourDownloadedKeyVaultCert>.pfx` (the original Key Vault certificate)
    - `<yourExtractedPem>.pem` (the first encrypted `.pem`)
    - `<yourNewKey>.key` (our decrypted `.key` from `<yourExtractedPem>.pem`)
    - `<serverCert>.pem` (our extracted certificate from `<yourDownloadedKeyVaultCert>.pfx`)

6. We'll need to bring `<yourNewKey>.key` and `<serverCert>.pem` to the Virtual Machine.

## Extracting the key (.key) and certificate (.pem) - Windows terminals
If there is no option to run *NIX-like terminals then it's possible to download a OpenSSL client for Windows. There are a few different client download options and ultimately it is up to the user to decide which download to choose from. After a successful installation the above steps for *NIX can be followed as well. The only difference here is possibly needing to use `openssl.exe` instead of just `openssl` when running the above commands. 

# Uploading the files to the Virtual Machine
An easy way to get the files up to the Virtual Machine is to use the `scp` command. The documentation on using [SCP to move files to and from a Linux Virtual Machine](https://docs.microsoft.com/en-us/azure/virtual-machines/linux/copy-files-to-linux-vm-using-scp) can be used. The below can be followed as well - this should work on *NIX and Windows type terminals.

1. Run `scp <yourNewKey>.key <serverCert>.pem <yourVMUser>@<yourVMIP>:~`.
    
    Example: `scp mykey.key mycert.pem user@12.345.678.910:~`

2. Alternatively, you can run a `scp` for each file to copy them up individually.
3. The directory location these files are copied to normally should not matter. The location needs to be remembered for later steps.

> **NOTE**: This example copies the files to `/home/<user>` (noted by the `~` in the above command). If you are trying to copy these files outside of `/home/<user>` you may see a `Permission Denied` error depending on your user priviledges and authentication method. If so, copy them to `/home/<user> (~)` instead.


# Apache

## Installation 

If Apache has not been installed yet on this Virtual Machine then the following commands can be ran:

1. `sudo apt-get update`
2. `sudo apt-get install apache2`.

After a successful installation `apache2` will start to run automatically afterwards. You can check the status of `apache2` with `sudo systemctl status apache2`.

3. Browse your domain and/or Virtual Machine IP with `http://`. You should now see the default Ubuntu/Apache welcome page. 

> **NOTE**: To ensure that `apache2` starts after a machine reboot or stop/start, run `sudo systemctl enable apache2`. Otherwise you may have to manually start the service.

## Enable SSL/TLS

1. Navigate to /etc/apache2/sites-available. Two files should be in this directory, `000-default.conf` and `default-ssl.conf`. For the sake of this guide, we'll be changing `default-ssl.conf`.
2. With your text editor of choice open the `default-ssl.conf` file for editing.
3. Look for the following lines in `default-ssl.conf`. By default they're set to the below values:

```
    SSLCertificateFile      /etc/ssl/certs/ssl-cert-snakeoil.pem

    SSLCertificateKeyFile /etc/ssl/private/ssl-cert-snakeoil.key
```
**We need to update these to point to our certificate and key location that we uploaded earlier.** The below assumes we moved our `.pem` and `.key` into `/etc/ssl/certs` and `/etc/ssl/private` respectively

```
    SSLCertificateFile      /etc/ssl/certs/<serverCert>.pem

    SSLCertificateKeyFile /etc/ssl/private/<yourNewKey>.key
```

If you had moved this into another location, such as `/home`, it would look like the following:

```
    SSLCertificateFile      /home/myuser/<serverCert>.pem

    SSLCertificateKeyFile /home/myuser/<yourNewKey>.key
```

> **NOTE**: While editing `default-ssl.conf` it may be good to edit any other Directives needing to be changed as desired, such as [`ServerName`](https://httpd.apache.org/docs/2.4/vhosts/name-based.html).

4. Save the file. Run `sudo a2ensite default-ssl.conf` to activate the Virtual Host. You should see an output like this:
```
Enabling site default-ssl.
To activate the new configuration, you need to run:
  systemctl reload apache2
```
5. **Before reloading/restarting `apache2` - run `sudo a2enmod ssl` to enable the SSL module.** You should see output along the lines of the below:
```
Considering dependency setenvif for ssl:
Module setenvif already enabled
Considering dependency mime for ssl:
Module mime already enabled
Considering dependency socache_shmcb for ssl:
Enabling module socache_shmcb.
Enabling module ssl.
See /usr/share/doc/apache2/README.Debian.gz on how to configure SSL and create self-signed certificates.
To activate the new configuration, you need to run:
  systemctl restart apache2
```
6. Prior to restarting Apache run `sudo apache2ctl configtest` to make sure our syntax is still valid after changing our `default-ssl.conf` file. If it's valid we'll see the below output:

```
Syntax OK
```

7. We're now okay to restart Apache. We can do this with `sudo systemctl restart apache2`. Run `sudo systemctl status apache2` to validate Apache was able to start correctly. 

8. Browsing your domain with `https://` should reflect it is now secured with a valid certificate. 

![Site Certificate](/media/2022/04/azure-ssl-vm-ws-5.png)
 
## Troubleshooting
### Domain doesn't load over HTTPS - 'Connection Refused'
1. Ensure that the `default-ssl.conf` file was activated with `sudo a2ensite default-ssl.conf`. If you're using a different file instead of this one replace `default-ssl.conf` with that file instead.

    This will create a file of the same name under `/etc/apache2/sites-enabled` that is symlinked to the one under `/etc/apache2/sites-available`. Validate this file was created in `sites-enabled` as well.

2. Ensure the Apache SSL module was activated with `sudo a2enmod ssl`. 
3. Any `.conf` file changes or module activation will only be picked up when `apache2` is restarted or reloaded. Ensure this was done for Apache after any of these changes.

### Apache won't start after making changes
1. Run `sudo systemctl status apache2` to check the status. This will normally show what may be wrong as well.
2. Ensuring a syntax check is done with `sudo apache2ctl configtest` after doing changes but before restarting/reloading `apache2` can help prevent this. Syntax issues may cause `apache2` to fail starting up.

### Browser times out trying to load the https:// domain - "site.com took to long to response"
1. Ensure that the Network Security Groups (NSG's) assigned to this Virtual Machine has port 443 allowed for traffic. This can be checked by going to the Networking tab in the Azure Portal for the Virtual Machine.
2. If needed, move the priority of the Inbound Port Rule to a higher priority (lower number) if other rules are conflicting with this.

# NGINX

## Installation 

If NGINX has not been installed yet on this Virtual Machine then the following commands can be ran:

1. `sudo apt-get update`
2. `sudo apt-get install nginx`.

After a successful installation `nginx` will start to run automatically afterwards. You can check the status of `nginx` with `systemctl status nginx`.

3. Browse your domain and/or Virtual Machine IP with `http://`. You should now see the default NGINX welcome page. 

> **NOTE**: To ensure that `nginx` starts after a machine reboot or stop/start, run `sudo systemctl enable nginx`. Otherwise you may have to manually start the service.

## Enable SSL/TLS
1. Navigate to /etc/nginx/sites-available. One file should be in this directory, `default.conf` (or just `default`). For the sake of this guide, we'll be changing `default.conf` to enable SSL since NGINX allows for optional enabling of this by default in this file.
2. With your text editor of choice open the `default.conf` file for editing.
3. Look for the following lines in `default.conf`. By default they're set to the below values:

```
# SSL configuration
#
# listen 443 ssl default_server;
# listen [::]:443 ssl default_server;
#
# Note: You should disable gzip for SSL traffic.
# See: https://bugs.debian.org/773332
#
# Read up on ssl_ciphers to ensure a secure configuration.
# See: https://bugs.debian.org/765782
#
# Self signed certs generated by the ssl-cert package
# Don't use them in a production server!
#
# include snippets/snakeoil.conf;
```

We'll want to comment out the two lines containing `listen` for port 443 and add two directives, `ssl_certificate` and `ssl_certificate_key`. Below we again assume our certificate and key is located under /etc/ssl/certs and /etc/ssl/private respectively. Change this path to your certificate and key accordingly. The file should be updated to the below:

```
# SSL configuration
#
listen 443 ssl default_server;
listen [::]:443 ssl default_server;

ssl_certificate /etc/ssl/certs/<serverCert>.pem;
ssl_certificate_key /etc/ssl/private/<yourKey>.key;

# Note: You should disable gzip for SSL traffic.
# See: https://bugs.debian.org/773332
#
# Read up on ssl_ciphers to ensure a secure configuration.
# See: https://bugs.debian.org/765782
#
# Self signed certs generated by the ssl-cert package
# Don't use them in a production server!
#
# include snippets/snakeoil.conf;
```

> **NOTE**: While editing `default.conf` it may be good to edit any other Directives needing to be changed as desired, such as [`server_name`](https://nginx.org/en/docs/http/server_names.html).

4. Save the file. To validate the file was saved with correct syntax run `sudo nginx -t` for a configuration check. If syntax is correct you should get the below output:

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```
5. Lastly, run `sudo systemctl reload nginx`. You can check the status of NGINX by running `sudo systemctl status nginx`.
6. Browsing your domain with `https://` should reflect it is now secured with a valid certificate.

![Site Certificate](/media/2022/04/azure-ssl-vm-ws-6.png)

### Domain doesn't load over HTTPS - 'Connection Refused'
1. Ensure that the `default.conf` file had the `listen` lines uncommented as well as the `ssl_certificate` and `ssl_certificate_key` directives added. If a seperate `.conf` was added to use as the host file for SSL/Port 443 functionality, ensure this is added correctly by running `ln -s /etc/nginx/sites-available/<newConfFile>.conf /etc/nginx/sites-enabled/<newConfFile>.conf`. Symlinking in this manner is NGINX's version of site configuration activation. 
 
3. Any `.conf` file changes will only be picked up when `nginx` is restarted or reloaded. Ensure this was done for NGINX after any of these changes.

### NGINX won't start after making changes
1. Run `sudo systemctl status nginx` to check the status. This will normally show what may be wrong as well.
2. Ensuring a syntax check is done with `sudo nginx -t` after doing changes but before restarting/reloading `nginx` can help prevent this. Syntax issues may cause `nginx` to fail starting up. For example:

```
nginx: [emerg] invalid number of arguments in "ssl_certificate" directive in /etc/nginx/sites-enabled/default:44
nginx: configuration file /etc/nginx/nginx.conf test failed
```

### Browser times out trying to load the https:// domain - "site.com took to long to response"
1. Ensure that the Network Security Groups (NSG's) assigned to this Virtual Machine has port 443 allowed for traffic. This can be checked by going to the Networking tab in the Azure Portal for the Virtual Machine.
2. If needed, move the priority of the Inbound Port Rule to a higher priority (lower number) if other rules are conflicting with this.

