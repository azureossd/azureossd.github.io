---
title: " \"Test mail could not be sent.\" or \"Could not instantiate mail function\" in Joomla Mail Settings sending a test mail.\t\t"
tags:
  - Joomla
  - SMTP
categories:
  - Azure App Service on Windows
  - Joomla
  - PHP
  - Debugging
date: 2016-05-16 17:03:47
author_name: Edison
header:
  teaser: "/assets/images/SendGrid.svg"
---

If you are getting the following error "**Test mail could not be sent**." or **"Could not instantiate mail function."** trying to send a test email from the **Joomla Mail Settings**, this is because Azure Web Apps don't support smtp or email service by default. Customers need to configure a third party smtp service and add it to Joomla settings. [![Joomla Test Email Error 1](/media/2016/05/135.png)](/media/2016/05/135.png) You can use [SendGrid](https://sendgrid.com/) that is a [cloud-based email service](https://sendgrid.com/email-solutions) and add it to your Joomla site configuration. Please review the following reference to know more about this service. [https://azure.microsoft.com/en-us/documentation/articles/store-sendgrid-mobile-services-send-email-scripts](https://azure.microsoft.com/en-us/documentation/articles/store-sendgrid-mobile-services-send-email-scripts)

* * *

## How to create a SendGrid account
Create a SendGrid is easy, you just need to go to Azure portal ([http://portal.azure.com](http://portal.azure.com)) and follow these steps:

1.  Click on "**New**" button.
2.  Select Marketplace and type for "**SendGrid**".
3.  Choose the one that is related to "**SendGrid Email Delivery**".
4.  And then clic on "**Create**" button.
5.  Fill all required files on the form. (Select a pricing tier, contact information, review also the legal terms)

After you set up the SendGrid account, you will see your configurations (username, smtp server, etc). You can use this information to complete Joomla Mail Settings. [![SendGrid settings](/media/2016/05/416.png)](/media/2016/05/416.png)

* * *

  **How to add SendGrid configuration to Joomla Mail Settings** Inside the "**Global Configuration**", select "**Server**" tab and select the following settings: 1.- Change the **Mailer** option to "**SMTP**" 2.- Type a "**From email**" sender. 3.- Choose the **SMTP Security**. For example:

*   You can set SMTP Security to **none** and use port **25**. (_SendGrid recommends customers to use port **587** to avoid any rate limiting that your server host may apply_.)
*   Or use SMTP Security to **SSL** and use port **465**.

You can find more documentation about **SendGrid SMTP Ports** in this reference: [https://sendgrid.com/docs/Classroom/Basics/Email\_Infrastructure/smtp\_ports.html](https://sendgrid.com/docs/Classroom/Basics/Email_Infrastructure/smtp_ports.html) [![Joomla Mail Settings](/media/2016/05/514.png)](/media/2016/05/514.png) [![Sending Joomla Test email](/media/2016/05/616.png)](/media/2016/05/616.png) If everything is working fine, you are going to receive a test email like this: [![Test email Joomla](/media/2016/05/713.png)](/media/2016/05/713.png) Check the following references for more information about PHP & SendGrid:

*   [https://azure.microsoft.com/en-us/documentation/articles/store-sendgrid-php-how-to-send-email/](https://azure.microsoft.com/en-us/documentation/articles/store-sendgrid-php-how-to-send-email/)
*   [https://sendgrid.com/docs/Integrate/Partners/Microsoft_Azure.html](https://sendgrid.com/docs/Integrate/Partners/Microsoft_Azure.html)