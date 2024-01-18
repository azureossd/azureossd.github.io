---
title: "Changing php-fpm 'pm' settings in App Service Wordpress on Linux"
author_name: "Anthony Salemo"
tags:
    - Deployment
    - Configuration
    - Azure App Service on Linux
    - Wordpress
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Wordpress
    - Deployment # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/WordPress.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-08-17 12:00:00
---

This post describes how to change php-fpm settings in Wordpress on App Service Linux.

# Overview
Wordpress on App Service Linux Docker Images utilize `php-fpm`, which can have various settings be changed if needed. The current settings are set to generous defaults, notably the following which are some of the more popular ones:

```conf
pm.max_children = 50
pm.start_servers = 20
pm.min_spare_servers = 5
pm.max_spare_servers = 35
```

A typical reason for wanting to change some of these is if `[pool www] server reached pm.max_children setting (50), consider raising it` is seen. Although there are other core reasons why this is likely appearing aside from the fact that simply that max children `php-fpm` processes were hit. That is however outside of this post.

# Configuration
The settings talked about here are found in `zz-docker.conf` under `/usr/local/etc/php-fpm.d/zz-docker.conf`. The default file contains the following currently:

```conf
[global]
daemonize = no

[www]
;listen = 9000
listen = /var/run/php/php-fpm.sock
listen.owner = nginx
listen.group = nginx
listen.mode = 0660

pm = dynamic
pm.max_children = 50
pm.start_servers = 20
pm.min_spare_servers = 5
pm.max_spare_servers = 35
```

Although `www.conf` has the same settings, changing this (even with reloading `php-fpm` and `nginx`) will not have `php-fpm` pick up these changes. This can be confirmed with the `php-fpm -tt` CLI command or, depending on what was changed (like `pm.start_servers`), you can use `top` or `ps`.

Rationale on why this file exists and may be used over `www.conf` can be found in this PHP-FPM GitHub thread - [Documentation regarding configuration. - Issue #241](https://github.com/docker-library/php/issues/241)

1. Through WebSSH in the application container, Copy over the existing `zz-docker.conf` file from `/usr/local/etc/php-fpm.d/zz-docker.conf` to `/home/dev/`.
2. Make the desired changes in `zz-docker.conf`. As an example, we'll change `pm.max_children` to `40` and `pm.start_servers` to `10`.

```conf
... other settings
pm = dynamic
pm.max_children = 40
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 35
... other settings
```

3. Follow [How to run Bash scripts in WordPress on Azure App Service (techcommunity)](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/how-to-run-bash-scripts-in-wordpress-on-azure-app-service/ba-p/3625692) / [How to run Bash scripts in WordPress on Linux App Services (GitHub)](https://github.com/Azure/wordpress-linux-appservice/blob/main/WordPress/running_post_startup_scripts.md) regarding the startup script location under `/home/dev/startup.sh`

4. Add the following to your `/home/dev/startup.sh` file:

```bash
#!/bin/bash

cp /home/dev/zz-docker.conf /usr/local/etc/php-fpm.d/
echo "Copied /home/dev/zz-docker to /usr/local/etc/php-fpm.d/"
```

You can confirm this was executed by running `cat /tmp/post-startup-script-stdout---supervisor-xxxxxxxx.log`

> **NOTE**: If they are any errors with startup script execution they'll be logged in `/tmp/post-startup-script-stderr---supervisor-xxxxxxxx.log`

5. Restart the site.
6. Validate the changes. Run `php -tt`, below is a truncated output example - we can our `pm.max_children` and `pm.start_servers` change:

```
[18-Jan-2024 18:46:49] NOTICE:  pm = dynamic
[18-Jan-2024 18:46:49] NOTICE:  pm.max_children = 40
[18-Jan-2024 18:46:49] NOTICE:  pm.start_servers = 10
[18-Jan-2024 18:46:49] NOTICE:  pm.min_spare_servers = 5
[18-Jan-2024 18:46:49] NOTICE:  pm.max_spare_servers = 35
[18-Jan-2024 18:46:49] NOTICE:  pm.max_spawn_rate = 32
[18-Jan-2024 18:46:49] NOTICE:  pm.process_idle_timeout = 10
[18-Jan-2024 18:46:49] NOTICE:  pm.max_requests = 500
[18-Jan-2024 18:46:49] NOTICE:  pm.status_path = undefined
[18-Jan-2024 18:46:49] NOTICE:  pm.status_listen = undefined
```

7. Next, again depending on what was changed, you can use `top` to validate this. Since `pm.start_servers` is a change you can easily visually see by the number of `php-fpm` child processes at "rest", we can count the ones we see:

```
263   184 nginx    SN    594m  19%   0   0% php-fpm: pool www
266   184 nginx    SN    594m  19%   0   0% php-fpm: pool www
265   184 nginx    SN    594m  19%   0   0% php-fpm: pool www
184   182 root     SN    591m  18%   0   0% php-fpm: master process (/usr/local/etc/php-fpm.conf)
271   184 nginx    SN    591m  18%   0   0% php-fpm: pool www
264   184 nginx    SN    591m  18%   0   0% php-fpm: pool www
272   184 nginx    SN    591m  18%   0   0% php-fpm: pool www
270   184 nginx    SN    591m  18%   0   0% php-fpm: pool www
267   184 nginx    SN    591m  18%   0   0% php-fpm: pool www
268   184 nginx    SN    591m  18%   0   0% php-fpm: pool www
269   184 nginx    SN    591m  18%   0   0% php-fpm: pool www
```

We can confirm there is a default of 10 `php-fpm` child processes.

Knowing the above, other settings can be changed as needed in the `zz-docker.conf` file, although in most cases, this does not need to be done.