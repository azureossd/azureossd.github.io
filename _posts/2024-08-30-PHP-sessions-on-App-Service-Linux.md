---
title: "PHP sessions on App Service Linux - 'Session data file is not created by your uid'"
author_name: "Anthony Salemo"
tags:
    - App Service
    - Configuration
    - Linux
    - PHP
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows,  
    - How To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/phplinux.png"
toc: true
toc_sticky: true
date: 2024-08-30 12:00:00
---

This post will cover using PHP sessions on App Service Linux using PHP "blessed" images and what seeing `Session data file is not created by your uid` means.

# Prerequisites
Ensure you have [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) enabled for your application. This can be then be viewed in various ways (FTP, Logstream, Azure CLI, directly through the )

# Overview
PHP sessions let you persist and manage session data based on user sessions, which are tracked through a session file stored under `/tmp` by default or specified otherwise via (`session_save_path()` or `session.save_path` in a custom `.ini`)

If using PHP "blessed" (code) images on App Service Linux, you may notice your session data is not persistent for two reasons, to start:
1. As called out - the default path for session data will be `/tmp`. If your application restarts, this will create a new container, and given a containers ephemeral nature, these files will be lost
2. If you decide to change the session save path to somewhere under `/home`, you may then notice the below error in `YYYY_MM_DD_lnxxxxxxxxxxxx_default_docker.log`:

```php
2024-08-28T16:08:53.823122322Z NOTICE: PHP message: PHP Warning:  session_start(): Session data file is not created by your uid in /home/site/wwwroot/index.php on line 5
2024-08-28T16:08:53.823164224Z NOTICE: PHP message: PHP Warning:  session_start(): Failed to read session data: files (path: /home/site/sessions) in /home/site/wwwroot/index.php on line 5
```

If you `ls -lrta` your session location under `/home` - you'll see that this is owned by `nobody` and `nogroup`. 

![File system owners](/media/2024/08/php-session-1.png)

For "blessed images" - `/home` is set to this user/group combination by default and design. This is a CIFS volume for serving persistent content on App Service Linux. It is not possible to change permissions of these directories or files and currently no option for changing mount options exists. Therefor, even though a lot of guidance is to do exactly that - it can't be done here.

One other aspect to notice is that when running `top`, you'll see the `php-fpm` worker processes running as the user `www-data`. This is where the descrepency comes into play and why this error surfaces.

![top output](/media/2024/08/php-session-2.png)

> The above is from WebSSH (the application container) NOT "Bash" (Kudu container)

To resolve the issue we're seeing about a mismatch in ownership, we can change the `php-fpm` workers to be apart of the `nobody` group.

# Solutions
## Running as nobody

1. Start a `startup.sh` somewhere under `/home`. Such as `/home/startup.sh`. Create it with the following contents:

    (startup.sh)

    ```bash
    #!/bin/bash

    echo "copying over zz-docker.conf.."
    cp /home/zz-docker.conf /usr/local/etc/php-fpm.d/zz-docker.conf
    ```

2. Copy `zz-docker.conf` from `/usr/local/etc/php-fpm.d/zz-docker.conf` back to `/home`. Edit this to include the following `user` and `group` additions:

    (zz-docker.conf)

    ```conf
    [global]
    daemonize = no

    [www]
    listen = 9000
    user = nobody
    group = nogroup
    ```

3. Set your "Startup Command" in **Settings** -> **Configuration** to be `/home/startup.sh`:

    ![Startup Command](/media/2024/08/php-session-3.png)

    > **NOTE**: Clicking "save" will restart the application

4. If you run `top` again in the application container, you'll see the user for `php-fpm` worker processes has changed to `nobody`

    ![top output with user change](/media/2024/08/php-session-4.png)

5. At this point, assuming session save path is somewhere under `/home`, the original error regarding `Session data file is not created by your uid` should not occur anymore and session data persists properly.

## Running as root
One may want to change the `php-fpm` user to `root` - this will fail with `ERROR: [pool www] please specify user and group other than root` upon startup.

This is because you would need to start the `php-fpm` process with the `-R` flag (shorthand for `--allow-to-run-as-root`), to allow running as root.

Follow the same steps as above but make these slight changes:

(zz-docker.conf)

```conf
[global]
daemonize = no

[www]
listen = 9000
user = root
group = root
```
(startup.sh)

```bash
#!/bin/bash

echo "copying over zz-docker.conf.."
cp /home/zz-docker.conf /usr/local/etc/php-fpm.d/zz-docker.conf

php-fpm -R
```

![top output with user change](/media/2024/08/php-session-5.png)

You should now see `php-fpm` worker processes running as root and still be able to persist and access session data.

**Note**: It may be possible to set up and/or use other group names, but this post does not delve into that. At that point, you may be going too far outside of what the built-in/code/"blessed" image options offer. It would make more sense to look into a custom docker image to use with Web App for Containers.

## Bring your own storage (BYOS)
This applies to both "Blessed" and custom images and using BYOS to mount Azure Files as a volume to the container.

Volume ownership is also `nobody:nogroup` - the earlier steps would apply if you store session files over a BYOS mount as well.



## Custom images
This post can apply to using custom images with either `/home` enabled via the App Setting `WEBSITES_ENABLE_APP_SERVICE_STORAGE = true` setting or through [Bring Your Own Storage](https://learn.microsoft.com/en-us/azure/app-service/configure-connect-to-azure-storage?tabs=basic%2Cportal&pivots=container-linux). Permission changes for users would instead be done through the `Dockerfile` and not a startup script



