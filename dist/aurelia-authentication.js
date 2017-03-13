import extend from 'extend';
import jwtDecode from 'jwt-decode';
import {PLATFORM,DOM} from 'aurelia-pal';
import {parseQueryString,join,buildQueryString} from 'aurelia-path';
import {getLogger} from 'aurelia-logging';
import {inject,Container} from 'aurelia-dependency-injection';
import {deprecated} from 'aurelia-metadata';
import {EventAggregator} from 'aurelia-event-aggregator';
import {BindingSignaler} from 'aurelia-templating-resources';
import {Rest,Config} from 'aurelia-api';
import {Redirect} from 'aurelia-router';
import {HttpClient} from 'aurelia-fetch-client';

import {AuthFilterValueConverter} from "./authFilterValueConverter"
import {AuthenticatedValueConverter} from "./authenticatedValueConverter"
import {AuthenticatedFilterValueConverter} from "./authenticatedFilterValueConverter"

export class Popup {
  constructor() {
    this.popupWindow = null;
    this.polling     = null;
    this.url         = '';
  }

  open(url: string, windowName: string, options?: {}): Popup {
    this.url = url;
    const optionsString = buildPopupWindowOptions(options || {});

    this.popupWindow = PLATFORM.global.open(url, windowName, optionsString);

    if (this.popupWindow && this.popupWindow.focus) {
      this.popupWindow.focus();
    }

    return this;
  }

  eventListener(redirectUri: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.popupWindow.addEventListener('loadstart', event => {
        if (event.url.indexOf(redirectUri) !== 0) {
          return;
        }

        const parser  = DOM.createElement('a');

        parser.href = event.url;

        if (parser.search || parser.hash) {
          const qs = parseUrl(parser);

          if (qs.error) {
            reject({error: qs.error});
          } else {
            resolve(qs);
          }

          this.popupWindow.close();
        }
      });

      this.popupWindow.addEventListener('exit', () => {
        reject({data: 'Provider Popup was closed'});
      });

      this.popupWindow.addEventListener('loaderror', () => {
        reject({data: 'Authorization Failed'});
      });
    });
  }

  pollPopup(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.polling = PLATFORM.global.setInterval(() => {
        let errorData;

        try {
          if (this.popupWindow.location.host ===  PLATFORM.global.document.location.host
            && (this.popupWindow.location.search || this.popupWindow.location.hash)) {
            const qs = parseUrl(this.popupWindow.location);

            if (qs.error) {
              reject({error: qs.error});
            } else {
              resolve(qs);
            }

            this.popupWindow.close();
            PLATFORM.global.clearInterval(this.polling);
          }
        } catch (error) {
          errorData = error;
        }

        if (!this.popupWindow) {
          PLATFORM.global.clearInterval(this.polling);
          reject({
            error: errorData,
            data : 'Provider Popup Blocked'
          });
        } else if (this.popupWindow.closed) {
          PLATFORM.global.clearInterval(this.polling);
          reject({
            error: errorData,
            data : 'Problem poll popup'
          });
        }
      }, 35);
    });
  }
}

const buildPopupWindowOptions = (options: {}): string => {
  const width  = options.width || 500;
  const height = options.height || 500;

  const extended = extend({
    width : width,
    height: height,
    left  : PLATFORM.global.screenX + ((PLATFORM.global.outerWidth - width) / 2),
    top   : PLATFORM.global.screenY + ((PLATFORM.global.outerHeight - height) / 2.5)
  }, options);

  let parts = [];

  Object.keys(extended).map(key => parts.push(key + '=' + extended[key]));

  return parts.join(',');
};

const parseUrl = (url: string): {} => {
  let hash = (url.hash.charAt(0) === '#') ? url.hash.substr(1) : url.hash;

  return extend(true, {}, parseQueryString(url.search), parseQueryString(hash));
};

export const logger = getLogger('aurelia-authentication');

/* eslint-disable max-lines */
export class BaseConfig {
  /**
   * Prepends baseUrl to a given url
   * @param  {string} url The relative url to append
   * @return {string}     joined baseUrl and url
   */
  joinBase(url: string): string {
    return join(this.baseUrl, url);
  }

  /**
   * Merge current settings with incoming settings
   * @param  {Object} incoming Settings object to be merged into the current configuration
   */
  configure(incoming: {}): Config {
    for (let key in incoming) {
      if (incoming.hasOwnProperty(key)) {
        const value = incoming[key];

        if (value !== undefined) {
          if (Array.isArray(value) || typeof value !== 'object' || value === null) {
            this[key] = value;
          } else {
            extend(true, this[key], value);
          }
        }
      }
    }
  }

  /* ----------- default  config ----------- */

  // Used internally. The used Rest instance; set during configuration (see index.js)
  client: Rest = null;

  // If using aurelia-api:
  // =====================

  // This is the name of the endpoint used for any requests made in relation to authentication (login, logout, etc.). An empty string selects the default endpoint of aurelia-api.
  endpoint: string = null;
  // When authenticated, these endpoints will have the token added to the header of any requests (for authorization). Accepts an array of endpoint names. An empty string selects the default endpoint of aurelia-api.
  configureEndpoints: Array<string> = null;

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
  // The property name used to send the existing token when refreshing `{ "refreshTokenSubmitProp": '...' }`
  refreshTokenSubmitProp = 'refresh_token';

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
  // full page reload if authorization changed in another tab (recommended to set it to 'true')
  storageChangedReload = false;
  // optional function to extract the expiration date. Takes the server response as parameter and returns NumericDate = number of seconds! since 1 January 1970 00:00:00 UTC (Unix Epoch)
  // eg (expires_in in sec): getExpirationDateFromResponse = serverResponse => new Date().getTime() / 1000 + serverResponse.expires_in;
  getExpirationDateFromResponse = null;
  // optional function to extract the access token from the response. Takes the server response as parameter and returns a token
  // eg: getAccessTokenFromResponse = serverResponse => serverResponse.data[0].access_token;
  getAccessTokenFromResponse = null;
  // optional function to extract the refresh token from the response. Takes the server response as parameter and returns a token
  // eg: getRefreshTokenFromResponse = serverResponse => serverResponse.data[0].refresh_token;
  getRefreshTokenFromResponse = null;

  // List of value-converters to make global
  globalValueConverters = ['authFilterValueConverter'];

