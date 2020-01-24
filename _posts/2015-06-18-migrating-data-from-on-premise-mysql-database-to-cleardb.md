---
title: "Migrating data from On-Premise MySQL Database to ClearDB - Deprecated"
tags:
  - ClearDB upgrade
  - database migration
  - MySQL migrate
  - MySQL upgrade
categories:
  - ClearDB
  - MySQL
date: 2015-06-18 15:25:00
author_name: Srikanth S.
---

**Note: Please keep multiple copies of your database when migrating data, so you can fallback if any issues occur.**

This blog is to help customers migrate their data from On-Premise MySQL database to ClearDB.

We will use a single self-contained file export to migrate your On-Premise database. You can only use Self-Contained File export for MySQL databases running InnoDB Storage engine. There are multiple ways to export data from your On-Premise Database:

*   Using mysqldump command line utility.
*   Using MySQL Workbench Data Export menu option.
*   Using phpmyadmin, if your application is php based.

**Exporting data using mysqldump:**

You can run below command to export data from MySQL.

mysqldump --set-gtid-purged=OFF --user=username --host=**hostname** --protocol=tcp --port=**3306** --default-character-set=utf8 --single-transaction=TRUE --routines --events  --password -r "**\\path\\to\\dump\\file**" -n "**dbschemaname**"

All items that are in bold will need to be replaced by the actual values.

**Exporting data using MySQL Workbench Data Export menu option:**

You will need to download and install MySQL Workbench to export data using this option. Once MySQL Workbench is installed, you can open it and connect to your On-Premise Database and use Server –> Data Export menu option.

[![image](/media/2019/03/1777.image_thumb_3255B81B.png "image")](/media/2019/03/3731.image_3E57A84F.png)

This should open up a window to select the schemas or tables that you want to export. Choose all the data you need to export and also select the options selected under “Export Options” and “Objects to Export” sections appropriately.

[![image](/media/2019/03/5415.image_thumb_48AB5D60.png "image")](/media/2019/03/6472.image_426486D2.png)

Once you click on “Start Export”, this should generate a file specified in the “Export to Self-Contained File” section.

**Exporting data using phpmyadmin option:**

You can export data from phpmyadmin application using the Export tab. After selecting the database you want to export, select “Export Method” as “Custom – display all possible options”. Other than the default checked items, you will need to check only “Add Drop Table/View/Procedure/Function/Event/Trigger Statement” checkbox in “Object creation options”.

[![image](/media/2019/03/0181.image_thumb_7F1C0F62.png "image")](/media/2019/03/7485.image_63E3B661.png)

Once you click on Go, it will export data and download a file to your PC. This is your database export file.

Once you have exported your data, there are multiple ways to get your data into ClearDB. We will go over these three options:

*   Using MySQL command line utility
*   Using MySQL Workbench
*   Using phpmyadmin, if your application is php based.

Before importing data, you will need to create a ClearDB database from azure portal. Information about ClearDB connection can be found on management portal or the new preview portal.

On Management Portal:

[![image](/media/2019/03/5633.image_thumb_282648D6.png "image")](/media/2019/03/4718.image_063AE652.png)

On Preview Portal:

[![image](/media/2019/03/0882.image_thumb_6C6940D3.png "image")](/media/2019/03/4744.image_5850244A.png)

All options will need you to modify the file that was created as part of the export. Open the .sql file created and add this line to the start of the file.

use ‘databaseschemaname’;

databaseschemaname should be the database name that will be created when you create a ClearDB database. You should be able to look it up on management portal under your website dashboard through “view connection strings” link.

**Importing data using MySQL command line utility:**

MySQL command line utility “mysql” is normally located in your MySQL installation or under MySQL workbench installation. Run below command with proper username, hostname and the path of the sql file created. Also modify the sql file to add use statement at the start.

mysql –u username –p –h hostname < /path/to/sql/file

This should prompt you for the password. Your data should be populated in ClearDB on successful login.

**Importing data using MySQL Workbench:**

Connect to your ClearDB database using the information provided in Azure management portal. After successful login, open the sql file created during export and execute the file ( after adding use databaseschemaname line). Make sure you select all on the file and then click on execute or place the cursor at the start of the file before clicking on execute. This should import all your data into ClearDB.

[![image](/media/2019/03/8345.image_thumb_30AC38D1.png "image")](/media/2019/03/0728.image_358EEC8D.png)

**Importing data using phpmyadmin:**

Login into your phpmyadmin site and browse to Import tab. Browse to the file created during export and run the import. This should import all your data into ClearDB.

[![image](/media/2019/03/3021.image_thumb_54D42411.png "image")](/media/2019/03/1325.image_399BCB10.png)

This should migrate your data into ClearDB from On-Premise MySQL database.