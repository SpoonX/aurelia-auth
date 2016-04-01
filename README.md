# aurelia-authentication

[![Build Status](https://travis-ci.org/SpoonX/aurelia-authentication.svg)](https://travis-ci.org/SpoonX/aurelia-authentication)
[![Join the chat at https://gitter.im/SpoonX/Dev](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/SpoonX/Dev?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Makes setting up authentication for your Aurelia app simple.

## What is aurelia-authentication?
This is a largely refactored module based on [paul van bladel's aurelia-authentication](https://github.com/paulvanbladel/aurelia-auth/).

aurelia-authentication is a token-based authentication plugin for [Aurelia](http://aurelia.io/) with support for popular social authentication providers (Google, Twitter, Facebook, LinkedIn, Windows Live, FourSquare, Yahoo, Github, Instagram) and a local stragegy, i.e. simple username / email and password.

aurelia-authentication is a port of the great [Satellizer](https://github.com/sahat/satellizer/) library to ES6 and packaged as an Aurelia plugin.

Other OAuth1 and Oauth2 than the above mentioned providers can be simply added by editing the extensible configuration file.

Basically, aurelia-authentication does not use any cookies but relies on a JWT (json web token) stored in the local storage of the browser:

![JWT in local storage](./pictures/TokenViaDevelopmentTools.png)

Both **local storage** as well as **session storage** can be used (via the aurelia-authentication security configuration file).

Spoonx/aurelia-authentication makes use of [aurelia-api](https://github.com/SpoonX/aurelia-api) for convenient use of the aurelia-fetch-client. Options are available to directly use aurelia-fetch-client instead. If configured, the aurelia token will be sent automatically to your protected API when the user is authenticated.

![Authentication header](./pictures/authHeader.png)

## How this differs from 'paulvanbladel/aurelia-auth'

This repository was originally a fork of paulvanbladel/aurealia-auth. It was forked when the original repository was in a period of inactivity, and later made into a repository of it's own. As such we often get asked how this repository differs from the original. So, at the time of writing the differences are as follows:

- Provides the option to use endpoints, introduced by [spoonx/aurelia-api](https://github.com/SpoonX/aurelia-api), which simplifies API access. 
 - By using aurelia-api the developer can specify which endpoints require the authentication patch.
- TypeScript support added through the addition of d.ts (typescript definition) files
- Lots of bug fixes
- Refactored code to be more readable and performant

**Aside:** Public SpoonX repositories are open to the community and actively maintained and used by the SpoonX company. They follow a strict deploy cycle with reviews and follow semantic versioning. This ensures code quality control and long term commitment.

## Installation
We assume that you know about ([NodeJs](https://nodejs.org/), [Gulp](http://gulpjs.com/)) and [Aurelia](http://aurelia.io/).
Since aurelia-authentication is an [Aurelia plugin](https://github.com/aurelia/skeleton-plugin), we also assume that you have your [Aurelia](http://aurelia.io/) project up and running.

```
jspm install github:spoonx/aurelia-authentication
```

## How to use aurelia-authentication?
aurelia-authentication does not contain any UI widgets. It's conceived as a simple service with following interface:
```javascript
login(email, password)
logout(redirectUri)
authenticate(provider, redirect, userData)
signup(displayName, email, password)
getMe([criteria])
updateMe(data[,criteria])
isAuthenticated()
getTokenPayload()
unlink(provider)
```
Login is used for the local authentication strategy (email + password). Authenticate is for social media authentication. Authenticate is also used for linking a social media account to an existing account.

### Add an aurelia-authentication security configuration file
Add an javascript file to your project where you will store the aurelia-authentication  security configuration data. Call it for example authConfig.js.
Since this file is available via the browser, it should never contain sensitive data. Note that for OAuth the clientId is non sensitive. The client secret is sensitive data and should be only available server side. The aurelia-authentication config file is compatible with the original Satellizer config file, easing the migration of AngularJs projects to Aurelia.

Spoonx/aurelia-authentication uses [aurelia-api](https://github.com/SpoonX/aurelia-api). Set here the aurelia-api endpoint for the authorization requests and specify all endpoints you want to have configured for authorized requests. The aurelia token will be added to requests to those endpoints.

```js
var baseConfig = {
    endpoint: 'auth',
    configureEndpoints: ['auth', 'protected-api']
};

var configForDevelopment = {
    providers: {
        google: {
            clientId: '239531826023-ibk10mb9p7ull54j55a61og5lvnjrff6.apps.googleusercontent.com'
        }
        ,
        linkedin:{
            clientId: '778mif8zyqbei7'
        },
        facebook:{
            clientId: '1452782111708498'
        }
    }
};

var configForProduction = {
    providers: {
        google: {
            clientId: '239531826023-3ludu3934rmcra3oqscc1gid3l9o497i.apps.googleusercontent.com'
        }
        ,
        linkedin: {
            clientId:'7561959vdub4x1'
        },
        facebook: {
            clientId:'1653908914832509'
        }

    }
};

var config;
if (window.location.hostname === 'localhost') {
    config = Object.assign({}, baseConfig, configForDevelopment);
}
else {
    config = Object.assign({}, baseConfig, configForProduction);
}

export default config;

```
The above configuration file can cope with a development and production version (not mandatory of course). The strategy is that when your run on localhost, the development configuration file is used, otherwise the production configuration file is taken.

### Update the aurelia configuration file

In your aurelia configuration file, add the plugin and inject the aurelia-authentication security configuration file.

While not mandantory, spoonx/aureli-auth is easiest to use in conjunction with [aurelia-api](https://github.com/SpoonX/aurelia-api). Aurelia-api allows to setup several endpoints for Rest services. This can be used to seperate public and protected routes. For that, we first need to register the endpoints with aurelia-api. Bellow we setup the endpoints 'auth' and 'protected-api'. These will be setup in the proceeding spoonx/aurelia-authentication-plugin configuration for authorized access (specified in above authConfig.js example). The endpoint 'public-api' bellow could be used for public access only, since we didn't add it above to the 'configureEndpoints' array and thus the access token will not be added by aurelia-authentication.

```javascript
import authConfig from './authConfig';

export function configure(aurelia) {
  aurelia.use
    /* Your other plugins and init code */
    .standardConfiguration()
    .developmentLogging()    
    /* setup the api endpoints first (if desired) */
    .plugin('spoonx/aurelia-api', configure => {
      configure
        .registerEndpoint('auth', 'https://myapi.org/auth')
        .registerEndpoint('protected-api', 'https://myapi.org/protected-api')
        .registerEndpoint('public-api', 'http://myapi.org/public-api');
    })
    /* configure spoonx/aurelia-authentication */
    .plugin('spoonx/aurelia-authentication', baseConfig => {
        baseConfig.configure(authConfig);
    });

    aurelia.start().then(a => a.setRoot());
}

```

### Provide a UI for a login, signup and profile.

See aurelia-authentication-samples for more details.

Button actions are passed to the corresponding view model via a simple click.delegate:
```html
<button class="btn btn-block btn-google-plus" click.delegate="authenticate('google')">
    <span class="ion-social-googleplus"></span>Sign in with Google
</button>
```

The login view model will speak directly with the aurelia-authentication service, which is made available via constructor injection.
```js
import {AuthService} from 'spoonx/aurelia-authentication';
import {inject} from 'aurelia-framework';
@inject(AuthService)

export class Login {
    constructor(auth) {
        this.auth = auth;
    };

    heading = 'Login';

    email    = '';
    password = '';
    login() {
        return this.auth.login(this.email, this.password)
        .then(response => {
            console.log("success logged " + response);
        })
        .catch(err => {
            console.log("login failure");
        });
    };

    authenticate(name) {
        return this.auth.authenticate(name, false, null)
        .then(response => {
            console.log("auth response " + response);
        });
    }
}
```

On the profile page, social media accounts can be linked and unlinked. For a nice UI experience, use  if.bind for either showing the link or unlink button:
```html
<button class="btn btn-sm btn-danger" if.bind="profile.facebook" click.delegate="unlink('facebook')">
    <i class="ion-social-facebook"></i> Unlink Facebook Account
</button>
<button class="btn btn-sm btn-primary" if.bind="!profile.facebook" click.delegate="link('facebook')">
    <i class="ion-social-facebook"></i> Link Facebook Account
</button>
```
### Making the Aurelia Router authentication aware

The logout and profile links are only shown when the user is authenticated, whereas the login link is only visible when the user is not authenticated.

```html
<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
    <ul class="nav navbar-nav">
        <li repeat.for="row of router.navigation | authFilter: isAuthenticated" class="${row.isActive ? 'active' : ''}">
            <a data-toggle="collapse" data-target="#bs-example-navbar-collapse-1.in" href.bind="row.href">${row.title}</a>
        </li>
    </ul>

    <ul if.bind="!isAuthenticated" class="nav navbar-nav navbar-right">
        <li><a href="/#/login">Login</a></li>
        <li><a href="/#/signup">Sign up</a></li>
    </ul>
    <ul if.bind="isAuthenticated" class="nav navbar-nav navbar-right">
        <li><a href="/#/profile">Profile</a></li>
        <li><a href="/#/logout">Logout</a></li>
    </ul>

    <ul class="nav navbar-nav navbar-right">
        <li class="loader" if.bind="router.isNavigating">
            <i class="fa fa-spinner fa-spin fa-2x"></i>
        </li>
    </ul>
</div>
```
Menu items visibility can also be linked with the authFilter to the isAuthenticated value.

In the router config function, you can specifify an auth property in the routing map indicating wether or not the user needs to be authenticated in order to access the route:

```js
import {AuthorizeStep} from 'spoonx/aurelia-authentication';

export class App {
    configureRouter(config, router) {
        config.title = 'Aurelia';

        config.addPipelineStep('authorize', AuthorizeStep); // Add a route filter to the authorize extensibility point.

        config.map([
            { route: ['','welcome'],  moduleId: './welcome',  nav: true, title: 'Welcome' },
            { route: 'flickr',        moduleId: './flickr',   nav: true, title: 'Flickr' },
            { route: 'customer',      moduleId: './customer', nav: true, title: 'CRM', auth: true },
            ...
        ]);

        ...
    };
}
```
In the above example the customer route is only available for authenticated users.

## Full configuration options.

Via the above mentioned configuration virtually all aspects of the authentication process can be tweaked:

```js
// If using aurelia-api:
// =====================

// This is the name of the endpoint used for any requests made in relation to authentication (login, logout, etc.). An empty string selects the default endpoint of aurelia-api.
endpoint: null,
// When authenticated, these endpoints will have the token added to the header of any requests (for authorization). Accepts an array of endpoint names. An empty string selects the default endpoint of aurelia-api.
configureEndpoints: null,


// SPA related options
// ===================

// The SPA url to which the user is redirected after a successful login
loginRedirect: '#/customer',
// The SPA url to which the user is redirected after a successful logout
logoutRedirect: '#/',
// The SPA route used when an unauthenticated user tries to access an SPA page that requires authentication
loginRoute: '/login',
// Whether or not an authentication token is provided in the response to a successful signup
loginOnSignup: true,
// If loginOnSignup == false: The SPA url to which the user is redirected after a successful signup (else loginRedirect is used)
signupRedirect: '#/login',


// API related options
// ===================

// The base url used for all authentication related requests, including provider.url below.
// This appends to the httpClient/endpoint base url, it does not override it.
baseUrl: '',
// The API endpoint to which login requests are sent
loginUrl: '/auth/login',
// The API endpoint to which signup requests are sent
signupUrl: '/auth/signup',
// The API endpoint used in profile requests (inc. `find/get` and `update`)
profileUrl: '/auth/me',
// The API endpoint used with oAuth to unlink authentication
unlinkUrl: '/auth/unlink/',
// The HTTP method used for 'unlink' requests (Options: 'get' or 'post')
unlinkMethod: 'get',


// Token Options
// =============

// The header property used to contain the authToken in the header of API requests that require authentication
authHeader: 'Authorization',
// The token name used in the header of API requests that require authentication
authToken: 'Bearer',
// The property name used when storing the token locally
tokenStorage: 'aurelia_access_token',
// The the property from which to get the authentication token after a successful login or signup
responseTokenProp: 'access_token',

// If the property defined by `responseTokenProp` is an object:
// ------------------------------------------------------------

//This is the property from which to get the token `{ "responseTokenProp": { "tokenName" : '...' } }`
tokenName: 'token',
// This allows the token to be a further object deeper `{ "responseTokenProp": { "tokenRoot" : { "tokenName" : '...' } } }`
tokenRoot: false,


// Refresh Token Options
// =====================

// Option to turn refresh tokens On/Off
useRefreshToken: false,
// The option to enable/disable the automatic refresh of Auth tokens using Refresh Tokens
autoUpdateToken: true,
// Oauth Client Id
clientId: false,
// The property name used when storing the refresh token locally
refreshTokenStorage: 'aurelia_refresh_token',
// The the property from which to get the refresh token after a successful token refresh
refreshTokenProp: 'refresh_token',
      
// If the property defined by `refreshTokenProp` is an object:
// -----------------------------------------------------------

// This is the property from which to get the token `{ "refreshTokenProp": { "refreshTokenName" : '...' } }`
refreshTokenName: 'token',
// This allows the refresh token to be a further object deeper `{ "refreshTokenProp": { "refreshTokenRoot" : { "refreshTokenName" : '...' } } }`
refreshTokenRoot: false,


// Miscellaneous Options
// =====================

// Whether to enable the fetch interceptor which automatically adds the authentication headers
// (or not... e.g. if using a session based API or you want to override the default behaviour)
httpInterceptor: true,
// For OAuth only: Tell the API whether or not to include token cookies in the response (for session based APIs)
withCredentials: true,
// Controls how the popup is shown for different devices (Options: 'browser' or 'mobile')
platform: 'browser',
// Determines the `window` property name upon which aurelia-authentication data is stored (Default: `window.localStorage`)
storage: 'localStorage',


// OAuth provider specific related configuration
// ============================================
providers: {
  google: {
    name: 'google',
    url: '/auth/google',
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
    redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
    scope: ['profile', 'email'],
    scopePrefix: 'openid',
    scopeDelimiter: ' ',
    requiredUrlParams: ['scope'],
    optionalUrlParams: ['display'],
    display: 'popup',
    type: '2.0',
    /*clientId: '239531826023-ibk10mb9p7ull54j55a61og5lvnjrff6.apps.googleusercontent.com',*/
    popupOptions: { width: 452, height: 633 }
  },
  facebook: {
    name: 'facebook',
    url: '/auth/facebook',
    authorizationEndpoint: 'https://www.facebook.com/v2.3/dialog/oauth',
    redirectUri: window.location.origin + '/' || window.location.protocol + '//' + window.location.host + '/',
    scope: ['email'],
    scopeDelimiter: ',',
    nonce: function() {
      return Math.random();
    },
    requiredUrlParams: ['nonce','display', 'scope'],
    display: 'popup',
    type: '2.0',
    popupOptions: { width: 580, height: 400 }
  },
  linkedin: {
    name: 'linkedin',
    url: '/auth/linkedin',
    authorizationEndpoint: 'https://www.linkedin.com/uas/oauth2/authorization',
    redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
    requiredUrlParams: ['state'],
    scope: ['r_emailaddress'],
    scopeDelimiter: ' ',
    state: 'STATE',
    type: '2.0',
    popupOptions: { width: 527, height: 582 }
  },
  github: {
    name: 'github',
    url: '/auth/github',
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
    optionalUrlParams: ['scope'],
    scope: ['user:email'],
    scopeDelimiter: ' ',
    type: '2.0',
    popupOptions: { width: 1020, height: 618 }
  },
  yahoo: {
    name: 'yahoo',
    url: '/auth/yahoo',
    authorizationEndpoint: 'https://api.login.yahoo.com/oauth2/request_auth',
    redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
    scope: [],
    scopeDelimiter: ',',
    type: '2.0',
    popupOptions: { width: 559, height: 519 }
  },
  twitter: {
    name: 'twitter',
    url: '/auth/twitter',
    authorizationEndpoint: 'https://api.twitter.com/oauth/authenticate',
    type: '1.0',
    popupOptions: { width: 495, height: 645 }
  },
  live: {
    name: 'live',
    url: '/auth/live',
    authorizationEndpoint: 'https://login.live.com/oauth20_authorize.srf',
    redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
    scope: ['wl.emails'],
    scopeDelimiter: ' ',
    requiredUrlParams: ['display', 'scope'],
    display: 'popup',
    type: '2.0',
    popupOptions: { width: 500, height: 560 }
  },
  instagram: {
    name: 'instagram',
    url: '/auth/instagram',
    authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',
    redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
    requiredUrlParams: ['scope'],
    scope: ['basic'],
    scopeDelimiter: '+',
    display: 'popup',
    type: '2.0',
    popupOptions: { width: 550, height: 369 }
  }
}
```

More non Aurelia specific details can be found on the [Sattelizer Github page](https://github.com/sahat/satellizer/).
