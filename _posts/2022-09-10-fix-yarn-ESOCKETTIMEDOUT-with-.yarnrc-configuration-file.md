---
title: "Fix Yarn ESOCKETTIMEDOUT with .yarnrc Configuration File"
author_name: "Ryan Douglass"
tags:
    - Nodejs
    - Yarn
    - Azure App Service on Linux
categories:
    - Nodejs
    - Deployment 
header:
    teaser: /assets/images/yarnlogo.png
toc: true
toc_sticky: true
date: 2022-09-10 12:00:00
---

During yarn install, you can often experience a timeout when downloading larger node modules.  These timeouts will cause build failures.  Increasing the timeout for `yarn install` with the flag `network-timeout` can resolve this problem.

```shell
yarn install --network-timeout 240000
```

However, in some cases you may not be able to directly change the `yarn install` command.  For App Service Linux, Oryx is running `yarn install` as part of the default deployment process when a `yarn.lock` file is present.  In this case, there isn't a direct way to modify the `yarn install` command.

### Error Examples

```shell
There appears to be trouble with your network connection. Retrying...
```

```shell
error An unexpected error occurred: 'https://registry.yarnpkg.com/<package name>.tgz: ESOCKETTIMEDOUT’.
```

## Yarn Configuration

One way to add arguments to yarn without directly changing the `yarn install` is to utilize the Yarn configuration file.  Those files are `.yarnrc` or `.yarnrc.yml` for v1.x and v2+ respectively.

*As of this publication Oryx is utilizing Yarn Classic, v1.X.*

### Yarn Classic v1.x

[.yarnrc \| Yarn (yarnpkg.com)](https://classic.yarnpkg.com/lang/en/docs/yarnrc/)

- Yarn classic can be configured with a file called `.yarnrc` in the root of your repository.
  - This file will enable you to change the behavior of `yarn install`.
- To increase the network timeout for yarn install, we can add `network-timeout 240000` in the file.
  - Time in ms, so this would be 240s.

```shell
network-timeout 240000
```

### Modern Yarn v2.x/v3.x

[Yarn - Package Manager (yarnpkg.com)](https://yarnpkg.com/configuration/yarnrc)

- Modern yarn's configuration file is different from classic yarn.
- The configuration file is named `.yarnrc.yml` and utilizes yaml formatting.
- The configuration options are also different.
- To increase network timeout, you would add `httpTimeout: 240000`

```yaml
httpTimeout: 24000
```
