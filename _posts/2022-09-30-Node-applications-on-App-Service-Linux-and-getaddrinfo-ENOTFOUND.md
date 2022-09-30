---
title: "Node applications on App Service Linux and getaddrinfo ENOTFOUND"
author_name: "Anthony Salemo"
tags:
    - Node
    - Linux
    - App Service
    - Configuration
    - ENOSPC
categories:
    - Node
    - Development 
header:
    teaser: /assets/images/nodejslogo.png
toc: true
toc_sticky: true
date: 2022-09-30 12:00:00
---

Sometimes when making requests to external dependencies with Node applications, you may encounter an error showing "getaddrinfo ENOTOUND". This can happen for a few different reasons, which we'll go through below.

> **NOTE**: These scenarios may not cover all reasons why this may occur, but more of the most common ones.

## What is getaddrinfo ENOTFOUND?
This is can be looked as two parts for better clarity:

- **ENOTFOUND**:

    `ENOTFOUND` is a DNS lookup failure thrown back by Node specifically - [doc](https://nodejs.org/dist/latest-v16.x/docs/api/errors.html#common-system-errors), meaning - this is something Node has created and is not a POSIX error - but, this can happen from the two real POSIX errors below. 
    
    This can either happen from `EAI_NONAME` ([reference](https://www.man7.org/linux/man-pages/man3/getaddrinfo.3.html#RETURN_VALUE)) which can ultimately occur in scenarios like a DNS sever being reachable, but no matching name was found to the IP being looked up, a DNS server timing out, a defined DNS server not able to reached, and others.

    The other is `EAI_NODATA` ([reference](https://www.man7.org/linux/man-pages/man3/getaddrinfo.3.html#RETURN_VALUE) that can prompt a `ENOTFOUND` from Node. This can occur if the nodename has no data, which the nodename could be a name associated with the hostname of the IP address for the machine.

- **getaddrinfo**:

    [getaddrinfo](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html) is a function to help resolve DNS within the C standard libray. Under the hood for Node HTTP clients, such as the Node native [HTTP module](https://nodejs.org/docs/latest-v16.x/api/http.html) - or other clients like [Axios](https://www.npmjs.com/package/axios), use `dns.lookup()` ([source](https://github.com/nodejs/node/blob/main/lib/dns.js#L140), [ref](https://nodejs.org/dist/latest-v16.x/docs/api/dns.html#dnslookup)) by default - which ultimately ends up calling `getaddrinfo` - which is what is actually returning the either of two POSIX errors; and lastly in turn node will return `ENOTFOUND` for this.


## Possible causes
Although some reasons where address above, we'll list some more day-to-day reasons on why this may be seen.

### The remote address doesn't exist
One big reason why this may occur is the remote address doesn't actually exist. Which would likely be due to the URI being looked up in code is possibly mistyped. Take the below example, which uses [Axios](https://www.npmjs.com/package/axios) to make an outbound call to "google". However, we have a typo here - where the URI is actually "https://google .com".

```javascript
router.get("/", async (_req, res, _next) => {
  try {
    const { data } = await axios.get(
      "https://google .com"
    );
    console.log(data);
    res.json({ message: "Calling a non-existing or blocked site.." });
  } catch (error) {
    console.error(error);
    res.status(500).send(error)
  }
});
```

This will throw the below error, which most of the time will usually look like this:

```javascript
getaddrinfo ENOTFOUND google
    at GetAddrInfoReqWrap.onlookup [as oncomplete] (dns.js:71:26) {
  hostname: 'google',
  syscall: 'getaddrinfo',
  code: 'ENOTFOUND',
  errno: -3008,
```

As expected, correcting the typo will resolve this. Another scenario here is for sites that plainly may not exist anymore - such a permanent removal of an FQDN or similiar. In those cases, the below troubleshooting can be used.

### DNS related issues
DNS related issues can manifest in a few ways, but this is another source of `ENOTFOUND`, and argubly the more-so direct reason for this - since `getaddrinfo` is inheritly DNS related, as explained above.

Improperly configured DNS servers (if using custom DNS, Azure DNS is the default on Azure App Serivce) - or domains, may contribute to this. If using a custom DNS server and wanting to rule this out, [`WEBSITE_DNS_SERVER`](https://learn.microsoft.com/en-us/azure/app-service/reference-app-settings?tabs=kudu%2Cdotnet#domain-and-dns) could be set to a test value of 8.8.8.8.

If the client (the Node application making the call) runs fine, and the endpoint is validated to be correct - try to run `nslookup`, `dig`, or even `tcpping` to see if the remote host can be resolved. As of writing this, all 3 of these utilities are installed in the current Blessed Images.

If on Azure App Service Linux, and using a Node **Blessed** Image, [SSH is enabled by default](https://learn.microsoft.com/en-us/azure/app-service/configure-linux-open-ssh-session). But if using a custom Docker Image, you'll have to enable SSH - for that, view this blog [here](https://azureossd.github.io/2022/04/27/2022-Enabling-SSH-on-Linux-Web-App-for-Containers/index.html). Use the above utilities while SSH'd into your container.

### Firewall and networking 
A firewall set on the remote end can also cause `ENOTFOUND` issues - or other network functionality that may block inbound traffic can additionally cause this behavior. 

If this is deemed to the case, aside from the command line utilities above - a quick test to rule this out if to open up traffic to test connectivity. 

### SNAT port exhaustion
Node's HTTP client doesn't reuse connections by default - and in this scenario, if not properly configured, can experience SNAT port exhaustion. This can also be the case with database connections and not implementing pooling.

See this blog post [here](https://azureossd.github.io/2022/03/10/NodeJS-with-Keep-Alives-and-Connection-Reuse/index.html) for ways to reuse connecitons. 

Ultimately, a side effect of this is also `getaddrinfo ENOTFOUND` errors periodically seen in `stderr` logging when trying to call to external resources. When SNAT ports are effectively used up (since anything over 128 is "best effort" allocation), connections may start outright failing, or no ports for outbound connection use can be allocated.

`getaddrinfo ENOTFOUND` errors would likely on the intermittent side in this scenario. To validate if you're experiencing this scenario, go to the Azure Portal and review the **Diagnose and Solve** blade -> **SNAT Port Exhaustion** detector.

![Diagnose and Solve Problems - 1](/media/2022/09/azure-oss-blog-enotfound.png)





