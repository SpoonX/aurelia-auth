import {PLATFORM} from 'aurelia-pal';
import {join} from 'aurelia-path';
import extend from 'extend';
import * as LogManager from 'aurelia-logging';

export class BaseConfig {
  /**
   * Prepends baseUrl to a given url
   * @param  {String} url The relative url to append
   * @return {String}     joined baseUrl and url
   */
  joinBase(url) {
    return join(this.baseUrl, url);
  }

  /**
   * Merge current settings with incomming settings
   * @param  {Object} incomming Settings object to be merged into the current configuration
   * @return {Config}           this
   */
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
  loginRedirect = '#/';
  // The SPA url to which the user is redirected after a successful logout
  logoutRedirect = '#/';
  // The SPA route used when an unauthenticated user tries to access an SPA page that requires authentication
  loginRoute = '/login';
  // Whether or not an authentication token is provided in the response to a successful signup
  loginOnSignup = true;
  // If loginOnSignup == false: The SPA url to which the user is redirected after a successful signup (else loginRedirect is used)
  signupRedirect = '#/login';
  // The SPA url to load when the token expires
  expiredRedirect = '#/';
  // The SPA url to load when the authentication status changed in other tabs/windows (detected through storageEvents)
  storageChangedRedirect = '#/';

  // API related options
  // ===================

  // The base url used for all authentication related requests, including provider.url below.
  // This appends to the httpClient/endpoint base url, it does not override it.
  baseUrl = '';
  // The API endpoint to which login requests are sent
  loginUrl = '/auth/login';
  // The API endpoint to which logout requests are sent (not needed for jwt)
  logoutUrl = null;
  // The HTTP method used for 'unlink' requests (Options: 'get' or 'post')
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
  // The API endpoint to which refreshToken requests are sent. null = loginUrl
  refreshTokenUrl = null;


  // Token Options
  // =============

  // The header property used to contain the authToken in the header of API requests that require authentication
  authHeader = 'Authorization';
  // The token name used in the header of API requests that require authentication
  authTokenType = 'Bearer';
  // The the property from which to get the access token after a successful login or signup. Can also be dotted eg "accessTokenProp.accessTokenName"
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
  // The the property from which to get the refresh token after a successful token refresh. Can also be dotted eg "refreshTokenProp.refreshTokenProp"
  refreshTokenProp = 'refresh_token';

  // If the property defined by `refreshTokenProp` is an object:
  // -----------------------------------------------------------

  // This is the property from which to get the token `{ "refreshTokenProp": { "refreshTokenName" : '...' } }`
  refreshTokenName = 'token';
  // This allows the refresh token to be a further object deeper `{ "refreshTokenProp": { "refreshTokenRoot" : { "refreshTokenName" : '...' } } }`
  refreshTokenRoot = false;

