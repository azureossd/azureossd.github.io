---
title: " Send email on App Service using Office 365 (O365)"
categories:
  - Azure App Service Web App
  - PHP
  - Java
  - Mail
  - How-To
date: 2017-03-27 15:06:02
tags:
  - Azure App Service Web App
  - PHP
  - Java
  - Mail
  - Office
author_name: Mangesh Sangapu
toc: true
toc_sticky: true
header:
    teaser: /assets/images/o365.png
---

## For PHP

This is a Proof of Concept to send email using the PHP Mailer library and Office 365.

------------------------------------------------------------------------

From the [PHPMailer GitHub site](https://github.com/PHPMailer/PHPMailer), follow the "Minimal installation" section and download class.phpmailer.php and class.smtp.php.

Copy-paste the code from "A Simple Example" section or use the following:

    <?php
    require 'class.phpmailer.php';
    require 'class.smtp.php';

    $mail = new PHPMailer;

    //$mail->SMTPDebug = 3; // Enable verbose debug output

    $mail->isSMTP(); // Set mailer to use SMTP
    $mail->Host = 'smtp.office365.com'; // Specify main and backup SMTP servers
    $mail->SMTPAuth = true; // Enable SMTP authentication
    $mail->Username = 'from.email@domain.com'; // SMTP username
    $mail->Password = 'password'; // SMTP password
    $mail->SMTPSecure = 'tls'; // Enable TLS encryption, `ssl` also accepted
    $mail->Port = 25; // TCP port to connect to

    $mail->setFrom('from.email@domain.com', 'Name');
    $mail->addAddress('recipient.email@domain.com'); // Add a recipient

    //$mail->addAttachment('/var/tmp/file.tar.gz'); // Add attachments
    //$mail->addAttachment('/tmp/image.jpg', 'new.jpg'); // Optional name
    $mail->isHTML(true); // Set email format to HTML

    $mail->Subject = 'Here is the subject';
    $mail->Body = 'This is the HTML message body <b>in bold!</b>';
    $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

    if(!$mail->send()) {
    echo 'Message could not be sent.';
    echo 'Mailer Error: ' . $mail->ErrorInfo;
    } else {
    echo 'Message has been sent';
    }

I did the above using kudu, so my folder looked like this:

![2017-03-27-diagnostic-console1](/media/2017/03/2017-03-27-Diagnostic-Console1.png)

And I ran the script from the command-line "php mail.php".

![2017-03-27-diagnostic-console2](/media/2017/03/2017-03-27-Diagnostic-Console2.png)


Here's the message that was sent:

![2017-03-27-outlook](/media/2017/03/2017-03-27-Outlook.png)


## For Java

Please check the sample below and modify it according to your application -

    import org.apache.commons.mail.DefaultAuthenticator;
    import org.apache.commons.mail.EmailException;
    import org.apache.commons.mail.HtmlEmail;



    public class JavaMailer {   



        public static void main(String[] args) {
                        
            HtmlEmail htmlemail = new HtmlEmail();       

            htmlemail.setHostName(“hostname”);
            htmlemail.setSmtpPort(“port”);
            htmlemail.setAuthenticator(new DefaultAuthenticator(“user”, “password”));
            htmlemail.setStartTLSEnabled(true);
            try {
                htmlemail.setFrom(“abc@microsoft.com”);
                htmlemail.setSubject(“Test Subject”);            
                htmlemail.setMsg(“This is a test <b> html email </b> … :-)” );
                htmlemail.addTo(“abc@microsoft.com”);
                htmlemail.send();
                System.out.println(“Your email is sent successfully”);
            } catch (EmailException e) {
                e.printStackTrace();        
            
            }
        }
    }

**Make sure you add the commons-email-1.4.jar and javax.mail.jar in your classpath.**

You can run this from command line like -

    java –cp ./commons-email-1.4.jar;./javax.mail.jar JavaMailer
