# aurelia-authentication

[![Build Status](https://travis-ci.org/SpoonX/aurelia-authentication.svg)](https://travis-ci.org/SpoonX/aurelia-authentication)
[![Known Vulnerabilities](https://snyk.io/test/npm/name/badge.svg)](https://snyk.io/test/npm/aurelia-authentication)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?maxAge=2592000?style=plastic)](https://gitter.im/SpoonX/Dev)

> Aurelia-authentication is a token-based authentication plugin for [Aurelia](http://aurelia.io/) with support for popular social authentication providers (Google, Twitter, Facebook, LinkedIn, Windows Live, FourSquare, Yahoo, Github, Instagram) and a local stragegy, i.e. simple username / email and password. It developed of a fork of [paul van bladel's aurelia-auth](https://github.com/paulvanbladel/aurelia-auth/) which itself is a port of the great [Satellizer](https://github.com/sahat/satellizer/) library.

Aurelia-authentication makes local and third-party authentication easy. Burelia-authentication does not use any cookies but relies on a token (designed for JWT, but has basic support for others as well) stored in the local storage of the browser. If your server is setup right, it can be a simple as just to select your server endpoint from your [aurelia-api](https://github.com/SpoonX/aurelia-api) setup, add your third-party client ids and you are ready to go.

You have multiple endpoints? No problem! In the recommended setting,  aurelia-authentication makes use of [aurelia-api](https://github.com/SpoonX/aurelia-api) which can set up multiple endpoints. Just specifiy in your aurelia-authentication configuration which endpoint you want to use for your server and which further endpoints you want to be configured and your token will be sent automatically to your protected API when the user is authenticated.

With aurelia-authentication you can:

* Use local or third-party providers to authenticate the user
* Automatically add your token to requests to the specified endpoints
* Automatically refresh your token
* Extensivly customize the settings
* Use standalone or in conjuction with [aurelia-api](https://github.com/SpoonX/aurelia-api)
* And more

## Important note

We've simplified installation and usage! This plugin should now be installed using `jspm i aurelia-authentication` or (for webpack) `npm i aurelia-authentication`. Make sure you update all references to `spoonx/aurelia-authentication` and `spoonx/aurelia-api` and remove the `spoonx/` prefix (don't forget your config.js, package.json, imports and bundles).

## Installation

### Jspm/SytemJs

Run `jspm i aurelia-authentication` from your project root.

### Webpack

Run `npm i aurelia-authentication` from your project root.

Aurelia-authentication has submodules (currently only the authFilter). So you need to add it to the AureliaWebpackPlugin includeSubModules list.

```js
AureliaWebpackPlugin({
    includeSubModules: [
      { moduleId: 'aurelia-authentication' }
    ]
  }),
```

## Documentation

You can find usage examples and the documentation at the [aurelia-authentication-docs](http://aurelia-authentication.spoonx.org/).

The [changelog](doc/changelog.md) provides you with information about important changes.

## Usage

### Add a configuration file

Set your custom configuration. You can find all options and the default values in the [baseConfig](http://aurelia-authentication.spoonx.org/baseConfig).

```js
/* authConfig.js */
var baseConfig = {
    endpoint: 'auth',             // use 'auth' endpoint for the auth server
    configureEndpoints: ['auth']  // add Authorization header to 'auth' endpoint
    facebook: {
        clientId: 'your client id' // set your third-party providers client ids
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
    login(credentialsObject) {
      return this.authService.login(credentialsObject)
        .then(() => {
            this.authenticated = this.authService.isAuthenticated();
        });
    };

    // use authService.logout to delete stored data
    logout() {
      return this.authService.logout()
        .then(() => {
          this.authenticated = this.authService.isAuthenticated();
        });
    }

    // use authService.authenticate(name) to get third-party authentication
    authenticateFacebook() {
      return this.authService.authenticate('facebook')
        .then(() => {
          this.authenticated  = this.authService.isAuthenticated();
        });
    }
}
```

### Quick authService api overview

```js
authService
  // the Rest instance of aurelia-api used for requests. '.client.client' is the used httpClient instance (from aurelia-fetch-client)
  .client
  // the current configutation object
  .config
  // signup with credentials and optionally logs in
  .signup(credentials: Object)): Promise<Response>
   // log in with credentials. Stores response/token if successful
  .login(credentials: Object): Promise<Response>
  // deletes the stored response/token
  .logout([redirectUri: string]): Promise<>
  // manually refresh authentication. Needs refreshToken options to be configured
  .updateToken(): Promise<Response> {
  // link a third-party account or log into server via third-party authentication. Stores response/token if successful
  .authenticate(provider: string[, redirectUri: string][, userData: Object]): Promise<Response>
  // unlink a third-party
  .unlink(provider: string): Promise<Response>
  // get profile
  .getMe([criteria: Object|string|number]): Promise<Response>
  // update profile
  .updateMe(data: Object[,criteria: Object|string|number]): Promise<Response>
  // check if a token is available and, if applicable, not expired
  .isAuthenticated(): boolean
  // get the token payload if available (JWT) or else return the login response
  .getTokenPayload(): string
  // get the tokens ttl if available
  .getTtl(): Number
```

Additionnally, you can use `AuthFilterValueConverter` and `AuthorizeStep` for UI feedback.

You can find more information in the [aurelia-authentication-docs](http://aurelia-authentication.spoonx.org/).
