---
title: "Title should be the same (or similar to) your filename"
author_name: "Your Name"
tags:
    - example
    - multiple words
    - no more than 3 tags
categories:
    - <Service Type> # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - <Stack> # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - <Framework> # Django, Spring Boot, CodeIgnitor, ExpressJS
    - <Database> # MySQL, MongoDB, 
    - <Blog Type> # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/imagename.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
---

## Overview that is using a H2 header which is useful for a TOC

Some content explaining the blog post.

## First Step

1. Ordered list
2. Ordered list with additional sentences/paragraphs.

   Notice that this new paragrah has 3 spaces before it so that it doesn't break up the ordered list.  If you do not do this, step 3 below will change to step 1.  Additionally, media will also need to be indented like below.

   ![Required description of the image](/media/2018/02/DockerIgnore.png)

3. Another Ordered list

   - Bullet and *italics* text.
   - Bullet and **BOLD** text.
   - Bullet with ~~strikethrough~~ text.

4. Last One

## Sample Code Blocks

YAML

```yaml
---
something: "Something"
---
```

Bash

```bash
bundle exec jekyll serve
```

Additional Samples can be found [Here](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#code)

## Sample Table

| Table | Test | Description |
|----|----|----|
|Some|Test|Data|
|Row|Number|2|