---
title: " Creating an AngularJS Single Page Application with routes on Azure WebApps"
tags:
  - AngularJs
  - WAWS
categories:
  - Azure App Service on Windows
  - AngularJs
  - How-To
  - Configuration
date: 2015-11-28 21:57:00
author_name: Prashanth Madi
---

This Blog would provide a step-by-step procedure on creating sample AngularJS app with routes supporting SEO. 

Source code is available on github @ https://github.com/prashanthmadi/angularjs-azure

1) Create a new Azure web app from portal.

2) Setup continuous deployment process.

3) Create a HTML file(index.html) with below content which would act as entry point to AngularJS app. A div tag with ng-view is an important part of this file.

``` {.scroll}
<html>
 <head>
 <link rel="stylesheet" type="text/css" href="assets/bootstrap/css/bootstrap.min.css">
 <script type="text/javascript" src="assets/angularmodules/angular.min.js"></script>
 <script type="text/javascript" src="assets/angularmodules/angular-route.min.js"></script>
 <script type="text/javascript" src="assets/app.js"></script>
 <base href="http://blogs.msdn.com/">
 </head>
 <body ng-app="giveCampaign">
 <div class="col-md-3">
 <ul class="nav">
 <li><a href="donarlist"> Donar List </a></li>
 <li><a href="receivertrans"> Receive</a></li>
 </ul>
 </div>
 <div ng-view></div>
 </body>
 </html>
```

4) Create a new directory(assets) to store all other files.

 ![](/media/2019/03/7041.Screen%20Shot%202015-11-30%20at%2010.28.25%20AM.png)

5) Create an app.js file inside assets folder which would have our app specific angularJS code. Below is for our sample app which has two controllers and route config.

``` {.scroll}
 (function(){
 var app = angular.module("giveCampaign",['ngRoute']);
 
 app.config(['$routeProvider','$locationProvider',function($routeProvider, $locationProvider) {
 
 $routeProvider.when('/donarlist', {templateUrl:"assets/templates/donarlist.html",controller:'DonarController'}).when('/receivertrans',{templateUrl:"assets/templates/receiver.html",controller:'ReceiverController'}).otherwise({redirectTo: '/abc'});
 $locationProvider.hashPrefix('!').html5Mode(true);
 }]);
 
 
 app.controller('DonarController', function(){
 this.recentTrans = recentTransactions;
 
 });
 
 var recentTransactions =[
 {donatedTo:"justin Tim",
 item:"bicycle",
 cost:"300",
 donatedBy:"Cristhian Uribe"
 },
 {donatedTo:"bryan lynch",
 item:"baseball bat",
 cost:"200",
 donatedBy:"richard marr"
 }
 ];
 
 app.controller('ReceiverController',function(){
 
 });
 
 })();
 
```

6) Our AngularJS project would require few angular libraries. Either you can download them and insert in assets/angularmodules folder (or) use existing CDN in index.html file.

![](/media/2019/03/4743.Screen%20Shot%202015-11-30%20at%2011.53.07%20AM.png)

[7) I have created two different templates inside assets/templates older to show a view based on incoming url

ex: - url ending with /donarlist should show all the donars of charity foundation (donarlist.html)

      - url ending with /receiver should show a form to fill required details. (receiver.html)

donarlist.html

``` {.scroll}
<div ng-controller="DonarController as donarCtrl">
 <div ng-repeat="transaction in donarCtrl.recentTrans">
 <div>{{transaction.donatedBy}} has donated a {{transaction.item}} worth of {{transaction.cost | currency}} to {{transaction.donatedTo}}</div>
 </div>
</div>
```

receriver.html 

``` {.scroll}
<div ng-controller="ReceiverController as recCtrl">
 <form name="needForm">
 <label>Name: </label>
 <input ng-model="item.name" type="text" />
 <label>Email: </label>
 <input ng-model="item.email" type="email" />
 <label>Need: </label>
 <input ng-model="item.name" type="text" />
 </form>
</div>
```

![](/media/2019/03/7455.Screen%20Shot%202015-11-30%20at%2010.36.23%20AM.png)

8) Create a web.config file which would establish incoming url routes from IIS to index.html page. Below is a working sample 

``` {.scroll}
<?xml version="1.0" encoding="UTF-8"?>
 <configuration>
 <system.webServer>
 <rewrite>
 <rules>
 <clear />
 <!-- ignore static files -->
 <rule name="AngularJS Conditions" stopProcessing="true">
 <match url="(app/.*|assets/.*|config/.*)" />
 <conditions logicalGrouping="MatchAll" trackAllCaptures="false" />
 <action type="None" />
 </rule>
 <!-- check if its root url and navigate to default page -->
 <rule name="Index Request" enabled="true" stopProcessing="true">
 <match url="^$" />
 <action type="Redirect" url="/receivertrans" logRewrittenUrl="true" />
 </rule>
 <!--remaining all other url's point to index.html file -->
 <rule name="AngularJS Wildcard" enabled="true">
 <match url="(.*)" />
 <conditions logicalGrouping="MatchAll" trackAllCaptures="false" />
 <action type="Rewrite" url="index.html" />
 </rule>
 </rules>
 </rewrite>
 </system.webServer>
 </configuration>
```

[9) Code is available on github @  https://github.com/prashanthmadi/angularjs-azure

10) Below are screen shots of a sample app with above code on azure

/donarlist url

![](/media/2019/03/2843.Screen%20Shot%202015-11-30%20at%2010.58.36%20AM.png)

/receiverlist url

![](/media/2019/03/7077.Screen%20Shot%202015-11-30%20at%2010.58.24%20AM.png)
.