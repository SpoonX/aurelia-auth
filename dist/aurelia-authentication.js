import extend from 'extend';
import * as LogManager from 'aurelia-logging';
import jwtDecode from 'jwt-decode';
import {PLATFORM,DOM} from 'aurelia-pal';
import {parseQueryString,join,buildQueryString} from 'aurelia-path';
import {inject} from 'aurelia-dependency-injection';
import {deprecated} from 'aurelia-metadata';
import {EventAggregator} from 'aurelia-event-aggregator';
import {BindingSignaler} from 'aurelia-templating-resources';
import {Redirect} from 'aurelia-router';
import {HttpClient} from 'aurelia-fetch-client';
import {Config,Rest} from 'aurelia-api';

export class Popup {
  constructor() {
    this.popupWindow = null;
    this.polling     = null;
    this.url         = '';
  }

  open(url, windowName, options) {
    this.url = url;
    const optionsString = buildPopupWindowOptions(options || {});

    this.popupWindow = PLATFORM.global.open(url, windowName, optionsString);

    if (this.popupWindow && this.popupWindow.focus) {
      this.popupWindow.focus();
    }

    return this;
  }

  eventListener(redirectUri) {
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

  pollPopup() {
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
            data: 'Provider Popup Blocked'
          });
        } else if (this.popupWindow.closed) {
          PLATFORM.global.clearInterval(this.polling);
          reject({
            error: errorData,
            data: 'Problem poll popup'
          });
        }
      }, 35);
    });
  }
}

const buildPopupWindowOptions = options => {
  const width  = options.width || 500;
  const height = options.height || 500;

  const extended = extend({
    width: width,
    height: height,
    left: PLATFORM.global.screenX + ((PLATFORM.global.outerWidth - width) / 2),
    top: PLATFORM.global.screenY + ((PLATFORM.global.outerHeight - height) / 2.5)
  }, options);

  let parts = [];
  Object.keys(extended).map(key => parts.push(key + '=' + extended[key]));

  return parts.join(',');
};

const parseUrl = url => {
  let hash = (url.hash.charAt(0) === '#') ? url.hash.substr(1) : url.hash;

  return extend(true, {}, parseQueryString(url.search), parseQueryString(hash));
};

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
  // redirect  when token expires. 0 = don't redirect (default), 1 = use logoutRedirect, string = redirect there
  expiredRedirect = 0;


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

  idTokenProp = 'id_token';
  idTokenName = 'token';
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
  _authToken = 'Bearer';
  _responseTokenProp = 'access_token';
  _tokenName = 'token';
  _tokenRoot = false;
  _tokenPrefix = 'aurelia';

  /* deprecated methods and parameteres */
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

  get current() {
    LogManager.getLogger('authentication').warn('Getter BaseConfig.current is deprecated. Use BaseConfig directly instead.');
    return this;
  }
  set current(_) {
    throw new Error('Setter BaseConfig.current is obsolete. Use BaseConfig directly instead.');
  }

  get _current() {
    LogManager.getLogger('authentication').warn('Getter BaseConfig._current is deprecated. Use BaseConfig directly instead.');
    return this;
  }
  set _current(_) {
    throw new Error('Setter BaseConfig._current is obsolete. Use BaseConfig directly instead.');
  }
}

function randomState() {
  let rand = Math.random().toString(36).substr(2);
  return encodeURIComponent(rand);
}

@inject(BaseConfig)
export class Storage {
  constructor(config) {
    this.config = config;
  }

  get(key) {
    return PLATFORM.global[this.config.storage].getItem(key);
  }

  set(key, value) {
    PLATFORM.global[this.config.storage].setItem(key, value);
  }

  remove(key) {
    PLATFORM.global[this.config.storage].removeItem(key);
  }
}

@inject(Storage, BaseConfig)
export class AuthLock {
  constructor(storage, config) {
    this.storage      = storage;
    this.config       = config;
    this.defaults     = {
      name: null,
      state: null,
      scope: null,
      scopeDelimiter: null,
      redirectUri: null,
      clientId: null,
      clientDomain: null,
      display: 'popup',
      lockOptions: {
        popup: true
      },
      popupOptions: null,
      responseType: 'token'
    };
  }

