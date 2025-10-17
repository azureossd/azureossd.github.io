---
title: "Setting up a NFS volume with Azure Container Apps"
author_name: "Anthony Salemo"
tags:
    - Container Apps
    - Availability
    - Configuration
    - Troubleshooting
categories:
    - Azure Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2025-10-17 12:00:00
---

This post will cover how to set up an NFS volume with Azure Container Apps through the Azure Portal

# Overview
As of writing this, documentation for mounting volumes with Azure Container Apps is mostly cli-based. This post will cover a basic NFS set up from scratch. Current documentation for NFS volumes and Azure Container Apps can be found at [Use storage mounts in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?tabs=nfs&pivots=azure-cli)


# Creating resources
## Storage
To start, you'll need a **Premium tier** Storage Account. An NFS share cannot be created on a _Standard_ one if that's being used.

1. In the Azure Portal, click on 'Create a Resource' and search for _Storage Account_

    ![Storage Account resource](/media/2025/10/aca-nfs-creation-1.png)

2. Set the following options on the Storage Account basics
    - **Subscription**: Choose your subscription to create the Storage Account in. Use the same subscription as the Container App Environment
    - **Resource Group**: Choose with Resource Group to create this in
    - **Storage Account Name**: Choose a name for the account
    - **Region**: Choose a region for the account
    - **Preferred storage type**: Set this to _Azure Files_
    - **Performance**: Set this to **Premium**
    - **File share billing** and **Redundancy**: Set this to your preferred options

    ![Storage Account Basics creation tab](/media/2025/10/aca-nfs-creation-2.png)

3. Select **Review and create** to create the Storage Account. The rest of the tabs during the creation process can be left the same.

### Create the NFS share
1. On the Storage Account, go to the **Data Storage** blade and then select _File Shares_
2. Click on "+ File Share" to create a new share
3. In the File Share creation window, set the following:
    - **Name**: Name of your NFS share
    - **Protocol**: NFS
    - **Root Squash**: Keep this defaulted to _No Root Squash_
    - The rest of the options under _Provisioned storage_ and _Performance_ can be left alone unless desired to be changed.

    ![NFS share creation](/media/2025/10/aca-nfs-creation-3.png)

4. Click **Review + create** to create the share.

### Remove "Secure Transfer Required"
On the Storage Accountt, go to **Settings** > **Configuration** and disable _Secure transfer required_. If this is not done, you'll see a volume mount failure later on with a message of `mount.nfs: access denied by server while mounting` in Container App system logs

![Disable secure transfer required](/media/2025/10/aca-nfs-creation-4.png)

## Container App Environment
At this point, if creating the Storage Account first, you'll see the message about any access to the NFS share is through a Virtual Network. For the Storage Account, VNET integration can be done later on after the fact, post-creation.

With a Container App Environment, the Virtual Network **needs to be specified at creation time**. You cannot enable a VNET post-creation - so if you're following along and your environment does _not_ have a VNET, you'll need to create a net-new one.

### Create a Container App Environment and Container App (with a VNET)
1. In the Azure Portal, click on 'Create a Resource' and search for _Container App_

    ![Container App creation blade](/media/2025/10/aca-nfs-creation-5.png)

