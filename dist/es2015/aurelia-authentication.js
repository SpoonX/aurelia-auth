var _dec, _class2, _dec2, _class3, _dec3, _class4, _dec4, _class5, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class6, _desc, _value, _class7, _dec12, _dec13, _class8, _desc2, _value2, _class9, _dec14, _class11, _dec15, _class12, _dec16, _class13;

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

import extend from 'extend';
import jwtDecode from 'jwt-decode';
import { PLATFORM, DOM } from 'aurelia-pal';
import { parseQueryString, join, buildQueryString } from 'aurelia-path';
import { getLogger } from 'aurelia-logging';
import { inject, Container } from 'aurelia-dependency-injection';
import { deprecated } from 'aurelia-metadata';
import { EventAggregator } from 'aurelia-event-aggregator';
import { BindingSignaler } from 'aurelia-templating-resources';
import { Rest, Config } from 'aurelia-api';
import { Redirect } from 'aurelia-router';
import { HttpClient } from 'aurelia-fetch-client';

import { AuthFilterValueConverter } from "./authFilterValueConverter";
import { AuthenticatedValueConverter } from "./authenticatedValueConverter";
import { AuthenticatedFilterValueConverter } from "./authenticatedFilterValueConverter";

export let Popup = class Popup {
  constructor() {
    this.popupWindow = null;
    this.polling = null;
    this.url = '';
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

        const parser = DOM.createElement('a');

        parser.href = event.url;

        if (parser.search || parser.hash) {
          const qs = parseUrl(parser);

          if (qs.error) {
            reject({ error: qs.error });
          } else {
            resolve(qs);
          }

          this.popupWindow.close();
        }
      });

      this.popupWindow.addEventListener('exit', () => {
        reject({ data: 'Provider Popup was closed' });
      });

      this.popupWindow.addEventListener('loaderror', () => {
        reject({ data: 'Authorization Failed' });
      });
    });
  }

  pollPopup() {
    return new Promise((resolve, reject) => {
      this.polling = PLATFORM.global.setInterval(() => {
        let errorData;

        try {
          if (this.popupWindow.location.host === PLATFORM.global.document.location.host && (this.popupWindow.location.search || this.popupWindow.location.hash)) {
            const qs = parseUrl(this.popupWindow.location);

            if (qs.error) {
              reject({ error: qs.error });
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
};

const buildPopupWindowOptions = options => {
  const width = options.width || 500;
  const height = options.height || 500;

  const extended = extend({
    width: width,
    height: height,
    left: PLATFORM.global.screenX + (PLATFORM.global.outerWidth - width) / 2,
    top: PLATFORM.global.screenY + (PLATFORM.global.outerHeight - height) / 2.5
  }, options);

  let parts = [];

  Object.keys(extended).map(key => parts.push(key + '=' + extended[key]));

  return parts.join(',');
};

const parseUrl = url => {
  let hash = url.hash.charAt(0) === '#' ? url.hash.substr(1) : url.hash;

  return extend(true, {}, parseQueryString(url.search), parseQueryString(hash));
};

export const logger = getLogger('aurelia-authentication');

export let BaseConfig = class BaseConfig {
  constructor() {
    this.client = null;
    this.endpoint = null;
    this.configureEndpoints = null;
    this.loginRedirect = '#/';
    this.logoutRedirect = '#/';
    this.loginRoute = '/login';
    this.loginOnSignup = true;
    this.signupRedirect = '#/login';
    this.expiredRedirect = '#/';
    this.storageChangedRedirect = '#/';
    this.baseUrl = '';
    this.loginUrl = '/auth/login';
    this.logoutUrl = null;
    this.logoutMethod = 'get';
    this.signupUrl = '/auth/signup';
    this.profileUrl = '/auth/me';
    this.profileMethod = 'put';
    this.unlinkUrl = '/auth/unlink/';
    this.unlinkMethod = 'get';
    this.refreshTokenUrl = null;
    this.authHeader = 'Authorization';
    this.authTokenType = 'Bearer';
    this.accessTokenProp = 'access_token';
    this.accessTokenName = 'token';
    this.accessTokenRoot = false;
    this.useRefreshToken = false;
    this.autoUpdateToken = true;
    this.clientId = false;
    this.refreshTokenProp = 'refresh_token';
    this.refreshTokenSubmitProp = 'refresh_token';
    this.refreshTokenName = 'token';
    this.refreshTokenRoot = false;
    this.idTokenProp = 'id_token';
    this.idTokenName = 'token';
    this.idTokenRoot = false;
    this.httpInterceptor = true;
    this.withCredentials = true;
    this.platform = 'browser';
    this.storage = 'localStorage';
    this.storageKey = 'aurelia_authentication';
    this.storageChangedReload = false;
    this.getExpirationDateFromResponse = null;
    this.getAccessTokenFromResponse = null;
    this.getRefreshTokenFromResponse = null;
    this.globalValueConverters = ['authFilterValueConverter'];
    this.providers = {
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
        lockOptions: {},
        responseType: 'token',
        state: randomState
      }
    };
    this._authToken = 'Bearer';
    this._responseTokenProp = 'access_token';
    this._tokenName = 'token';
    this._tokenRoot = false;
    this._tokenPrefix = 'aurelia';
  }

  joinBase(url) {
    return join(this.baseUrl, url);
  }

  configure(incoming) {
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

  set authToken(authToken) {
    logger.warn('BaseConfig.authToken is deprecated. Use BaseConfig.authTokenType instead.');
    this._authTokenType = authToken;
    this.authTokenType = authToken;

    return authToken;
  }
  get authToken() {
    return this._authTokenType;
  }

  set responseTokenProp(responseTokenProp) {
    logger.warn('BaseConfig.responseTokenProp is deprecated. Use BaseConfig.accessTokenProp instead.');
    this._responseTokenProp = responseTokenProp;
    this.accessTokenProp = responseTokenProp;

    return responseTokenProp;
  }
  get responseTokenProp() {
    return this._responseTokenProp;
  }

  set tokenRoot(tokenRoot) {
    logger.warn('BaseConfig.tokenRoot is deprecated. Use BaseConfig.accessTokenRoot instead.');
    this._tokenRoot = tokenRoot;
    this.accessTokenRoot = tokenRoot;

    return tokenRoot;
  }
  get tokenRoot() {
    return this._tokenRoot;
  }

  set tokenName(tokenName) {
    logger.warn('BaseConfig.tokenName is deprecated. Use BaseConfig.accessTokenName instead.');
    this._tokenName = tokenName;
    this.accessTokenName = tokenName;

    return tokenName;
  }
  get tokenName() {
    return this._tokenName;
  }

  set tokenPrefix(tokenPrefix) {
    logger.warn('BaseConfig.tokenPrefix is obsolete. Use BaseConfig.storageKey instead.');
    this._tokenPrefix = tokenPrefix;

    return tokenPrefix;
  }
  get tokenPrefix() {
    return this._tokenPrefix || 'aurelia';
  }

  get current() {
    logger.warn('Getter BaseConfig.current is deprecated. Use BaseConfig directly instead.');

    return this;
  }
  set current(_) {
    throw new Error('Setter BaseConfig.current has been removed. Use BaseConfig directly instead.');
  }

  get _current() {
    logger.warn('Getter BaseConfig._current is deprecated. Use BaseConfig directly instead.');

    return this;
  }
  set _current(_) {
    throw new Error('Setter BaseConfig._current has been removed. Use BaseConfig directly instead.');
  }
};

function randomState() {
  let rand = Math.random().toString(36).substr(2);

  return encodeURIComponent(rand);
}

export let Storage = (_dec = inject(BaseConfig), _dec(_class2 = class Storage {
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
}) || _class2);

export let AuthLock = (_dec2 = inject(Storage, BaseConfig), _dec2(_class3 = class AuthLock {
  constructor(storage, config) {
    this.storage = storage;
    this.config = config;
    this.defaults = {
      name: null,
      state: null,
      scope: null,
      scopeDelimiter: ' ',
      redirectUri: null,
      clientId: null,
      clientDomain: null,
      display: 'popup',
      lockOptions: {},
      popupOptions: null,
      responseType: 'token'
    };
  }

  open(options, userData) {
    if (typeof PLATFORM.global.Auth0Lock !== 'function') {
      throw new Error('Auth0Lock was not found in global scope. Please load it before using this provider.');
    }
    const provider = extend(true, {}, this.defaults, options);
    const stateName = provider.name + '_state';

    if (typeof provider.state === 'function') {
      this.storage.set(stateName, provider.state());
    } else if (typeof provider.state === 'string') {
      this.storage.set(stateName, provider.state);
    }

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
          this.lock.hide();
        }
        resolve({
          access_token: authResponse.idToken
        });
      });
      this.lock.on('unrecoverable_error', err => {
        if (!lockOptions.auth.redirect) {
          this.lock.hide();
        }
        reject(err);
      });
      this.lock.show();
    });

    return openPopup.then(lockResponse => {
      if (provider.responseType === 'token' || provider.responseType === 'id_token%20token' || provider.responseType === 'token%20id_token') {
        return lockResponse;
      }

      throw new Error('Only `token` responseType is supported');
    });
  }
}) || _class3);

export let OAuth1 = (_dec3 = inject(Storage, Popup, BaseConfig), _dec3(_class4 = class OAuth1 {
  constructor(storage, popup, config) {
    this.storage = storage;
    this.config = config;
    this.popup = popup;
    this.defaults = {
      url: null,
      name: null,
      popupOptions: null,
      redirectUri: null,
      authorizationEndpoint: null
    };
  }

  open(options, userData) {
    const provider = extend(true, {}, this.defaults, options);
    const serverUrl = this.config.joinBase(provider.url);

    if (this.config.platform !== 'mobile') {
      this.popup = this.popup.open('', provider.name, provider.popupOptions);
    }

    return this.config.client.post(serverUrl).then(response => {
      const url = provider.authorizationEndpoint + '?' + buildQueryString(response);

      if (this.config.platform === 'mobile') {
        this.popup = this.popup.open(url, provider.name, provider.popupOptions);
      } else {
        this.popup.popupWindow.location = url;
      }

      const popupListener = this.config.platform === 'mobile' ? this.popup.eventListener(provider.redirectUri) : this.popup.pollPopup();

      return popupListener.then(result => this.exchangeForToken(result, userData, provider));
    });
  }

  exchangeForToken(oauthData, userData, provider) {
    const data = extend(true, {}, userData, oauthData);
    const serverUrl = this.config.joinBase(provider.url);
    const credentials = this.config.withCredentials ? 'include' : 'same-origin';

    return this.config.client.post(serverUrl, data, { credentials: credentials });
  }
}) || _class4);

export let OAuth2 = (_dec4 = inject(Storage, Popup, BaseConfig), _dec4(_class5 = class OAuth2 {
  constructor(storage, popup, config) {
    this.storage = storage;
    this.config = config;
    this.popup = popup;
    this.defaults = {
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
    const provider = extend(true, {}, this.defaults, options);
    const stateName = provider.name + '_state';

    if (typeof provider.state === 'function') {
      this.storage.set(stateName, provider.state());
    } else if (typeof provider.state === 'string') {
      this.storage.set(stateName, provider.state);
    }

    const url = provider.authorizationEndpoint + '?' + buildQueryString(this.buildQuery(provider));
    const popup = this.popup.open(url, provider.name, provider.popupOptions);
    const openPopup = this.config.platform === 'mobile' ? popup.eventListener(provider.redirectUri) : popup.pollPopup();

    return openPopup.then(oauthData => {
      if (provider.responseType === 'token' || provider.responseType === 'id_token token' || provider.responseType === 'token id_token') {
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

    const serverUrl = this.config.joinBase(provider.url);
    const credentials = this.config.withCredentials ? 'include' : 'same-origin';

    return this.config.client.post(serverUrl, data, { credentials: credentials });
  }

  buildQuery(provider) {
    let query = {};
    const urlParams = ['defaultUrlParams', 'requiredUrlParams', 'optionalUrlParams'];

    urlParams.forEach(params => {
      (provider[params] || []).forEach(paramName => {
        const camelizedName = camelCase(paramName);
        let paramValue = typeof provider[paramName] === 'function' ? provider[paramName]() : provider[camelizedName];

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

  close(options) {
    const provider = extend(true, {}, this.defaults, options);
    const url = provider.logoutEndpoint + '?' + buildQueryString(this.buildLogoutQuery(provider));
    const popup = this.popup.open(url, provider.name, provider.popupOptions);
    const openPopup = this.config.platform === 'mobile' ? popup.eventListener(provider.postLogoutRedirectUri) : popup.pollPopup();

    return openPopup;
  }

  buildLogoutQuery(provider) {
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
}) || _class5);

function camelCase(name) {
  return name.replace(/([:\-_]+(.))/g, function (_, separator, letter, offset) {
    return offset ? letter.toUpperCase() : letter;
  });
}

export let Authentication = (_dec5 = inject(Storage, BaseConfig, OAuth1, OAuth2, AuthLock), _dec6 = deprecated({ message: 'Use baseConfig.loginRoute instead.' }), _dec7 = deprecated({ message: 'Use baseConfig.loginRedirect instead.' }), _dec8 = deprecated({ message: 'Use baseConfig.joinBase(baseConfig.loginUrl) instead.' }), _dec9 = deprecated({ message: 'Use baseConfig.joinBase(baseConfig.signupUrl) instead.' }), _dec10 = deprecated({ message: 'Use baseConfig.joinBase(baseConfig.profileUrl) instead.' }), _dec11 = deprecated({ message: 'Use .getAccessToken() instead.' }), _dec5(_class6 = (_class7 = class Authentication {
  constructor(storage, config, oAuth1, oAuth2, auth0Lock) {
    this.storage = storage;
    this.config = config;
    this.oAuth1 = oAuth1;
    this.oAuth2 = oAuth2;
    this.auth0Lock = auth0Lock;
    this.updateTokenCallstack = [];
    this.accessToken = null;
    this.refreshToken = null;
    this.idToken = null;
    this.payload = null;
    this.exp = null;
    this.responseAnalyzed = false;
  }

  getLoginRoute() {
    return this.config.loginRoute;
  }

  getLoginRedirect() {
    return this.config.loginRedirect;
  }

  getLoginUrl() {
    return this.Config.joinBase(this.config.loginUrl);
  }

  getSignupUrl() {
    return this.Config.joinBase(this.config.signupUrl);
  }

  getProfileUrl() {
    return this.Config.joinBase(this.config.profileUrl);
  }

  getToken() {
    return this.getAccessToken();
  }

  get responseObject() {
    logger.warn('Getter Authentication.responseObject is deprecated. Use Authentication.getResponseObject() instead.');

    return this.getResponseObject();
  }

  set responseObject(response) {
    logger.warn('Setter Authentication.responseObject is deprecated. Use AuthServive.setResponseObject(response) instead.');
    this.setResponseObject(response);
  }

  get hasDataStored() {
    logger.warn('Authentication.hasDataStored is deprecated. Use Authentication.responseAnalyzed instead.');

    return this.responseAnalyzed;
  }

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
    this.responseAnalyzed = false;

    this.storage.remove(this.config.storageKey);
  }

  getAccessToken() {
    if (!this.responseAnalyzed) this.getDataFromResponse(this.getResponseObject());

    return this.accessToken;
  }

  getRefreshToken() {
    if (!this.responseAnalyzed) this.getDataFromResponse(this.getResponseObject());

    return this.refreshToken;
  }

  getIdToken() {
    if (!this.responseAnalyzed) this.getDataFromResponse(this.getResponseObject());

    return this.idToken;
  }

  getPayload() {
    if (!this.responseAnalyzed) this.getDataFromResponse(this.getResponseObject());

    return this.payload;
  }

  getExp() {
    if (!this.responseAnalyzed) this.getDataFromResponse(this.getResponseObject());

    return this.exp;
  }

  getTtl() {
    const exp = this.getExp();

    return Number.isNaN(exp) ? NaN : exp - Math.round(new Date().getTime() / 1000);
  }

  isTokenExpired() {
    const timeLeft = this.getTtl();

    return Number.isNaN(timeLeft) ? undefined : timeLeft < 0;
  }

  isAuthenticated() {
    return !!this.getAccessToken() && !this.isTokenExpired();
  }

  getDataFromResponse(response) {
    const config = this.config;

    this.accessToken = typeof this.config.getAccessTokenFromResponse === 'function' ? this.config.getAccessTokenFromResponse(response) : this.getTokenFromResponse(response, config.accessTokenProp, config.accessTokenName, config.accessTokenRoot);

    this.refreshToken = null;
    if (config.useRefreshToken) {
      try {
        this.refreshToken = typeof this.config.getRefreshTokenFromResponse === 'function' ? this.config.getRefreshTokenFromResponse(response) : this.getTokenFromResponse(response, config.refreshTokenProp, config.refreshTokenName, config.refreshTokenRoot);
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
    } catch (_) {}
    this.exp = parseInt(typeof this.config.getExpirationDateFromResponse === 'function' ? this.config.getExpirationDateFromResponse(response) : this.payload && this.payload.exp, 10) || NaN;

    this.responseAnalyzed = true;

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

      if (!token) {
        let error = new Error('Token not found in response');

        error.responseObject = response;
        throw error;
      }

      return token;
    }

    const token = response[tokenName] === undefined ? null : response[tokenName];

    if (!token) {
      let error = new Error('Token not found in response');

      error.responseObject = response;
      throw error;
    }

    return token;
  }

  toUpdateTokenCallstack() {
    return new Promise(resolve => this.updateTokenCallstack.push(resolve));
  }

  resolveUpdateTokenCallstack(response) {
    this.updateTokenCallstack.map(resolve => resolve(response));
    this.updateTokenCallstack = [];
  }

  authenticate(name, userData = {}) {
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
      providerLogin = oauthType === '1.0' ? this.oAuth1 : this.oAuth2;
    }

    return providerLogin.open(this.config.providers[name], userData);
  }

  logout(name) {
    let rtnValue = Promise.resolve('Not Applicable');

    if (this.config.providers[name].oauthType !== '2.0' || !this.config.providers[name].logoutEndpoint) {
      return rtnValue;
    }

    return this.oAuth2.close(this.config.providers[name]);
  }

  redirect(redirectUrl, defaultRedirectUrl, query) {
    if (redirectUrl === true) {
      logger.warn('DEPRECATED: Setting redirectUrl === true to actually *not redirect* is deprecated. Set redirectUrl === \'\' instead.');

      return;
    }

    if (redirectUrl === false) {
      logger.warn('BREAKING CHANGE: Setting redirectUrl === false to actually *do redirect* is deprecated. Set redirectUrl to undefined or null to use the defaultRedirectUrl if so desired.');
    }

    if (redirectUrl === 0) {
      logger.warn('BREAKING CHANGE: Setting redirectUrl === 0 is deprecated. Set redirectUrl to \'\' instead.');

      return;
    }

    if (redirectUrl === '') {
      return;
    }

    if (typeof redirectUrl === 'string') {
      PLATFORM.location.href = encodeURI(redirectUrl + (query ? `?${ buildQueryString(query) }` : ''));
    } else if (defaultRedirectUrl) {
      PLATFORM.location.href = defaultRedirectUrl + (query ? `?${ buildQueryString(query) }` : '');
    }
  }
}, (_applyDecoratedDescriptor(_class7.prototype, 'getLoginRoute', [_dec6], Object.getOwnPropertyDescriptor(_class7.prototype, 'getLoginRoute'), _class7.prototype), _applyDecoratedDescriptor(_class7.prototype, 'getLoginRedirect', [_dec7], Object.getOwnPropertyDescriptor(_class7.prototype, 'getLoginRedirect'), _class7.prototype), _applyDecoratedDescriptor(_class7.prototype, 'getLoginUrl', [_dec8], Object.getOwnPropertyDescriptor(_class7.prototype, 'getLoginUrl'), _class7.prototype), _applyDecoratedDescriptor(_class7.prototype, 'getSignupUrl', [_dec9], Object.getOwnPropertyDescriptor(_class7.prototype, 'getSignupUrl'), _class7.prototype), _applyDecoratedDescriptor(_class7.prototype, 'getProfileUrl', [_dec10], Object.getOwnPropertyDescriptor(_class7.prototype, 'getProfileUrl'), _class7.prototype), _applyDecoratedDescriptor(_class7.prototype, 'getToken', [_dec11], Object.getOwnPropertyDescriptor(_class7.prototype, 'getToken'), _class7.prototype)), _class7)) || _class6);

export let AuthService = (_dec12 = inject(Authentication, BaseConfig, BindingSignaler, EventAggregator), _dec13 = deprecated({ message: 'Use .getAccessToken() instead.' }), _dec12(_class8 = (_class9 = class AuthService {
  constructor(authentication, config, bindingSignaler, eventAggregator) {
    this.authenticated = false;
    this.timeoutID = 0;

    this.storageEventHandler = event => {
      if (event.key !== this.config.storageKey || event.newValue === event.oldValue) {
        return;
      }

      if (this.config.autoUpdateToken && this.authentication.getAccessToken() && this.authentication.getRefreshToken()) {
        this.authentication.updateAuthenticated();

        return;
      }

      logger.info('Stored token changed event');

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
    };

    this.authentication = authentication;
    this.config = config;
    this.bindingSignaler = bindingSignaler;
    this.eventAggregator = eventAggregator;

    const oldStorageKey = config.tokenPrefix ? `${ config.tokenPrefix }_${ config.tokenName }` : config.tokenName;
    const oldToken = authentication.storage.get(oldStorageKey);

    if (oldToken) {
      logger.info('Found token with deprecated format in storage. Converting it to new format. No further action required.');
      let fakeOldResponse = {};

      fakeOldResponse[config.accessTokenProp] = oldToken;
      this.setResponseObject(fakeOldResponse);
      authentication.storage.remove(oldStorageKey);
    }

    this.setResponseObject(this.authentication.getResponseObject());

    PLATFORM.addEventListener('storage', this.storageEventHandler);
  }

  get client() {
    return this.config.client;
  }

  get auth() {
    logger.warn('AuthService.auth is deprecated. Use .authentication instead.');

    return this.authentication;
  }

  setTimeout(ttl) {
    this.clearTimeout();

    const expiredTokenHandler = () => {
      if (this.config.autoUpdateToken && this.authentication.getAccessToken() && this.authentication.getRefreshToken()) {
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

  clearTimeout() {
    if (this.timeoutID) {
      PLATFORM.global.clearTimeout(this.timeoutID);
    }
    this.timeoutID = 0;
  }

  setResponseObject(response) {
    this.authentication.setResponseObject(response);

    this.updateAuthenticated();
  }

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

      logger.info(`Authorization changed to: ${ this.authenticated }`);
    }
  }

  getMe(criteriaOrId) {
    if (typeof criteriaOrId === 'string' || typeof criteriaOrId === 'number') {
      criteriaOrId = { id: criteriaOrId };
    }

    return this.client.find(this.config.joinBase(this.config.profileUrl), criteriaOrId);
  }

  updateMe(body, criteriaOrId) {
    if (typeof criteriaOrId === 'string' || typeof criteriaOrId === 'number') {
      criteriaOrId = { id: criteriaOrId };
    }
    if (this.config.profileMethod === 'put') {
      return this.client.update(this.config.joinBase(this.config.profileUrl), criteriaOrId, body);
    }

    return this.client.patch(this.config.joinBase(this.config.profileUrl), criteriaOrId, body);
  }

  getAccessToken() {
    return this.authentication.getAccessToken();
  }

  getCurrentToken() {
    return this.getAccessToken();
  }

  getRefreshToken() {
    return this.authentication.getRefreshToken();
  }

  getIdToken() {
    return this.authentication.getIdToken();
  }

  isAuthenticated(callback) {
    this.authentication.responseAnalyzed = false;

    let authenticated = this.authentication.isAuthenticated();

    if (!authenticated && this.config.autoUpdateToken && this.authentication.getAccessToken() && this.authentication.getRefreshToken()) {
      this.updateToken().then(() => {
        if (typeof callback === 'function') {
          callback(this.authenticated);
        }
      }).catch(error => logger.warn(error.message));

      authenticated = true;
    } else if (typeof callback === 'function') {
      PLATFORM.global.setTimeout(() => {
        try {
          callback(authenticated);
        } catch (error) {
          logger.warn(error.message);
        }
      }, 1);
    }

    return authenticated;
  }

  getExp() {
    return this.authentication.getExp();
  }

  getTtl() {
    return this.authentication.getTtl();
  }

  isTokenExpired() {
    return this.authentication.isTokenExpired();
  }

  getTokenPayload() {
    return this.authentication.getPayload();
  }

  updateToken() {
    if (!this.authentication.getRefreshToken()) {
      return Promise.reject(new Error('refreshToken not set'));
    }

    if (this.authentication.updateTokenCallstack.length === 0) {
      let content = {
        grant_type: 'refresh_token',
        client_id: this.config.clientId ? this.config.clientId : undefined
      };

      content[this.config.refreshTokenSubmitProp] = this.authentication.getRefreshToken();

      this.client.post(this.config.joinBase(this.config.refreshTokenUrl ? this.config.refreshTokenUrl : this.config.loginUrl), content).then(response => {
        this.setResponseObject(response);
        this.authentication.resolveUpdateTokenCallstack(this.isAuthenticated());
      }).catch(error => {
        this.setResponseObject(null);
        this.authentication.resolveUpdateTokenCallstack(Promise.reject(error));
      });
    }

    return this.authentication.toUpdateTokenCallstack();
  }

  signup(displayNameOrCredentials, emailOrOptions, passwordOrRedirectUri, options, redirectUri) {
    let normalized = {};

    if (typeof displayNameOrCredentials === 'object') {
      normalized.credentials = displayNameOrCredentials;
      normalized.options = emailOrOptions;
      normalized.redirectUri = passwordOrRedirectUri;
    } else {
      normalized.credentials = {
        'displayName': displayNameOrCredentials,
        'email': emailOrOptions,
        'password': passwordOrRedirectUri
      };
      normalized.options = options;
      normalized.redirectUri = redirectUri;
    }

    return this.client.post(this.config.joinBase(this.config.signupUrl), normalized.credentials, normalized.options).then(response => {
      if (this.config.loginOnSignup) {
        this.setResponseObject(response);
      }
      this.authentication.redirect(normalized.redirectUri, this.config.signupRedirect);

      return response;
    });
  }

  login(emailOrCredentials, passwordOrOptions, optionsOrRedirectUri, redirectUri) {
    let normalized = {};

    if (typeof emailOrCredentials === 'object') {
      normalized.credentials = emailOrCredentials;
      normalized.options = passwordOrOptions;
      normalized.redirectUri = optionsOrRedirectUri;
    } else if (typeof emailOrCredentials === 'string') {
      normalized.credentials = {
        'email': emailOrCredentials,
        'password': passwordOrOptions
      };
      normalized.options = optionsOrRedirectUri;
      normalized.redirectUri = redirectUri;
    }

    if (this.config.clientId) {
      normalized.credentials.client_id = this.config.clientId;
    }

    return this.client.post(this.config.joinBase(this.config.loginUrl), normalized.credentials, normalized.options).then(response => {
      this.setResponseObject(response);

      this.authentication.redirect(normalized.redirectUri, this.config.loginRedirect);

      return response;
    });
  }

  logout(redirectUri, query, name) {
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
        return this.authentication.logout(name).then(logoutResponse => {
          let stateValue = this.authentication.storage.get(name + '_state');

          if (logoutResponse.state !== stateValue) {
            return Promise.reject('OAuth2 response state value differs');
          }

          return localLogout(logoutResponse);
        });
      }
    } else {
      return this.config.logoutUrl ? this.client.request(this.config.logoutMethod, this.config.joinBase(this.config.logoutUrl)).then(localLogout).catch(localLogout) : localLogout();
    }
  }

  authenticate(name, redirectUri, userData) {
    return this.authentication.authenticate(name, userData).then(response => {
      this.setResponseObject(response);

      this.authentication.redirect(redirectUri, this.config.loginRedirect);

      return response;
    });
  }

  unlink(name, redirectUri) {
    const unlinkUrl = this.config.joinBase(this.config.unlinkUrl) + name;

    return this.client.request(this.config.unlinkMethod, unlinkUrl).then(response => {
      this.authentication.redirect(redirectUri);

      return response;
    });
  }
}, (_applyDecoratedDescriptor(_class9.prototype, 'getCurrentToken', [_dec13], Object.getOwnPropertyDescriptor(_class9.prototype, 'getCurrentToken'), _class9.prototype)), _class9)) || _class8);

export let AuthenticateStep = (_dec14 = inject(AuthService), _dec14(_class11 = class AuthenticateStep {
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
      return next.cancel(new Redirect(this.authService.config.loginRedirect));
    }

    return next();
  }
}) || _class11);

export let AuthorizeStep = (_dec15 = inject(AuthService), _dec15(_class12 = class AuthorizeStep {
  constructor(authService) {
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
}) || _class12);

export let FetchConfig = (_dec16 = inject(HttpClient, Config, AuthService, BaseConfig), _dec16(_class13 = class FetchConfig {
  constructor(httpClient, clientConfig, authService, config) {
    this.httpClient = httpClient;
    this.clientConfig = clientConfig;
    this.authService = authService;
    this.config = config;
  }

  get interceptor() {
    return {
      request: request => {
        if (!this.config.httpInterceptor || !this.authService.isAuthenticated()) {
          return request;
        }
        let token = this.authService.getAccessToken();

        if (this.config.authTokenType) {
          token = `${ this.config.authTokenType } ${ token }`;
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
              token = `${ this.config.authTokenType } ${ token }`;
            }

            request.headers.set(this.config.authHeader, token);

            return this.httpClient.fetch(request).then(resolve);
          });
        });
      }
    };
  }

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
        throw new Error(`There is no '${ client || 'default' }' endpoint registered.`);
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
}) || _class13);

export function configure(frameworkConfig, config) {
  if (!PLATFORM.location.origin) {
    PLATFORM.location.origin = PLATFORM.location.protocol + '//' + PLATFORM.location.hostname + (PLATFORM.location.port ? ':' + PLATFORM.location.port : '');
  }

  const baseConfig = frameworkConfig.container.get(BaseConfig);

  if (typeof config === 'function') {
    config(baseConfig);
  } else if (typeof config === 'object') {
    baseConfig.configure(config);
  }

  for (let converter of baseConfig.globalValueConverters) {
    frameworkConfig.globalResources(`./${ converter }`);
    logger.info(`Add globalResources value-converter: ${ converter }`);
  }
  const fetchConfig = frameworkConfig.container.get(FetchConfig);
  const clientConfig = frameworkConfig.container.get(Config);

  if (Array.isArray(baseConfig.configureEndpoints)) {
    baseConfig.configureEndpoints.forEach(endpointToPatch => {
      fetchConfig.configure(endpointToPatch);
    });
  }

  let client;

  if (baseConfig.endpoint !== null) {
    if (typeof baseConfig.endpoint === 'string') {
      const endpoint = clientConfig.getEndpoint(baseConfig.endpoint);

      if (!endpoint) {
        throw new Error(`There is no '${ baseConfig.endpoint || 'default' }' endpoint registered.`);
      }
      client = endpoint;
    } else if (baseConfig.endpoint instanceof HttpClient) {
      client = new Rest(baseConfig.endpoint);
    }
  }

  if (!(client instanceof Rest)) {
    client = new Rest(frameworkConfig.container.get(HttpClient));
  }

  baseConfig.client = client;
}