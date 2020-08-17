---
title: "WordPress Best Practices for Performance"
author_name: "Christopher Maldonado"
tags:
    - azure
    - app services
    - wordpress
    - best practices
    - performance
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/wordpress.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
toc: true
toc_sticky: true
date: 2020-08-07 16:00:00
---

WordPress Performance Best Practices on Azure App Services (Windows/Linux)

## Best Practices

When it comes to Performance, there are a few Best Practices recommended when using Azure App Services.

1. Ensure App Service and Database are in the same datacenter.
2. Optimize Database
3. Compress Images
    - Store media and static files in Azure Blob Storage.
    - Compress Images using a plugin
4. Reduce HTTP calls
5. Use Azure CDN
6. Turn off Pingback and Trackbacks
7. Cache pages.
8. Diagnose Theme and Plugin issues.

### Optimizing Database

When it comes to DB optimization, there are many different plugins out there that can do what is needed. DB optimization is needed to help keep your WordPress database clean from any unneeded entries or orphaned objects. We will be using the following: **WP-Optimize**

- Login to your WordPress Admin Dashboard
- Go to: **Plugins > Add New**
- Search for **WP-Optimize**
- Click Install Now, then Activate.

![WP Optimize](/media/2020/08/wp-optimize.png)

Once installed and activated, you will have a new entry in the panel menu. Navigate to **WP-Optimize > Database**.

Here you will have many different options to help optimize your database.

For basic optimization, you can leave the default selectec options checked and hit **Run all selected optimizations**. Otherwise, you can pick and choose for the list available.

![WP Optimize Options](/media/2020/08/wp-optimize-options.png)

These optimizations are helpful to keep your database in good shape and not expand with unneeded data.

### Compressing Images

Compressing images has become an important part of WordPress in recent years. With high definition and ultra high definition, images are getting larger in size and not web optimized. This is why compressing images on WordPress is important to keep your site at a reasonable load time.

There are many different plugins or all in plugins that can do various things; however, we will be using the following: **Smush**

- Login to your WordPress Admin Dashboard
- Go to: **Plugins > Add New**
- Search for **Smush**
- Click Install Now, then Activate.

![Smush](/media/2020/08/smush.png)

Once installed and activated, you will have a new entry in the panel menu. Navigate to **Smush > Dashboard**.

If this is the first time using this plugin, you will need to go through a setup process for this.

It is recommended to **Automatically optimize new uploads**, **Strip my image metadata**, and **Enable Lazy Loading**.

This will allow for any new images added to your site to be compressed. You can also compress individual files if needed by going into your **Media > Library**.

Select your image and on the right hand side you will have compression options:

![Smush Options](/media/2020/08/smush-options.png)

Set your options and select **Compress**.

This will help keep your images optimized for the web and help improve site loading.

### Using Azure Blob Storage

Azure Storage can be used in WordPress to store your uploads and media. This will help offload content from your App Service for static content like image.

The plugin being used here is: **Microsoft Azure Storage for WordPress**

- Login to your WordPress Admin Dashboard
- Go to: **Plugins > Add New**
- Search for **Azure Storage**
- Click Install Now, then Activate.

![Microsoft Azure Storage for WordPress](/media/2020/08/az-storage.png)

Once installed and activated, you will need to navigate to **Settings > Microsoft Azure** to update settings.

You will need to provide the following settings for your Azure Storage Container:

- Store Account Name
- Store Account Key

Set your Store Account Name (Storage Account Name) and your Store Account Key (Storage Account Access Key). Then click **Save Changes**.

![Microsoft Azure Storage for WordPress Options](/media/2020/08/az-storage-options.png)

