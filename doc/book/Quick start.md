# Getting started

This is a small guide that shows you how to use this module.
In this document, we'll be modifying the skeleton to use aurelia-authentication.

## Prerequisites

For this guide, we assume you have the [aurelia skeleton](https://github.com/aurelia/skeleton-navigation) set up.
We'll also assume you have [node](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed, and that you're familiar with [installing modules](https://docs.npmjs.com/).

Finally, we'll assume that you have [jspm](http://jspm.io) installed. If you don't, run `npm i -g jspm`.

## Enough chat

Now it's time to start doing something

### Installation

First, head on over to your favorite terminal and run `jspm install aurelia-api aurelia-authentication` from your project root. This will install the module and aurelia-api to make using this module even easier.

### Configuration

Add a javascript file to your project where you will store the aurelia-authentication configuration data. Call it for example authConfig.js.
Since this file is available via the browser, it should never contain sensitive data. Note that for OAuth the clientId is non sensitive. The client secret is sensitive data and should be only available server side. The aurelia-authentication config file is compatible with the original [Satellizer](https://github.com/sahat/satellizer/) config file, making it easy to find more configuration options and server configuration examples.

Aurelia-authentication uses [aurelia-api](https://github.com/SpoonX/aurelia-api). This allows you to specify here the aurelia-api endpoint for the authorization requests and to list all endpoints you want to have configured for authorized requests. The access token will be added to all requests to those endpoints.

Here is a sample of a close to minimal custom setting:

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

### Register the plugin

In your aurelia configuration file, add the plugin and inject above aurelia-authentication configuration file.

While not mandantory, aurelia-authentication is easiest to use in conjunction with [aurelia-api](https://github.com/SpoonX/aurelia-api). Aurelia-api allows to setup several endpoints for Rest services. This can be used to seperate public and protected routes. For that, we first need to register the endpoints with aurelia-api. Bellow we setup the endpoints 'auth' and 'protected-api'. These will be setup in the proceeding aurelia-authentication configuration for authorized access (specified in above authConfig.js example). The endpoint 'public-api' bellow could be used for public access only. Since we didn't add it above to the 'configureEndpoints' array and the access token will not be added to it by aurelia-authentication.

```js
import authConfig from './authConfig';

export function configure(aurelia) {
  aurelia.use
    /* Your other plugins and init code */
    .standardConfiguration()
    .developmentLogging()    
    /* setup the api endpoints first (if desired) */
    .plugin('aurelia-api', configure => {
      configure
        .registerEndpoint('auth', 'https://myapi.org/auth')
        .registerEndpoint('protected-api', 'https://myapi.org/protected-api')
        .registerEndpoint('public-api', 'http://myapi.org/public-api');
    })
    /* configure aurelia-authentication */
    .plugin('aurelia-authentication', baseConfig => {
        baseConfig.configure(authConfig);
    });

    aurelia.start().then(a => a.setRoot());
}
```

### Provide a UI for a login, signup and profile

Button actions are passed to the corresponding view model via a simple click.delegate:

```html
<button class="btn btn-block btn-google-plus" click.delegate="authenticate('google')">
    <span class="ion-social-googleplus"></span>Sign in with Google
</button>
```

The login view model will speak directly with the aurelia-authentication service, which is made available via constructor injection.

```js
import {AuthService} from 'aurelia-authentication';
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
        return this.auth.authenticate(name)
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
import {AuthorizeStep} from 'aurelia-authentication';

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
