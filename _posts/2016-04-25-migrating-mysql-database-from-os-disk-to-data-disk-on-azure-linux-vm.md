---
title: " Migrating MySQL database from OS disk to Data disk on Azure Linux VM"
tags:
  - mysql linux migration data
  - mysql os disk data disk azure linux
categories:
  - MySQL
  - Azure VM
  - Performance
  - How-To
date: 2016-04-25 18:24:50
author_name: Srikanth S.
toc: true
toc_sticky: true
header:
    teaser: /assets/images/VM-Linux.svg
---

**NOTE: Please take a backup of your MySQL databases before attempting migration. Taking backups is always a good process before attempting to make changes. Migrating without taking backups can lead to serious issues including data loss.** There are many cases where customer installs MySQL on OS disk without his knowledge. Most of MySQL installs put data directory in /var/lib/mysql. Putting MySQL data files on OS disk can have performance impact because of I/O contention. Particularly so if you are expecting higher performance from MySQL. How do you install MySQL:

*   **Ubuntu**: sudo apt install mysql-server
*   **CentOS**: sudo yum install mariadb-server

How to migrate Data from OS disk to Data Disk.

## Attach Data Disks
1.  First attach data disks to your VM. Based on IOPS performance and storage requirements, attach disks accordingly. In this blog we will attach two data disks.
    *   Follow this article to attach 2 new empty disks. Procedure is same for both V1 (Classic)/V2 (ARM) VM. [https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-linux-attach-disk-portal/](https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-linux-attach-disk-portal/)
    *   [![clip_image001](/media/2016/04/clip_image001_thumb16.png "clip_image001")](/media/2016/04/clip_image00121.png)
    *   If you see an error when adding disk like this:
        
        **A disk named 'xyzabc-2016mmddetc' already uses the same LUN: 0. This is because you added the disks in succession too fast.** 
        
        Wait for some time and then retry. It will succeed.
    *   Once configured you should see 2 disks like below:
    *   [![clip_image002](/media/2016/04/clip_image002_thumb9.png "clip_image002")](/media/2016/04/clip_image00214.png)

## Create RAID Device

2.  Create a software raid device using the disks attached. **Please note that all commands are run logged in as root in this blog. You can do the same or run from individual id's with sudo.**

   - Follow this article to achieve that: [https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-linux-configure-raid/](https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-linux-configure-raid/). Below are a series of screenshots from my demo (on Ubuntu 14.04) to illustrate the steps performed to create a software raid device.
    [![clip_image003](/media/2016/04/clip_image003_thumb4.png "clip_image003")](/media/2016/04/clip_image0039.png)
    [![clip_image004](/media/2016/04/clip_image004_thumb6.png "clip_image004")](/media/2016/04/clip_image00410.png)

  - You may be prompted for a window to choose mail settings. You can safely choose No Configuration and click ok.
    [![clip_image005](/media/2016/04/clip_image005_thumb3.png "clip_image005")](/media/2016/04/clip_image0056.png)
    [![clip_image006](/media/2016/04/clip_image006_thumb8.png "clip_image006")](/media/2016/04/clip_image00612.png)
    [![clip_image007](/media/2016/04/clip_image007_thumb3.png "clip_image007")](/media/2016/04/clip_image0076.png)
    [![clip_image008](/media/2016/04/clip_image008_thumb5.png "clip_image008")](/media/2016/04/clip_image0089.png)

  - In below screenshot, i have used nobootwait. nobootwait works for ubuntu, but does not for CentOS. So you would need to replace ****nobootwait**** with ****nofail**** for CentOS.
    [![clip_image009](/media/2016/04/clip_image009_thumb2.png "clip_image009")](/media/2016/04/clip_image0092.png)
    [![clip_image010](/media/2016/04/clip_image010_thumb2.png "clip_image010")](/media/2016/04/clip_image0103.png)
3.  Once you followed above steps, you should see a directory /data mounted with raid device md127. You can check last image in above step. /dev/md127 is mounted as /data.

## Moving MySQL Data
4.  Now we start the process of moving data for MySQL.
5.  First Stop MySQL Service:
    *   Ubuntu: service mysql stop
    *   CentOS: service mariadb stop
