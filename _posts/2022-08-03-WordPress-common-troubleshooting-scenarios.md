---
title: "WordPress common troubleshooting scenarios"
author_name: "Arjun Baliga"
tags:
    - Azure App Service
    - WordPress
    - Mixed content error
    - Too many redirects
    - Debug WordPress
    - Troubleshooting
categories:
    - Azure App Service
    - WordPress
    - Mixed content error
    - Too many redirects
    - Debug WordPress
    - Troubleshooting
header:
    teaser: "/assets/images/azure-containerapps-logo.png" 
toc: true
toc_sticky: true
date: 2022-08-03 12:00:00
---
# Mixed Content error on WordPress site 
What does the mixed content error message indicate?

Normally when resources like image, CSS or JS files are requested with HTTPS and if they are loaded with HTTP protocol this can have an effect of mixed content error. 
 
You can confirm if your site is being affected by mixed content errors by checking the browser inspect element console. 
<br/><b>Error Message</b> - 
Mixed Content the page URL was loaded over HTTPS but requested an insecure stylesheet.
 >![WordPress common troubleshooting scenarios](/media/2022/08/mixed-content-error.png)

Most browsers follow the RFC for Mixed Content, you can find information relevant on this restriction here:
 https://www.w3.org/TR/mixed-content/ and https://tools.ietf.org/html/rfc6797.

<br/><b>How to resolve the mixed content error?<b>
1. In the wp-config.php, please check the below configurations like WP_HOME and WP_SITEURL settings are set properly as per your requirement. Please refer to the screenshot below for the recommended settings.
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] == 'https')
<br/>$_SERVER['HTTPS'] = 'on';
<br/>$http_protocol='http://';
<br/>if (!preg_match("/^localhost(:[0-9])*/", $_SERVER['HTTP_HOST']) && !preg_match("/^127\.0\.0\.1(:[0-9])*/", $_SERVER['HTTP_HOST'])) {
<br/>	$http_protocol='https://';
<br/>}
 >![WordPress common troubleshooting scenarios](/media/2022/08/wp_home_site_url.png)

 2.	In the Azure Portal within the custom domains tab check if the setting HTTPS only is tuned on. 
 >![WordPress common troubleshooting scenarios](/media/2022/08/appservice_http_only.png)

 3. Purge the Wordpress cache from the admin Dashboard. 
  >![WordPress common troubleshooting scenarios](/media/2022/08/wp_admin_clear_cache.png)
 4. If you're still facing mixed content error search for HTTP references in the database and replace it with HTTPS. You can easily do it using the plugins below -
[Better Search and Replace](https://wordpress.org/plugins/better-search-replace/)
[Search & Replace](https://wordpress.org/plugins/search-and-replace/)

5. Please install the WordPress plugin SSL Insecure Content Fixer and select the appropriate HTTPS detection method as in the screenshot below. For example,HTTP_X_ARR_SSL setting works for Azure Linux App Service blessed images. 
 >![WordPress common troubleshooting scenarios](/media/2022/08/wp_detect_http_setting.png)

# How to Debug WordPress Errors
If your WordPress page is encountering application issues without the detailed error, please use the below steps to debug further. 
  >![WordPress common troubleshooting scenarios](/media/2022/08/wp_critical_error.png)

1.	Edit the wp-config.php file and look for the following line of code:
<br/>define(‘WP_DEBUG’, false);
<br/>Please update the line to the changes below - 
<br/>define(‘WP_DEBUG’, true);
<br/>define(‘WP_DEBUG_LOG’, true);
<br/>define(‘WP_DEBUG_DISPLAY’, false);
<br/>@ini_set(‘display_errors’,0);
2.	Check debug.log inside wp-content folder and application logs for the detailed error. 
3.	Once you fix the issue please revert the changes done in step 1.

# How to resolve if the WordPress site is encountering too many redirects issue
1.	 Review the SSL, home_url and site_url configurations are set properly in your wp-config.php. Please refer to the screenshot and code below for the recommneded settings.
<br/>if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] == 'https')
<br/>$_SERVER['HTTPS'] = 'on';
<br/>$http_protocol='http://';
<br/>if (!preg_match("/^localhost(:[0-9])*/", $_SERVER['HTTP_HOST']) && !preg_match("/^127\.0\.0\.1(:[0-9])*/", $_SERVER['HTTP_HOST'])) {
<br/>	$http_protocol='https://';
<br/>}
<br/>define('WP_HOME', $http_protocol . $_SERVER['HTTP_HOST']);
<br/>define('WP_SITEURL', $http_protocol . $_SERVER['HTTP_HOST']);
 >![WordPress common troubleshooting scenarios](/media/2022/08/wp_home_site_url.png)
2.	Disable all plugins by renaming the plugins folder to check if the redirection is being caused by any of the plugins. 
3.	Please check if the WordPress admin URL https://<site home url>/wp-admin or any other inside URLs also facing too may redirection issue. 
4.	Review the server configuration files like .htaccess or web.config or nginx config files for any redirect rules that have been configured and update the settings accordingly. 