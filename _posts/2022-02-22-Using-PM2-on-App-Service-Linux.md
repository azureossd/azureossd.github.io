---
title: "Using PM2 on App Service Linux"
author_name: "Edison Garcia"
tags:
    - Nodejs
    - PM2
    - Azure App Service on Linux
categories:
    - Azure App Service on Linux
    - Nodejs
    - Deployment 
    - Performance
header:
    teaser: /assets/images/nodelinux.png
toc: true
toc_sticky: true
date: 2022-02-22 12:00:00
---

PM2 is a production process manager for Node.js applications that allows you quickly start, manage, scale node processes and keep your application online. It is a built-in Load Balancer that implements auto-restarting across crashes and machine restarts. PM2 (currently 4.5.6 version) is installed by default in Node.js containers. 

  - (Applies just for **Node 12 LTS**) - The container automatically starts your app with PM2 when one of the common Node.js files is found in your project:
    - bin/www
    - server.js
    - app.js
    - index.js
    - hostingstart.js
    - One of the following PM2 files: `process.json` and `ecosystem.config.js`
  - Starting from **Node 14 LTS**, the container doesn't automatically start your app with PM2. To start your app with PM2, set the startup command to `pm2 start <.js-file-or-PM2-file> --no-daemon`. 

# Configuration 

To run PM2 successfully inside the docker container in Azure App Service Linux, be sure to use the `--no-daemon` argument because PM2 needs to run in the foreground for the container to work properly.

Alternative you can also use `pm2-runtime`, which is another option to run the aplication in the foreground designed for using with [containers](https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/), e.g. `pm2-runtime start index.js`.

You can update the Startup Command  or provide a bash script location.

![PM2](/media/2022/02/nest-deployment-linux-02.png)

If you want to use a configuration file, then you can use:

