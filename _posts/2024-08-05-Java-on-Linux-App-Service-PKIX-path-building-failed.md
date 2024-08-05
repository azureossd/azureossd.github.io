---
title: "Java on App Service Linux - PKIX path building failed"
author_name: "Anthony Salemo"
tags:
    - Java
    - Configuration
    - Troubleshooting
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Configuration
    - Java # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - Troubleshooting 
header:
    teaser: /assets/images/javalinux.png # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-08-05 12:00:00
---

This post will cover the error `PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException` and a few common reasons as to why this would happen.

# Overview
The message `PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException` will typically happen when calling to an external HTTPS endpoint that is secured with a certificate. The error itself may have various other root causes as to why it's thrown - if so - it'll be in the "inner" root cause or along with the stack trace. But the general concensus is, when this message is seen, it's typically certificate related.

We'll cover some common examples below with an examples within Spring Boot.

# Prerequisites
## Logging
Ensure [**App Service Logs**](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-windows) are enabled for your App Service application.

Without these logs enabled, runtime troubleshooting will make it much harder or almost impossible to diagnose problems.

You can view/retrieve these logs directly from the Kudu site or FTP. You can also go to **Diagnose and Solve Problems** -> **Application Logs** on the App Service to view logging, as well as using the Logstream option.

## OpenSSL
`openssl` can be used in these common scenarios or in general when troubleshooting certificate related issues.

"Blessed" images on App Service Linux already come with `openssl`.

For custom images with Web Apps for Containers - this completely depends on the image itself, distribution, and other various factors.

You can install the `openssl` package by going into the application container through the _SSH_ option and installing it:
- Alpine: `apk add openssl`:
- RHEL/CentOS: `yum install openssl`
- Ubuntu/Debian: `apt-get install openssl`
- Mariner: `tdnf install openssl`

