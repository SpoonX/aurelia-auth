# Aurelia-authentication

[Open on github](https://github.com/SpoonX/aurelia-authentication)

## What is aurelia-authentication?

> Aurelia-authentication is a token-based authentication plugin for [Aurelia](http://aurelia.io/) with support for popular social authentication providers (Google, Twitter, Facebook, LinkedIn, Windows Live, FourSquare, Yahoo, Github, Instagram) and a local stragegy, i.e. simple username / email and password. It developed of a fork of [paul van bladel's aurelia-auth](https://github.com/paulvanbladel/aurelia-auth/) which itself is a port of the great [Satellizer](https://github.com/sahat/satellizer/) library.

Aurelia-authentication makes local and third-party authentication easy. If your server is setup right, it can be a simple as just to select your server endpoint from your [aurelia-api](https://github.com/SpoonX/aurelia-api) setup, add your third-party client ids and you are ready to go. Basically, aurelia-authentication does not use any cookies but relies on a JWT (json web token; other token formats have basic support) stored in the local storage of the browser:

![JWT in local storage](./pictures/TokenViaDevelopmentTools.png)

You have multiple endpoints? No problem! In the recommended setting, aurelia-authentication makes use of [aurelia-api](https://github.com/SpoonX/aurelia-api) which sets up multiple endpoints easily. Just specifiy in your aurelia-authentication configuration which endpoint you want to use for your server and which further endpoints you want to be configured and your token will be sent automatically to your protected API when the user is authenticated.

![Authentication header](./pictures/authHeader.png)

With aurelia-authentication you can:

* Use local login or third-party providers to authenticate the user
* Automatically add your token to requests to the specified endpoints
* Automatically refresh your token
* Extensivly customize the settings
* Use standalone or in conjuction with [aurelia-api](https://github.com/SpoonX/aurelia-api)
* And more

## Important note

The package name has changed (to make life easier). For installation, use `jspm i aurelia-authentication` or (for webpack) `npm i aurelia-authentication --save`. Make sure you update all references to `spoonx/aurelia-authentication` and `spoonx/aurelia-api` and remove the `spoonx/` prefix (don't forget your config.js, package.json, imports and bundles).

## How this differs from 'paulvanbladel/aurelia-auth'

This repository was originally a fork of paulvanbladel/aurealia-auth. It was forked when the original repository was in a period of inactivity, and later made into a repository of it's own. We still aim to provide 100% backwards compatibility, so the transition to aurelia-authentication should propose no problems.
As such we often get asked how this repository differs from the original. So, at the time of writing the differences are as follows:

* Provides the option to use endpoints, introduced by [aurelia-api](https://github.com/SpoonX/aurelia-api), which simplifies API access.
* By using aurelia-api the developer can specify which endpoints require the authentication patch.
* TypeScript support added through the addition of d.ts (typescript definition) files
* Lots of bug fixes
* Refactored code to be more readable and performant

**Aside:** Public SpoonX repositories are open to the community and actively maintained and used by the SpoonX company. They follow a strict deploy cycle with reviews and follow semantic versioning. This ensures code quality control and long term commitment.
