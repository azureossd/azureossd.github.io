---
title: "Case study: TypeError: Invalid URL - ERR_INVALID_URL with Next.js (and Node.js) apps"
author_name: "Anthony Salemo"
tags:
    - Nodejs
    - Next
categories:
    - Azure App Service on Linux
    - Node
    - Troubleshooting
    - Linux
header:
    teaser: /assets/images/nextjs.png
toc: true
toc_sticky: true
date: 2025-08-15 12:00:00
---
This blog covers a niche issue with Next.js, but potentially any node.js-based app, when using the Node.js URI API

# Overview
To preface this blog, this issue can happen to any node.js application that uses the ["modern" `URL` API](https://nodejs.org/api/url.html). This can also happen essentially anywhere (your local machine, PaaS, IaaS, etc.), but for the sake of this post is being written about on App Service Linux using a Node.js v20 "blessed" image. This also happened to occur on a Next.js app, which is what this blog context is limited to, **but this is not actually just limited to Next.js** - this also doesn't pertain to client-side routing. 

The error upon Next.js startup would look like this and can be found in your `default_docker.log` file as long as [App Service Logs](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs) are enabled:

```
2025-08-07T19:21:13.3114549Z ⨯ TypeError: Invalid URL
2025-08-07T19:21:13.3115168Z at d.u (build/server/pages/_error.js:1:649)
2025-08-07T19:21:13.3115201Z at d (build/server/chunks/3244.js:6:16047)
2025-08-07T19:21:13.3115226Z at a.s (build/server/pages/_app.js:1:465) {
2025-08-07T19:21:13.3115250Z code: 'ERR_INVALID_URL',
2025-08-07T19:21:13.3115277Z input: 'https://810492618439:8080/'
```

This particular error would be thrown wherever nodes _current_ URL API is used. Assuming this is pulling the hostname from the `HOSTNAME` variable (or `--hostname` passed to the container), we can also further assume this is the case (at least in Next.js' case), since it'll also log it at startup:

```
   ▲ Next.js 15.3.1

   - Local:        http://810492618439:8080⁠

   - Network:      http://810492618439:8080⁠

 ✓ Starting...

 ✓ Ready in 79ms
```

The `HOSTNAME` / `--hostname` injected to the container cannot be overriden. In this particular case, this was set to a consistent (string) numerical based value under extremely rare circumstances. This is almost always a mix of alphabetical characters and numbers.

One assumption we can make is that the value is numerical (although still sent as a string) - of `810492618439`. Technically, this is an allowed value and furthermore we can see that this value passed to Next.js for server startup **is valid** - or else this would've failed at server startup (not past this where other logic for URLs where invoked). So this is not the problem - the problem seems limited to the URI aspect of this.
- Some further investigation shows that there doesn't happen to be any POSIX standard for `HOSTNAME` (https://pubs.opengroup.org/onlinepubs/009695399/basedefs/xbd_chap08.html)
- But there is an RFC standard about [_Requirements for Internet Hosts_](https://datatracker.ietf.org/doc/html/rfc1123#page-13), but this doesn't seem to limit syntax to not allow an all numerical value (that's not an IP). Atleast, in the sense that it's not made explicitly clear to an average user.

So, at this point, the value itself is okay in terms of server startup. 

With some further investigation and knowing that [URL](https://nodejs.org/api/url.html) is being used, we can focus our investigation on `ERR_INVALID_URL` and why this is invalid.

# Investigation
It's always good to see if an issue can be reproduced locally where possible. A simple use case would be to create a bare minimum express.js server (or anything like this) and do a quick repro using the `URI` API.

```js
import express from "express";
import { URL } from "url";
const app = express();
const parsedUrl = new URL("http://810492618439:3000");

const port = process.env.PORT || 3000;

app.get("/", (_req, res) => {
    res.json({ "msg": "node-uri-test" });
});

app.listen(port, () => {
    console.log(parsedUrl.host);
    console.log(`Server is running on port ${port}`);
});
```

Running a basic express application like this failed with:

```
$ node server.js 
node:internal/url:797
    this.#updateContext(bindingUrl.parse(input, base));
                                   ^

TypeError: Invalid URL
    at new URL (node:internal/url:797:36)
    at file:///C:/Users/ansalemo/code/node-uri-test/server.js:4:19
    at ModuleJob.run (node:internal/modules/esm/module_job:234:25)
    at async ModuleLoader.import (node:internal/modules/esm/loader:473:24)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:123:5) {
  code: 'ERR_INVALID_URL',
  input: 'http://810492618439:3000'
}
```

What is we pass this value as the host? We know the original Next.js started fine, but what about node/express and `createServer` under the hood?

```js
const host = parsedUrl.hostname || "3542861087a";

app.listen(port, () => {
    console.log(`Server is running on port ${host}:${port}`);
});
```

This works:

```
$ node server.js 
3542861087a:3000
Server is running on port 3542861087a:3000
```

What if we add an alphabetical character to the string?

```js
const parsedUrl = new URL("http://3542861087a:3000");
```

This now works:

```
$ node server.js 
3542861087a:3000
Server is running on port 3000
```

Now we know this can be reproduced locally. So far we know:
1. Server startup was uneffected. Logic that was invoked post-startup was affected with `URL` API usage is only affected
2. `URI` usage fails if the passed in (string) value turns out to be all numbers in the extremely rare case that it may

If we look back at the [URI](https://nodejs.org/api/url.html) docs for Node, we know it's based off of the [WHATWG URL API](https://nodejs.org/api/url.html#the-whatwg-url-api). In the past couple of years, this moved from a "legacy" `uri` package. The old `uri` description mentions the following:

"_`url.parse()` uses a lenient, non-standard algorithm for parsing URL strings. It is prone to security issues such as host name spoofing and incorrect handling of usernames and passwords. Do not use with untrusted input. CVEs are not issued for `url.parse()` vulnerabilities. Use the `WHATWG URL API` instead._"

If we do a quick test to see if this passes with the legacy `uri` API, we can see that this does:

```js
import express from "express";
import url from "node:url";
const app = express();
const parsedUrl = url.parse("http://810492618439:3000", true);

const port = process.env.PORT || 3000;
const host = parsedUrl.hostname;

app.get("/", (_req, res) => {
    res.json({ "msg": "node-uri-test" });
});

app.listen(port, () => {
    console.log(parsedUrl.hostname);
    console.log(`Server is running on port ${host}:${port}`);
});
```

```
$ node server.js 
810492618439
Server is running on port 810492618439:3000
```

At this point, bit by bit we've ruled this down to likely the specifications used by `WHATWG URL API`

Before checking out `WHATWG`, we can atleast attempt to see what's happening in `at new URL (node:internal/url:797:36)` where it fails - which should point to this file - https://github.com/nodejs/node/blob/main/lib/url.js. We can see there is logic to throw `ERR_INVALID_URL` if a `url` provided matches a regex for "forbidden" characters on [line 400](https://github.com/nodejs/node/blob/main/lib/url.js#L400) through 422. Although interestingly enough, if we put the value in this blog through a regex checker with that value - or - even trying to run that same code locally in `url.js` on those lines with that regex, it passes. So at some point in this file (or elsewhere) a failure is occurring. 

Looking at the `WHATWG` [valid domain spec](https://url.spec.whatwg.org/#valid-domain), this also doesn't seem to call out that an invalid host would consistent of this value, aside from the callout of [forbidden host code point](https://url.spec.whatwg.org/#forbidden-host-code-point), which in our value we can see, doesn't apply here.

The issue at this point is still clearly related to `WHATWG` and parsing logic for URI's not accepting only stringified numbers. Through a bit more additional searching, a Github thread [http://40000000000 considered as being a wrong URL · Issue #436 · whatwg/url](https://github.com/whatwg/url/issues/436) was opened by a user who noticed the same behavior. 

**Conclusion**:

Looking at the last comments and the testing through other mechanisms (`ping`, `curl`, `ssh`) which _do_ take input like `810492618439` as a valid host - it seems ultimately there may be a bit of a gray area with the RFC and how these tools interpret it (and us users alike), and, this issue in particular, was a culmination of multiple things occuring at once to cause extremely rare edgecase behavior.