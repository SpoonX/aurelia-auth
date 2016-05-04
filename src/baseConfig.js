import {join} from 'aurelia-path';
import extend from 'extend';
import * as LogManager from 'aurelia-logging';

export class BaseConfig {
  // prepends baseUrl
  withBase(url) {
    return join(this.baseUrl, url);
  }

  // merge current settings with incomming settings
  configure(incomming) {
    for (let key in incomming) {
      const value = incomming[key];
      if (value !== undefined) {
        if (Array.isArray(value) || typeof value !== 'object' || value === null) {
          this[key] = value;
        } else {
          extend(true, this[key], value);
        }
      }
    }
  }

  /* ----------- default  config ----------- */

  // Used internally. The used Rest instance; set during configuration (see index.js)
  client = null;

  // If using aurelia-api:
  // =====================

  // This is the name of the endpoint used for any requests made in relation to authentication (login, logout, etc.). An empty string selects the default endpoint of aurelia-api.
  endpoint = null;
  // When authenticated, these endpoints will have the token added to the header of any requests (for authorization). Accepts an array of endpoint names. An empty string selects the default endpoint of aurelia-api.
  configureEndpoints = null;


  // SPA related options
  // ===================

  // The SPA url to which the user is redirected after a successful login
  loginRedirect = '#/customer';
  // The SPA url to which the user is redirected after a successful logout
  logoutRedirect = '#/';
  // The SPA route used when an unauthenticated user tries to access an SPA page that requires authentication
  loginRoute = '/login';
  // Whether or not an authentication token is provided in the response to a successful signup
  loginOnSignup = true;
  // If loginOnSignup == false: The SPA url to which the user is redirected after a successful signup (else loginRedirect is used)
  signupRedirect = '#/login';


  // API related options
  // ===================

  // The base url used for all authentication related requests, including provider.url below.
  // This appends to the httpClient/endpoint base url, it does not override it.
  baseUrl = '';
  // The API endpoint to which login requests are sent
  loginUrl = '/auth/login';
  // The API endpoint to which signup requests are sent
  signupUrl = '/auth/signup';
  // The API endpoint used in profile requests (inc. `find/get` and `update`)
  profileUrl = '/auth/me';
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
  // The the property from which to get the access token after a successful login or signup
  accessTokenProp = 'access_token';


  // If the property defined by `accessTokenProp` is an object:
  // ------------------------------------------------------------

  //This is the property from which to get the token `{ "accessTokenProp": { "accessTokenName" : '...' } }`
  accessTokenName = 'token';
  // This allows the token to be a further object deeper `{ "accessTokenProp": { "accessTokenRoot" : { "accessTokenName" : '...' } } }`
  accessTokenRoot = false;

  // Token properties
  // ------------------------------------------------------------

  // The payload property (for JWT) or responseObject properties for the expiration date. Accepts Number or Date
  accessTokenExpProp = 'exp';


  // Refresh Token Options
  // =====================

  // Option to turn refresh tokens On/Off
  useRefreshToken = false;
  // The option to enable/disable the automatic refresh of Auth tokens using Refresh Tokens
  autoUpdateToken = true;
  // Oauth Client Id
  clientId = false;
  // The the property from which to get the refresh token after a successful token refresh
  refreshTokenProp = 'refresh_token';

  // If the property defined by `refreshTokenProp` is an object:
  // -----------------------------------------------------------

  // This is the property from which to get the token `{ "refreshTokenProp": { "refreshTokenName" : '...' } }`
  refreshTokenName = 'token';
  // This allows the refresh token to be a further object deeper `{ "refreshTokenProp": { "refreshTokenRoot" : { "refreshTokenName" : '...' } } }`
  refreshTokenRoot = false;


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

