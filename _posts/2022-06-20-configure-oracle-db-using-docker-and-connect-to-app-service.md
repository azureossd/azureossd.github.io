---
title: "Configure a Oracle DB on Linux VM using Docker and Add Sample Data"
author_name: "Aldmar Joubert"
tags:
    - Azure App Service on Linux
    - Configuration
    - Oracle
    - Database
categories:
    - Azure App Service on Linux    
    - How-To
    - Configuration
    - Database
header:
    teaser: "/assets/images/azurelinux.png" 
toc: true
toc_sticky: true
date: 2022-06-08 12:00:00
---

# Prerequisites

+ Choose the Oracle DB Version: https://github.com/oracle/docker-images/tree/main/OracleDatabase/SingleInstance
+ Create a volume mount in your local directory
+ Add appropriate permissions to volume: chmod -R o+w /home/<-user->/databases/oracle

<br>

# Build the Database Image
1. clone the Oracle Docker Images repository onto your virtual machine
```git
git clone https://github.com/oracle/docker-images.git
```
2. Navigate to the directory that contains the Dockerfile for the version of the Oracle database you would like to run

```cmd
cd /home/<-user->/docker-images/OracleDatabase/SingleInstance/dockerfiles/19.3.0
```

3. Once inside the directory, build the image
```docker
 docker build -t oracle-standard:19.3.0 .
```
 
# Run image and wait approximately 45 mins

```docker
docker run --rm --name oracle19c \
-d -p 1521:1521 -p 5500:5500 \
-e ORACLE_SID=ORCLCDB \
-e ORACLE_PDB=ORCLPDB1 \
-e ORACLE_PWD=Azure123 \
-e ORACLE_CHARACTERSET=AL32UTF8 \
-v /home/<-user->/databases/oracle:/opt/oracle/oradata \
oracle-standard:19.3.0
```
 
Create a Database User
=============================================
To run commands from within the container:

```docker
docker exec -it oracle19c /bin/bash -c "source /home/oracle/.bashrc; sqlplus /nolog"
```

```SQL
connect sys as sysdba; (No password needed)
CREATE USER c##azure IDENTIFIED BY azure;
GRANT ALL PRIVILEGES TO c##azure;
```
 
# Test Connection with Oracle SQL Developer and Add Sample Data

Using Oracle SQL Developer to connect to the database and create a table with the previous user. Make sure the default port is exposed on the VM.

![Oracle SQL Developer Connection](/media/2022/06/azure-ossd-oracle-SQL-developer.png)

```sql
CREATE TABLE people ( 
  person_id   INTEGER NOT NULL PRIMARY KEY, 
  given_name  VARCHAR2(100) NOT NULL, 
  family_name VARCHAR2(100) NOT NULL, 
  title       VARCHAR2(20), 
  birth_date  DATE 
);

INSERT INTO people VALUES (1, 'Dave', 'Badger', 'Mr', date'1960-05-01');

SELECT * FROM people;
```

Access Oracle DB from PHP App Service
=====================================
[Access Oracle Databases from Azure Web Apps using OCI8 drivers with PHP](https://azureossd.github.io/2016/02/23/access-oracle-databases-from-azure-web-apps-using-oci8-drivers-with-php/index.html)


