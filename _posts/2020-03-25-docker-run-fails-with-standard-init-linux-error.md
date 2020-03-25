---
title: "Docker run fails with standard_init_linux.go error"
author_name: "Christopher Maldonado"
tags:
    - docker
    - standard_init_linux
    - error
categories:
    - Azure App Service on Linux # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - Troubleshooting # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/azurelinux.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
date: 2020-03-25 00:00:00
---

Looking into the standard_init_linux.go error when working with Azure App Service on Linux.

## Issue

If you have ever build Linux containers on Windows with custom shell scripts, you may have ran into this issue error before:

```bash
2019-01-31T16:00:10.908327548Z standard_init_linux.go:195: exec user process caused "no such file or directory"
```

This is normally due to the Linux system not understanding one of your scripts you are trying to execute.

In Windows, text file's end of line sequence is normally CR+LF (Carriage Return[0x0D] + Line Feed[0x0A]).
In Linux and modern Macs (OS X+), the EOL sequence is just LF.

When running Linux images, shell scripts will need to use LF instead of CRLF. Thus why sometimes we run into the above error message. Linux recognizes LF as a new line, thus when CRLF are in the shell file, it doesn't recognize it as valid.

## Solution

### How you can change your file to only use LF

In VS Code, it is pretty easy. All you need to do is make sure that your end of line sequence is set to LF. You can set this at the bottom right hand corner of your screen:

![VS Code Line Ending Encoding](/media/2020/03/chmald-docker-run-error.png)

Be sure to save your file so that it holds the correct settings.
In Vi or Vim, you will need to open your file in the editor and type the following command:

```bash
:set ff=unix
```

This will set your file format to Unix. Save this and you are good to go.
