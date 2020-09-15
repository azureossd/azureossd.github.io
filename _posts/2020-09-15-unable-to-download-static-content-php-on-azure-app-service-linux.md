---
title: "Unable to download static content when using php images on Azure App Service - Linux"
author_name: "Srikanth Sureddy"
tags:
    - Azure App Service Linux
    - PHP 7.2/7.3/7.4
    - Static Content
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - PHP # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Any Framework based on PHP 7.2 or 7.3 or 7.4 Images # Django, Spring Boot, CodeIgnitor, ExpressJS
    - How-To, Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: #"/assets/images/imagename.png"  There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2020-09-15 13:00:00
---

## Unable to download static content (>2MB) when using PHP 7.2 or 7.3 or 7.4 images on Azure App Service Linux

With a recent update that was pushed out to App Service Linux, sites using our php images have started seeing issues downloading static files (jpg,png,zip,pdf etc) > 2MB.

This is happening at 2 levels. 
1. If you are downloading the file directly using a link. 
2. If you are downloading the file through php script.

We are currently investigating why this is happening. But you can fix this with a bit of customization.

## How to fix if your download is failing using a direct link

1. Using a  startup script, we will modify apache configuration to disable mmap and sendfile support. You can find more about these features here: 
    - <http://httpd.apache.org/docs/current/mod/core.html#enablemmap>
    - <http://httpd.apache.org/docs/current/mod/core.html#enablesendfile>

2. Steps to update apache configuration using startup script:

   1. Create a startup.sh in your local machine with below content. **Make sure you have Linux-style (LF) line endings in startup.sh file.**
        ### Sample startup script is [here](https://appsvcphp.blob.core.windows.net/public/startup.sh)

        ### startup.sh contents
        ```bash    
        #!/bin/sh
        echo "Executing custom startup script."
        cp /home/site/wwwroot/apache2.conf /etc/apache2/apache2.conf
        cd /home/site/wwwroot
        export APACHE_PORT=8080

        if [  -n "$PHP_ORIGIN" ] && [ "$PHP_ORIGIN" = "php-fpm" ]; then
        export NGINX_DOCUMENT_ROOT='/home/site/wwwroot'
        service nginx start
        else
        export APACHE_DOCUMENT_ROOT='/home/site/wwwroot'
        fi

        apache2-foreground    
        ```

    2. Download apache2.conf file for your site. Modify it to disable mmap and sendfile. A snippet is below: 
        ### Sample apache2.conf file is [here](https://appsvcphp.blob.core.windows.net/public/apache2.conf)
        ### apache configuration snippet
        ```
        <Directory "${APACHE_DOCUMENT_ROOT}">
    	    Options Indexes FollowSymLinks
	        EnableMMAP Off
    	    EnableSendfile Off
	        AllowOverride None
	        Require all granted
        </Directory>
        ```
    
    3. Upload startup.sh and apache2.conf. You can use your publishing credentials and curl to acheive this. 

        ### Sample below for a site mysamplesite 
        
        #### If uploading from a Linux Machine:
        ```
        curl -X PUT --data-binary @startup.sh 'https://$mysamplesite:<publishing-password>@mysamplesite.scm.azurewebsites.net/api/vfs/site/wwwroot/starup.sh' -v
        curl -X PUT --data-binary @apache2.conf 'https://$mysamplesite:<publishing-password>@mysamplesite.scm.azurewebsites.net/api/vfs/site/wwwroot/apache2.conf' -v
        ```        

        #### If uploading from a Windows Machine:
        ````
        curl -X PUT --data-binary @startup.sh https://$mysamplesite:<publishing-password>@mysamplesite.scm.azurewebsites.net/api/vfs/site/wwwroot/startup.sh -v
        curl -X PUT --data-binary @apache2.conf https://$mysamplesite:<publishing-password>@mysamplesite.scm.azurewebsites.net/api/vfs/site/wwwroot/apache2.conf -v
        ````

        ### If your site is in an ASE (App Service Environment), then use below samples: Assuming your site name is mysamplesite and ase domain name is contoso.com

        #### If uploading from a Linux Machine:
        ```
        curl -X PUT --data-binary @startup.sh 'https://$mysamplesite:<publishing-password>@mysamplesite.scm.contoso.com/api/vfs/site/wwwroot/starup.sh' -v
        curl -X PUT --data-binary @apache2.conf 'https://$mysamplesite:<publishing-password>@mysamplesite.scm.contoso.com/api/vfs/site/wwwroot/apache2.conf' -v
        ```
        #### If uploading from a Windows Machine:
        ```
        curl -X PUT --data-binary @startup.sh https://$mysamplesite:<publishing-password>@mysamplesite.scm.contoso.com/api/vfs/site/wwwroot/startup.sh -v
        curl -X PUT --data-binary @apache2.conf https://$mysamplesite:<publishing-password>@mysamplesite.scm.contoso.com/api/vfs/site/wwwroot/apache2.conf -v
        ```

    4. Set up startup script using Azure Portal or az cli.
    
        #### From Portal, Browse to the Site -> Configuration (under Settings) -> General Settings Tab -> Startup Command (under Stack settings)

        Set it to /home/site/wwwroot/startup.sh

        #### From az cli: 
        ```cli
        az webapp config set -g MyResourceGroup -n mysamplesite --startup-file /home/site/wwwroot/startup.sh
        ```
    5. This will restart the site and change apache configuration that will enable file downloads > 2MB.



## If you are downloading files through php script using specific PHP APIs (e.g. fpassthru())

- The fix will require changing your code that reads files. It involves moving away from reading files using fpassthru. 

    #### A sample php code snippet is below: 

    ```php
    <?php
    $file = './xx.txt';
    $query_file = htmlspecialchars($_GET["file"]);

    if ($query_file != null)
    {
        $file = $query_file;
    }

    if (file_exists($file))
    {
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="'.basename($file).'"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($file));

        $fp = fopen($file, 'rb');
        // fpassthru($fp);

        ob_flush();
        flush();

        while(!feof($fp))
        {
            print(fread($fp, 2048));
            ob_flush();
        }
        ob_flush();
        flush();
        fclose ($fp);
        exit;
    }
    else
    {
        echo "File " . $file . " not found.";
    }
    ?>
    ```