This will sync the plugin and show any available containers to select from. If you have a container already created, select it now. If not, create a new blob container. Info on how to do this can be found here: [https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-portal#create-a-container](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-portal#create-a-container).

Be sure to also select **Use Microsoft Azure Storage for all media uploads on this site**. This will ensure that your media is uploaded to the Azure Storage account.

If you are adding this to an exisiting site, you may need to manually upload your content as this is intended for new content.

You can test this by going into **Media > Library** and uploading a new image.

### Enabling WordPress Caching

PHP is a server side scripting language, therefore that Time To First Byte is typically WordPress gathering all the data so PHP can compile a HTML page to respond with. This is why it is always recommended to enable some sort of WordPress caching as it keeps these compiled HTML pages in a store to serve for later.

There are many different options for caching; however, we will be using the following: **WP Super Cache**

- Login to your WordPress Admin Dashboard
- Go to: **Plugins > Add New**
- Search for **WP Super Cache**
- Click Install Now, then Activate.

![WP Super Cache](/media/2020/08/wp-super-cache.png)

Once installed and activated, you will need to navigate to **Settings > WP Super Cache** to update settings.

Navigate to the **Advanced** section of the settings. This is where you will enable various options for WP Super Cache.

Starting out, enable all **Recommended** settings. These settings will need some optimization for your WordPress needs, so they will be different for everyone.

![WP Super Cache Options](/media/2020/08/wp-super-cache-options.png)

Click **Update Status** to save your changes.

### Using Azure CDN

Using a CDN like Azure CDN will help you offload static content like .js and .css files. This will allow for faster loading of these files as they will be served by a CDN somewhere closer to the client making the requests.

To enable this, we will be using the same plugin used for WordPress Caching: **WP Super Cache**

Navigate to **Settings > WP Super Cache**. Click on the **CDN** section of the settings.

Here we will populate our CDN settings from Azure CDN. If you do not have an Azure CDN, you can follow these steps to create one: [https://docs.microsoft.com/en-us/azure/cdn/cdn-create-new-endpoint](https://docs.microsoft.com/en-us/azure/cdn/cdn-create-new-endpoint).

You will need your Azure CDN endpoint.

![WP Total Cache CDN Options](/media/2020/08/wp-super-cache-cdn.png)

Click **Enable CDN Support** and provide your **Off-site URL**, then click **Save Changes**.

This will enable CDN and offload your content. You can leave the options to their default values.

Browse to your site after clearing your WordPress cache to view the changes.

### Enabling Redis Cache

Redis Cache allows for additional caching for your WordPress site. While most caching options help after the PHP has compiled the static page, Redis cache helps by caching database calls to help reduce the load against your MySQL database. This allows for faster DB querying of WordPress and thus a faster PHP compile for a static page to be served.

If you used the WordPress or WordPress on Linux marketplace items on the Azure Portal, then you should have the needed plugin installed. If not, we are using the following: **Redis Object Cache**

- Login to your WordPress Admin Dashboard
- Go to: **Plugins > Add New**
- Search for **Redis Object Cache**
- Click Install Now, then Activate.

![Redis Object Cache](/media/2020/08/redis-object-cache.png)

Once installed and activated, you will need to navigate to **Settings > Redis** to update settings.

By default, Redis Object Cache will connect to 127.0.0.1:6379 for Redis. We will need to modify the ***wp-config.php*** file to connect to Azure Cache for Redis.

If you do not have an Azure Cache for Redis, follow these steps to set one up: [https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/quickstart-create-redis](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/quickstart-create-redis).

Via SSH or FTP, open your wp-config.php and add the following defines:

- define('WP_REDIS_HOST', 'yourRedisEndpoint.redis.cache.windows.net');
- define('WP_REDIS_PASSWORD', 'yourAccessKey');

Once these defines are added into your wp-config.php file, navigate to **Settings > Redis**. Then click on **Enable Object Cache**. You should get something like the following:

![Redis Object Cache Connection](/media/2020/08/redis-object-cache-connection.png)

If you run into any issues, take a look at the **Diagnostics** tab for more logging info.

## Conclusion

With all these best practices or at least some of these, you will have a WordPress site running at better speeds.
