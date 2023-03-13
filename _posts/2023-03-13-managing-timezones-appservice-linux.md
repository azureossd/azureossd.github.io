---
title: "Manage Timezones in App Service Linux"
author_name: "Edison Garcia"
tags:
    - TimeZone
    - App Service Linux
    - Configuration
categories:
    - Azure App Service on Linux
    - Configuration 
header:
    teaser: /assets/images/azurelinux.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2023-03-13 12:00:00
---

By default, the time zone for the app is always UTC. You can change it to any of the valid values that are listed in [TZ timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones). 

![TimeZone](/media/2023/03/timezone-01.png)


If the specified value isn't recognized, UTC is used. There is a different between Windows and Linux, for Windows check this [reference](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-vista/cc749073(v=ws.10)). 


# Configuration

To configure the timezone it is really simple, you need to identify the correct value from the [TZ database list]((https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)) and then add an app setting from **Configuration** and then **Application Settings**.

You can use **`WEBSITE_TIME_ZONE`** or **`TZ`** app setting with the correct value.

![TimeZone Config](/media/2023/03/timezone-02.png)

This change will restart the container, then you can use WebSSH and check the current date with the change.

![TimeZone Config](/media/2023/03/timezone-03.png)

# Troubleshooting

In case the change is not being updated, you can get the latest tzdata list from the distro repository through `apt install tzdata` for Debian based or `apk add tzdata` for Alpine images and build a custom startup script. Here is an example for Alpine:

```shell
#!/bin/bash
 
apk update
apk add --no-cache tzdata
cp /usr/share/zoneinfo/$WEBSITE_TIME_ZONE /etc/localtime
echo $WEBSITE_TIME_ZONE > /etc/timezone
```
