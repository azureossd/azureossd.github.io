---
title: "Using MySQL clients to connect to a MySQL database from App Service Linux"
author_name: "Anthony Salemo"
tags:
    - Linux
    - Network
    - Configuration
    - Azure App Service on Linux
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-01-24 12:00:00
---

This post will cover using MySQL clients from App Service Linux containers to connect to a MySQL database for troubleshooting.

# Overview
Sometimes, you may encounter an issue where an application is having issues connecting to a MySQL database, or, certain queries when done through application code do not generate the result you expected, amongst other potential issues.

Through the **SSH option** on the App Service Linux Kudu site, you can connect to your container and use the below approach. For "Blessed Images", SSH is already enabled. 

For custom images, you may need to enable SSH - if so, review [Enabling SSH on Linux Web App for Containers](https://azureossd.github.io/2022/04/27/2022-Enabling-SSH-on-Linux-Web-App-for-Containers/index.html). If SSH is not able to enabled into a custom image, then what's covered in this blog post may not be able to be done for creating a connection from that particular application.

> **NOTE**: Do not try to install these packages through the "Bash" option - Bash opens a shell in the Kudu container where you're running as `kudu_ssh_user` (non-root) - therefor package installation will fail. This _must_ be done in the application container ("SSH" option).

# Test connectivity
First, it may be good to test general connectivity and name resolution.

**Name resolution**:

You can use the `nslookup` command. Run `nslookup [yourmysqlhost]`. If this is an Azure Database for MySQL server, run `nslookup somemysqlserver.mysql.database.azure.com`, for example.

![nslookup to MySQL](/media/2024/01/mysql-client-1.png)

If this is not installed in the container, run the following:
- Ubuntu/Debian: `apt-get install dnsutils`
- Alpine: `apk add bind-tools`
- Mariner: `tdnf install bind-utils`
- RHEL/CentOS: `yum install bind-utils`

If name resolution fails then subsequent commands and steps below will not work, this will need to be focused on first.


**Connections**:

We can test if the MySQL server is able to establish a connection from us, the client, by using the `nc` (netcat) command.

If this is not installed in the container, run the following:
- Ubuntu/Debian: `apt-get install netcat`
  - **Note**: If you see `E: Package 'netcat' has no installation candidate` use `apt-get install netcat-traditional` instead
- Alpine: `apk add netcat-openbsd`
- Mariner: `tdnf install nc`
- RHEL/CentOS: `yum install nc`

This example is ran within a Debian-based container. We're running the `nc` command `nc -vzn [mysql_ip] [mysql_port]` which confirms that a connection to port 3306 for our MySQL server can be established. If this fails, review if traffic is allowed to the destination (eg., firewall on the server, UDR/RTs, Virtual Appliances, etc.). You should see something like the below.

![nc to MySQL](/media/2024/01/mysql-client-2.png)

# Install the MySQL client
To install the MySQL client, run the following depending on your package manager and distribution:

- Ubuntu/Debian: `apt-get install default-mysql-client`
- Alpine: `apk add mysql mysql-client`
- Mariner: `tdnf install mysql`
- RHEL/CentOS: `yum install mysql`

If you're running a **Ubuntu/Debian** installation and get `E: Package 'mysql-client' has no installation candidate`, make sure that `default-mysql-client` is being installed as the package.

With the `mysql` client now installed, run the command `mysql -u [mysql_user] -h [mysql_host_fqdn] -p`. If this can successfully connect, you'd see something like the below:

![MySQL client to MySQL](/media/2024/01/mysql-client-3.png)

You can now review the databases, tables, execute queries and other information since you're now connected to the target MySQL server:

![MySQL client to MySQL](/media/2024/01/mysql-client-4.png)

If you're unable to connect - the error message should be written to the console, which can be troubleshot further depending on the message itself.