6.  Copy data from /var/lib/mysql to /data/mysql. For this cd to /data and run this command without doublequotes: "rsync -aux /var/lib/mysql .". If you don't find rsync, you can install rsync package. Then rename /var/lib/mysql folder to /var/lib/mysql_old. Then create a symlink to /data/mysql in /var/lib folder. This is the command from /var/lib directory: "ln -s /data/mysql mysql"
    *   [![clip_image011](/media/2016/04/clip_image011_thumb3.png "clip_image011")](/media/2016/04/clip_image0113.png)

## Start MySQL
7.  Now go ahead and start mysql. Let's see if it starts. MySQL does not startup. This is because we need to make some more changes for different flavors of Linux.

### For Ubuntu 14.04 or lower (Tested with 14.04).
  *   Change permissions on /var/lib/mysql. Command to run is: chown -R mysql:mysql /var/lib/mysql
  *   If AppArmor is not enabled you do not need to do below. But it is recommended to have AppArmor enabled for security. Follow below steps to allow mysql access through AppArmor:
    [![clip_image012](/media/2016/04/clip_image012_thumb2.png "clip_image012")](/media/2016/04/clip_image0123.png)
  *   Add below two lines to allow access for mysqld process and save the file:
    [![clip_image013](/media/2016/04/clip_image013_thumb4.png "clip_image013")](/media/2016/04/clip_image0134.png)
  *   Restart apparmor service issuing this command: service apparmor restart.
  *   Now fire up mysql service and you should see it will start up.
     [![clip_image014](/media/2016/04/clip_image014_thumb1.png "clip_image014")](/media/2016/04/clip_image0141.png)

### For Ubuntu 16.04
  *   Ubuntu 16.04 comes with MySQL 5.7.x. This introduces new folders for MySQL to handle under /var/lib. These are /var/lib/mysql-files which limits import/export operations and /var/lib/mysql-keyring for secure storage.
  *   So we need to create a folder under /data for mysql-files and mysql-keyring similar to mysql folder and create links similar to what we did in step 6 above.
     [![blog2](/media/2016/04/blog2-300x28.jpg)](/media/2016/04/blog2.jpg)
     [![blog3](/media/2016/04/blog3-300x66.jpg)](/media/2016/04/blog3.jpg)
  *   Then we add these folders for apparmor restrictions into /etc/apparmor.d/usr.sbin.mysqld file.
     [![blog1](/media/2016/04/blog1-286x300.jpg)](/media/2016/04/blog1.jpg)
  *   Now restart apparmor service and then restart mysql service.

### For CentOS/Oracle Linux 7.x (Tested with CentOS 7.1 and Oracle Linux 7.0).
  *   If selinux is disabled you do not need to do below. It is not recommended, but if you want to disable selinux, you can just run "setenforce 0" and this will set selinux to permissive mode and MariaDB should startup fine without below changes. But it is recommended to have selinux enabled for security. Follow below steps to allow mysql access through selinux:
  *   First cd to /var/lib folder and change ownership on mysql symlink. It should be owned by mysql:mysql.
     [![clip_image015](/media/2016/04/clip_image015_thumb1.png "clip_image015")](/media/2016/04/clip_image0151.png)
  *   Then run below commands to change selinux execution context for /var/lib/mysql and /data/mysql. If you see any error here, change directory to /root and try executing the semanage command again. Then run restore context, so that changes take immediate effect.
    [![clip_image016](/media/2016/04/clip_image016_thumb1.png "clip_image016")](/media/2016/04/clip_image0161.png)
    [![clip_image017](/media/2016/04/clip_image017_thumb1.png "clip_image017")](/media/2016/04/clip_image0171.png)
    [![clip_image018](/media/2016/04/clip_image018_thumb2.png "clip_image018")](/media/2016/04/clip_image0182.png)
    [![clip_image019](/media/2016/04/clip_image019_thumb3.png "clip_image019")](/media/2016/04/clip_image0193.png)
    [![clip_image020](/media/2016/04/clip_image020_thumb2.png "clip_image020")](/media/2016/04/clip_image0202.png)

## Conclusion
8.  This completes the steps to move MySQL data from OS disk to Data Disks.
9.  Once this has been completed, you can refer to my [blog](/2015/03/27/performance-tuning-mysql-database-on-azure-linux-vms/ "Performance Tuning MySQL Database on Azure Linux VM’s") on how to performance tune your MySQL database.

****NOTE: Please take a backup of your MySQL databases before attempting migration. Taking backups is always a good process before attempting to make changes. Migrating without taking backups can lead to serious issues including data loss.****