# aurelia-authentication

[![Build Status](https://travis-ci.org/SpoonX/aurelia-authentication.svg)](https://travis-ci.org/SpoonX/aurelia-authentication)
[![Known Vulnerabilities](https://snyk.io/test/npm/name/badge.svg)](https://snyk.io/test/npm/aurelia-authentication)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?maxAge=2592000?style=plastic)](https://gitter.im/SpoonX/Dev)

> Aurelia-authentication is a token-based authentication plugin for [Aurelia](http://aurelia.io/) with support for popular social authentication providers (Google, Twitter, Facebook, LinkedIn, Windows Live, FourSquare, Yahoo, Github, Instagram) and a local strategy, i.e. simple username / email and password. It developed of a fork of [paul van bladel's aurelia-auth](https://github.com/paulvanbladel/aurelia-auth/) which itself is a port of the great [Satellizer](https://github.com/sahat/satellizer/) library.

Aurelia-authentication makes local and third-party authentication easy. Aurelia-authentication does not use any cookies but relies on a token (designed for JWT, but has basic support for others as well) stored in the local storage of the browser. If your server is setup right, it can be a simple as just to select your server endpoint from your [aurelia-api](https://github.com/SpoonX/aurelia-api) setup, add your third-party client ids and you are ready to go.

You have multiple endpoints? No problem! In the recommended setting, aurelia-authentication makes use of [aurelia-api](https://github.com/SpoonX/aurelia-api) which can set up multiple endpoints. Just specify in your aurelia-authentication configuration which endpoint you want to use for your server and which further endpoints you want to be configured and your token will be sent automatically to your protected API when the user is authenticated.

With aurelia-authentication you can:

* Use local login or third-party providers to authenticate the user
* Automatically add your token to requests to the specified endpoints
* Automatically refresh your token
* Extensively customize the settings
* Use standalone or in conjunction with [aurelia-api](https://github.com/SpoonX/aurelia-api)
* Use [Auth0](https://auth0.com) as your only authentication provider (see [the relevant section](auth0.md) for more info)
* Update valueConverters using the 'authorization-change' binding signal.
* Subscribe to the 'authorization-change' event.
* And more

## Documentation

You can find usage examples and the documentation at the [aurelia-authentication-docs](http://aurelia-authentication.spoonx.org/).

The [changelog](doc/changelog.md) provides you with information about important changes.

## Installation

### Aureli-Cli

Run `npm i aurelia-authentication --save` from your project root.

Aurelia-authentication needs an installation of [aurelia-api](https://www.npmjs.com/package/aurelia-api). It also has submodules (currently only the authFilter) and makes use of `extend` and `jwt-decode`. So, add following to the `build.bundles.dependencies` section of `aurelia-project/aurelia.json`.

```js
"dependencies": [
  // ...
  "extend",
  {
    "name": "aurelia-authentication",
    "path": "../node_modules/aurelia-authentication/dist/amd",
    "main": "aurelia-authentication"
  },
  {
    "name": "jwt-decode",
    "path": "../node_modules/jwt-decode/lib",
    "main": "index"
  }
  // ...
],
```

### Jspm

Run `jspm i aurelia-authentication`

Add `aurelia-authentication` to the `bundles.dist.aurelia.includes` section of `build/bundles.js`.

Aurelia-authentication needs an installation of [aurelia-api](https://www.npmjs.com/package/aurelia-api). It also has submodules. They are imported in it's main file, so no further action is required.

If the installation results in having forks, try resolving them by running:

```sh
jspm inspect --forks
jspm resolve --only registry:package-name@version
```

E.g.

```sh
jspm inspect --forks
>     Installed Forks
>         npm:aurelia-dependency-injection 1.0.0-beta.1.2.3 1.0.0-beta.2.1.0

jspm resolve --only npm:aurelia-dependency-injection@1.0.0-beta.2.1.0
```

### Webpack

Run `npm i aurelia-authentication --save` from your project root.

Add `'aurelia-authentication'` in the `coreBundles.aurelia section` of your `webpack.config.js`.

Aurelia-authentication needs an [aurelia-api](https://www.npmjs.com/package/aurelia-api). It also has submodules. They are listed as resources in the package.json. So, no further action is required.

### Typescript

Npm-based installations pick up the typings automatically. For Jspm-based installations, add to your `typings.json`:

```js
"aurelia-authentication": "github:spoonx/aurelia-authentication",
```

and run `typings i`

or run

```sh
typings i github:spoonx/aurelia-authentication
```

## Usage

### Add a configuration file

Set your custom configuration. You can find all options and the default values in the [baseConfig](http://aurelia-authentication.spoonx.org/baseConfig.html).

```js
/* authConfig.js */
var baseConfig = {
    endpoint: 'auth',             // use 'auth' endpoint for the auth server
    configureEndpoints: ['auth'], // add Authorization header to 'auth' endpoint
    facebook: {
        clientId: 'your client id' // set your third-party providers client ids
    }
}
```

### Configure the plugin

Register the plugin and apply your `authConfig`.

```js
/* main.js */
import authConfig from './authConfig';

aurelia.use
  /* Your other plugins and init code */
  .plugin('aurelia-api', config => {
    // Register an authentication hosts
    config.registerEndpoint('auth');
  })
  /* configure aurelia-authentication */
  .plugin('aurelia-authentication', baseConfig => {
      baseConfig.configure(authConfig);
  });
```

### Use AuthService in a view-model

```js
import {AuthService} from 'aurelia-authentication';
import {inject} from 'aurelia-framework';

@inject(AuthService)
export class Login {
    constructor(authService) {
        this.authService   = authService;
        this.authenticated = false;
    };

    // use authService.login(credentialsObject) to login to your auth server
    // authService.authenticated holds the current status
    // authService.getPayload() gives you the current payload object (for jwt)
    login(credentialsObject) {
      return this.authService.login(credentialsObject)
        .then(() => {
            this.authenticated = this.authService.authenticated;
        });
    };

    // use authService.logout to delete stored data
    // set expiredRedirect in your settings to automatically redirect
    logout() {
      return this.authService.logout()
        .then(() => {
          this.authenticated = this.authService.authenticated;
        });
    }

    // use authService.authenticate(name) to get third-party authentication
    authenticateFacebook() {
      return this.authService.authenticate('facebook')
        .then(() => {
          this.authenticated  = this.authService.authenticated;
        });
    }
}
```

### Quick authService api overview

```js
authService
  // the Rest instance of aurelia-api used for requests. '.client.client' is the used httpClient instance (from aurelia-fetch-client)
  .client
  // the current authentication status
  .authenticated
  // signup into server with credentials and optionally logs in
  signup(displayNameOrCredentials, emailOrOptions, passwordOrRedirectUri, options, redirectUri)
  // log into server with credentials. Stores response if successful
  login(emailOrCredentials, passwordOrOptions, optionsOrRedirectUri, redirectUri)
  // deletes stored response. If configured in the config, sends optionally a logout request. 
  logout(redirectUri, query, name)
  // manually refresh authentication. Needs refreshToken options to be configured
  .updateToken()
  // link third-party account or log into server via third-party authentication. Stores response if successful
  authenticate(name, redirectUri, userData)
  // unlink third-party
  unlink(name, redirectUri)
  // get profile
  .getMe(criteriaOrId)
  // update profile
  .updateMe(body, criteriaOrId)
  // check if token is available and, if applicable, not expired
  .isAuthenticated()
  // get token payload if available
  .getTokenPayload()
  // get the token ttl if available
  .getTtl()
  // get the token exp if available
  .getExp()
```

Additionally, you can use `AuthFilterValueConverter` and `AuthenticatedStep` for UI feedback.

You can find more information in the [aurelia-authentication-docs](http://aurelia-authentication.spoonx.org/).

## Note

Some month ago, we've simplified installation and usage! This plugin should now be installed using `jspm i aurelia-authentication` or (for webpack) `npm i aurelia-authentication --save`. Make sure you update all references to `spoonx/aurelia-authentication` and `spoonx/aurelia-api` and remove the `spoonx/` prefix (don't forget your config.js, package.json, imports and bundles).