> **NOTE**: If SSH is not enabled for your custom image, see [Enabling SSH on Linux Web App for Containers](https://azureossd.github.io/2022/04/27/2022-Enabling-SSH-on-Linux-Web-App-for-Containers/index.html)

# Common causes
We'll be using Spring Boot as an example as well as [Bad SSL (badssl.com)](https://badssl.com/). In these examples, we'll act as though https://badssl.com/ is our backend that we're calling to generate some of these common issues.

In pretty much most scenarios, the backend/remote endpoint being called and it's certificate (either in itself or in relation to the key/trust store of the caller) is the problem.

The below controller will be our code to access these external `https://` endpoints.

```java
package com.windows.azure.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class CertificateController {
    // This will change and is currently a placeholder
    private static final String URL = "https://self-signed.badssl.com/";

    @Autowired
    private RestTemplate RestTemplateConfiguration;
    // This will change and is currently a placeholder
    @GetMapping("/api/cert/selfsigned")
    public String selfSignedCertificate() {
        String response = RestTemplateConfiguration.getForObject(URL, String.class);
        return response;
    }
}

```

The only thing that will change is the `URL` variable to point to different endpoints on https://badssl.com based on the scenario.

## Expired certificate

A variation of this `PKIX path building failed` error is an expired certificate on the remote host. 

Below is an example of us calling to a badssl.com endpoint that has an expired certificate:

```java
   private static final String URL = "https://expired.badssl.com/";

    @Autowired
    private RestTemplate RestTemplateConfiguration;

    @GetMapping("/api/cert/expired")
    public String expiredCertificate() {
        String response = RestTemplateConfiguration.getForObject(URL, String.class);
        return response;
    }
```

From an external user, you'd be presented with an HTTP 500. If there is no `/error` page mapping, it'll just show the "Whitelabel" page:

![HTTP 500](/media/2024/08/java-cert-1.png)

If you go under `/home/LogFiles/YYYY_MM_DD_lwxxxxxxxxx_default_docker.log` (or use any of other methods liste to view logs), you'll see the full exception and stack trace.

```java
 ERROR 75 --- [nio-8080-exec-9] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed: org.springframework.web.client.ResourceAccessException: I/O error on GET request for "https://expired.badssl.com/": PKIX path validation failed: java.security.cert.CertPathValidatorException: validity check failed] with root cause 
 java.security.cert.CertificateExpiredException: NotAfter: Sun Apr 12 23:59:59 GMT 2015
 	at java.base/sun.security.x509.CertificateValidity.valid(CertificateValidity.java:277) ~[na:na]
 	at java.base/sun.security.x509.X509CertImpl.checkValidity(X509CertImpl.java:619) ~[na:na]
 	at java.base/sun.security.provider.certpath.BasicChecker.verifyValidity(BasicChecker.java:190) ~[na:na]
 	at java.base/sun.security.provider.certpath.BasicChecker.check(BasicChecker.java:144) ~[na:na]
 	at java.base/sun.security.provider.certpath.PKIXMasterCertPathValidator.validate(PKIXMasterCertPathValidator.java:125) ~[na:na]
 	at java.base/sun.security.provider.certpath.PKIXCertPathValidator.validate(PKIXCertPathValidator.java:224) ~[na:na]
```

In this case, we can obviously see the certificate of the remote host expired on 4/12/2015.

You can further confirm this and look at more certificate details by using `openssl` - which is installed in these Java "Blessed" images. For custom images, this may vary based on how the image was built. See the "prerequsites" section above.

If we run the command `openssl s_client -connect expired.badssl.com:443 -servername expired.badssl.com -showcerts | openssl x509 -text -noout`, we can take a look at the output. Notice the `verify error:` property, as well as `notAfter` - which corresponds to our exception:

![Expired certificate](/media/2024/08/java-cert-2.png)

In a real case, just replace the hostname with the hostname seeing a potential expired certificate exception.

The root cause here is the expired certificate and the resolution would be to have the remote endpoint and hosting provider update/refresh their certificate.

## Self-signed certificates
Self-signed certificates aren't typically recommended for production scenarions since anyone can create these. But these do occasionally end up in the way of production traffic.

The below example calls to an endpoint secured with a self-signed certificate.

```java
private static final String URL = "https://self-signed.badssl.com/";

@Autowired
private RestTemplate RestTemplateConfiguration;

@GetMapping("/api/cert/selfsigned")
public String selfSignedCertificate() {
    String response = RestTemplateConfiguration.getForObject(URL, String.class);
    return response;
}
```

Again, from an external user standpoint, you'd be presented with an HTTP 500. If there is no `/error` page mapping, it'll just show the "Whitelabel" page:

![HTTP 500 from selfsigned certificate](/media/2024/08/java-cert-13.png)

If you go under `/home/LogFiles/YYYY_MM_DD_lwxxxxxxxxx_default_docker.log` (or use any of other methods liste to view logs), you'll see the full exception and stack trace.

```java
sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target
 	at java.base/sun.security.provider.certpath.SunCertPathBuilder.build(SunCertPathBuilder.java:141) ~[na:na]
 	at java.base/sun.security.provider.certpath.SunCertPathBuilder.engineBuild(SunCertPathBuilder.java:126) ~[na:na]
 	at java.base/java.security.cert.CertPathBuilder.build(CertPathBuilder.java:297) ~[na:na]
 	at java.base/sun.security.validator.PKIXValidator.doBuild(PKIXValidator.java:434) ~[na:na]
 	at java.base/sun.security.validator.PKIXValidator.engineValidate(PKIXValidator.java:306) ~[na:na]
 	at java.base/sun.security.validator.Validator.validate(Validator.java:264) ~[na:na]
 	at java.base/sun.security.ssl.X509TrustManagerImpl.checkTrusted(X509TrustManagerImpl.java:231) ~[na:na]
```

The message returned regarding `sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target` may seem a bit cryptic, but with more thought, makes sense. It's stating the certificate is not found within the Java Trust Store. Given this is a self-signed certificate, it makes sense.

You can again use the `openssl` command `openssl s_client -connect self-signed.badssl.com:443 -servername self-signed.badssl.com -showcerts | openssl x509 -text -noout` to verify the legitimacy of the certificate. Replace "self-signed.bad.ssl.com" with the remote host endpoint you're troubleshooting.

Here, we can see the `verify error` is `self signed certificate`

![Self-signed certificate](/media/2024/08/java-cert-3.png)

**Resolution**:

You can add the self-signed certificate into the Java Trust Store by downloading the cert, converting it into a public key format, and then uploading it to Azure App Service under the **Certificates** blade - which will automatically be loaded into the key store.

1. Download the cert from the remote endpoint. Then below command downloads this to `/home` as a `.crt` file (`self-signed.badssl.com.crt`) - Run:

    ```
    echo -n | openssl s_client -connect self-signed.badssl.com:443 | \
    sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' > /home/self-signed.badssl.com.cer
    ```

    ![Self-signed certificate download](/media/2024/08/java-cert-4.png)

2. Download the `.cer` - you can use FTP or Kudu (.scm. site) via the `/newui/fileManager` endpoint

    ![Self-signed certificate download](/media/2024/08/java-cert-5.png)

3. Upload the self-signed certificate of the remote endpoint we downloaded to the **Certificates** blade on the App Service

    ![Self-signed certificate upload](/media/2024/08/java-cert-6.png)

    **NOTE**: The container should restart after doing this. If it doesn't, explicitly restart it.

4. In `default_docker.log` (application stdout), you'll notice that the **thumbprint** of the certificate we just uploaded is being automatically added to the Java Trust Store (`cacerts`) upon startup.

    ```
    ...
    2024-08-02T15:16:37.4928480Z ## Done printing build info.
    2024-08-02T15:16:37.4997918Z Add public certificates to keystore if exists...
    2024-08-02T15:16:37.5086075Z Adding thumbprint 9DFF24E1DBEEC15F90751E7AF364D417D65CB8CD
    2024-08-02T15:16:38.1481615Z Warning: use -cacerts option to access cacerts keystore
    2024-08-02T15:16:38.5951827Z Certificate was added to keystore
    2024-08-02T15:16:38.6700462Z Set default trustStore...
    2024-08-02T15:16:38.6701650Z Add private certificates to keystore if exists...
    2024-08-02T15:16:38.6703205Z Using default max heap configuration
    2024-08-02T15:16:38.6982419Z STARTUP_FILE=
    2024-08-02T15:16:38.6983245Z STARTUP_COMMAND=
    2024-08-02T15:16:38.6983305Z No STARTUP_FILE available.
    2024-08-02T15:16:38.6983345Z No STARTUP_COMMAND defined.
    2024-08-02T15:16:38.8245161Z Made a local copy of the app and using APP_JAR_PATH=/local/site/wwwroot/app.jar
    2024-08-02T15:16:38.8442167Z Picked up JAVA_TOOL_OPTIONS: -Djava.net.preferIPv4Stack=true -Djavax.net.ssl.trustStorePassword=changeit -Djavax.net.ssl.trustStore=/opt/java/openjdk/lib/security/cacerts 
    ...
    ```

5. If you call the endpoint again, you'll notice this is now successfull:

    ![Self-signed certificate request](/media/2024/08/java-cert-7.png)

    If you go back into SSH (the application container) and run `keytool -v -list -noprompt -storepass "changeit" -cacerts -alias "your_cert_thumbprint"` - you can see this works because the certificate has been added to the keystore for Java to use when accessing this remote endpoint. Previously, this was missing, which is where the `unable to find valid certification path to requested target` message came into play.

    ![Java Keystore](/media/2024/08/java-cert-8.png)

    **NOTE**: These certificate will need to be updated when these expire. Assuming the remote endpoint's cert is also updated/refreshed.

## Untrusted root CA's
This more or less presents itself as the same error and concept in the "self-signed" certificate section above. To be able to tell the difference between this and a the "self signed" certificate error - you'd have to investigate the certificate itself.

The error seen would again be:

```java
ERROR 85112 --- [nio-8080-exec-1] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed: org.springframework.web.client.ResourceAccessException: I/O error on GET request for "https://untrusted-root.badssl.com/": PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target] with root cause

sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target
        at java.base/sun.security.provider.certpath.SunCertPathBuilder.build(SunCertPathBuilder.java:148) ~[na:na]
        at java.base/sun.security.provider.certpath.SunCertPathBuilder.engineBuild(SunCertPathBuilder.java:129) ~[na:na]
        at java.base/java.security.cert.CertPathBuilder.build(CertPathBuilder.java:297) ~[na:na]
        at java.base/sun.security.validator.PKIXValidator.doBuild(PKIXValidator.java:383) ~[na:na]
        at java.base/sun.security.validator.PKIXValidator.engineValidate(PKIXValidator.java:271) ~[na:na]
```

The code and endpoint we're testing with is:

```java
private static final String URL = "https://untrusted-root.badssl.com/";

@Autowired
private RestTemplate RestTemplateConfiguration;

@GetMapping("/api/cert/untrustedroot")
public String untrustedRootCertificate() {
    String response = RestTemplateConfiguration.getForObject(URL, String.class);
    return response;
}
```

This would also be returned as an HTTP 500 to a user or client.

![Untrusted Root CA - download](/media/2024/08/java-cert-12.png)


You can check who the root certificate authority is by looking in in the browser, or, by using `openssl`. Below is an example of using https://untrusted-root.badssl.com/ - replace this with your external endpoint as needed.

![Untrusted Root CA - browser](/media/2024/08/java-cert-9.png)

![Untrusted Root CA - openssl](/media/2024/08/java-cert-10.png)

You can use something like the below to download all certs in the chain and rename them to their common names:

```bash
openssl s_client -showcerts -verify 5 -connect untrusted-root.badssl.com:443 < /dev/null |
   awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/{ if(/BEGIN CERTIFICATE/){a++}; out="cert"a".cer"; print >out}'

for cert in *.cer; do 
        newname=$(openssl x509 -noout -subject -in $cert | sed -nE 's/.*CN ?= ?(.*)/\1/; s/[ ,.*]/_/g; s/__/_/g; s/_-_/-/; s/^_//g;p' | tr '[:upper:]' '[:lower:]').cer
        echo "${newname}"; mv "${cert}" "${newname}" 
done
```

![Untrusted Root CA - download](/media/2024/08/java-cert-11.png)

You can then upload the root certificate to the Configuration blade - this wll again automatically be added into the keystore. In this case, the certificate did not contain a public key, so we could add this as a `.cer` through "Public key certificates".

After uploading it, and after the container restarts, if we hit the endpoint again, we can see that this is now successfull:

![Untrusted Root CA - success](/media/2024/08/java-cert-15.png)


If the root CA of the remote endpoint is one that you think is likely not already stored within the truststore - then you can list out the current certificates stored and theiri associated issuers. You can run the command `keytool -v -list -cacerts -storepass changeit -noprompt` and change it as needed. Currently, we can see there is 129 entries in `cacerts`:

![All trust store certificates](/media/2024/08/java-cert-16.png)

## Broken certificates - incomplete-chain, no-subject, no-common-name (CN), etc.

These are 3 different issues, and there could be more, but ultimately these are all related to the same problem of a misconfigured certificate.

Just like the missing root CA and self-signed certificate on the external resource, this will also present itself as a typical `PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target` message.

```java
Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed: org.springframework.web.client.ResourceAccessException: I/O error on GET request for "https://incomplete-chain.badssl.com/": PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target] with root cause

sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target
        at java.base/sun.security.provider.certpath.SunCertPathBuilder.build(SunCertPathBuilder.java:148) ~[na:na]
        at java.base/sun.security.provider.certpath.SunCertPathBuilder.engineBuild(SunCertPathBuilder.java:129) ~[na:na]
        at java.base/java.security.cert.CertPathBuilder.build(CertPathBuilder.java:297) ~[na:na]
        at java.base/sun.security.validator.PKIXValidator.doBuild(PKIXValidator.java:383) ~[na:na]
        at java.base/sun.security.validator.PKIXValidator.engineValidate(PKIXValidator.java:271) ~[na:na]
```

This should also be taken into consideration when this error is seen - especially if it's not a self-signed certificate and the root CA is trusted. Since `PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target` can happen for a variety of reasons, you should and will likely need to use `openssl` (or related tooling) to troubleshoot this further or determine the likely cause.

## Other considerations
**Certificate rotation**:
- For scenarios like self-signed or untrusted root CA's where you need to manually add these certs, you may end up in a situation where these need to be rotated. Forgetting to do so may introduce SSL/TLS errors or "expired" certificate related exceptions

**Wildcard certificates**:
- If you're attempting to use a wildcard certificate in your keystore - this may cause a `PKIX` error as well. For example, see [Can Java connect to wildcard ssl](https://stackoverflow.com/questions/3166373/can-java-connect-to-wildcard-ssl#:~:text=The%20default%20implementation%20in%20Sun%27s%20JSSE%20doesn%27t%20support,It%20may%20be%20cheaper%20than%20a%20wildcard%20cert.)

# Custom images
Custom Java images are not going to have the same "built in" logic that is done above - where a certificate is automatically added to a keystore/truststore when a certificate is added to the portal.

This will need to be more manual, which is mostly expected in this situation.

> **NOTE**: To troubleshoot or check the contents of the key store as well as where certificates are loaded - you should have SSH enabled for the application container. Do not use the "Bash" option as this opens a shell in the Kudu container.

When adding certificates with a custom image - you will need to use the `WEBSITE_LOAD_CERTIFICATES` App Setting - either with the value of the thumbprint for the certificate you want to use, or `*` (wildcard), to add all certificates listed under the **Certificates** blade.

In this example, we're loading one specific certificate. If we then go to **SSH** and look under `/var/ssl/certs` (as called out [here](https://learn.microsoft.com/en-us/azure/app-service/configure-language-java-security?pivots=java-javase#manually-load-the-key-store-in-linux)), we can see the certificate that was added.

![Custom image certificates](/media/2024/08/java-cert-17.png)

![Custom image certificates](/media/2024/08/java-cert-18.png)

In your image, you can add logic to your entrypoint to import a specific certificate (or any certificates), loaded in when `WEBSITE_LOAD_CERTIFICATES` is set. Below is an example of this logic - we're importing the certificate we added through the portal by it's thumbprint into our keystore:

(entrypoint.sh)

```java
#!/bin/sh
set -e

# Get env vars in the Dockerfile to show up in the SSH session
eval $(printenv | sed -n "s/^\([^=]\+\)=\(.*\)$/export \1=\2/p" | sed 's/"/\\\"/g' | sed '/=/s//="/' | sed 's/$/"/' >> /etc/profile)

echo "Starting SSH ..."
service ssh start

echo "Adding certificates to the keystore.."

keytool -import \
-alias wafc \
-storepass changeit \
-cacerts \
-noprompt \
-file /var/ssl/certs/9DFF24E1DBEEC15F90751E7AF364D417D65CB8CD.der

echo "Running startup command 'java -jar /usr/src/app/azure-0.0.1-SNAPSHOT.jar'"
java -jar /usr/src/app/azure-0.0.1-SNAPSHOT.jar
```

The rest of the blog post, regarding various `PKIX` errors and reasonings, would apply to custom images as well.


