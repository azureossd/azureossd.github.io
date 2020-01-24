---
title: " Upload a service certificate to Azure VM using Azure SDK Java code"
tags:
  - .cer
  - .pfx
  - Azure sdk
  - Azure VM
  - certificate
  - Java
  - service certificate
  - virtual machine
categories:
  - Java
  - Azure SDK
  - Azure VM
date: 2015-09-18 11:51:00
author_name: Prasad K.
---

If you want to programmatically upload a service certificate to the Azure VM without remotely logging into the VM, you can use the following Java program template to achieve it. This is useful when you want to upload multiple certificate at same time and do not want to do it manually.

**Prerequisite** \- Azure sdk for Java.

    import java.io.File;  
    import java.io.FileInputStream;  
    import java.io.IOException;  
    import java.net.URI;  
    import java.net.URISyntaxException;

    import com.microsoft.windowsazure.Configuration;  
    import com.microsoft.windowsazure.core.OperationStatusResponse;  
    import com.microsoft.windowsazure.core.utils.KeyStoreType;  
    import com.microsoft.windowsazure.exception.ServiceException;  
    import com.microsoft.windowsazure.management.compute.ComputeManagementClient;  
    import com.microsoft.windowsazure.management.compute.ComputeManagementService;  
    import com.microsoft.windowsazure.management.compute.models.CertificateFormat;  
    import com.microsoft.windowsazure.management.compute.models.ServiceCertificateCreateParameters;  
    import com.microsoft.windowsazure.management.compute.models.ServiceCertificateListResponse;  
    import com.microsoft.windowsazure.management.configuration.ManagementConfiguration;  
    import com.sun.mail.iap.ByteArray;

    public class VMUploadCertificate {  
       
     static String uri = "[https://management.core.windows.net/](https://management.core.windows.net/)";  
     static String subscriptionId = "<your subscription Id>";  
     static String keyStoreLocation = "<Your management certificate jks file path>";  
     static String keyStorePassword =  "<Keystore password>";

     public static void main(String\[\] args) throws IOException, URISyntaxException {  
        
      Configuration config = ManagementConfiguration.configure(  
             new URI(uri),  
               subscriptionId,  
               keyStoreLocation, // the file path to the JKS  
               keyStorePassword, // the password for the JKS  
               KeyStoreType.jks // flags that I'm using a JKS key store  
               );  
        
      // create a management client to call the API  
      ComputeManagementClient client = ComputeManagementService.create(config);  
        
      try {  
                ServiceCertificateListResponse serviceCertificateListResponse = client.getServiceCertificatesOperations().list("<serviceName>");  
                for ( ServiceCertificateListResponse.Certificate certificate : serviceCertificateListResponse.getCertificates()) {  
                       System.out.println("Cert URI  = "+certificate.getCertificateUri().toString() );  
                       System.out.println("Thumprint = "+certificate.getThumbprint());  
                }  
                 
                 
                // loop on certificats to upload     
                File folder = new File("C:\\\certificates");  
                try {  
                       for (File file : folder.listFiles() ) {  
                            if ( file.isFile() && file.getName().endsWith(".pfx") ) {  
         //  if ( file.isFile() && file.getName().endsWith(".cer") ) {                                                                                             // .cer specific  
                               System.out.println("File " + file.getPath());  
         // Add Service Certificate                            
                                     ServiceCertificateCreateParameters serviceCertificateCreateParameters = new ServiceCertificateCreateParameters();  
                                   serviceCertificateCreateParameters.setCertificateFormat(CertificateFormat.Pfx);  
         //         serviceCertificateCreateParameters.setCertificateFormat(CertificateFormat.Cer);                                      // .cer specific  
                                      
                                     //String base64Key = null;                                                                                                           // .cer specific  
                                     byte \[\] byteKey = null;  
                                     try {  
                                            FileInputStream fis = new FileInputStream(file.getPath());  
                                            int size = fis.available();  
                                            byteKey = new byte\[size\];  
                                            fis.read(byteKey);  
                                            fis.close();  
                                            // base64Key = javax.xml.bind.DatatypeConverter.printBase64Binary(byteKey);                 // .cer specific  
                                     } catch(Exception e) {  
                                            System.out.println("Cannot retrieve key." + file.getPath());  
                                     }  
                                      
                                     //byte \[\] byteKey2 = base64Key.getBytes();                                                                                // .cer specific  
                                     serviceCertificateCreateParameters.setData(byteKey );  
                                     serviceCertificateCreateParameters.setPassword("<.pfx password>");                                     // .pfx specific  
                                     OperationStatusResponse operationStatusResponse = client.getServiceCertificatesOperations().create("<serviceName>", serviceCertificateCreateParameters);  
                                     System.out.println(operationStatusResponse);  
                              }  
                       }  
                               
                } catch ( SecurityException e ) {  
                       System.out.println("Cannot retrieve files." + e.getMessage());  
                }

                 
                 
                serviceCertificateListResponse = client.getServiceCertificatesOperations().list("<serviceName>");             
                for ( ServiceCertificateListResponse.Certificate certificate : serviceCertificateListResponse.getCertificates()) {  
                       System.out.println("Thumprint = "+certificate.getThumbprint());  
                }  
                 
                 
          } catch (Exception e) {             
                e.printStackTrace();  
          }

     }

    }

You'll have to modify the code according to the certificate type. If the certificate is ".cer" uncomment out few of the lines and you are good to go.