2. On the **Basics** blade:
    - **Subscription**: Choose a subscription that the Storage Account from earlier exists i n
    - **Resource group**: Choose a Resource Group
    - **Container app name**: Choose a name for your Container App
    - For _Optimize for Azure Functions_, leave this as-is (unless you're deploying an Azure Function)
    - **Deployment Source**: Container image (unless you're deploying from source - eg. source-to-cloud)
    - **Container Apps environment**:
        - **Region**: Select a region for the envinronment
        - **Container apps environment**: Click on "Create new environment"
            -  **Environment name**: Give a name for the environment
            - **Networking blade**: In the networking blade, select _Use your own virtual network_ as "Yes" under the **Virtual network** section
                - Select _Create new_ if you do not already have an existing VNET and an **empty** subnet
                - Leave _Virtual IP_ as external (for the sake of this blog post)
                - Leave _Infrastructure resource group_ empty so it takes the default name
                - All the other blades for _Workload profiles_ and _Monitoring_ can be left-as unless you want to enable Workload Profiles or change your logging destination during the creation process

                    ![Container App creation blade](/media/2025/10/aca-nfs-creation-6.png)
                - Then, select **Create**
3. On the **Container** blade
    - You can either use the quickstart image, by checking the _Use quickstart image_ image checkbox
    - Or, bring your own image - **NOTE**: Failures can happen post-creation, which, at this point would have nothing to do with the storage volume. Always review error logs - follow (Applications (and revisions) stuck in activating state on Azure Container Apps)[https://azureossd.github.io/2025/05/05/Applications-(and-revisions)-stuck-in-activating-state-on-Azure-Container-Apps/index.html] for common reasons why revisions may end up in a degraded or failed state.

    ![Container App creation blade](/media/2025/10/aca-nfs-creation-7.png)

4. **Ingress** blade
    - If using your own container, and if this application expects external traffic, ensure the **Target port** matches the application listening port

5. Click **Review and create** to create the environment with the selected VNET, as well as the Container App.

### (Option 1) Service Endpoint - Allow the Storage Account access from the ACA VNET
Since the VNET is now created - go back to your Storage Account from earlier.

1. Go to the File Share. Under **Overview** will show the following:

    ![NFS share network setup](/media/2025/10/aca-nfs-creation-8.png)

2. For ease of setup in terms of this blog post, select **Service Endpoint**
3. Use the following options:
    - **Public network access**: Enabled from selected virtual networks and IP addresses
    - **Virtual networks**: Select _Add existing virtual network_ and then select the VNET and subnet from earlier. This will prompt to enable a Service Endpoint, which you want to do. Select **Enable**

    ![Service Endpoint setup](/media/2025/10/aca-nfs-creation-9.png)

    - After this process completes while in the same blade, click **Add**
    - Then, click **Save**

4. At this point, **Endpoint Status** should be _Enabled_ and we can now move on to adding the storage resource and volume on the environment and application

    ![Service Endpoint setup complete](/media/2025/10/aca-nfs-creation-10.png)

### (Option 2) Private Endpoint - Allow the Storage Account access from the ACA VNET
Another option is using a Private Endpoint. You'll need an _empty_ subnet (different than the one given to the Container App Environment) to proceed. You can create an empty subnet in your Virtual Network with the defaults provided and then move back to the below blade on the Storage Account - or - just follow [Create a private endpoint for Azure Files](https://learn.microsoft.com/en-us/azure/storage/files/storage-files-networking-endpoints?tabs=azure-portal#create-a-private-endpoint)

1. Go to the File Share. Under **Overview** will show the following:

    ![NFS share network setup](/media/2025/10/aca-nfs-creation-8.png)

2. Select **Private Endpoint**. This will take you through the creation blade for a **Private Endpoint**. Follow the step form to create this:
    - **Basics**:
        - **Subscription**: Create this in the same subscription as the Container App Environment and Storage account
            - **Resource Group**: Choose a resouce group
        - **Name**: Give the Private Endpoint a name
        - **Network Interface Name**: This will defaul to `[name]-nic`, leave this as the default
    - **Resource**: Leave the defaults
    - **Virtual Network**:
        - **Virtual Network**: Select the VNET from earlier
        - **Subnet**: Select the empty subnet created (mentioned above)
        -  Leave the rest of the defaults for all following tabs
    - Click through and then click **Create**

3. After Private Endpoint creation, you should see **Private link resource** set to your Storage Account. If you `nslookup` your file share FQDN, you should see this now also has the private link alias associated with it:

```
$ nslookup myfsstorageaccount.file.core.windows.net
Server:  some.thing.com
Address:  xxx.xx.xx.xx

Non-authoritative answer:
Name:    file.xxxxxxxxxx.store.core.windows.net
Address:  xx.xx.xxx.x
Aliases:  myfsstorageaccount.file.core.windows.net
          myfsstorageaccount.privatelink.file.core.windows.net
```

### Create a Storage Resource on the environment
> **NOTE**: Irregardless if you used a Service Endpoint or Private Endpoint, the normal FQDN for the file share (eg. somefileshare.file.core.windows.net will be used below - don't use the Private Link alias if a Private Endpoint was used)

1. Go back to the **Container App Environment** and select **Azure Files** under _Settings_
2. Select **Add** and then _Network File System (NFS)_
3. In the pop-out blade, set the following:
    - **Name**: Set a name for the resource
    - **Server**: Set this to `yourstorageaccount.file.core.windows.net`
    - **File share name**: Set this to `/yourstorageaccount/yournfssharename`
    - **Access Mode**: Set your access mode to read/write or read-only

    **IMPORTANT**: Make sure to include the forward slashes, this syntax is expected.

    ![ACA NFS setup blade](/media/2025/10/aca-nfs-creation-12.png)

**NOTE**: If you go back to your NFS file share, you'll see this info in which you can pull from

![NFS mount information](/media/2025/10/aca-nfs-creation-11.png)

4. Select **Add** and then **Save**

### Add a volume to the Container App
1. Go to your **Azure Container App** that you created and go to **Application** > **Volumes**
2. Select **Add** to add a volume
    - **Volume type**: Azure file volume
    - **Name**: Choose a name for the volume
    - **File share name**: Choose the name of the storage resource created earlier above on the _Container App Environment_
    - **Mount options**: Omit this unless you know which options to pass in. Allowed mount options are also the ones listed on the NFS "man page" - [nfs(5) - Linux man page](https://linux.die.net/man/5/nfs)

    ![Adding a volume on the Container App](/media/2025/10/aca-nfs-creation-13.png)

3. Lastly, click **Add**. Then click **Save as new revision**

### Mount the volume to the Container App
> **NOTE**: You can either explicitly create a new revision through the _Revisions and replicas_ or do this through the _Containers_ blade 

1. Go to your **Azure Container App** that you created and go to **Application** > **Revisions and replicas**
2. Click **Create  new revision**
3. Select the container to mount a volume to, then click **Edit**
4. On the popout window, go to the _Volume mounts_ tab
    - **Volume name**: Select the _Volume_ created just before on the Container App
    - **Mount path**: Specify a directory to mount this volume to
5. Click **Save**, then click **Create**

    ![Mounting a volume on the Container App](/media/2025/10/aca-nfs-creation-14.png)

### Confirm the volume is mounted
If the Revision is not in a degraded or failed state after enabling the volume mount, this already would imply this is successful.

This is is now **Failed** or **Degraded**, ensure your _Logs destination_ is set to either Log Analytics or Azure Monitor and query the system logs table for `ContainerAppSystemLogs` (Azure Monitor) or `ContainerAppSystemLogs_CL` (Log Analytics) and review the errors seen there.

Otherwise, go to the **Console** blade, and run `df -a` or `df -h`. You can also use the `mount` command, assuming it's installed in your container image and available in the running container, to use the command `mount | grep "nfs"` to see additional arguments and version information

![Console output on the Container App](/media/2025/10/aca-nfs-creation-15.png)

If using a Private Endpoint, you'll still see the normal FQDN for the file share in the above output. But if you `nslookup` this from within the container, you should see this resolves to the IP of the NIC for the Private Endpoint

![Private Endpoint output on the Container App](/media/2025/10/aca-nfs-creation-18.png)

We know this works because if this was failing, console access would be unavailable due to the fact the volume monut happens early on in the container lifecycle  (within a pod) - a container is not yet created and running by that point in time.

# FAQs and other information
## FAQs
- You cannot pass mount options like `-t`, `--types` through the "mount options" field. `-t` is only set when you either choose SMB (`mount.cifs`) or NFS (`mount.nfs`). Using the above _Console_ method, you can see that the NFS version used is `nsf4`. This cannot be changed (eg. to `aznfs`)
- SMB and NFS have different methods of setting file/directory permissions which can be seen here: [Container Apps - Setting storage directory permissions](https://azureossd.github.io/2024/12/30/Container-Apps-Setting-storage-directory-permissions/index.html)
- SMB requires Access Keys to set up a storage resource and mount a volume, NFS does not
- NFS requires a VNET on the Container App Environment and integrated with the Storage Account to make all of this possible
- This blog post only covered a "typical" Private Endpoint set up - if your VNET has custom DNS, ensure the file share FQDN can be resolved against your DNS servers. You may need to add Azure DNS (168.63.129.16) to "resolve unresolved queries" on your DNS servers
- If a volume mount is failing, no "application" / "console" logs will be available, only system logs. This is because a volume mount happens very early on in a pod lifecycle, prior to a running container. A container never gets to the point of being successfully created and running, which means no application process ever starts (and thus, no application logs)

## Troubleshooting
- For general storage mount troubleshooting, review [Troubleshooting volume mount issues on Azure Container Apps](https://azureossd.github.io/2023/07/24/Troubleshooting-volume-mount-issues-on-Azure-Container-Apps/index.html)
- You also should review [Azure Files security compatability on Container Apps](https://azureossd.github.io/2025/02/10/Azure-Files-security-compatability-on-Container-Apps/index.html). This by default is set to "maximum capability" on the file share - if this is changed to options other than this, you risk having the mount fail with `permission denied (13)`
- Forgetting to disable "Secure Transfer Required" on the Storage Account will also cause `permission denied`

Aside from system logs, going to **Diagnose and Solve Problems** > **Storage Mount Failures** will also display storage troubleshooting information for mount failure on the Container App 

![Diagnose and Solve Problems](/media/2025/10/aca-nfs-creation-16.png)


