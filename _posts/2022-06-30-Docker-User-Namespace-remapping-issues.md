---
title: "Docker User Namespace remapping issues"
author_name: "Anthony Salemo"
tags:
    - Azure App Service on Linux
    - Azure Web App for Containers
    - Configuration
    - Docker
    - Deployment
categories:
    - Troubleshooting    
    - How-To
    - Configuration
    - Docker
header:
    teaser: "/assets/images/dockerlogo.png" 
toc: true
toc_sticky: true
date: 2022-06-30 12:00:00
---

Docker has a concept of **User namespace** and **User namespace remapping** (Otherwise known as `userns`). When this is used, this remaps users in the container to less privileged users on the host machine. 

Sometimes, a user may be explicitly defined in a `Dockerfile` that has a `UID` mapped outside of the allowed range of id's. Othertimes, a file itself for example can have a high `UID`, which may happen without purposely doing this, as this would depend on how the Image is ultimately built (base Image, Third Party Image, etc.)

When these `UID`s are mapped to an id out of range, errors can occur, as explained below.

You can read more of the official documentation [here](https://docs.docker.com/engine/security/userns-remap/#user-namespace-known-limitations).

# Important note
The concept of username spaces is a typical Linux construct. The error described in this article is **NOT** an App Service and/or an Azure issue. This can easily be reproduced on essentially any machine that supports user namespaces and remapping, and is trying to create an ID out of the range set on the machine.

> **NOTE**: The range of these id's can **not** be changed on App Services. It is ultimately up to the developer or maintainer of the Image to resolve what is set with too high of an id.


# Errors 

## Types of errors
Sometimes if a user, group or file is mapped to a high UID or GUID you may see errors like the following:

- `failed to register layer: Error processing tar file(exit status 1): Container ID 1000000 cannot be mapped to a host IDErr: 0, Message: failed to register layer: Error processing tar file(exit status 1): Container ID 1000000 cannot be mapped to a host ID`
- `OCI runtime create failed: container_linux.go:380: starting container process caused: setup user: cannot set uid to unmapped user in user namespace: unknown`

There may be other variations of this message, but ultimately it will show that a user id cannot be mapped to the user namespace or hose.

## Where this may show
On App Services, this will show on the Image pull. Encountering these errors will cause the pull to fail - causing an `Application Error :(` message or a HTTP 502 when attempting to browse the site.

Below is an example of a pull that fails:

```yaml
2022-07-01T00:02:29.030Z INFO  - 6f199d2c4d2f Extracting 32KB / 308KB
2022-07-01T00:02:29.930Z INFO  - 6f199d2c4d2f Extracting 192KB / 308KB
2022-07-01T00:02:30.500Z INFO  - 6f199d2c4d2f Extracting 224KB / 308KB
2022-07-01T00:02:32.193Z INFO  - 6f199d2c4d2f Extracting 256KB / 308KB
2022-07-01T00:02:34.247Z INFO  - 6f199d2c4d2f Extracting 308KB / 308KB
2022-07-01T00:02:35.021Z INFO  - 6f199d2c4d2f Extracting 308KB / 308KB
2022-07-01T00:02:48.845Z INFO  - 6f199d2c4d2f Pull complete
2022-07-01T00:02:48.874Z INFO  - d163dfb13dd8 Extracting 193B / 193B
2022-07-01T00:02:48.876Z INFO  - d163dfb13dd8 Extracting 193B / 193B
2022-07-01T00:02:49.002Z INFO  - d163dfb13dd8 Pull complete
2022-07-01T00:02:49.017Z INFO  - 8820d67a46eb Extracting 202B / 202B
2022-07-01T00:02:49.019Z INFO  - 8820d67a46eb Extracting 202B / 202B
2022-07-01T00:02:49.113Z INFO  -  
2022-07-01T00:02:49.114Z ERROR - failed to register layer: Error processing tar file(exit status 1): Container ID 1000000 cannot be mapped to a host IDErr: 0, Message: failed to register layer: Error processing tar file(exit status 1): Container ID 1000000 cannot be mapped to a host ID
2022-07-01T00:02:49.124Z INFO  - Pull Image failed, Time taken: 0 Minutes and 55 Seconds
```

You can view log files to further correlate this through **Log Stream** or the **Kudu** site by viewing log files ending with `_docker.log`.

# Resolution
## Find the file

**This must be ran locally and not on App Services**.

Start a shell into the locally running container from the Image in question and run `find / \( -uid 1000000 \)  -ls 2>/dev/null`.

Replace `1000000` with the id that fails in the error message during the Image pull.

Ideally, the below should be seen, in this case with a file owned by a user of too high of a `UID`:

```shell
# find / \( -uid 1000000 \)  -ls 2>/dev/null
  4758012      0 -rw-r--r--   1 veryhigh veryhigh        0 Jun 30 21:24 /var/www/html/file-with-high-id
```

> **NOTE**: If a user with a high `UID` is set as the `USER` of the container, then all files may appear owned by said user.

## Confirm the file 

**This must be ran locally and not on App Services**.

If a specific file is found to be the offender, it can be confirmed to have a high ID mapping by running:

`ls -ln file-with-high-id`

An example of output would be:

```shell
# ls -ln file-with-high-id
-rw-r--r-- 1 1000000 1000000 0 Jun 30 21:24 file-with-high-id
```

## Fix the file or user
To do this, the file(s) ownership must be changed. This can be done in the `Dockerfile` by using `chown` for example on the file.

If the user is defined in the Image like the below, update the id it is mapped to - below is an example:

```Dockerfile
RUN groupadd veryhigh -g 1000000
RUN useradd -r -u 1000000 -g veryhigh veryhigh
RUN touch file-with-high-id
RUN chown veryhigh:veryhigh file-with-high-id
```

If the Image is a 3rd party image, contact the maintainer about the `UID` used. Alternatively it may be possible to create your own Image and use the 3rd party image as a base to change ownership on the affect file(s) or user.

After resolving this, **the image must be rebuilt** and then can be deployed. This **must** be done locally.

## NPM based projects causing userns remap exceptions
Certain versions of NPM may install packages into your `node_modules` directory with an extremely high ID for the file owner/creator. This has been more prevalent in **npm 9**, there has been discussion surrounding this in the npm community, which can be found in these threads - it is highly recommended to read these for context:

- [RFC thread ([RRFC] Clean up file ownership story)](https://github.com/npm/rfcs/issues/546)
- [NPM 9 change log (Breaking Changes)](https://docs.npmjs.com/cli/v9/using-npm/changelog?v=true#900-pre6-2022-10-19)
- [This GitHub issue (GitHub Issue 5900)](https://github.com/npm/cli/issues/5900)


If deploying the below `Dockerfile` to App Service, explicitly targeting **npm 9**, we get a userns remapping error:

> **NOTE**: This can happen with other version previously, like [npm 5](https://github.com/projectkudu/kudu/issues/2512)

**(Dockerfile)**:
```Dockerfile
FROM node:18.9.0-alpine3.15

WORKDIR /app
COPY package.json ./
RUN npm i -g npm@9.1.1 && \
    npm i

COPY . ./

EXPOSE 8080 

CMD [ "node", "/app/server.js" ]
```

Error seen on App Services:

```
ERROR - failed to register layer: Error processing tar file(exit status 1): Container ID 1516583083 cannot be mapped to a host IDErr: 0, Message: failed to register layer: Error processing tar file(exit status 1): Container ID 1516583083 cannot be mapped to a host ID
```

Using the same general approach above, we will **need to investigate this locally**. However, as a caveat, the `find` command may not find the UID that it's failing with - due to the fact that ID switching may be occurring (described in the earlier linked threads).

We can use this approach to find the high ID in the container - since we know this is related to NPM and node_modules, we use this. Make sure to replace the below path with your path to your `node_modules`:

```bash
FILES=$(find /app/node_modules/ ! -user root)
ls -lrta $FILES
```

We can now see the owner name is actually the ID that matches the above error:

```bash
-rw-r--r--    1 501      dialout       1490 Nov 29 17:18 /app/node_modules/cookie-signature/Readme.md
-rw-r--r--    1 501      dialout        695 Nov 29 17:18 /app/node_modules/cookie-signature/History.md
-rw-r--r--    1 501      dialout         29 Nov 29 17:18 /app/node_modules/cookie-signature/.npmignore
-rw-r--r--    1 15165830 root          1070 Nov 29 17:18 /app/node_modules/content-type/package.json
-rw-r--r--    1 15165830 root          4809 Nov 29 17:18 /app/node_modules/content-type/index.js
-rw-r--r--    1 15165830 root          2796 Nov 29 17:18 /app/node_modules/content-type/README.md
-rw-r--r--    1 15165830 root          1089 Nov 29 17:18 /app/node_modules/content-type/LICENSE
-rw-r--r--    1 15165830 root           436 Nov 29 17:18 /app/node_modules/content-type/HISTORY.md
-rw-r--r--    1 501      dialout        703 Nov 29 17:18 /app/node_modules/asynckit/stream.js
-rw-r--r--    1 501      dialout       1751 Nov 29 17:18 /app/node_modules/asynckit/serialOrdered.js
-rw-r--r--    1 501      dialout        501 Nov 29 17:18 /app/node_modules/asynckit/serial.js
-rw-r--r--    1 501      dialout       1017 Nov 29 17:18 /app/node_modules/asynckit/parallel.js
```

As a resolution, we can change the ownership of the files under this directory with `chown`.

**IMPORTANT**: If you're going to use `chown`, it **must** be in the same layer as `npm install`. If this is in two seperate/distinct layers, ownership change will not work and you'll still end up getting an ID out of range error due to userns.

(Do)
```
RUN npm i -g npm@9.1.1 && \
    npm i && \
    find /app/node_modules/ ! -user root | xargs chown root:root
```

(Dont)
```
RUN npm i -g npm@9.1.1 && \
    npm i 

RUN find /app/node_modules/ ! -user root | xargs chown root:root
```

### What if I can't find the UID?
There is a chance the UID that the pull and container creation is failing on cannot be found.

This is not always the case. However, **you should still use the same approaches**.

The reason for this is if using the `find /app/node_modules/ ! -user root` approach, for example, you may see node_module related files with the user in a range of **50x** and in the group **dialout**. When searching through the entire filesystem, these would generally be the only ones appearing other than the user/group `node` and `root`.

In these specific scenarios, after changing these 50x users and dialout groups to **root** (or a user within an acceptable UID range), this issue is resolved. This may be due to user switching during NPM installation, which is called out at the top of the **npm** section in the threads linked. 