  //OAuth provider specific related configuration
  // ============================================
  providers = {
    google: {
      name: 'google',
      url: '/auth/google',
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
      redirectUri: encodeURI(window.location.origin || window.location.protocol + '//' + window.location.host),
      scope: ['profile', 'email'],
      scopePrefix: 'openid',
      scopeDelimiter: ' ',
      requiredUrlParams: ['scope'],
      optionalUrlParams: ['display'],
      display: 'popup',
      type: '2.0',
      popupOptions: {
        width: 452,
        height: 633
      }
    },
    facebook: {
      name: 'facebook',
      url: '/auth/facebook',
      authorizationEndpoint: 'https://www.facebook.com/v2.3/dialog/oauth',
      redirectUri: encodeURI(window.location.origin + '/' || window.location.protocol + '//' + window.location.host + '/'),
      scope: ['email'],
      scopeDelimiter: ',',
      nonce: function() {
        return Math.random();
      },
      requiredUrlParams: ['nonce', 'display', 'scope'],
      display: 'popup',
      type: '2.0',
      popupOptions: {
        width: 580,
        height: 400
      }
    },
    linkedin: {
      name: 'linkedin',
      url: '/auth/linkedin',
      authorizationEndpoint: 'https://www.linkedin.com/uas/oauth2/authorization',
      redirectUri: encodeURI(window.location.origin || window.location.protocol + '//' + window.location.host),
      requiredUrlParams: ['state'],
      scope: ['r_emailaddress'],
      scopeDelimiter: ' ',
      state: 'STATE',
      type: '2.0',
      popupOptions: {
        width: 527,
        height: 582
      }
    },
    github: {
      name: 'github',
      url: '/auth/github',
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      redirectUri: encodeURI(window.location.origin || window.location.protocol + '//' + window.location.host),
      optionalUrlParams: ['scope'],
      scope: ['user:email'],
      scopeDelimiter: ' ',
      type: '2.0',
      popupOptions: {
        width: 1020,
        height: 618
      }
    },
    yahoo: {
      name: 'yahoo',
      url: '/auth/yahoo',
      authorizationEndpoint: 'https://api.login.yahoo.com/oauth2/request_auth',
      redirectUri: encodeURI(window.location.origin || window.location.protocol + '//' + window.location.host),
      scope: [],
      scopeDelimiter: ',',
      type: '2.0',
      popupOptions: {
        width: 559,
        height: 519
      }
    },
    twitter: {
      name: 'twitter',
      url: '/auth/twitter',
      authorizationEndpoint: 'https://api.twitter.com/oauth/authenticate',
      type: '1.0',
      popupOptions: {
        width: 495,
        height: 645
      }
    },
    live: {
      name: 'live',
      url: '/auth/live',
      authorizationEndpoint: 'https://login.live.com/oauth20_authorize.srf',
      redirectUri: encodeURI(window.location.origin || window.location.protocol + '//' + window.location.host),
      scope: ['wl.emails'],
      scopeDelimiter: ' ',
      requiredUrlParams: ['display', 'scope'],
      display: 'popup',
      type: '2.0',
      popupOptions: {
        width: 500,
        height: 560
      }
    },
    instagram: {
      name: 'instagram',
      url: '/auth/instagram',
      authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',
      redirectUri: encodeURI(window.location.origin || window.location.protocol + '//' + window.location.host),
      requiredUrlParams: ['scope'],
      scope: ['basic'],
      scopeDelimiter: '+',
      display: 'popup',
      type: '2.0',
      popupOptions: {
        width: 550,
        height: 369
      }
    }
  };

  /* deprecated defaults */
  _authToken = 'Bearer';
  _responseTokenProp = 'access_token';
  _tokenName = 'token';
  _tokenRoot = false;
  _tokenPrefix = 'aurelia';

  /* deprecated methods and parameteres */
  get current() {
    LogManager.getLogger('authentication').warn('BaseConfig.current() is deprecated. Use BaseConfig directly instead.');
    return this;
  }

  set authToken(authToken) {
    LogManager.getLogger('authentication').warn('BaseConfig.authToken is deprecated. Use BaseConfig.authTokenType instead.');
    this._authTokenType = authToken;
    this.authTokenType = authToken;
    return authToken;
  }
  get authToken() {
    return this._authTokenType;
  }

  set responseTokenProp(responseTokenProp) {
    LogManager.getLogger('authentication').warn('BaseConfig.responseTokenProp is deprecated. Use BaseConfig.accessTokenProp instead.');
    this._responseTokenProp = responseTokenProp;
    this.accessTokenProp = responseTokenProp;
    return responseTokenProp;
  }
  get responseTokenProp() {
    return this._responseTokenProp;
  }

  set tokenRoot(tokenRoot) {
    LogManager.getLogger('authentication').warn('BaseConfig.tokenRoot is deprecated. Use BaseConfig.accessTokenRoot instead.');
    this._tokenRoot = tokenRoot;
    this.accessTokenRoot = tokenRoot;
    return tokenRoot;
  }
  get tokenRoot() {
    return this._tokenRoot;
  }

  set tokenName(tokenName) {
    LogManager.getLogger('authentication').warn('BaseConfig.tokenName is deprecated. Use BaseConfig.accessTokenName instead.');
    this._tokenName = tokenName;
    this.accessTokenName = tokenName;
    return tokenName;
  }
  get tokenName() {
    return this._tokenName;
  }

  set tokenPrefix(tokenPrefix) {
    LogManager.getLogger('authentication').warn('BaseConfig.tokenPrefix is obsolete. Use BaseConfig.storageKey instead.');
    this._tokenPrefix = tokenPrefix;
    return tokenPrefix;
  }
  get tokenPrefix() {
    return this._tokenPrefix || 'aurelia';
  }
}
