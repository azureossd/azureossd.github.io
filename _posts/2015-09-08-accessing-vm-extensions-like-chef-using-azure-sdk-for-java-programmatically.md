---
title: " Accessing VM extensions like Chef using Azure sdk for Java programmatically"
tags:
  - Java azure sdk chef knife vm extension
author_name: Prasad K.
categories:
  - Java
  - Azure SDK
  - How-To
date: 2015-09-08 09:19:00
---

**To access the VM extension reference like Chef programmatically, please follow the steps -**

This blog shows how can you access the Azure VMs and extensions using the Azure Management APIs programmatically. This version is for Java language. You can find Python version [here](http://blogs.msdn.com/b/shwetasblogs/archive/2015/02/19/creating-deployment-amp-customizing-linux-vms-with-python-amp-chef-part-2.aspx "Python Chef").

**1. Install the Azure sdk for Java using the link - <https://azure.microsoft.com/en-us/documentation/articles/java-download-windows/>. If you are using Eclipse, please scroll down on the same link for installing the plugin.**]{style="font-size: small;"}

**2. Once it is install you can use the below code snippet to access your all VM extension reference.**]

    import java.io.IOException;
    import java.net.URI;
    import java.net.URISyntaxException;
    import java.util.ArrayList;
    import javax.xml.parsers.ParserConfigurationException;

    import org.xml.sax.SAXException;

    import com.microsoft.windowsazure.Configuration;
    import com.microsoft.windowsazure.core.utils.KeyStoreType;
    import com.microsoft.windowsazure.exception.ServiceException;
    import com.microsoft.windowsazure.management.compute.ComputeManagementClient;
    import com.microsoft.windowsazure.management.compute.ComputeManagementService;
    import com.microsoft.windowsazure.management.compute.models.HostedServiceGetDetailedResponse;
    import com.microsoft.windowsazure.management.compute.models.HostedServiceListResponse;
    import com.microsoft.windowsazure.management.compute.models.ResourceExtensionReference;
    import com.microsoft.windowsazure.management.compute.models.Role;
    import com.microsoft.windowsazure.management.configuration.ManagementConfiguration;

    public class TestResourceExtensionRef {
    
    static String uri = “https://management.core.windows.net/“;
    static String subscriptionId = “<your subscription id>”;
    static String keyStoreLocation = “<your keystore path>”;
    static String keyStorePassword = “<your keystore password>”;

    public static void main(String[] args) throws IOException, URISyntaxException, ServiceException, ParserConfigurationException, SAXException {
    
    Configuration config = ManagementConfiguration.configure(
            new URI(uri), 
            subscriptionId,
            keyStoreLocation, // the file path to the JKS
            keyStorePassword, // the password for the JKS
            KeyStoreType.jks // flags that I’m using a JKS key store
            );
    
    // create a management client to call the API
    ComputeManagementClient client = ComputeManagementService.create(config);
    
    //ArrayList<Role> vmlist = new ArrayList<Role>();
            HostedServiceListResponse hostedServiceListResponse = client.getHostedServicesOperations().list();
                
            ArrayList<HostedServiceListResponse.HostedService> hostedServicelist = hostedServiceListResponse.getHostedServices();       

            for (HostedServiceListResponse.HostedService hostedService : hostedServicelist) {
            System.out.println(“Hosted Service : ” + hostedService.getServiceName());
            
                    HostedServiceGetDetailedResponse hostedServiceGetDetailedResponse = client.getHostedServicesOperations().getDetailed(hostedService.getServiceName());                
                    ArrayList<HostedServiceGetDetailedResponse.Deployment> deploymentlist = hostedServiceGetDetailedResponse.getDeployments();

                    for (HostedServiceGetDetailedResponse.Deployment deployment : deploymentlist) {
                    System.out.println(“Deployment : ” + deployment.getName());                 
                    
                        ArrayList<Role> rolelist = deployment.getRoles();
                        
                        for (Role role : rolelist) {
                        System.out.println(“Role : ” + role.getRoleName());
                        ArrayList<ResourceExtensionReference> extnRefList = role.getResourceExtensionReferences();
                        
                        for (ResourceExtensionReference extnRef : extnRefList)
                        {
                        System.out.println(“Resource Extension : ” + extnRef.getName());
                        }
                        }
                        
                    }
            }
    }

    }

 

3\. If you want to access the extension for a specific deployment slot, you can use -


    ComputeManagementClient client = ComputeManagementService.create(config);

    DeploymentGetResponse depResp = client.getDeploymentsOperations().getBySlot("azurechefnode", DeploymentSlot.**Production**);

    ArrayList\<Role\> roleList = depResp.getRoles();

    **for**(Role rol : roleList){

         ArrayList\<ResourceExtensionReference\> extList = rol.getResourceExtensionReferences();

    **for**(ResourceExtensionReference extn : extList)

              System.**out**.println(extn.getName());

    }

 

</p>
