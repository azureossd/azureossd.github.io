---
title: "PHP Error Log on Azure Website"
tags:
  - PHP
  - php error log azure webapps
  - PHP troubleshooting
categories:
  - PHP
date: 2015-04-15 07:54:00
author_name: Yi Wang
---

1\. E\_ERROR - Fatal run-time errors. These are the errors that can not be recovered, execution of the script is halted (<http://php.net/manual/en/errorfunc.constants.php>)

2\. When fatal errors happen, you could see http 500 internal server error or a blank page on your browser

3. PHP error log is an important log file for troubleshooting. if you use default php runtime environment on Azure website, this log file is default to "php\_errors.log", in LogFiles directory, it is predefined in pnp.ini, you can see it in phpinfo page, eg.

![](/media/2019/03/8345.phpinfo-03.PNG)

 

4\. Broadly used directives for error display and error logging include:

**error\_reporting** - set the error reporting level, see predefined constants for values (<http://php.net/manual/en/errorfunc.constants.php>)

**display\_errors** - determines if errors should be displayed to screen, it takes string value "On" or "Off"

**display\_startup\_errors** - Errors that occur during PHP startup are not displayed even display\_errors is turned on. This could happen when there are parse errors. You need to turn on display\_startup\_errors for these cases. This option is recommended for debugging only.

**log\_errors** - determines whether script error messages should be logged to server's error log

**error\_log** - It defines the path where script errors should be logged.

Refer to <http://php.net/manual/en/errorfunc.configuration.php> for more detail.

 

5\. **How to enable error log**

Most errors and logging options can be set in user script using ini\_set() or user level ini file. When you see log\_errors is Off from phpinfo, you can turn it on in D:\\home\\site\\wwwroot\\.user.ini, eg.

log\_errors=On\
6. Manage error log file

By default, PHP log all types of errors (E\_ALL, integer value 32767).

![](/media/2019/03/5807.errror_eall.PNG)

With current implementation on Azure, php\_errors.log is not managed by system, you need to maintain it to proper size. You can reduce the volume of log message by changing error log level.

In production environment, it is reasonable to stop logging E\_NOTICE, E\_STRICT, E\_DEPRECATED, to exclude these errors, reset the value of error\_reporting in D:\\home\\site\\wwwroot\\.user.ini, eg.

error\_reporting = **`E_ALL`** & \~**`E_NOTICE`** & \~**`E_STRICT`** & \~**`E_DEPRECATED`**

 

Check phpinfo to confirm the change:

![](/media/2019/03/8816.php_errors.PNG)
