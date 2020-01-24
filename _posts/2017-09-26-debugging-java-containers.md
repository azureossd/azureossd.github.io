---
title: " Debugging Java containers"
categories:
  - Azure App Service on Linux
  - Java
  - Debugging
date: 2017-09-26 17:12:47
tags:
author_name: Prasad K.
header:
    teaser: /assets/images/Logo-docker.svg
---

Can you debug Java applications within your container? Yes.

How? Check below…


1. Modify your dockerfile

-   To expose JPDA params

                 <font color="#d16349" size="2">*ENV JPDA\_OPTS="-agentlib:jdwp=transport=dt\_socket,address=8000,server=y,suspend=n"*</font>

-   To expose the debug port along with application port

                 *<font color="#c0504d">EXPOSE 7080 **<font>8000</font>**</font>*

-   To add the options in your command

               *<font color="#c0504d">CMD \["sh", "-c", "java **<font>\$JPDA\_OPTS</font>** -Durl=\$url -jar app.jar"\]</font>*

<font color="#c0504d">\
</font>

2. Build the docker and run with exposing the app port and debug port.</font>

               *<font color="#c0504d">docker run –d -p 7080:7080 \<docker image\></font>*

<font color="#c0504d">\
</font>

3. Open the project in Eclipse and create a debug configuration with Host and debug port

![image](/media/2017/09/image_thumb255.png "image")



4. Set the breakpoints and Launch the debug configuration. Voila! You are debugging the application in running container.
