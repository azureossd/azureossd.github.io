---
title: " Setup Single Sign On with AAD using SimpleSAMLphp"
tags:
  - MediaWiki
  - PHP
  - SSO
categories:
  - PHP
  - How-To
date: 2016-08-15 14:00:16
author_name: Yi Wang
toc: true
toc_sticky: true
---

This blog provides step-by-step instruction on how to setup Single Sign On with Azure AD using SimpleSMPLphp API (apply to MediaWiki site as an example).

## Install and configure SimpleSAMLphp

1. To download SimpleSAMLphp, [https://simplesamlphp.org/download](https://simplesamlphp.org/download) , extract the download to wwwroot/simplesamlphp

2. Configure admin: Edit wwwroot/simplesamlphp/config/config.php,

   - Modify baseurlpath: 'baseurlpath'  => 'simplesamlphp/www/'

  - Set admin login passwoed:      'auth.adminpassword'  => '&lt;your-admin-password>'

  - Browse to simplasamlphp admin page, &lt;your-site-url>/simplesamlphp/www/, login with 'admin' and the password you set in config.php

    ![01](/media/2016/07/016-500x147.png)

3. Generate metadata in XML: Click Federation tab, choose "XML to simpleSAMLphp metadata converter,

    [![02](/media/2016/07/027-500x301.png)](/media/2016/07/027.png)

   - Copy raw XML from  [https://login.windows.net/72f988bf-86f1-41af-91ab-2d7cd011db47/FederationMetadata/2007-06/FederationMetadata.xml ](https://login.windows.net/72f988bf-86f1-41af-91ab-2d7cd011db47/FederationMetadata/2007-06/FederationMetadata.xml)

   paste to "XML metadata" area, and click "Parse", you will see the PHP code populated in "Converted metadata" area.

    - Copy the PHP code into wwwroot/simplesamlphp/metadata/saml20-idp-remote.php

4. Configure authsources: Add following PHP code in wwwroot/simplesamlphp/config/authsources.php:

        Find $config = array( 'default-sp' => array(...), );

   Add the code:

        'idp' => 'https://sts.windows.net/72f988bf-86f1-41af-91ab-2d7cd011db47/',

5. Check the default settings for php sessions, if session.phpsession.cookiename is 'null', set it to 'PHPSESSID'.

## Integrate with MediaWiki site

1. Download SimpleSamlAuth extension from [https://github.com/jornane/mwSimpleSamlAuth/releases](https://github.com/jornane/mwSimpleSamlAuth/releases) , extract to wwwroot/extensions/SimpleSamlAuth
2. Modify LocalSettings.php to require authentication:

        require_once "$IP/extensions/mwSimpleSamlAuth/SimpleSamlAuth.php";

        $wgSamlRequirement = SAML_REQUIRED;

        $wgSamlCreateUser = true;

        $wgSamlUsernameAttr = '[http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'](http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name');

        $wgSamlRealnameAttr = '[http://schemas.microsoft.com/identity/claims/displayname'](http://schemas.microsoft.com/identity/claims/displayname');

        $wgSamlMailAttr = '[http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'](http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name');

        $wgSamlSspRoot = '/libraries/simplesamlphp';

        $wgSamlAuthSource = 'default-sp';

        $wgSamlPostLogoutRedirect = NULL;

 

## Configure authentication in Azure AD

1.  In Azure management portal (classic), select Active Directory from menu, choose Microsoft tenant
2.  Select Application tab, Add your application [![](/media/2016/08/aad-add-app-500x278.png)](/media/2016/08/aad-add-app.png)
3.  Select a name for your application, keep "Web application and/or web API", click next
4.  In "Sign on URL", use home url of your site, for "App ID URL", use the URL to default-sp, e.g. http://&lt;your-site-url>/libraries/simplesamlphp/www/module.php/saml/sp/metadata.php/default-sp
5.  From Configure tab of your application, find "permission to other applications" section, check Enable "sign in and read users' profiles" and "read directory data" under Delegated Permission,save the change.  [![](/media/2016/08/aad-perm-500x202.png)](/media/2016/08/aad-perm.png)

 

**References:**

[https://simplesamlphp.org/](https://simplesamlphp.org/)

[https://www.mediawiki.org/wiki/Extension:SimpleSamlAuth](https://www.mediawiki.org/wiki/Extension:SimpleSamlAuth)