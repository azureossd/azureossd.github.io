---
title: "Configure Imagick PHP Extension in App Service"
author_name: "Edison Garcia"
tags:
    - PHP
    - Imagick
    - ImageMagick
categories:
    - Azure App Service on Windows
    - Azure App Service on Linux
    - Configuration
    - PHP Extensions 
header:
    teaser: /assets/images/App-Services.png
toc: true
toc_sticky: true
date: 2022-02-10 12:00:00
---

This blog explains how to configure Imagick PHP Extension in App Service Windows and the alternatives you have for App Service Linux. 


Reference: [Microsoft Q&A questions](https://docs.microsoft.com/en-us/answers/questions/494672/how-can-i-install-the-php-module-imagick-on-my-web.html).

# App Service Windows

Based on your **PHP version** and **Platform (32/64 bits)**, get the latest `php_imagick.dll` from https://windows.php.net/downloads/pecl/releases/imagick/.

Since App Service Windows is running IIS as the webserver, you can select **NTS (Non-Thread Safe)**. This is used when PHP runs on Fast CGI binary.



## PHP 7.4

For this scenario `php_imagick-3.7.0-7.4-nts-vc15-x64.zip` was selected. 

 ![PHP extension](/media/2022/01/php-imagick-01.png)

1. Go to Kudu site browsing to https://yoursitename.scm.azurewebsites.net/DebugConsole 
2. Create a folder named `imagick` inside `c:\home\site` or `D:\home\site` (in any applicable scenario).
3. Unzip the folder and copy all `CORE_RL_*` files to `c:\home\site\imagick\` or `d:\home\site\imagick\`

   ![PHP extension](/media/2022/01/php-imagick-02.png)

4. Create two new folders `ext` and `ini` inside `c:\home\site` or `d:\home\site` (in any applicable scenario).

5. Copy `php_imagick.dll` to `c:\home\site\ext\` or `d:\home\site\ext\`

6. Create a new file named `extensions.ini` inside  `c:\home\site\ini\` or `d:\home\site\ini\` with the following content:

    ```ini
    extension=C:\home\site\ext\php_imagick.dll
    ```
7. Create new file `applicationHost.xdt` file inside the `c:\home\site` or `d:\home\site` folder and copy the below configuration:

    ```xml
      <?xml version="1.0"?>
      <configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
        <system.webServer>
          <runtime xdt:Transform="InsertIfMissing">
            <environmentVariables xdt:Transform="InsertIfMissing">
              <add name="PATH" value="%PATH%;c:\home\site\imagick" xdt:Locator="Match(name)" xdt:Transform="InsertIfMissing" />
            </environmentVariables>
          </runtime>
        </system.webServer>
      </configuration>
    ```
8. Add the following App Settings in Azure Portal:

   ![PHP extension](/media/2022/01/php-imagick-03.png)

   > Note: Check if c or d drives applies to you.

    - **MAGICK_CODER_MODULE_PATH** = **c:\home\site\imagick**
    - **MAGICK_HOME** =  **c:\home\site\imagick**
    - **PHP_INI_SCAN_DIR** = **c:\home\site\ini**

9. If you create a info page, you should see the following results:
    ```php
      <?
      phpinfo();
    ```
    ![PHP extension](/media/2022/01/php-imagick-04.png)



# App Service Linux

PHP images are [pre-build](https://github.com/microsoft/Oryx/blob/main/doc/runtimes/php.md#system-packages) with imagick extension.

>**Note**: Currently imagick is having compilation issues with PHP 8.x, recommend to use PHP 7.4 for now, for more information check this [reference](https://github.com/Imagick/imagick/issues/331).
 
## ImageMagick policies
ImageMagick best practices strongly encourages you to configure a security policy that suits your local environment. You can read more about these policies [here](https://imagemagick.org/script/security-policy.php).

Policies can be found on `/etc/ImageMagick-6/policy.xml`

If you desire to modify these policies on Azure App Service, the best option to accomplish this will be to use a startup script.

Here is an example for removing policies for ghostscript:

```bash
  #!/bin/bash
  #Removing ghostscript policies
  sed -i '/disable ghostscript format types/,+6d' /etc/ImageMagick-6/policy.xml 
  apt-get upgrade && apt-get install -y ghostscript
  apache2-foreground 
```

## Troubleshooting

### ghostscript

- **Scenario**: Uncaught ImagickException: attempt to perform an operation not allowed by the security policy <RandomPolicy>. 

  ```log
    PHP Fatal error: Uncaught ImagickException: attempt to perform an operation not allowed by the security policy `PDF' @ error/constitute.c/IsCoderAuthorized/408 in /home/site/wwwroot/index.php:11\nStack trace:\n#0 /home/site/wwwroot/index.php(11): Imagick->readImage('random.pdf')\n#1 {main}\n thrown in /home/site/wwwroot/index.php on line 11
  ```

  **Resolution**: Add a custom startup script to modify existing policy with read|write or removing the policy, check steps above.

- **Scenario**: PHP Fatal error: Uncaught ImagickException: FailedToExecuteCommand `'gs' 

  ```log
    PHP Fatal error: Uncaught ImagickException: FailedToExecuteCommand `'gs' -sstdout=%stderr -dQUIET -dSAFER -dBATCH -dNOPAUSE -dNOPROMPT -dMaxBitmap=500000000 -dAlignToPixels=0 -dGridFitTT=2 '-sDEVICE=pngalpha' -dTextAlphaBits=4 -dGraphicsAlphaBits=4 '-r72x72' -dFirstPage=1 -dLastPage=1 '-sOutputFile=/tmp/magick-60nJzxfIQqHrXx%d' '-f/tmp/magick-60rZK5yQMK31K7' '-f/tmp/magick-60_Dsu584RGIyH'' (1) @ error/pdf.c/InvokePDFDelegate/291 
  ```

    **Resolution**: Add a custom startup script to modify existing policy with `apt-get upgrade && apt-get install -y ghostscript`, check steps above.