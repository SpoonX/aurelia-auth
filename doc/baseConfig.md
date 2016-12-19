# Full configuration options

```js
// If using aurelia-api:
// =====================

// This is the name of the endpoint used for any requests made in relation to authentication (login, logout, etc.). An empty string selects the default endpoint of aurelia-api.
endpoint = null;
// When authenticated, these endpoints will have the token added to the header of any requests (for authorization). Accepts an array of endpoint names. An empty string selects the default endpoint of aurelia-api.
configureEndpoints = null;


// SPA related options
// ===================

// The SPA url to which the user is redirected after a successful login
loginRedirect = '#/';
// The SPA url to which the user is redirected after a successful logout
logoutRedirect = '#/';
// The SPA route used when an unauthenticated user tries to access an SPA page that requires authentication
loginRoute = '/login';
// Whether or not an authentication token is provided in the response to a successful signup
loginOnSignup = true;
// If loginOnSignup == false: The SPA url to which the user is redirected after a successful signup (else loginRedirect is used)
signupRedirect = '#/login';
// reload page when token expires. 0 = don't reload (default), 1 = do reload page
expiredReload = 0;
// reload page when storage changed aka login/logout in other tabs/windows. 0 = don't reload (default), 1 = do reload page
storageChangedReload = 0;


// API related options
// ===================

// The base url used for all authentication related requests, including provider.url below.
// This appends to the httpClient/endpoint base url, it does not override it.
baseUrl = '';
// The API endpoint to which login requests are sent
loginUrl = '/auth/login';
// The API endpoint to which logout requests are sent (not needed for jwt)
logoutUrl = null;
// The HTTP method used for 'logout' requests (Options: 'get' or 'post')
logoutMethod = 'get';
// The API endpoint to which signup requests are sent
signupUrl = '/auth/signup';
// The API endpoint used in profile requests (inc. `find/get` and `update`)
profileUrl = '/auth/me';
// The method used to update the profile ('put' or 'patch')
profileMethod = 'put';
// The API endpoint used with oAuth to unlink authentication
unlinkUrl = '/auth/unlink/';
// The HTTP method used for 'unlink' requests (Options: 'get' or 'post')
unlinkMethod = 'get';


// Token Options
// =============

// The header property used to contain the authToken in the header of API requests that require authentication
authHeader = 'Authorization';
// The token name used in the header of API requests that require authentication
authTokenType = 'Bearer';
// The property from which to get the access token after a successful login or signup
accessTokenProp = 'access_token';


// If the property defined by `accessTokenProp` is an object:
// ------------------------------------------------------------

//This is the property from which to get the token `{ "accessTokenProp": { "accessTokenName" : '...' } }`
accessTokenName = 'token';
// This allows the token to be a further object deeper `{ "accessTokenProp": { "accessTokenRoot" : { "accessTokenName" : '...' } } }`
accessTokenRoot = false;


// Refresh Token Options
// =====================

// Option to turn refresh tokens On/Off
useRefreshToken = false;
// The option to enable/disable the automatic refresh of Auth tokens using Refresh Tokens
autoUpdateToken = true;
// Oauth Client Id
clientId = false;
// The property from which to get the refresh token after a successful token refresh
refreshTokenProp = 'refresh_token';

// If the property defined by `refreshTokenProp` is an object:
// -----------------------------------------------------------

// This is the property from which to get the token `{ "refreshTokenProp": { "refreshTokenName" : '...' } }`
refreshTokenName = 'token';
// This allows the refresh token to be a further object deeper `{ "refreshTokenProp": { "refreshTokenRoot" : { "refreshTokenName" : '...' } } }`
refreshTokenRoot = false;


// Id Token Options
// =====================

// The property from which to get the id token after a successful login
idTokenProp = 'id_token';

// If the property defined by `idTokenProp` is an object:
// -----------------------------------------------------------

// This is the property from which to get the token `{ "idTokenProp": { "idTokenName" : '...' } }`
idTokenName = 'token';
// This allows the id token to be a further object deeper `{ "idTokenProp": { "idTokenRoot" : { "idTokenName" : '...' } } }`
idTokenRoot = false;


// Miscellaneous Options
// =====================

// Whether to enable the fetch interceptor which automatically adds the authentication headers
// (or not... e.g. if using a session based API or you want to override the default behaviour)
httpInterceptor = true;
// For OAuth only: Tell the API whether or not to include token cookies in the response (for session based APIs)
withCredentials = true;
// Controls how the popup is shown for different devices (Options: 'browser' or 'mobile')
platform = 'browser';
// Determines the `window` property name upon which aurelia-authentication data is stored (Default: `window.localStorage`)
storage = 'localStorage';
// The key used for storing the authentication response locally
storageKey = 'aurelia_authentication';
// optional function to extract the expiration date. takes the server response as parameter
// eg (expires_in in sec): getExpirationDateFromResponse = serverResponse => new Date().getTime() + serverResponse.expires_in * 1000;
getExpirationDateFromResponse = null;
// optional function to extract the access token from the response. takes the server response as parameter
// eg: getAccessTokenFromResponse = serverResponse => serverResponse.data[0].access_token;
getAccessTokenFromResponse = null;
// optional function to extract the refresh token from the response. takes the server response as parameter
// eg: getRefreshTokenFromResponse = serverResponse => serverResponse.data[0].refresh_token;
getRefreshTokenFromResponse = null;

// List of value-converters to make global
globalValueConverters = ['authFilterValueConverter'];


//OAuth provider specific related configuration
// ============================================
providers = {
  facebook: {
    name: 'facebook',
    url: '/auth/facebook',
    authorizationEndpoint: 'https://www.facebook.com/v2.5/dialog/oauth',
    redirectUri: window.location.origin + '/',
    requiredUrlParams: ['display', 'scope'],
    scope: ['email'],
    scopeDelimiter: ',',
    display: 'popup',
    oauthType: '2.0',
    popupOptions: { width: 580, height: 400 }
  },
  google: {
    name: 'google',
    url: '/auth/google',
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
    redirectUri: window.location.origin,
    requiredUrlParams: ['scope'],
    optionalUrlParams: ['display', 'state'],
    scope: ['profile', 'email'],
    scopePrefix: 'openid',
    scopeDelimiter: ' ',
    display: 'popup',
    oauthType: '2.0',
    popupOptions: { width: 452, height: 633 },
    state: function() {
      let rand = Math.random().toString(36).substr(2);
      return encodeURIComponent(rand);
    }
  },
  github: {
    name: 'github',
    url: '/auth/github',
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    redirectUri: window.location.origin,
    optionalUrlParams: ['scope'],
    scope: ['user:email'],
    scopeDelimiter: ' ',
    oauthType: '2.0',
    popupOptions: { width: 1020, height: 618 }
  },
  instagram: {
    name: 'instagram',
    url: '/auth/instagram',
    authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',
    redirectUri: window.location.origin,
    requiredUrlParams: ['scope'],
    scope: ['basic'],
    scopeDelimiter: '+',
    oauthType: '2.0'
  },
  linkedin: {
    name: 'linkedin',
    url: '/auth/linkedin',
    authorizationEndpoint: 'https://www.linkedin.com/uas/oauth2/authorization',
    redirectUri: window.location.origin,
    requiredUrlParams: ['state'],
    scope: ['r_emailaddress'],
    scopeDelimiter: ' ',
    state: 'STATE',
    oauthType: '2.0',
    popupOptions: { width: 527, height: 582 }
  },
  twitter: {
    name: 'twitter',
    url: '/auth/twitter',
    authorizationEndpoint: 'https://api.twitter.com/oauth/authenticate',
    redirectUri: window.location.origin,
    oauthType: '1.0',
    popupOptions: { width: 495, height: 645 }
  },
  twitch: {
    name: 'twitch',
    url: '/auth/twitch',
    authorizationEndpoint: 'https://api.twitch.tv/kraken/oauth2/authorize',
    redirectUri: window.location.origin,
    requiredUrlParams: ['scope'],
    scope: ['user_read'],
    scopeDelimiter: ' ',
    display: 'popup',
    oauthType: '2.0',
    popupOptions: { width: 500, height: 560 }
  },
  live: {
    name: 'live',
    url: '/auth/live',
    authorizationEndpoint: 'https://login.live.com/oauth20_authorize.srf',
    redirectUri: window.location.origin,
    requiredUrlParams: ['display', 'scope'],
    scope: ['wl.emails'],
    scopeDelimiter: ' ',
    display: 'popup',
    oauthType: '2.0',
    popupOptions: { width: 500, height: 560 }
  },
  yahoo: {
    name: 'yahoo',
    url: '/auth/yahoo',
    authorizationEndpoint: 'https://api.login.yahoo.com/oauth2/request_auth',
    redirectUri: window.location.origin,
    scope: [],
    scopeDelimiter: ',',
    oauthType: '2.0',
    popupOptions: { width: 559, height: 519 }
  },
  bitbucket: {
    name: 'bitbucket',
    url: '/auth/bitbucket',
    authorizationEndpoint: 'https://bitbucket.org/site/oauth2/authorize',
    redirectUri: window.location.origin + '/',
    requiredUrlParams: ['scope'],
    scope: ['email'],
    scopeDelimiter: ' ',
    oauthType: '2.0',
    popupOptions: { width: 1028, height: 529 }
  },
  auth0: {
    name: 'auth0',
    oauthType: 'auth0-lock',
    clientId: 'your_client_id',
    clientDomain: 'your_domain_url',
    display: 'popup',
    lockOptions: {
      popup: true
    },
    responseType: 'token',
    state: function() {
      return Math.random().toString(36).substr(2);
    }
  },
  genericOIDCProvider: {
    name: 'identityServer',
    oauthType: '2.0',
    clientId: 'MustMatchConfiguredOIDCClientApplication',
    authorizationEndpoint: 'http://localhost:54540/connect/authorize',
    redirectUri: 'http://localhost:49862/',
    logoutEndpoint: 'http://localhost:54540/connect/logout',
    postLogoutRedirectUri: 'http://localhost:49862/',
    responseType: 'token id_token',
    scope: ['openid email profile'],
    requiredUrlParams: ['scope', 'nonce', 'resource'],
    state: function () {
       var text = "";
       var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
       for (var i = 0; i < 32; i++) {
         text += possible.charAt(Math.floor(Math.random() * possible.length));
       }
       return text;
    },
    nonce: function () {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (var i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    },
    popupOptions: { width: 1028, height: 529 },
    resource: 'aurelia-openiddict-resources aurelia-openiddict-server'
  }
};
```

More non-Aurelia specific details can be found on the [Sattelizer Github page](https://github.com/sahat/satellizer/).

## Separate settings for development and productions

One way of using different settings for development and production would be:

```js
import extend from 'extend';

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
    config = extend(true, {}, baseConfig, configForDevelopment);
}
else {
  config = extend(true, {}, baseConfig, configForProduction);
}

export default config;
```

The above configuration file can cope with a development and production version (not mandatory of course). The strategy is that when your run on localhost, the development configuration file is used, otherwise the production configuration file is taken.
