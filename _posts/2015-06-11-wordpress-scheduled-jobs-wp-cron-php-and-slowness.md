---
title: "WordPress Scheduled Jobs (wp-cron.php) and Slowness"
tags:
  - azure
  - Azure Web Jobs
  - Cron Jobs
  - mysql
  - PHP
  - php wordpress troubleshooting wordpress
  - Web Apps
  - Web Jobs
  - WebJob
  - wordpress troubleshooting
categories:
  - PHP
  - WordPress
  - Performance
date: 2015-06-11 13:11:13
author_name: Mangesh Sangapu
---

**Overview**

In Unix/Linux, a cron job is a task that can be configured to run at specific times or intervals. This is no different than a [Web Job in Azure](https://azure.microsoft.com/en-us/documentation/articles/web-sites-create-web-jobs/).

However, in regard to WordPress, crons are invoked from wp-cron.php. For every request, WordPress runs a check to see if it’s time to invoke a cron. This is an unnecessary call and should be avoided. In this article, we will look at the default crons shipped with WordPress and look at ways we can improve our site performance.

* * *

**Default WordPress Jobs**

By default, WordPress ships with several crons:

|**Cron Name**|**Codex Description**|
|---|---|
|wp\_version\_check|Check WordPress version against the newest version. The WordPress version, PHP version, and Locale is sent. Checks against the WordPress server at api.wordpress.org server. Will only check if WordPress isn’t installing.|
|wp\_update\_plugins|Check plugin versions against the latest versions hosted on WordPress.org. The WordPress version, PHP version, and Locale is sent along with a list of all plugins installed. Checks against the WordPress server at api.wordpress.org. Will only check if WordPress isn’t installing.|
|wp\_update\_themes| Check theme versions against the latest versions hosted on WordPress.org. A list of all themes installed in sent to WP. Checks against the WordPress server at api.wordpress.org. Will only check if WordPress isn’t installing.|
wp\_maybe\_auto_update|Performs WordPress automatic background updates.|
|wp\_scheduled\_delete|Permanently deletes posts, pages, attachments, and comments which have been in the trash for EMPTY\_TRASH\_DAYS.

However, these are not easily visible to the user. Never fear because just like “there’s an app for that”, in WordPress, there’s a Plugin for that! – [WP Crontrol](https://wordpress.org/plugins/wp-crontrol/)  ([https://wordpress.org/plugins/wp-crontrol/](https://wordpress.org/plugins/wp-crontrol/ "https://wordpress.org/plugins/wp-crontrol/"))

This plugin can be used to view crons and modify their recurrence.

[![5732.crontrol1[1]](/media/2019/03/3465.5732.crontrol11_thumb_3A71E563.png "5732.crontrol1[1]")](/media/2019/03/8156.5732.crontrol11_342B0ED5.png)

* * *

**WordPress Slowness**

An important thing to note is the time/date of when the crons are scheduled to run. If you ever happen to see slowness on your site during this time, you probably want to disable the cron event in question. To disable a cron event, click Edit, then clear the “Next run (UTC)” field (reverts to now) and change the “Event Schedule” to non-repeating like so:

![](/media/2019/03/0184.crontrol2.png)

**Remember that these events can always run as needed.**

* * *

**Disable All Crons**

If you would like to disable all crons, you will need to add this line to your wp-config.php.

define(‘DISABLE\_WP\_CRON’, true);

* * *

**Configuring WordPress Crons through Azure Web Jobs**

After you’ve disabled the crons by following the step in the previous section. Instead of having WordPress check at each and every request whether a job should run, an alternative solution is to create an Azure Web Job.

Here’s a snippet that can be saved as a .bat file. Be sure to update the **x** to match your version of PHP.

"D:\\Program Files (x86)\\PHP\\v5.**x**\\php.exe" D:\\home\\site\\wwwroot\\wp-cron.php cli/auto

Once this .bat file is saved, compress as a .zip and upload your [Azure Web Job](https://azure.microsoft.com/en-us/documentation/articles/web-sites-create-web-jobs/). Since most of the cron events are scheduled every 12 hours, we recommend the same for this scheduled job.

Now your WordPress website doesn’t have to worry about if/when the cron will get invoked on every single request.