  open(options, userData) {
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

    this.lock = this.lock || new PLATFORM.global.Auth0Lock(provider.clientId, provider.clientDomain);

    const openPopup = new Promise((resolve, reject) => {
      let opts = provider.lockOptions;
      opts.popupOptions = provider.popupOptions;
      opts.responseType = provider.responseType;
      opts.callbackURL = provider.redirectUri;
      opts.authParams = opts.authParams || {};
      if (provider.scope) opts.authParams.scope = provider.scope;
      if (provider.state) opts.authParams.state = this.storage.get(provider.name + '_state');

      this.lock.show(provider.lockOptions, (err, profile, tokenOrCode) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            //NOTE: this is an id token (JWT) and it shouldn't be named access_token
            access_token: tokenOrCode
          });
        }
      });
    });

    return openPopup
      .then(lockResponse => {
        if (provider.responseType === 'token' ||
            provider.responseType === 'id_token%20token' ||
            provider.responseType === 'token%20id_token'
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
  constructor(storage, popup, config) {
    this.storage  = storage;
    this.config   = config;
    this.popup    = popup;
    this.defaults = {
      url: null,
      name: null,
      popupOptions: null,
      redirectUri: null,
      authorizationEndpoint: null
    };
  }

  open(options, userData) {
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

  exchangeForToken(oauthData, userData, provider) {
    const data        = extend(true, {}, userData, oauthData);
    const serverUrl   = this.config.joinBase(provider.url);
    const credentials = this.config.withCredentials ? 'include' : 'same-origin';

    return this.config.client.post(serverUrl, data, {credentials: credentials});
  }
}

@inject(Storage, Popup, BaseConfig)
export class OAuth2 {
  constructor(storage, popup, config) {
    this.storage      = storage;
    this.config       = config;
    this.popup        = popup;
    this.defaults     = {
      url: null,
      name: null,
      state: null,
      scope: null,
      scopeDelimiter: null,
      redirectUri: null,
      popupOptions: null,
      authorizationEndpoint: null,
      responseParams: null,
      requiredUrlParams: null,
      optionalUrlParams: null,
      defaultUrlParams: ['response_type', 'client_id', 'redirect_uri'],
      responseType: 'code'
    };
  }

  open(options, userData) {
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
        if (provider.responseType === 'token' ||
            provider.responseType === 'id_token token' ||
            provider.responseType === 'token id_token'
        ) {
          return oauthData;
        }
        if (oauthData.state && oauthData.state !== this.storage.get(stateName)) {
          return Promise.reject('OAuth 2.0 state parameter mismatch.');
        }
        return this.exchangeForToken(oauthData, userData, provider);
      });
  }

  exchangeForToken(oauthData, userData, provider) {
    const data = extend(true, {}, userData, {
      clientId: provider.clientId,
      redirectUri: provider.redirectUri
    }, oauthData);

    const serverUrl   = this.config.joinBase(provider.url);
    const credentials = this.config.withCredentials ? 'include' : 'same-origin';

    return this.config.client.post(serverUrl, data, {credentials: credentials});
  }

  buildQuery(provider) {
    let query = {};
    const urlParams   = ['defaultUrlParams', 'requiredUrlParams', 'optionalUrlParams'];

    urlParams.forEach( params => {
      (provider[params] || []).forEach( paramName => {
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
}

const camelCase = function(name) {
  return name.replace(/([\:\-\_]+(.))/g, function(_, separator, letter, offset) {
    return offset ? letter.toUpperCase() : letter;
  });
};

@inject(Storage, BaseConfig, OAuth1, OAuth2, AuthLock)
export class Authentication {
  constructor(storage, config, oAuth1, oAuth2, auth0Lock) {
    this.storage              = storage;
    this.config               = config;
    this.oAuth1               = oAuth1;
    this.oAuth2               = oAuth2;
    this.auth0Lock            = auth0Lock;
    this.updateTokenCallstack = [];
    this.accessToken          = null;
    this.idToken              = null;
    this.refreshToken         = null;
    this.payload              = null;
    this.exp                  = null;
    this.hasDataStored        = false;
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

  get responseObject() {
    LogManager.getLogger('authentication').warn('Getter Authentication.responseObject is deprecated. Use Authentication.getResponseObject() instead.');
    return this.getResponseObject();
  }

  set responseObject(response) {
    LogManager.getLogger('authentication').warn('Setter Authentication.responseObject is deprecated. Use AuthServive.setResponseObject(response) instead.');
    this.setResponseObject(response);
  }

  /* get/set responseObject */

  getResponseObject() {
    return JSON.parse(this.storage.get(this.config.storageKey));
  }

  setResponseObject(response) {
    if (response) {
      this.getDataFromResponse(response);
      this.storage.set(this.config.storageKey, JSON.stringify(response));
      return;
    }
    this.accessToken = null;
    this.refreshToken = null;
    this.idToken = null;
    this.payload = null;
    this.exp = null;

    this.hasDataStored = false;

    this.storage.remove(this.config.storageKey);
  }


  /* get data, update if needed first */

  getAccessToken() {
    if (!this.hasDataStored) this.getDataFromResponse(this.getResponseObject());
    return this.accessToken;
  }

  getRefreshToken() {
    if (!this.hasDataStored) this.getDataFromResponse(this.getResponseObject());
    return this.refreshToken;
  }
 
  getIdToken() {
      if(!this.hasDataStored) this.getDataFromResponse(this.getResponseObject());
      return this.idToken;
  }

  getPayload() {
    if (!this.hasDataStored) this.getDataFromResponse(this.getResponseObject());
    return this.payload;
  }

  getExp() {
    if (!this.hasDataStored) this.getDataFromResponse(this.getResponseObject());
    return this.exp;
  }


 /* get status from data */

  getTtl() {
    const exp = this.getExp();
    return  Number.isNaN(exp) ? NaN : exp - Math.round(new Date().getTime() / 1000);
  }

  isTokenExpired() {
    const timeLeft = this.getTtl();
    return Number.isNaN(timeLeft) ? undefined : timeLeft < 0;
  }

  isAuthenticated() {
    const isTokenExpired = this.isTokenExpired();
    if (isTokenExpired === undefined ) return this.accessToken ? true : false;
    return !isTokenExpired;
  }


  /* get and set from response */

  getDataFromResponse(response) {
    const config   = this.config;

    this.accessToken = this.getTokenFromResponse(response, config.accessTokenProp, config.accessTokenName, config.accessTokenRoot);

    this.refreshToken = null;
    if (config.useRefreshToken) {
      try {
        this.refreshToken = this.getTokenFromResponse(response, config.refreshTokenProp, config.refreshTokenName, config.refreshTokenRoot);
      } catch (e) {
        this.refreshToken = null;
      }
    }
    
    this.idToken = null;
    try {
        this.idToken = this.getTokenFromResponse(response, config.idTokenProp, config.idTokenName, config.idTokenRoot);
    } catch(e) {
        this.idToken = null;
    }

    this.payload = null;
    try {
      this.payload = this.accessToken ? jwtDecode(this.accessToken) : null;
    } catch (_) {_;}

    this.exp = this.payload ? parseInt(this.payload.exp, 10) : NaN;

    this.hasDataStored = true;

    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      idToken: this.idToken,
      payload: this.payload,
      exp: this.exp
    };
  }

  getTokenFromResponse(response, tokenProp, tokenName, tokenRoot) {
    if (!response) return undefined;

    const responseTokenProp = tokenProp.split('.').reduce((o, x) => o[x], response);

    if (typeof responseTokenProp === 'string') {
      return responseTokenProp;
    }

    if (typeof responseTokenProp === 'object') {
      const tokenRootData = tokenRoot && tokenRoot.split('.').reduce((o, x) => o[x], responseTokenProp);
      const token = tokenRootData ? tokenRootData[tokenName] : responseTokenProp[tokenName];

      if (!token) throw new Error('Token not found in response');

      return token;
    }

    const token = response[tokenName] === undefined ? null : response[tokenName];

    if (!token) throw new Error('Token not found in response');

    return token;
  }


  toUpdateTokenCallstack() {
    return new Promise(resolve => this.updateTokenCallstack.push(resolve));
  }

  resolveUpdateTokenCallstack(response) {
    this.updateTokenCallstack.map(resolve => resolve(response));
    this.updateTokenCallstack = [];
  }


  /**
   * Authenticate with third-party
   *
   * @param {String}    name of the provider
   * @param {[{}]}      [userData]
   *
   * @return {Promise<response>}
   */
  authenticate(name, userData = {}) {
    let oauthType = this.config.providers[name].type;

    if (oauthType) {
      LogManager.getLogger('authentication').warn('DEPRECATED: Setting provider.type is deprecated and replaced by provider.oauthType');
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

  redirect(redirectUrl, defaultRedirectUrl) {
    // stupid rule to keep it BC
    if (redirectUrl === true) {
      LogManager.getLogger('authentication').warn('DEPRECATED: Setting redirectUrl === true to actually *not redirect* is deprecated. Set redirectUrl === 0 instead.');
      return;
    }
    // stupid rule to keep it BC
    if (redirectUrl === false) {
      LogManager.getLogger('authentication').warn('BREAKING CHANGE: Setting redirectUrl === false to actually *do redirect* is deprecated. Set redirectUrl to undefined or null to use the defaultRedirectUrl if so desired.');
    }
    // BC hack. explicit 0 means don't redirect. false will be added later and 0 deprecated
    if (redirectUrl === 0) {
      return;
    }
    if (typeof redirectUrl === 'string') {
      PLATFORM.location.href = encodeURI(redirectUrl);
    } else if (defaultRedirectUrl) {
      PLATFORM.location.href = defaultRedirectUrl;
    }
  }
}

@inject(Authentication, BaseConfig, BindingSignaler, EventAggregator)
export class AuthService {
  /**
   * The Authentication instance that handles the token
   *
   * @param  {Authentication}
   */
  authentication;

  /**
   * The Config instance that contains the current configuration setting
   *
   * @param  {Config}
   */
  config;

  /**
   * The current login status
   *
   * @param  {Boolean}
   */
  authenticated  = false;

  /**
   * The currently set timeoutID
   *
   * @param  {Number}
   */
  timeoutID = 0;

  /**
   *  Create an AuthService instance
   *
   * @param  {Authentication}  authentication  The Authentication instance to be used
   * @param  {Config}          config          The Config instance to be used
   * @param  {BindingSignaler} bindingSignaler The BindingSignaler instance to be used
   * @param  {EventAggregator} eventAggregator The EventAggregator instance to be used
   */
  constructor(authentication, config, bindingSignaler, eventAggregator) {
    this.authentication  = authentication;
    this.config          = config;
    this.bindingSignaler = bindingSignaler;
    this.eventAggregator = eventAggregator;

    // get token stored in previous format over
    const oldStorageKey = config.tokenPrefix
                        ? config.tokenPrefix + '_' + config.tokenName
                        : config.tokenName;
    const oldToken = authentication.storage.get(oldStorageKey);

    if (oldToken) {
      LogManager.getLogger('authentication').info('Found token with deprecated format in storage. Converting it to new format. No further action required.');
      let fakeOldResponse = {};
      fakeOldResponse[config.accessTokenProp] = oldToken;
      this.setResponseObject(fakeOldResponse);
      authentication.storage.remove(oldStorageKey);
    }

    // initialize status by resetting if existing stored responseObject
    this.setResponseObject(this.authentication.getResponseObject());
  }

  /**
   * Getter: The configured client for all aurelia-authentication requests
   *
   * @return {HttpClient}
   */
  get client() {
    return this.config.client;
  }

  get auth() {
    LogManager.getLogger('authentication').warn('AuthService.auth is deprecated. Use .authentication instead.');
    return this.authentication;
  }

  /**
   * Sets the login timeout
   *
   * @param  {Number} ttl  Timeout time in ms
   */
  setTimeout(ttl) {
    this.clearTimeout();

    this.timeoutID = PLATFORM.global.setTimeout(() => {
      if (this.config.autoUpdateToken
        && this.authentication.getAccessToken()
        && this.authentication.getRefreshToken()) {
        this.updateToken();
      } else {
        this.logout(this.config.expiredRedirect);
      }
    }, ttl);
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
   * @param {Object} response The servers response as GOJO
   */
  setResponseObject(response) {
    this.clearTimeout();

    this.authentication.setResponseObject(response);

    let wasAuthenticated = this.authenticated;
    this.authenticated = this.authentication.isAuthenticated();

    if (this.authenticated && !Number.isNaN(this.authentication.exp)) {
      this.setTimeout(this.getTtl() * 1000);
    }

    if (wasAuthenticated !== this.authenticated) {
      this.bindingSignaler.signal('authentication-change');
      this.eventAggregator.publish('authentication-change', this.authenticated);

      LogManager.getLogger('authentication').info(`Authorization changed to: ${this.authenticated}`);
    }
  }

  /**
   * Get current user profile from server
   *
   * @param {[{}|number|string]}  [criteriaOrId object or a Number|String converted to {id: criteriaOrId}]
   *
   * @return {Promise<response>}
   */
  getMe(criteriaOrId) {
    if (typeof criteriaOrId === 'string' || typeof criteriaOrId === 'number') {
      criteriaOrId = {id: criteriaOrId};
    }
    return this.client.find(this.config.joinBase(this.config.profileUrl), criteriaOrId);
  }

  /**
   * Send current user profile update to server

   * @param {any}                 Request body with data.
   * @param {[{}|Number|String]}  [criteriaOrId object or a Number|String converted to {id: criteriaOrId}]
   *
   * @return {Promise<response>}
   */
  updateMe(body, criteriaOrId) {
    if (typeof criteriaOrId === 'string' || typeof criteriaOrId === 'number') {
      criteriaOrId = { id: criteriaOrId };
    }
    if (this.config.profileMethod === 'put') {
      return this.client.update(this.config.joinBase(this.config.profileUrl), criteriaOrId, body);
    }
    return this.client.patch(this.config.joinBase(this.config.profileUrl), criteriaOrId, body);
  }

  /**
   * Get accessToken from storage
   *
   * @returns {String} Current accessToken
   */
  getAccessToken() {
    return this.authentication.getAccessToken();
  }

  @deprecated({message: 'Use .getAccessToken() instead.'})
  getCurrentToken() {
    return this.getAccessToken();
  }

  /**
   * Get refreshToken from storage
   *
   * @returns {String} Current refreshToken
   */
  getRefreshToken() {
    return this.authentication.getRefreshToken();
  }

  getIdToken() {
      return this.authentication.getIdToken();
  }

 /**
  * Gets authentication status
  *
  * @returns {Boolean} For Non-JWT and unexpired JWT: true, else: false
  */
  isAuthenticated() {
    let authenticated = this.authentication.isAuthenticated();

    // auto-update token?
    if (!authenticated
      && this.config.autoUpdateToken
      && this.authentication.getAccessToken()
      && this.authentication.getRefreshToken()) {
      this.updateToken();
      authenticated = true;
    }

    return authenticated;
  }

  /**
   * Gets exp in milliseconds
   *
   * @returns {Number} Exp for JWT tokens, NaN for all other tokens
   */
  getExp() {
    return this.authentication.getExp();
  }

  /**
   * Gets ttl in seconds
   *
   * @returns {Number} Ttl for JWT tokens, NaN for all other tokens
   */
  getTtl() {
    return this.authentication.getTtl();
  }

 /**
  * Gets exp from token payload and compares to current time
  *
  * @returns {Boolean} Returns (ttl > 0)? for JWT, undefined other tokens
  */
  isTokenExpired() {
    return this.authentication.isTokenExpired();
  }

  /**
  * Get payload from tokens
  *
  * @returns {Object} Payload for JWT, else null
  */
  getTokenPayload() {
    return this.authentication.getPayload();
  }

  /**
   * Request new accesss token
   *
   * @returns {Promise<Response>} Requests new token. can be called multiple times
   */
  updateToken() {
    if (!this.authentication.getRefreshToken()) {
      return Promise.reject(new Error('refreshToken not set'));
    }

    if (this.authentication.updateTokenCallstack.length === 0) {
      const content = {
        grant_type: 'refresh_token',
        refresh_token: this.authentication.getRefreshToken(),
        client_id: this.config.clientId ? this.config.clientId : undefined
      };

      this.client.post(this.config.joinBase(this.config.refreshTokenUrl
                                            ? this.config.refreshTokenUrl
                                            : this.config.loginUrl), content)
        .then(response => {
          this.setResponseObject(response);
          this.authentication.resolveUpdateTokenCallstack(this.isAuthenticated());
        })
        .catch(err => {
          this.setResponseObject(null);
          this.authentication.resolveUpdateTokenCallstack(Promise.reject(err));
        });
    }

    return this.authentication.toUpdateTokenCallstack();
  }

  /**
   * Signup locally. Login and redirect depending on config
   *
   * @param {String|{}}   displayNameOrCredentials displayName | object with signup data.
   * @param {[String]|{}} emailOrOptions           [email | options for post request]
   * @param {[String]}    passwordOrRedirectUri    [password | optional redirectUri overwrite]
   * @param {[{}]}        options                  [options]
   * @param {[String]}    redirectUri              [optional redirectUri overwrite]
   *
   * @return {Promise<Object>|Promise<Error>}     Server response as Object
   */
  signup(displayNameOrCredentials, emailOrOptions, passwordOrRedirectUri, options, redirectUri) {
    let content;

    if (typeof arguments[0] === 'object') {
      content = arguments[0];
      options = arguments[1];
      redirectUri = arguments[2];
    } else {
      content = {
        'displayName': displayNameOrCredentials,
        'email': emailOrOptions,
        'password': passwordOrRedirectUri
      };
    }
    return this.client.post(this.config.joinBase(this.config.signupUrl), content, options)
      .then(response => {
        if (this.config.loginOnSignup) {
          this.setResponseObject(response);
        }
        this.authentication.redirect(redirectUri, this.config.signupRedirect);

        return response;
      });
  }

  /**
   * login locally. Redirect depending on config
   *
   * @param {[String]|{}} emailOrCredentials      email | object with signup data.
   * @param {[String]}    [passwordOrOptions]     [password | options for post request]
   * @param {[{}]}        [optionsOrRedirectUri]  [options | redirectUri overwrite]]
   * @param {[String]}    [redirectUri]           [optional redirectUri overwrite]
   *
   * @return {Promise<Object>|Promise<Error>}    Server response as Object
   */
  login(emailOrCredentials, passwordOrOptions, optionsOrRedirectUri, redirectUri) {
    let content;

    if (typeof arguments[0] === 'object') {
      content             = arguments[0];
      optionsOrRedirectUri = arguments[1];
      redirectUri         = arguments[2];
    } else {
      content = {
        'email': emailOrCredentials,
        'password': passwordOrOptions
      };
      optionsOrRedirectUri = optionsOrRedirectUri;
    }

    if (this.config.clientId) {
      content.client_id = this.config.clientId;
    }

    return this.client.post(this.config.joinBase(this.config.loginUrl), content, optionsOrRedirectUri)
      .then(response => {
        this.setResponseObject(response);

        this.authentication.redirect(redirectUri, this.config.loginRedirect);

        return response;
      });
  }

  /**
   * logout locally and redirect to redirectUri (if set) or redirectUri of config. Sends logout request first, if set in config
   *
   * @param {[String]}    [redirectUri]                      [optional redirectUri overwrite]
   *
   * @return {Promise<>|Promise<Object>|Promise<Error>}     Server response as Object
   */
  logout(redirectUri) {
    let localLogout = response => new Promise(resolve => {
      this.setResponseObject(null);

      this.authentication.redirect(redirectUri, this.config.logoutRedirect);

      if (typeof this.onLogout === 'function') {
        this.onLogout(response);
      }

      resolve(response);
    });
    
    return (this.config.logoutUrl
      ? this.client.request(this.config.logoutMethod, this.config.joinBase(this.config.logoutUrl)).then(localLogout)
      : localLogout());
  }

  /**
   * Authenticate with third-party and redirect to redirectUri (if set) or redirectUri of config
   *
   * @param {String}    name          Name of the provider
   * @param {[String]}  [redirectUri] [optional redirectUri overwrite]
   * @param {[{}]}      [userData]    [optional userData for the local authentication server]
   *
   * @return {Promise<Object>|Promise<Error>}     Server response as Object
   */
  authenticate(name, redirectUri, userData = {}) {
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
   * @param {String}      name                  Name of the provider
   *
   * @return {Promise<Object>|Promise<Error>}  Server response as Object
   */
  unlink(name, redirectUri) {
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
  constructor(authService) {
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
      return next.cancel(new Redirect( this.authService.config.loginRedirect ));
    }

    return next();
  }
}

@inject(AuthService)
export class AuthorizeStep {
  constructor(authService) {
    LogManager.getLogger('authentication').warn('AuthorizeStep is deprecated. Use AuthenticationStep instead.');

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
      return next.cancel(new Redirect( this.authService.config.loginRedirect ));
    }

    return next();
  }
}

@inject(HttpClient, Config, AuthService, BaseConfig)
export class FetchConfig {
  /**
   * Construct the FetchConfig
   *
   * @param {HttpClient} httpClient
   * @param {Config} clientConfig
   * @param {Authentication} authService
   * @param {BaseConfig} config
   */
  constructor(httpClient, clientConfig, authService, config) {
    this.httpClient   = httpClient;
    this.clientConfig = clientConfig;
    this.authService  = authService;
    this.config       = config;
  }

  /**
   * Interceptor for HttpClient
   *
   * @return {{request: Function, response: Function}}
   */
  get interceptor() {
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
          if (response.ok) {
            return resolve(response);
          }
          if (response.status !== 401) {
            return resolve(response);
          }
          if (!this.config.httpInterceptor || !this.authService.isTokenExpired()) {
            return resolve(response);
          }
          if (!this.config.useRefreshToken || !this.authService.getRefreshToken()) {
            return resolve(response);
          }

          return this.authService.updateToken().then(() => {
            let token = this.authService.getAccessToken();

            if (this.config.authTokenType) {
              token = `${this.config.authTokenType} ${token}`;
            }

            request.headers.set(this.config.authHeader, token);

            return this.client.fetch(request).then(resolve);
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
   * @return {HttpClient[]}
   */
  configure(client) {
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

// added for easy jspm bundling
// eslint-disable-line no-unused-vars
// eslint-disable-line no-unused-vars
// eslint-disable-line no-unused-vars

/**
 * Configure the plugin.
 *
 * @param {{globalResources: Function, container: {Container}}} aurelia
 * @param {{}|Function}                                         config
 */
export function configure(aurelia, config) {
  // ie9 polyfill
  if (!PLATFORM.location.origin) {
    PLATFORM.location.origin = PLATFORM.location.protocol + '//' + PLATFORM.location.hostname + (PLATFORM.location.port ? ':' + PLATFORM.location.port : '');
  }

  const baseConfig = aurelia.container.get(BaseConfig);

  if (typeof config === 'function') {
    config(baseConfig);
  } else if (typeof config === 'object') {
    baseConfig.configure(config);
  }

  // after baseConfig was configured
  for (let converter of baseConfig.globalValueConverters) {
    aurelia.globalResources(`./${converter}`);
    LogManager.getLogger('authentication').info(`Add globalResources value-converter: ${converter}`);
  }
  const fetchConfig  = aurelia.container.get(FetchConfig);
  const clientConfig = aurelia.container.get(Config);

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
    client = new Rest(aurelia.container.get(HttpClient));
  }

  // Set the client on the config, for use throughout the plugin.
  baseConfig.client = client;
}