  // The property name from which to get the user authentication token. Can also be dotted idTokenProp.idTokenName
  idTokenProp = 'id_token';
  // This is the property from which to get the id token `{ "idTokenProp": { "idTokenName" : '...' } }`
  idTokenName = 'token';
  // This allows the id_token to be a further object deeper `{ "idTokenProp": { "idTokenRoot" : { "idTokenName" : '...' } } }`
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
  // Determines the `PLATFORM` property name upon which aurelia-authentication data is stored (Default: `PLATFORM.localStorage`)
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
      redirectUri: PLATFORM.location.origin + '/',
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
      redirectUri: PLATFORM.location.origin,
      requiredUrlParams: ['scope'],
      optionalUrlParams: ['display', 'state'],
      scope: ['profile', 'email'],
      scopePrefix: 'openid',
      scopeDelimiter: ' ',
      display: 'popup',
      oauthType: '2.0',
      popupOptions: { width: 452, height: 633 },
      state: randomState
    },
    github: {
      name: 'github',
      url: '/auth/github',
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      redirectUri: PLATFORM.location.origin,
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
      redirectUri: PLATFORM.location.origin,
      requiredUrlParams: ['scope'],
      scope: ['basic'],
      scopeDelimiter: '+',
      oauthType: '2.0'
    },
    linkedin: {
      name: 'linkedin',
      url: '/auth/linkedin',
      authorizationEndpoint: 'https://www.linkedin.com/uas/oauth2/authorization',
      redirectUri: PLATFORM.location.origin,
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
      redirectUri: PLATFORM.location.origin,
      oauthType: '1.0',
      popupOptions: { width: 495, height: 645 }
    },
    twitch: {
      name: 'twitch',
      url: '/auth/twitch',
      authorizationEndpoint: 'https://api.twitch.tv/kraken/oauth2/authorize',
      redirectUri: PLATFORM.location.origin,
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
      redirectUri: PLATFORM.location.origin,
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
      redirectUri: PLATFORM.location.origin,
      scope: [],
      scopeDelimiter: ',',
      oauthType: '2.0',
      popupOptions: { width: 559, height: 519 }
    },
    bitbucket: {
      name: 'bitbucket',
      url: '/auth/bitbucket',
      authorizationEndpoint: 'https://bitbucket.org/site/oauth2/authorize',
      redirectUri: PLATFORM.location.origin + '/',
      requiredUrlParams: ['scope'],
      scope: ['email'],
      scopeDelimiter: ' ',
      oauthType: '2.0',
      popupOptions: { width: 1028, height: 529 }
    },
    spotify: {
      name: 'spotify',
      url: '/auth/spotify',
      authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      redirectUri: PLATFORM.location.origin,
      optionalUrlParams: ['state'],
      requiredUrlParams: ['scope'],
      scope: ['user-read-email'],
      scopePrefix: '',
      scopeDelimiter: ',',
      oauthType: '2.0',
      popupOptions: { width: 500, height: 530 },
      state: () => encodeURIComponent(Math.random().toString(36).substr(2))
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
      state: randomState
    }
  };

  /* deprecated defaults */
  /**
   * @deprecated
   */
  _authToken = 'Bearer';
  /**
   * @deprecated
   */
  _responseTokenProp = 'access_token';
  /**
   * @deprecated
   */
  _tokenName = 'token';
  /**
   * @deprecated
   */
  _tokenRoot = false;
  /**
   * @deprecated
   */
  _tokenPrefix = 'aurelia';

  /* deprecated methods and parameteres */
  /**
   * @deprecated
   */
  set authToken(authToken) {
    LogManager.getLogger('authentication').warn('BaseConfig.authToken is deprecated. Use BaseConfig.authTokenType instead.');
    this._authTokenType = authToken;
    this.authTokenType = authToken;
    return authToken;
  }
  get authToken() {
    return this._authTokenType;
  }

  /**
   * @deprecated
   */
  set responseTokenProp(responseTokenProp) {
    LogManager.getLogger('authentication').warn('BaseConfig.responseTokenProp is deprecated. Use BaseConfig.accessTokenProp instead.');
    this._responseTokenProp = responseTokenProp;
    this.accessTokenProp = responseTokenProp;
    return responseTokenProp;
  }
  get responseTokenProp() {
    return this._responseTokenProp;
  }

  /**
   * @deprecated
   */
  set tokenRoot(tokenRoot) {
    LogManager.getLogger('authentication').warn('BaseConfig.tokenRoot is deprecated. Use BaseConfig.accessTokenRoot instead.');
    this._tokenRoot = tokenRoot;
    this.accessTokenRoot = tokenRoot;
    return tokenRoot;
  }
  get tokenRoot() {
    return this._tokenRoot;
  }

  /**
   * @deprecated
   */
  set tokenName(tokenName) {
    LogManager.getLogger('authentication').warn('BaseConfig.tokenName is deprecated. Use BaseConfig.accessTokenName instead.');
    this._tokenName = tokenName;
    this.accessTokenName = tokenName;
    return tokenName;
  }
  get tokenName() {
    return this._tokenName;
  }

  /**
   * @deprecated
   */
  set tokenPrefix(tokenPrefix) {
    LogManager.getLogger('authentication').warn('BaseConfig.tokenPrefix is obsolete. Use BaseConfig.storageKey instead.');
    this._tokenPrefix = tokenPrefix;
    return tokenPrefix;
  }
  get tokenPrefix() {
    return this._tokenPrefix || 'aurelia';
  }

  /**
   * @deprecated
   */
  get current() {
    LogManager.getLogger('authentication').warn('Getter BaseConfig.current is deprecated. Use BaseConfig directly instead.');
    return this;
  }
  set current(_) {
    throw new Error('Setter BaseConfig.current has been removed. Use BaseConfig directly instead.');
  }

  /**
   * @deprecated
   */
  get _current() {
    LogManager.getLogger('authentication').warn('Getter BaseConfig._current is deprecated. Use BaseConfig directly instead.');
    return this;
  }
  set _current(_) {
    throw new Error('Setter BaseConfig._current has been removed. Use BaseConfig directly instead.');
  }
}

function randomState() {
  let rand = Math.random().toString(36).substr(2);
  return encodeURIComponent(rand);
}
