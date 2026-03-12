---
title: "GLIBC version not found"
author_name: "Anthony Salemo"
tags:
    - App Service Linux
    - Troubleshooting
categories:
    - App Service Linux
    - Configuration
    - Linux
header:
    teaser: /assets/images/azurelinux.png
toc: true
toc_sticky: true
date: 2026-01-13 12:00:00
---

This post will quickly cover this error and some brief actions to take for troubleshooting

# Overview
This post will cover the error `version 'GLIBC_x.xx' not found`. This error signature may vary depending on the language of the application, but it generally has the same syntax. This can happen for any language - the context of this post applies to "Blessed Images" but this general information can apply to anywhere this happens on Linux machines.

A full error in a real-world setting is below, where the language is Python:
- `ImportError: /lib/x86_64-linux-gpu/libc.so.6: version 'GLIBC_2.33' not found (required by /home/site/wwwroot/antenv/lib/python3.12/site-pcackages/cryptography/hazmat/bindings/_rust.abi3.so)`

**Deconstructing the error**
---
The main part of the error is `version 'GLIBC_2.33' not found`. Which is saying that a particular version of glibc is not found at runtime. Since App Service Linux is talked about here, the runtime is the container. The container is ran from an image in which a certain version of glibc is included in, normally based on the distribution and version.

This version of glibc is being requested by a specific peice of code. Normally this is going to be something like C bindings or shared object libraries. We see this occasionally with packages that are primarily built upon C, such as `cryptography`, `bcrypt` and other packages like this.

**How can you check the glibc version?**
---
Go into **SSH** and run `ldd --version`. Do this in the **application container**, not the Kudu container.

![glibc version](/media/2026/01/glibc_version.png)

> **NOTE**: The application must be running to go into SSH. If it's crashing you cannot SSH in. You cannot SSH into a container that is crashing, in general.

> **NOTE**: For custom images/custom containers (Web App for Containers), you need to enable SSH in your image. See [Enabling SSH on Linux Web App for Containers](https://azureossd.github.io/2022/04/27/2022-Enabling-SSH-on-Linux-Web-App-for-Containers/index.html)

**What is "glibc?"**: This is the C standard library (GNU) which is a foundational aspect in Linux. There is also `musl` C, which Alpine uses.

**Important points and troubleshooting**
--
**Do not try to manually change the libc version**. This means attempting things like trying to install/update `glibc` or things along this path because:
- You may break other aspects of the container. There is a large amount of tooling builtin to container images that normally rely on C. Changing this may cause adverse/unexpected behavior at runtime
- You may waste a large amount of time. Even though you can alter some behavior via startup commands/scripts - due to complexity of trying to change it while troubleshooting the initial error, you may end up being unsuccessful and ending frusturated

**Typical path to resolution**:
- Identify the package that wants a specific version of glibc. You may be able to downgrade or upgrade these. The package repository (or general online searching) should point to information that shows what version of glibc a package may use
- Or, If you can't down/upgrade - then for "Blessed Images", see if you can upgrade to a higher version of the image you're on. For example, at the time of writing this blog post and in relation to the above error that's ran within a Python "Blessed" image, the following glibc versions are utilized:
    - **Python 3.11 image**: glibc 2.21
    - **Python 3.12 image**: glibc 2.21
    - **Python 3.13 image**: glibc 2.36
    - **Python 3.14 image**: glibc 2.39
    - The error assumes that the application is using an image that's 3.12 or below. Therefor a potential resolution is to use the Python 3.13 image or higher.
    - This same concept should apply to other Blessed Images. Of course, there may be differences in which glibc versions are used across language versions of the other images. Use `ldd --version` to check the glibc version while in SSH

- Or, Use a custom image through Web App for Containers. There may be packages that require a specific version that may not be compatible with the current distribution version or other aspects in Blessed Images. **This is an occasionally recommended path for things like this is to use a custom image since you have complete control over how the image is built.**