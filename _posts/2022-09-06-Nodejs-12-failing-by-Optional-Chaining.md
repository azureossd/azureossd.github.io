---
title: "Node.js 12 applications failing by Optional chaining"
author_name: "Edison Garcia"
tags:
    - Nodejs
    - Azure App Service on Linux
categories:
    - Nodejs
    - Deployment 
header:
    teaser: /assets/images/nodelinux.png
toc: true
toc_sticky: true
date: 2022-09-06 12:00:00
---

Node.js version 14 has included [Optional Chaining (**?.**) operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) as part of the [updates/hightlights](https://nodejs.medium.com/node-js-version-14-available-now-8170d384567e), which enable JavaScript developers to read the value of a property located deep within a chain of connected objects without having to check that each reference in the chain is valid.

This change can be affecting **Node.js <=12 applications** which have npm modules dependencies that are implementing optional chaining in their code.

![Nodejs12-chaining-operator](/media/2022/09/chaining-operator-node-12.png) 
(*Screenshot taken from https://node.green*)

Some sceanrios are described below: 

# npx serve -s

When running `npx serve -s` without having installed the module before, it will fetch the latest version (currently v14). This new version requires at least Node.js 14 version to run, otherwise it will fail with the following error:

```shell
npx serve -s
npx: installed 91 in 29.345s
file:///root/.npm/_npx/108/lib/node_modules/serve/build/main.js:130
      url.port = url.port ?? "3000";
                           ^
SyntaxError: Unexpected token '?'
    at Loader.moduleStrategy (internal/modules/esm/translators.js:140:18)
    at async link (internal/modules/esm/module_job.js:42:21)
```

## Mitigation

You can mitigate this error with the following options:

1. Run `npx serve@13 -s`, which will pull the latest 13 version (13.0.4) Or
2. Install server@13.x version with `npm install serve@13.0.4 --save` and then you can use `npx serve -s` and it will pull the version from node_modules folder Or
3. Upgrade your application to use Node.js 14 version.

# Other scenarios

You can find other issues reported by the community: 

- [eslint-plugin-next ](https://github.com/vercel/next.js/issues/38530)
- [Next.js issue](https://github.com/vercel/next.js/pull/36978)
- [Remix framework](https://github.com/remix-run/remix/issues/2400)
- [WebPack 4 issue](https://github.com/webpack/webpack/issues/10227)