- **process.json**: 
    > [PM2 Official documentation](https://pm2.keymetrics.io/docs/usage/application-declaration/) 

     e.g. `pm2 start process.json --no-daemon`
    ```json
       {
            "name"        : "worker",
            "script"      : "./index.js",
            "instances"   : 1,
            "merge_logs"  : true,
            "log_date_format" : "YYYY-MM-DD HH:mm Z",
            "watch": true,
            "watch_options": {
                "followSymlinks": true,
                "usePolling"   : true,
                "interval"    : 5
            }
        }
    ```
    e.g.  Update startup command with `process.json`

    ```json
        {
            "script": "serve",
            "env": {
                    "PM2_SERVE_PATH": './build'
                }
            "args": '--no-daemon'
        }
    ```

- **ecosystem.config.js**:

    >[PM2 Official documentation](https://pm2.keymetrics.io/docs/usage/application-declaration/) 

    e.g. `pm2 start ecosystem.config.js --env production --no-daemon `

    ```json
    module.exports = {
        apps : [
            {
                name: "myapp1",
                script: "./custom.js",
                watch: false,
                error_file:'./error.log',
                out_file:'./output.log',
                env: {
                "NODE_ENV": "development",
                "PORT": 3000,
                },    
                env_production : {
                "NODE_ENV": "production",
                "PORT": 8080,
                }
            }
        ]
    }
    ```

Here are some examples based in some nodejs/javascript frameworks:

## JavaScript Frameworks

PM2 can serve static files or a SPA (Single Page Application) with [pm2 serve](https://pm2.keymetrics.io/docs/usage/expose/) feature. Here are some references and examples you can check when deploying and configuring JavaScript Frameworks:

- [Angular](https://azureossd.github.io/2022/01/29/Angular-Deployment-on-App-Service-Linux/index.html): e.g. `pm2 serve /home/site/wwwroot/dist/projectname --no-daemon --spa` where projectname is the name of your project.
- [React](https://azureossd.github.io/2022/02/07/React-Deployment-on-App-Service-Linux/index.html): e.g.  `pm2 serve /home/site/wwwroot/build --no-daemon --spa` 
- [Vue](https://azureossd.github.io/2022/02/11/Vue-Deployment-on-App-Service-Linux/index.html): e.g.  `pm2 serve /home/site/wwwroot/dist --no-daemon --spa`

## Nodejs frameworks
- Express: e.g. `pm2 start server.js --no-daemon` 
- [Nest](https://azureossd.github.io/2022/02/11/Nest-Deployment-on-App-Service-Linux/index.html): e.g. `pm2 start dist/main.js --no-daemon`
- Most frameworks: e.g. `pm2 start <entrypoint>.js --no-daemon` or `pm2-runtime start <entrypoint>.js`

# Performance

To get the maximum server performance and use all available CPU cores (vCPUs) you can add `-i max` parameter to pm2 using startup command/script defined in Azure Portal.

`pm2 start server.js -i max --no-daemon`

The `-i max` flag will make sure to start the application in cluster-mode, spawning as many workers as there are CPU cores on the server.

![PM2](/media/2022/02/pm2-01-performance.png)


# Troubleshooting

## Script not found

In scenarios that PM2 is not finding the js script file, you can get similar error:

E.g. **`pm2 error: [pm2][error] script not found: /home/site/wwwroot/dist/index.js`**

You can validate the following:
- If you are deploying from Azure DevOps, GitHub Actions or using ZipDeploy and building the modules not using App Service Build (Oryx), then validate if `node_modules` and application files are inside `/home/site/wwwroot`. You can use `https://<site-name>.scm.azurewebsites.net/newui/fileManager`
- In case of bash script, review if structure content is valid and if script extension file has EOL sequence [LF and not CRLF](https://azureossd.github.io/2020/03/25/docker-run-fails-with-standard-init-linux-error/index.html).
- If npm or module not found, check these references:
    - [NPM executables (nest start, nuxt start, next start) not being found](https://azureossd.github.io/2022/10/24/NPM-Executables-not-being-found-at-startup-on-App-Service-Linux/index.html)
    - [Cannot find module 'module-name'](https://azureossd.github.io/2022/10/25/Module-not-found-with-Node-on-App-Service-Linux/index.html)


## Node Options

In case you want to pass node options to pm2 you can use `--node-args` for example, when increasing heap memory: 

`pm2 start app.js --node-args="--max-old-space-size=2048" --no-daemon`


## Logging

To get PM2 and/or Application Logs, you need to enable [**Application Service Logs**](https://docs.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs#enable-application-logging-linuxcontainer) from Azure Portal and use Kudu `https:/sitename.scm.azurewebsites.net/api/logs/docker` clicking on the **Date_InstanceID_default_docker.log** or use Log Stream or [Azure cli](https://docs.microsoft.com/en-us/cli/azure/webapp/log?view=azure-cli-latest) with `az web app log`.

### PM2 Logs

If the application is throwing uncaught exceptions that is causing node process to crash, you can check for `PM2 log` and `<id>|worker` in **Date_InstanceID_default_docker.log** for more information about the issue and signal. PM2 will automatically create a new process and launch the application itself, the advantage of this approach will be that the container will not be exiting. 

```log
022-02-23T00:50:28.559915988Z 2022-02-23T00:50:28: PM2 log: App [worker:0] starting in -cluster mode-
2022-02-23T00:50:28.565065248Z 00:50:28 PM2       | pid=42 msg=process killed
2022-02-23T00:50:28.565097450Z 00:50:28 PM2       | App [worker:0] starting in -cluster mode-
2022-02-23T00:50:28.603341626Z 2022-02-23T00:50:28: PM2 log: App [worker:0] online
2022-02-23T00:50:28.604192785Z 00:50:28 PM2       | App [worker:0] online
2022-02-23T00:50:28.740950953Z 00:50:28 0|worker  | /home/site/wwwroot/index.js:12
2022-02-23T00:50:28.741217172Z 00:50:28 0|worker  | console.log('Crash';
2022-02-23T00:50:28.741229372Z 00:50:28 0|worker  |             ^^^^^^^
2022-02-23T00:50:28.741237973Z 00:50:28 0|worker  | SyntaxError: missing ) after argument list
2022-02-23T00:50:28.741242573Z 00:50:28 0|worker  |     at wrapSafe (internal/modules/cjs/loader.js:915:16)
2022-02-23T00:50:28.741247174Z 00:50:28 0|worker  |     at Module._compile (internal/modules/cjs/loader.js:963:27)
2022-02-23T00:50:28.741251474Z 00:50:28 0|worker  |     at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)
2022-02-23T00:50:28.741256174Z 00:50:28 0|worker  |     at Module.load (internal/modules/cjs/loader.js:863:32)
2022-02-23T00:50:28.741453188Z 00:50:28 0|worker  |     at Function.Module._load (internal/modules/cjs/loader.js:708:14)
2022-02-23T00:50:28.741464589Z 00:50:28 0|worker  |     at /usr/local/lib/node_modules/pm2/lib/ProcessContainer.js:303:25
2022-02-23T00:50:28.741552695Z 00:50:28 0|worker  |     at wrapper (/usr/local/lib/node_modules/pm2/node_modules/async/internal/once.js:12:16)
2022-02-23T00:50:28.741559896Z 00:50:28 0|worker  |     at next (/usr/local/lib/node_modules/pm2/node_modules/async/waterfall.js:96:20)
2022-02-23T00:50:28.741634101Z 00:50:28 0|worker  |     at /usr/local/lib/node_modules/pm2/node_modules/async/internal/onlyOnce.js:12:16
2022-02-23T00:50:28.741784711Z 00:50:28 0|worker  |     at WriteStream.<anonymous> (/usr/local/lib/node_modules/pm2/lib/Utility.js:186:13)
2022-02-23T00:50:28.744311588Z 2022-02-23T00:50:28: PM2 log: App name:worker id:0 disconnected
2022-02-23T00:50:28.744701815Z 00:50:28 PM2       | App name:worker id:0 disconnected
2022-02-23T00:50:28.745117845Z 2022-02-23T00:50:28: PM2 log: App [worker:0] exited with code [0] via signal [SIGINT]
2022-02-23T00:50:28.746090213Z 00:50:28 PM2       | App [worker:0] exited with code [0] via signal [SIGINT]
2022-02-23T00:50:28.746877668Z 2022-02-23T00:50:28: PM2 log: App [worker:0] starting in -cluster mode-
2022-02-23T00:50:28.754209881Z 00:50:28 PM2       | App [worker:0] starting in -cluster mode-
2022-02-23T00:50:28.787172587Z 2022-02-23T00:50:28: PM2 log: App [worker:0] online
```

PM2 will try several times until it reaches 15 times. Then it will throw the following error: `Script <entrypoint.js> had too many unstable restarts (16). Stopped. "errored"`

###  Access Logs
Since PM2 does not provide or allow to configure access logs with all requests processed by the server. You can use [**access-log** npm package](https://www.npmjs.com/package/access-log ) that does that for you when using http or https server. 

### PM2 Plus  

Enterprise software developed by PM2 where you can pay for a plan to get real-time monitoring through web interface and profiling options among others. 

Here are some screenshots from the free plan. 

![PM2](/media/2022/02/pm2-02-performance.png)

![PM2](/media/2022/02/pm2-03-performance.png)