  //OAuth provider specific related configuration
  // ============================================
  providers = {
    facebook: {
      name                 : 'facebook',
      url                  : '/auth/facebook',
      authorizationEndpoint: 'https://www.facebook.com/v2.5/dialog/oauth',
      redirectUri          : PLATFORM.location.origin + '/',
      requiredUrlParams    : ['display', 'scope'],
      scope                : ['email'],
      scopeDelimiter       : ',',
      display              : 'popup',
      oauthType            : '2.0',
      popupOptions         : {width: 580, height: 400}
    },
    google: {
      name                 : 'google',
      url                  : '/auth/google',
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
      redirectUri          : PLATFORM.location.origin,
      requiredUrlParams    : ['scope'],
      optionalUrlParams    : ['display', 'state'],
      scope                : ['profile', 'email'],
      scopePrefix          : 'openid',
      scopeDelimiter       : ' ',
      display              : 'popup',
      oauthType            : '2.0',
      popupOptions         : {width: 452, height: 633},
      state                : randomState
    },
    github: {
      name                 : 'github',
      url                  : '/auth/github',
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      redirectUri          : PLATFORM.location.origin,
      optionalUrlParams    : ['scope'],
      scope                : ['user:email'],
      scopeDelimiter       : ' ',
      oauthType            : '2.0',
      popupOptions         : {width: 1020, height: 618}
    },
    instagram: {
      name                 : 'instagram',
      url                  : '/auth/instagram',
      authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',
      redirectUri          : PLATFORM.location.origin,
      requiredUrlParams    : ['scope'],
      scope                : ['basic'],
      scopeDelimiter       : '+',
      oauthType            : '2.0'
    },
    linkedin: {
      name                 : 'linkedin',
      url                  : '/auth/linkedin',
      authorizationEndpoint: 'https://www.linkedin.com/uas/oauth2/authorization',
      redirectUri          : PLATFORM.location.origin,
      requiredUrlParams    : ['state'],
      scope                : ['r_emailaddress'],
      scopeDelimiter       : ' ',
      state                : 'STATE',
      oauthType            : '2.0',
      popupOptions         : {width: 527, height: 582}
    },
    twitter: {
      name                 : 'twitter',
      url                  : '/auth/twitter',
      authorizationEndpoint: 'https://api.twitter.com/oauth/authenticate',
      redirectUri          : PLATFORM.location.origin,
      oauthType            : '1.0',
      popupOptions         : {width: 495, height: 645}
    },
    twitch: {
      name                 : 'twitch',
      url                  : '/auth/twitch',
      authorizationEndpoint: 'https://api.twitch.tv/kraken/oauth2/authorize',
      redirectUri          : PLATFORM.location.origin,
      requiredUrlParams    : ['scope'],
      scope                : ['user_read'],
      scopeDelimiter       : ' ',
      display              : 'popup',
      oauthType            : '2.0',
      popupOptions         : {width: 500, height: 560}
    },
    live: {
      name                 : 'live',
      url                  : '/auth/live',
      authorizationEndpoint: 'https://login.live.com/oauth20_authorize.srf',
      redirectUri          : PLATFORM.location.origin,
      requiredUrlParams    : ['display', 'scope'],
      scope                : ['wl.emails'],
      scopeDelimiter       : ' ',
      display              : 'popup',
      oauthType            : '2.0',
      popupOptions         : {width: 500, height: 560}
    },
    yahoo: {
      name                 : 'yahoo',
      url                  : '/auth/yahoo',
      authorizationEndpoint: 'https://api.login.yahoo.com/oauth2/request_auth',
      redirectUri          : PLATFORM.location.origin,
      scope                : [],
      scopeDelimiter       : ',',
      oauthType            : '2.0',
      popupOptions         : {width: 559, height: 519}
    },
    bitbucket: {
      name                 : 'bitbucket',
      url                  : '/auth/bitbucket',
      authorizationEndpoint: 'https://bitbucket.org/site/oauth2/authorize',
      redirectUri          : PLATFORM.location.origin + '/',
      requiredUrlParams    : ['scope'],
      scope                : ['email'],
      scopeDelimiter       : ' ',
      oauthType            : '2.0',
      popupOptions         : {width: 1028, height: 529}
    },
    auth0: {
      name        : 'auth0',
      oauthType   : 'auth0-lock',
      clientId    : 'your_client_id',
      clientDomain: 'your_domain_url',
      display     : 'popup',
      lockOptions : {},
      responseType: 'token',
      state       : randomState
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

  /* deprecated methods and parameters */
  /**
   * @param {string} authToken
   * @deprecated
   */
  set authToken(authToken) {
    logger.warn('BaseConfig.authToken is deprecated. Use BaseConfig.authTokenType instead.');
    this._authTokenType = authToken;
    this.authTokenType = authToken;

    return authToken;
  }
  get authToken() {
    return this._authTokenType;
  }

  /**
   * @param {string} responseTokenProp
   * @deprecated
   */
  set responseTokenProp(responseTokenProp) {
    logger.warn('BaseConfig.responseTokenProp is deprecated. Use BaseConfig.accessTokenProp instead.');
    this._responseTokenProp = responseTokenProp;
    this.accessTokenProp = responseTokenProp;

    return responseTokenProp;
  }
  get responseTokenProp() {
    return this._responseTokenProp;
  }

  /**
   * @param {string} tokenRoot
   * @deprecated
   */
  set tokenRoot(tokenRoot) {
    logger.warn('BaseConfig.tokenRoot is deprecated. Use BaseConfig.accessTokenRoot instead.');
    this._tokenRoot = tokenRoot;
    this.accessTokenRoot = tokenRoot;

    return tokenRoot;
  }
  get tokenRoot() {
    return this._tokenRoot;
  }

  /**
   * @param {string} tokenName
   * @deprecated
   */
  set tokenName(tokenName) {
    logger.warn('BaseConfig.tokenName is deprecated. Use BaseConfig.accessTokenName instead.');
    this._tokenName = tokenName;
    this.accessTokenName = tokenName;

    return tokenName;
  }
  get tokenName() {
    return this._tokenName;
  }

  /**
   * @param {string} tokenPrefix
   * @deprecated
   */
  set tokenPrefix(tokenPrefix) {
    logger.warn('BaseConfig.tokenPrefix is obsolete. Use BaseConfig.storageKey instead.');
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
    logger.warn('Getter BaseConfig.current is deprecated. Use BaseConfig directly instead.');

    return this;
  }
  set current(_) {
    throw new Error('Setter BaseConfig.current has been removed. Use BaseConfig directly instead.');
  }

  /**
   * @deprecated
   */
  get _current() {
    logger.warn('Getter BaseConfig._current is deprecated. Use BaseConfig directly instead.');

    return this;
  }
  set _current(_) {
    throw new Error('Setter BaseConfig._current has been removed. Use BaseConfig directly instead.');
  }
}

/**
 * RandomState
 *
 * @returns {number}
 */
function randomState() {
  let rand = Math.random()
    .toString(36)
    .substr(2);

  return encodeURIComponent(rand);
}

@inject(BaseConfig)
export class Storage {
  constructor(config: BaseConfig) {
    this.config = config;
  }

  get(key: string): string {
    return PLATFORM.global[this.config.storage].getItem(key);
  }

  set(key: string, value: string) {
    PLATFORM.global[this.config.storage].setItem(key, value);
  }

  remove(key: string) {
    PLATFORM.global[this.config.storage].removeItem(key);
  }
}

@inject(Storage, BaseConfig)
export class AuthLock {
  constructor(storage: Storage, config: BaseConfig) {
    this.storage  = storage;
    this.config   = config;
    this.defaults = {
      name          : null,
      state         : null,
      scope         : null,
      scopeDelimiter: ' ',
      redirectUri   : null,
      clientId      : null,
      clientDomain  : null,
      display       : 'popup',
      lockOptions   : {},
      popupOptions  : null,
      responseType  : 'token'
    };
  }

  open(options: {}, userData?: {}): Promise<any> {
    // check pre-conditions
    if (typeof PLATFORM.global.Auth0Lock !== 'function') {
      throw new Error('Auth0Lock was not found in global scope. Please load it before using this provider.');
    }
    const provider  = extend(true, {}, this.defaults, options);
    const stateName = provider.name + '_state';

    if (typeof provider.state === 'function') {
      this.storage.set(stateName, provider.state());
    } else if (typeof provider.state === 'string') {
      this.storage.set(stateName, provider.state);
    }

    // transform provider options into auth0-lock options
    let opts = {
      auth: {
        params: {}
      }
    };

    if (Array.isArray(provider.scope) && provider.scope.length) {
      opts.auth.params.scope = provider.scope.join(provider.scopeDelimiter);
    }
    if (provider.state) {
      opts.auth.params.state = this.storage.get(provider.name + '_state');
    }
    if (provider.display === 'popup') {
      opts.auth.redirect = false;
    } else if (typeof provider.redirectUri === 'string') {
      opts.auth.redirect = true;
      opts.auth.redirectUrl = provider.redirectUri;
    }
    if (typeof provider.popupOptions === 'object') {
      opts.popupOptions = provider.popupOptions;
    }
    if (typeof provider.responseType === 'string') {
      opts.auth.responseType = provider.responseType;
    }
    let lockOptions = extend(true, {}, provider.lockOptions, opts);

    this.lock = this.lock || new PLATFORM.global.Auth0Lock(provider.clientId, provider.clientDomain, lockOptions);

    const openPopup = new Promise((resolve, reject) => {
      this.lock.on('authenticated', authResponse => {
        if (!lockOptions.auth.redirect) {
          // hides the lock popup, as it doesn't do so automatically
          this.lock.hide();
        }
        resolve({
          access_token: authResponse.idToken
        });
      });
      this.lock.on('unrecoverable_error', err => {
        if (!lockOptions.auth.redirect) {
          // hides the lock popup, as it doesn't do so automatically
          this.lock.hide();
        }
        reject(err);
      });
      this.lock.show();
    });

    return openPopup
      .then(lockResponse => {
        if (provider.responseType === 'token'
          || provider.responseType === 'id_token%20token'
          || provider.responseType === 'token%20id_token'
        ) {
          return lockResponse;
        }
        //NOTE: 'code' responseType is not supported, this is an OpenID response (JWT token)
        //      and code flow is not secure client-side
        throw new Error('Only `token` responseType is supported');
      });
  }
}

@inject(Storage, Popup, BaseConfig)
export class OAuth1 {
  constructor(storage: Storage, popup: Popup, config: BaseConfig) {
    this.storage  = storage;
    this.config   = config;
    this.popup    = popup;
    this.defaults = {
      url                  : null,
      name                 : null,
      popupOptions         : null,
      redirectUri          : null,
      authorizationEndpoint: null
    };
  }

  open(options: {}, userData: {}): Promise<any> {
    const provider  = extend(true, {}, this.defaults, options);
    const serverUrl = this.config.joinBase(provider.url);

    if (this.config.platform !== 'mobile') {
      this.popup = this.popup.open('', provider.name, provider.popupOptions);
    }

    return this.config.client.post(serverUrl)
      .then(response => {
        const url = provider.authorizationEndpoint + '?' + buildQueryString(response);

        if (this.config.platform === 'mobile') {
          this.popup = this.popup.open(url, provider.name, provider.popupOptions);
        } else {
          this.popup.popupWindow.location = url;
        }

        const popupListener = this.config.platform === 'mobile'
                            ? this.popup.eventListener(provider.redirectUri)
                            : this.popup.pollPopup();

        return popupListener.then(result => this.exchangeForToken(result, userData, provider));
      });
  }

  exchangeForToken(oauthData: {}, userData: {}, provider: string): Promise<any> {
    const data        = extend(true, {}, userData, oauthData);
    const serverUrl   = this.config.joinBase(provider.url);
    const credentials = this.config.withCredentials ? 'include' : 'same-origin';

    return this.config.client.post(serverUrl, data, {credentials: credentials});
  }
}

/**
 * OAuth2 service class
 *
 * @export
 * @class OAuth2
 */
@inject(Storage, Popup, BaseConfig)
export class OAuth2 {
  /**
   * Creates an instance of OAuth2.
   *
   * @param {Storage} storage The Storage instance
   * @param {Popup}   popup   The Popup instance
   * @param {Config}  config  The Config instance
   *
   * @memberOf OAuth2
   */
  constructor(storage: Storage, popup: Popup, config: BaseConfig) {
    this.storage      = storage;
    this.config       = config;
    this.popup        = popup;
    this.defaults     = {
      url                  : null,
      name                 : null,
      state                : null,
      scope                : null,
      scopeDelimiter       : null,
      redirectUri          : null,
      popupOptions         : null,
      authorizationEndpoint: null,
      responseParams       : null,
      requiredUrlParams    : null,
      optionalUrlParams    : null,
      defaultUrlParams     : ['response_type', 'client_id', 'redirect_uri'],
      responseType         : 'code'
    };
  }

  /**
   * Open OAuth2 flow
   *
   * @param {{}} options  OAuth2 and dialog options
   * @param {{}} userData Extra data for the authentications server
   * @returns {Promise<any>} Authentication server response
   *
   * @memberOf OAuth2
   */
  open(options: {}, userData: {}): Promise<any> {
    const provider  = extend(true, {}, this.defaults, options);
    const stateName = provider.name + '_state';

    if (typeof provider.state === 'function') {
      this.storage.set(stateName, provider.state());
    } else if (typeof provider.state === 'string') {
      this.storage.set(stateName, provider.state);
    }

    const url       = provider.authorizationEndpoint
                    + '?' + buildQueryString(this.buildQuery(provider));
    const popup     = this.popup.open(url, provider.name, provider.popupOptions);
    const openPopup = (this.config.platform === 'mobile')
                    ? popup.eventListener(provider.redirectUri)
                    : popup.pollPopup();

    return openPopup
      .then(oauthData => {
        if (provider.responseType === 'token'
          || provider.responseType === 'id_token token'
          || provider.responseType === 'token id_token'
        ) {
          return oauthData;
        }
        if (oauthData.state && oauthData.state !== this.storage.get(stateName)) {
          return Promise.reject('OAuth 2.0 state parameter mismatch.');
        }

        return this.exchangeForToken(oauthData, userData, provider);
      });
  }

  /**
   * Exchange the code from the external provider by a token from the authentication server
   *
   * @param {{}} oauthData The oauth data from the external provider
   * @param {{}} userData Extra data for the authentications server
   * @param {string} provider The name of the provider
   * @returns {Promise<any>} The authenticaion server response with the token
   *
   * @memberOf OAuth2
   */
  exchangeForToken(oauthData: {}, userData: {}, provider: string): Promise<any> {
    const data = extend(true, {}, userData, {
      clientId   : provider.clientId,
      redirectUri: provider.redirectUri
    }, oauthData);

    const serverUrl   = this.config.joinBase(provider.url);
    const credentials = this.config.withCredentials ? 'include' : 'same-origin';

    return this.config.client.post(serverUrl, data, {credentials: credentials});
  }

  /**
   * Create the query string for a provider
   *
   * @param {string} provider The provider name
   * @returns {string} The resulting query string
   *
   * @memberOf OAuth2
   */
  buildQuery(provider: string): string {
    let query = {};
    const urlParams   = ['defaultUrlParams', 'requiredUrlParams', 'optionalUrlParams'];

    urlParams.forEach(params => {
      (provider[params] || []).forEach(paramName => {
        const camelizedName = camelCase(paramName);
        let paramValue      = (typeof provider[paramName] === 'function')
                              ? provider[paramName]()
                              : provider[camelizedName];

        if (paramName === 'state') {
          paramValue = encodeURIComponent(this.storage.get(provider.name + '_state'));
        }

        if (paramName === 'scope' && Array.isArray(paramValue)) {
          paramValue = paramValue.join(provider.scopeDelimiter);

          if (provider.scopePrefix) {
            paramValue = provider.scopePrefix + provider.scopeDelimiter + paramValue;
          }
        }

        query[paramName] = paramValue;
      });
    });

    return query;
  }

  /**
   * Send logout request to oath2 rpovider
   *
   * @param {[{}]} options Logout option
   * @returns {Promise<any>} The OAuth provider response
   *
   * @memberOf OAuth2
   */
  close(options?: {}): Promise<any> {
    const provider  = extend(true, {}, this.defaults, options);
    const url       = provider.logoutEndpoint + '?'
                    + buildQueryString(this.buildLogoutQuery(provider));
    const popup     = this.popup.open(url, provider.name, provider.popupOptions);
    const openPopup = (this.config.platform === 'mobile')
                    ? popup.eventListener(provider.postLogoutRedirectUri)
                    : popup.pollPopup();

    return openPopup;
  }

  /**
   * Build query for logout request
   *
   * @param {string} provider The rpovider name
   * @returns {string} The logout query string
   *
   * @memberOf OAuth2
   */
  buildLogoutQuery(provider: string): string {
    let query = {};
    let authResponse = this.storage.get(this.config.storageKey);

    if (provider.postLogoutRedirectUri) {
      query.post_logout_redirect_uri = provider.postLogoutRedirectUri;
    }
    if (this.storage.get(provider.name + '_state')) {
      query.state = this.storage.get(provider.name + '_state');
    }
    if (JSON.parse(authResponse).id_token) {
      query.id_token_hint = JSON.parse(authResponse).id_token;
    }

    return query;
  }
}

/**
 * camelCase a string
 *
 * @param {any} name String to be camelized
 * @returns {string} The camelized name
 */
function camelCase(name: string): string {
  return name.replace(/([:\-_]+(.))/g, function(_, separator, letter, offset) {
    return offset ? letter.toUpperCase() : letter;
  });
}

/* eslint-disable max-lines */
@inject(Storage, BaseConfig, OAuth1, OAuth2, AuthLock)
export class Authentication {
  constructor(storage: Storage, config: BaseConfig, oAuth1: OAuth1, oAuth2: OAuth2, auth0Lock: AuthLock) {
    this.storage              = storage;
    this.config               = config;
    this.oAuth1               = oAuth1;
    this.oAuth2               = oAuth2;
    this.auth0Lock            = auth0Lock;
    this.updateTokenCallstack = [];
    this.accessToken          = null;
    this.refreshToken         = null;
    this.idToken              = null;
    this.payload              = null;
    this.exp                  = null;
    this.responseAnalyzed     = false;
  }

  /* deprecated methods */
  @deprecated({message: 'Use baseConfig.loginRoute instead.'})
  getLoginRoute() {
    return this.config.loginRoute;
  }

  @deprecated({message: 'Use baseConfig.loginRedirect instead.'})
  getLoginRedirect() {
    return this.config.loginRedirect;
  }

  @deprecated({message: 'Use baseConfig.joinBase(baseConfig.loginUrl) instead.'})
  getLoginUrl() {
    return this.Config.joinBase(this.config.loginUrl);
  }

  @deprecated({message: 'Use baseConfig.joinBase(baseConfig.signupUrl) instead.'})
  getSignupUrl() {
    return this.Config.joinBase(this.config.signupUrl);
  }

  @deprecated({message: 'Use baseConfig.joinBase(baseConfig.profileUrl) instead.'})
  getProfileUrl() {
    return this.Config.joinBase(this.config.profileUrl);
  }

  @deprecated({message: 'Use .getAccessToken() instead.'})
  getToken() {
    return this.getAccessToken();
  }

  get responseObject(): {} {
    logger.warn('Getter Authentication.responseObject is deprecated. Use Authentication.getResponseObject() instead.');

    return this.getResponseObject();
  }

  set responseObject(response: {}) {
    logger.warn('Setter Authentication.responseObject is deprecated. Use AuthServive.setResponseObject(response) instead.');
    this.setResponseObject(response);
  }

  get hasDataStored(): boolean {
    logger.warn('Authentication.hasDataStored is deprecated. Use Authentication.responseAnalyzed instead.');

    return this.responseAnalyzed;
  }

  /* get/set responseObject */
  getResponseObject(): {} {
    return JSON.parse(this.storage.get(this.config.storageKey));
  }

  setResponseObject(response: {}) {
    if (response) {
      this.getDataFromResponse(response);
      this.storage.set(this.config.storageKey, JSON.stringify(response));

      return;
    }
    this.accessToken      = null;
    this.refreshToken     = null;
    this.idToken          = null;
    this.payload          = null;
    this.exp              = null;
    this.responseAnalyzed = false;

    this.storage.remove(this.config.storageKey);
  }

  /* get data, update if needed first */
  getAccessToken(): string {
    if (!this.responseAnalyzed) this.getDataFromResponse(this.getResponseObject());

    return this.accessToken;
  }

  getRefreshToken(): string {
    if (!this.responseAnalyzed) this.getDataFromResponse(this.getResponseObject());

    return this.refreshToken;
  }

  getIdToken(): string {
    if (!this.responseAnalyzed) this.getDataFromResponse(this.getResponseObject());

    return this.idToken;
  }

  getPayload(): {} {
    if (!this.responseAnalyzed) this.getDataFromResponse(this.getResponseObject());

    return this.payload;
  }

  getExp(): number {
    if (!this.responseAnalyzed) this.getDataFromResponse(this.getResponseObject());

    return this.exp;
  }

 /* get status from data */
  getTtl(): number {
    const exp = this.getExp();

    return  Number.isNaN(exp) ? NaN : exp - Math.round(new Date().getTime() / 1000);
  }

  isTokenExpired(): boolean {
    const timeLeft = this.getTtl();

    return Number.isNaN(timeLeft) ? undefined : timeLeft < 0;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !this.isTokenExpired();
  }

  /* get and set from response */
  getDataFromResponse(response: {}): {} {
    const config   = this.config;

    // get access token either with from supplied parameters or with supplied function
    this.accessToken = typeof this.config.getAccessTokenFromResponse === 'function'
                     ? this.config.getAccessTokenFromResponse(response)
                     : this.getTokenFromResponse(response, config.accessTokenProp, config.accessTokenName, config.accessTokenRoot);

    this.refreshToken = null;
    if (config.useRefreshToken) {
      try {
        // get refresh token either with from supplied parameters or with supplied function
        this.refreshToken = typeof this.config.getRefreshTokenFromResponse === 'function'
                         ? this.config.getRefreshTokenFromResponse(response)
                         : this.getTokenFromResponse(response, config.refreshTokenProp, config.refreshTokenName, config.refreshTokenRoot);
      } catch (e) {
        this.refreshToken = null;

        logger.warn('useRefreshToken is set, but could not extract a refresh token');
      }
    }

    this.idToken = null;
    try {
      this.idToken = this.getTokenFromResponse(response, config.idTokenProp, config.idTokenName, config.idTokenRoot);
    } catch (e) {
      this.idToken = null;
    }

    this.payload = null;
    try {
      this.payload = this.accessToken ? jwtDecode(this.accessToken) : null;
    } catch (_) {} // eslint-disable-line no-empty

    // get exp either with from jwt or with supplied function
    this.exp = parseInt((typeof this.config.getExpirationDateFromResponse === 'function'
                        ? this.config.getExpirationDateFromResponse(response)
                        : this.payload && this.payload.exp), 10) || NaN;

    this.responseAnalyzed = true;

    return {
      accessToken : this.accessToken,
      refreshToken: this.refreshToken,
      idToken     : this.idToken,
      payload     : this.payload,
      exp         : this.exp
    };
  }

  /**
   * Extract the token from the server response
   *
   * @param {{}} response The response
   * @param {string} tokenProp tokenProp
   * @param {string} tokenName tokenName
   * @param {string} tokenRoot tokenRoot
   * @returns {string} The token
   *
   * @memberOf Authentication
   */
  getTokenFromResponse(response: {}, tokenProp: string, tokenName: string, tokenRoot: string): string {
    if (!response) return undefined;

    const responseTokenProp = tokenProp.split('.').reduce((o, x) => o[x], response);

    if (typeof responseTokenProp === 'string') {
      return responseTokenProp;
    }

    if (typeof responseTokenProp === 'object') {
      const tokenRootData = tokenRoot && tokenRoot.split('.').reduce((o, x) => o[x], responseTokenProp);
      const token = tokenRootData ? tokenRootData[tokenName] : responseTokenProp[tokenName];

      if (!token) {
        // if the token is not found in the response,
        // throw an error along with the response object as a key
        let error = new Error('Token not found in response');

        error.responseObject = response;
        throw error;
      }

      return token;
    }

    const token = response[tokenName] === undefined ? null : response[tokenName];

    if (!token) {
        // if the token is not found in the response,
        // throw an error along with the response object as a key
      let error = new Error('Token not found in response');

      error.responseObject = response;
      throw error;
    }

    return token;
  }

  toUpdateTokenCallstack(): Promise<any> {
    return new Promise(resolve => this.updateTokenCallstack.push(resolve));
  }

  resolveUpdateTokenCallstack(response: {}) {
    this.updateTokenCallstack.map(resolve => resolve(response));
    this.updateTokenCallstack = [];
  }

  /**
   * Authenticate with third-party
   *
   * @param {string}    name        Name of the provider
   * @param {[{}]}      [userData]  Additional data send to the authentication server
   *
   * @return {Promise<any>} The authentication server response
   */
  authenticate(name: string, userData: {} = {}): Promise<any> {
    let oauthType = this.config.providers[name].type;

    if (oauthType) {
      logger.warn('DEPRECATED: Setting provider.type is deprecated and replaced by provider.oauthType');
    } else {
      oauthType = this.config.providers[name].oauthType;
    }

    let providerLogin;

    if (oauthType === 'auth0-lock') {
      providerLogin = this.auth0Lock;
    } else {
      providerLogin = (oauthType === '1.0' ? this.oAuth1 : this.oAuth2);
    }

    return providerLogin.open(this.config.providers[name], userData);
  }

  /**
   * Send logout request to oauth provider
   *
   * @param {string} name The provider name
   * @returns {Promise<any>} The server response
   *
   * @memberOf Authentication
   */
  logout(name: string): Promise<any> {
    let rtnValue = Promise.resolve('Not Applicable');

    if (this.config.providers[name].oauthType !== '2.0' || !this.config.providers[name].logoutEndpoint) {
      return rtnValue;
    }

    return this.oAuth2.close(this.config.providers[name]);
  }

  /**
   * Redirect (page reload if applicable for the browsers save password option)
   *
   * @param {string}   redirectUrl The redirect url. To not redirect use an empty string.
   * @param {[string]} defaultRedirectUrl The defaultRedirectUrl. Used when redirectUrl is undefined
   * @param {[string]} query The optional query string to add the the url
   * @returns {undefined} undefined
   *
   * @memberOf Authentication
   */
  redirect(redirectUrl: string, defaultRedirectUrl?: string, query?: string) {
    // stupid rule to keep it BC
    if (redirectUrl === true) {
      logger.warn('DEPRECATED: Setting redirectUrl === true to actually *not redirect* is deprecated. Set redirectUrl === \'\' instead.');

      return;
    }

    // stupid rule to keep it BC
    if (redirectUrl === false) {
      logger.warn('BREAKING CHANGE: Setting redirectUrl === false to actually *do redirect* is deprecated. Set redirectUrl to undefined or null to use the defaultRedirectUrl if so desired.');
    }

    // BC hack. explicit 0 means don't redirect. deprecated in favor of an empty string
    if (redirectUrl === 0) {
      logger.warn('BREAKING CHANGE: Setting redirectUrl === 0 is deprecated. Set redirectUrl to \'\' instead.');

      return;
    }

    // Empty string means don't redirect overwrite.
    if (redirectUrl === '') {
      return;
    }

    if (typeof redirectUrl === 'string') {
      PLATFORM.location.href = encodeURI(redirectUrl + (query ? `?${buildQueryString(query)}` : ''));
    } else if (defaultRedirectUrl) {
      PLATFORM.location.href = defaultRedirectUrl + (query ? `?${buildQueryString(query)}` : '');
    }
  }
}

/* eslint-disable max-lines */
@inject(Authentication, BaseConfig, BindingSignaler, EventAggregator)
export class AuthService {
  /**
   * The Authentication instance that handles the token
   *
   * @param  {Authentication}
   */
  authentication: Authentication;

  /**
   * The BaseConfig instance that contains the current configuration setting
   *
   * @param  {BaseConfig}
   */
  config: BaseConfig;

  /**
   * The current login status
   *
   * @param  {boolean}
   */
  authenticated: boolean  = false;

  /**
   * The currently set timeoutID
   *
   * @param  {number}
   */
  timeoutID: number = 0;

  /**
   *  Create an AuthService instance
   *
   * @param  {Authentication}  authentication  The Authentication instance to be used
   * @param  {Config}          config          The Config instance to be used
   * @param  {BindingSignaler} bindingSignaler The BindingSignaler instance to be used
   * @param  {EventAggregator} eventAggregator The EventAggregator instance to be used
   */
  constructor(authentication: Authentication, config: BaseConfig, bindingSignaler: BindingSignaler, eventAggregator: EventAggregator) {
    this.authentication  = authentication;
    this.config          = config;
    this.bindingSignaler = bindingSignaler;
    this.eventAggregator = eventAggregator;

    // get token stored in previous format over
    const oldStorageKey = config.tokenPrefix
                        ? `${config.tokenPrefix}_${config.tokenName}`
                        : config.tokenName;
    const oldToken = authentication.storage.get(oldStorageKey);

    if (oldToken) {
      logger.info('Found token with deprecated format in storage. Converting it to new format. No further action required.');
      let fakeOldResponse = {};

      fakeOldResponse[config.accessTokenProp] = oldToken;
      this.setResponseObject(fakeOldResponse);
      authentication.storage.remove(oldStorageKey);
    }

    // initialize status by resetting if existing stored responseObject
    this.setResponseObject(this.authentication.getResponseObject());

    // listen to storage events in case the user logs in or out in another tab/window
    PLATFORM.addEventListener('storage', this.storageEventHandler);
  }

  /**
   * The handler used for storage events. Detects and handles authentication changes in other tabs/windows
   *
   * @param {StorageEvent} event StorageEvent
   */
  storageEventHandler = (event: StorageEvent) => {
    if (event.key !== this.config.storageKey || event.newValue === event.oldValue) {
      return;
    }

    logger.info('Stored token changed event');

    // IE runs the event handler before updating the storage value. Update it now.
    // An unset storage key in IE is an empty string, where-as chrome is null
    if (event.newValue) {
      this.authentication.storage.set(this.config.storageKey, event.newValue);
    } else {
      this.authentication.storage.remove(this.config.storageKey);
    }

    let wasAuthenticated = this.authenticated;

    this.authentication.responseAnalyzed = false;
    this.updateAuthenticated();

    if (wasAuthenticated === this.authenticated) {
      return;
    }

    if (this.config.storageChangedRedirect) {
      PLATFORM.location.href = this.config.storageChangedRedirect;
    }

    if (this.config.storageChangedReload) {
      PLATFORM.location.reload();
    }
  }

  /**
   * Getter: The configured Rest client for all aurelia-authentication requests
   *
   * @return {Rest}
   */
  get client(): Rest {
    return this.config.client;
  }

  /**
   * Getter: The authentication class instance
   *
   * @return {boolean}
   * @deprecated
   */
  get auth(): Authentication {
    logger.warn('AuthService.auth is deprecated. Use .authentication instead.');

    return this.authentication;
  }

  /**
   * Sets the login timeout
   *
   * @param  {number} ttl  Timeout time in ms
   */
  setTimeout(ttl: number) {
    this.clearTimeout();

    const expiredTokenHandler = () => {
      if (this.config.autoUpdateToken
        && this.authentication.getAccessToken()
        && this.authentication.getRefreshToken()) {
        this.updateToken().catch(error => logger.warn(error.message));

        return;
      }

      this.setResponseObject(null);

      if (this.config.expiredRedirect) {
        PLATFORM.location.assign(this.config.expiredRedirect);
      }
    };

    this.timeoutID = PLATFORM.global.setTimeout(expiredTokenHandler, ttl);
    PLATFORM.addEventListener('focus', () => {
      if (this.isTokenExpired()) {
        expiredTokenHandler();
      }
    });
  }

  /**
   * Clears the login timeout
   */
  clearTimeout() {
    if (this.timeoutID) {
      PLATFORM.global.clearTimeout(this.timeoutID);
    }
    this.timeoutID = 0;
  }

  /**
   * Stores and analyses the servers responseObject. Sets login status and timeout
   *
   * @param {{}} response The servers response as object
   */
  setResponseObject(response: {}) {
    this.authentication.setResponseObject(response);

    this.updateAuthenticated();
  }

  /**
   * Update authenticated. Sets login status and timeout
   */
  updateAuthenticated() {
    this.clearTimeout();

    let wasAuthenticated = this.authenticated;

    this.authenticated = this.authentication.isAuthenticated();

    if (this.authenticated && !Number.isNaN(this.authentication.exp)) {
      this.setTimeout(this.getTtl() * 1000);
    }

    if (wasAuthenticated !== this.authenticated) {
      this.bindingSignaler.signal('authentication-change');
      this.eventAggregator.publish('authentication-change', this.authenticated);

      logger.info(`Authorization changed to: ${this.authenticated}`);
    }
  }

  /**
   * Get current user profile from server
   *
   * @param {({}|number|string)} [criteriaOrId] (optional) An object or a number|string converted to {id: criteriaOrId}
   * @returns {Promise<any>} The server response
   *
   * @memberOf AuthService
   */
  getMe(criteriaOrId?: {}|number|string): Promise<any> {
    if (typeof criteriaOrId === 'string' || typeof criteriaOrId === 'number') {
      criteriaOrId = {id: criteriaOrId};
    }

    return this.client.find(this.config.joinBase(this.config.profileUrl), criteriaOrId);
  }

  /**
   * Send current user profile update to server
   *
   * @param {{}}                body           Request body with data.
   * @param {{}|number|string}  [criteriaOrId] (optional) An object or a number|string converted to {id: criteriaOrId}
   *
   * @return {Promise<any>} The server response
   */
  updateMe(body: {}, criteriaOrId?: {}|number|string): Promise<any> {
    if (typeof criteriaOrId === 'string' || typeof criteriaOrId === 'number') {
      criteriaOrId = {id: criteriaOrId};
    }
    if (this.config.profileMethod === 'put') {
      return this.client.update(this.config.joinBase(this.config.profileUrl), criteriaOrId, body);
    }

    return this.client.patch(this.config.joinBase(this.config.profileUrl), criteriaOrId, body);
  }

  /**
   * Get accessToken from storage
   *
   * @returns {string} Current accessToken
   */
  getAccessToken(): string {
    return this.authentication.getAccessToken();
  }

  @deprecated({message: 'Use .getAccessToken() instead.'})
  getCurrentToken(): string {
    return this.getAccessToken();
  }

  /**
   * Get refreshToken from storage
   *
   * @returns {string} Current refreshToken
   */
  getRefreshToken(): string {
    return this.authentication.getRefreshToken();
  }

  /**
   * Get idToken from storage
   *
   * @returns {string} Current idToken
   */
  getIdToken(): string {
    return this.authentication.getIdToken();
  }

 /**
  * Gets authentication status from storage
  *
  * @param {[Function]} [callback] optional callback (authenticated: boolean) => void executed once the status is determined
  *
  * @returns {boolean} For Non-JWT and unexpired JWT: true, else: false
  */
  isAuthenticated(callback?: (authenticated: boolean) => void): boolean {
    this.authentication.responseAnalyzed = false;

    let authenticated = this.authentication.isAuthenticated();

    // auto-update token?
    if (!authenticated
      && this.config.autoUpdateToken
      && this.authentication.getAccessToken()
      && this.authentication.getRefreshToken()
    ) {
      this.updateToken()
        .then(() => {
          // call callback with now updated status
          if (typeof callback === 'function') {
            callback(this.authenticated); // eslint-disable-line callback-return
          }
        })
        .catch(error => logger.warn(error.message));

      authenticated = true;
    } else if (typeof callback === 'function') {
      // ensure consistent execution order with a 'delayed' callback
      PLATFORM.global.setTimeout(() => {
        try {
          callback(authenticated); // eslint-disable-line callback-return
        } catch(error) {
          logger.warn(error.message);
        }
      }, 1);
    }

    return authenticated;
  }

  /**
   * Gets exp in milliseconds
   *
   * @returns {number} Exp for JWT tokens, NaN for all other tokens
   */
  getExp(): number {
    return this.authentication.getExp();
  }

  /**
   * Gets ttl in seconds
   *
   * @returns {number} Ttl for JWT tokens, NaN for all other tokens
   */
  getTtl(): number {
    return this.authentication.getTtl();
  }

 /**
  * Gets exp from token payload and compares to current time
  *
  * @returns {boolean} Returns (ttl > 0)? for JWT, undefined other tokens
  */
  isTokenExpired(): boolean {
    return this.authentication.isTokenExpired();
  }

  /**
  * Get payload from tokens
  *
  * @returns {{}} Payload for JWT, else null
  */
  getTokenPayload(): {} {
    return this.authentication.getPayload();
  }

  /**
   * Request new access token
   *
   * @returns {Promise<any>} Requests new token. can be called multiple times
   */
  updateToken(): Promise<any> {
    if (!this.authentication.getRefreshToken()) {
      return Promise.reject(new Error('refreshToken not set'));
    }

    if (this.authentication.updateTokenCallstack.length === 0) {
      let content = {
        grant_type: 'refresh_token',
        client_id : this.config.clientId ? this.config.clientId : undefined
      };

      content[this.config.refreshTokenSubmitProp] = this.authentication.getRefreshToken();

      this.client.post(this.config.joinBase(this.config.refreshTokenUrl
                                            ? this.config.refreshTokenUrl
                                            : this.config.loginUrl), content)
        .then(response => {
          this.setResponseObject(response);
          this.authentication.resolveUpdateTokenCallstack(this.isAuthenticated());
        })
        .catch(error => {
          this.setResponseObject(null);
          this.authentication.resolveUpdateTokenCallstack(Promise.reject(error));
        });
    }

    return this.authentication.toUpdateTokenCallstack();
  }

  /**
   * Signup locally. Login and redirect depending on config
   *
   * @param {string|{}}   displayNameOrCredentials displayName | object with signup data.
   * @param {[string]|{}} emailOrOptions           [email | options for post request]
   * @param {[string]}    passwordOrRedirectUri    [password | optional redirectUri overwrite]
   * @param {[{}]}        options                  [options]
   * @param {[string]}    [redirectUri]            [optional redirectUri overwrite, ''= no redirection]
   *
   * @return {Promise<any>} Server response as Object
   */
  signup(displayNameOrCredentials: string|{}, emailOrOptions?: string|{}, passwordOrRedirectUri?: string, options?: {}, redirectUri?: string): Promise<any> {
    let normalized = {};

    if (typeof displayNameOrCredentials === 'object') {
      normalized.credentials = displayNameOrCredentials;
      normalized.options     = emailOrOptions;
      normalized.redirectUri = passwordOrRedirectUri;
    } else {
      normalized.credentials = {
        'displayName': displayNameOrCredentials,
        'email'      : emailOrOptions,
        'password'   : passwordOrRedirectUri
      };
      normalized.options     = options;
      normalized.redirectUri = redirectUri;
    }

    return this.client.post(this.config.joinBase(this.config.signupUrl), normalized.credentials, normalized.options)
      .then(response => {
        if (this.config.loginOnSignup) {
          this.setResponseObject(response);
        }
        this.authentication.redirect(normalized.redirectUri, this.config.signupRedirect);

        return response;
      });
  }

  /**
   * Login locally. Redirect depending on config
   *
   * @param {[string]|{}} emailOrCredentials      email | object with signup data.
   * @param {[string]}    [passwordOrOptions]     [password | options for post request]
   * @param {[{}]}        [optionsOrRedirectUri]  [options | redirectUri overwrite]]
   * @param {[string]}    [redirectUri]           [optional redirectUri overwrite, ''= no redirection]
   *
   * @return {Promise<Object>|Promise<Error>}    Server response as Object
   */
  login(emailOrCredentials: string|{}, passwordOrOptions?: string|{}, optionsOrRedirectUri?: {}, redirectUri?: string): Promise<any> {
    let normalized = {};

    if (typeof emailOrCredentials === 'object') {
      normalized.credentials = emailOrCredentials;
      normalized.options     = passwordOrOptions;
      normalized.redirectUri = optionsOrRedirectUri;
    } else {
      normalized.credentials = {
        'email'   : emailOrCredentials,
        'password': passwordOrOptions
      };
      normalized.options     = optionsOrRedirectUri;
      normalized.redirectUri = redirectUri;
    }

    if (this.config.clientId) {
      normalized.credentials.client_id = this.config.clientId;
    }

    return this.client.post(this.config.joinBase(this.config.loginUrl), normalized.credentials, normalized.options)
      .then(response => {
        this.setResponseObject(response);

        this.authentication.redirect(normalized.redirectUri, this.config.loginRedirect);

        return response;
      });
  }

  /**
   * Logout locally and redirect to redirectUri (if set) or redirectUri of config.
   * Sends logout request first, if set in config
   *
   * @param {[string]}    [redirectUri]    [optional redirectUri overwrite, ''= no redirection]
   * @param {[string]}    [query]          [optional query string for the uri]
   * @param {[string]}    [name]           [optional name Name of the provider]
   *
   * @return {Promise<any>}     Server response as Object
   */
  logout(redirectUri?: string, query?: string, name?: string): Promise<any> {
    let localLogout = response => new Promise(resolve => {
      this.setResponseObject(null);

      this.authentication.redirect(redirectUri, this.config.logoutRedirect, query);

      if (typeof this.onLogout === 'function') {
        this.onLogout(response);
      }
      resolve(response);
    });

    if (name) {
      if (this.config.providers[name].logoutEndpoint) {
        return this.authentication.logout(name)
          .then(logoutResponse => {
            let stateValue = this.authentication.storage.get(name + '_state');

            if (logoutResponse.state !== stateValue) {
              return Promise.reject('OAuth2 response state value differs');
            }

            return localLogout(logoutResponse);
          });
      }
    } else {
     return this.config.logoutUrl
        ? this.client.request(this.config.logoutMethod, this.config.joinBase(this.config.logoutUrl))
            .then(localLogout)
            .catch(localLogout)
        : localLogout();
    }
  }

  /**
   * Authenticate with third-party and redirect to redirectUri (if set) or redirectUri of config
   *
   * @param {string}    name          Name of the provider
   * @param {[string]}  [redirectUri] [optional redirectUri overwrite]
   * @param {[{}]}      [userData]    [optional userData for the local authentication server]
   *
   * @return {Promise<any>} Server response as Object
   */
  authenticate(name: string, redirectUri?: string, userData?: {}): Promise<any> {
    return this.authentication.authenticate(name, userData)
      .then(response => {
        this.setResponseObject(response);

        this.authentication.redirect(redirectUri, this.config.loginRedirect);

        return response;
      });
  }

  /**
   * Unlink third-party
   *
   * @param {string}    name          Name of the provider
   * @param {[string]}  [redirectUri] [optional redirectUri overwrite]
   *
   * @return {Promise<any>}  Server response as Object
   */
  unlink(name: string, redirectUri?: string): Promise<any> {
    const unlinkUrl = this.config.joinBase(this.config.unlinkUrl) + name;

    return this.client.request(this.config.unlinkMethod, unlinkUrl)
      .then(response => {
        this.authentication.redirect(redirectUri);

        return response;
      });
  }
}

@inject(AuthService)
export class AuthenticateStep {
  constructor(authService: AuthService) {
    this.authService = authService;
  }

  run(routingContext, next) {
    const isLoggedIn = this.authService.authenticated;
    const loginRoute = this.authService.config.loginRoute;

    if (routingContext.getAllInstructions().some(route => route.config.auth === true)) {
      if (!isLoggedIn) {
        return next.cancel(new Redirect(loginRoute));
      }
    } else if (isLoggedIn && routingContext.getAllInstructions().some(route => route.fragment === loginRoute)) {
      return next.cancel(new Redirect(this.authService.config.loginRedirect));
    }

    return next();
  }
}

@inject(AuthService)
export class AuthorizeStep {
  constructor(authService: AuthService) {
    logger.warn('AuthorizeStep is deprecated. Use AuthenticateStep instead.');

    this.authService = authService;
  }

  run(routingContext, next) {
    const isLoggedIn = this.authService.isAuthenticated();
    const loginRoute = this.authService.config.loginRoute;

    if (routingContext.getAllInstructions().some(route => route.config.auth)) {
      if (!isLoggedIn) {
        return next.cancel(new Redirect(loginRoute));
      }
    } else if (isLoggedIn && routingContext.getAllInstructions().some(route => route.fragment === loginRoute)) {
      return next.cancel(new Redirect(this.authService.config.loginRedirect));
    }

    return next();
  }
}

@inject(HttpClient, Config, AuthService, BaseConfig)
export class FetchConfig {
  /**
   * Construct the FetchConfig
   *
   * @param {HttpClient} httpClient httpClient
   * @param {Config} clientConfig clientConfig
   * @param {Authentication} authService authService
   * @param {BaseConfig} config baseConfig
   */
  constructor(httpClient: HttpClient, clientConfig: Config, authService: Authentication, config: BaseConfig) {
    this.httpClient   = httpClient;
    this.clientConfig = clientConfig;
    this.authService  = authService;
    this.config       = config;
  }

  /**
   * Interceptor for HttpClient
   *
   * @return {{request: Function, response: Function}} The interceptor
   */
  get interceptor(): {request: Function, response: Function} {
    return {
      request: request => {
        if (!this.config.httpInterceptor || !this.authService.isAuthenticated()) {
          return request;
        }
        let token = this.authService.getAccessToken();

        if (this.config.authTokenType) {
          token = `${this.config.authTokenType} ${token}`;
        }

        request.headers.set(this.config.authHeader, token);

        return request;
      },
      response: (response, request) => {
        return new Promise((resolve, reject) => {
          // resolve success
          if (response.ok) {
            return resolve(response);
          }
          // resolve all non-authorization errors
          if (response.status !== 401) {
            return resolve(response);
          }
          // resolve unexpected authorization errors (not a managed request or token not expired)
          if (!this.config.httpInterceptor || !this.authService.isTokenExpired()) {
            return resolve(response);
          }
          // resolve expected authorization error without refresh_token setup
          if (!this.config.useRefreshToken || !this.authService.getRefreshToken()) {
            return resolve(response);
          }

          // refresh token and try again
          return this.authService.updateToken().then(() => {
            let token = this.authService.getAccessToken();

            if (this.config.authTokenType) {
              token = `${this.config.authTokenType} ${token}`;
            }

            request.headers.set(this.config.authHeader, token);

            return this.httpClient.fetch(request).then(resolve);
          });
        });
      }
    };
  }

  /**
   * Configure client(s) with authorization interceptor
   *
   * @param {HttpClient|Rest|string[]} client HttpClient, rest client or api endpoint name, or an array thereof
   *
   * @return {HttpClient[]} The configured client(s)
   */
  configure(client: HttpClient|Rest|Array<string>): HttpClient|Array<HttpClient> {
    if (Array.isArray(client)) {
      let configuredClients = [];

      client.forEach(toConfigure => {
        configuredClients.push(this.configure(toConfigure));
      });

      return configuredClients;
    }

    if (typeof client === 'string') {
      const endpoint = this.clientConfig.getEndpoint(client);

      if (!endpoint) {
        throw new Error(`There is no '${client || 'default'}' endpoint registered.`);
      }
      client = endpoint.client;
    } else if (client instanceof Rest) {
      client = client.client;
    } else if (!(client instanceof HttpClient)) {
      client = this.httpClient;
    }

    client.interceptors.push(this.interceptor);

    return client;
  }
}

// added for bundling
// eslint-disable-line no-unused-vars
// eslint-disable-line no-unused-vars
// eslint-disable-line no-unused-vars

/**
 * Configure the plugin.
 *
 * @export
 * @param {FrameworkConfiguration} frameworkConfig The FrameworkConfiguration instance
 * @param {{}|Function}            config          The Config instance
 *
 */
export function configure(frameworkConfig: { container: Container, globalResources: (...resources: string[]) => any }, config: {}|Function) {
  // ie9 polyfill
  if (!PLATFORM.location.origin) {
    PLATFORM.location.origin = PLATFORM.location.protocol + '//' + PLATFORM.location.hostname + (PLATFORM.location.port ? ':' + PLATFORM.location.port : '');
  }

  const baseConfig = frameworkConfig.container.get(BaseConfig);

  if (typeof config === 'function') {
    config(baseConfig);
  } else if (typeof config === 'object') {
    baseConfig.configure(config);
  }

  // after baseConfig was configured
  for (let converter of baseConfig.globalValueConverters) {
    frameworkConfig.globalResources(`./${converter}`);
    logger.info(`Add globalResources value-converter: ${converter}`);
  }
  const fetchConfig  = frameworkConfig.container.get(FetchConfig);
  const clientConfig = frameworkConfig.container.get(Config);

  // Array? Configure the provided endpoints.
  if (Array.isArray(baseConfig.configureEndpoints)) {
    baseConfig.configureEndpoints.forEach(endpointToPatch => {
      fetchConfig.configure(endpointToPatch);
    });
  }

  let client;

  // Let's see if there's a configured named or default endpoint or a HttpClient.
  if (baseConfig.endpoint !== null) {
    if (typeof baseConfig.endpoint === 'string') {
      const endpoint = clientConfig.getEndpoint(baseConfig.endpoint);

      if (!endpoint) {
        throw new Error(`There is no '${baseConfig.endpoint || 'default'}' endpoint registered.`);
      }
      client = endpoint;
    } else if (baseConfig.endpoint instanceof HttpClient) {
      client = new Rest(baseConfig.endpoint);
    }
  }

  // No? Fine. Default to HttpClient. BC all the way.
  if (!(client instanceof Rest)) {
    client = new Rest(frameworkConfig.container.get(HttpClient));
  }

  // Set the client on the config, for use throughout the plugin.
  baseConfig.client = client;
}
