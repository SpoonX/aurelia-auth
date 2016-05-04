import {inject} from 'aurelia-dependency-injection';
import {deprecated} from 'aurelia-metadata';
import * as LogManager from 'aurelia-logging';

import {BaseConfig}  from './baseConfig';
import {Storage} from './storage';
import {OAuth1} from './oAuth1';
import {OAuth2} from './oAuth2';

@inject(Storage, BaseConfig, OAuth1, OAuth2)
export class Authentication {
  constructor(storage, config, oAuth1, oAuth2) {
    this.storage              = storage;
    this.config               = config;
    this.oAuth1               = oAuth1;
    this.oAuth2               = oAuth2;
    this.updateTokenCallstack = [];
    this.accessToken          = null;
    this.refreshToken         = null;
    this.payload              = null;
    this.exp                  = null;
    this.hasDataStored        = false;

    // get token stored in previous format over
    const oldStorageKey = config.tokenPrefix
                        ? config.tokenPrefix + '_' + config.tokenName
                        : this.tokenName;
    const oldToken = storage.get(oldStorageKey);

    if (oldToken) {
      LogManager.getLogger('authentication').info('Found token with deprecated format in storage. Converting it to new format. No further action required.');
      let fakeOldResponse = {};
      fakeOldResponse[config.accessTokenProp] = oldToken;
      this.responseObject = fakeOldResponse;
      storage.remove(oldStorageKey);
    }
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

  @deprecated({message: 'Use baseConfig.withBase(baseConfig.loginUrl) instead.'})
  getLoginUrl() {
    return this.config.withBase(this.config.loginUrl);
  }

  @deprecated({message: 'Use baseConfig.withBase(baseConfig.signupUrl) instead.'})
  getSignupUrl() {
    return this.config.withBase(this.config.signupUrl);
  }

  @deprecated({message: 'Use baseConfig.withBase(baseConfig.profileUrl) instead.'})
  getProfileUrl() {
    return this.config.withBase(this.config.profileUrl);
  }

  @deprecated({message: 'Use .getAccessToken() instead.'})
  getToken() {
    return this.getAccessToken();
  }

  /* getters/setters for responseObject */

  get responseObject() {
    return JSON.parse(this.storage.get(this.config.storageKey || {}));
  }

  set responseObject(response) {
    if (response) {
      this.getDataFromResponse(response);
      return this.storage.set(this.config.storageKey, JSON.stringify(response));
    }
    this.deleteData();
    return this.storage.remove(this.config.storageKey);
  }


  /* get data, update if needed first */

  getAccessToken() {
    if (!this.hasDataStored) this.getDataFromResponse(this.responseObject);
    return this.accessToken;
  }

  getRefreshToken() {
    if (!this.hasDataStored) this.getDataFromResponse(this.responseObject);
    return this.refreshToken;
  }

  getPayload() {
    if (!this.hasDataStored) this.getDataFromResponse(this.responseObject);
    return this.payload;
  }

  getExp() {
    if (!this.hasDataStored) this.getDataFromResponse(this.responseObject);
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

    let payload = null;

    if (this.accessToken && this.accessToken.split('.').length === 3) {
      try {
        const base64 = this.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));
      } catch (e) {
        payload = null;
      }
    }

    this.payload = payload || response;

    this.exp = NaN;
    if (this.payload) {
      const exp = this.payload[this.config.accessTokenExpProp];
      this.exp =  Number(new Date(exp));
      this.exp = this.exp ? this.exp : parseInt(exp, 10);
    }

    this.hasDataStored = true;

    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      payload: this.payload,
      exp: this.exp
    };
  }

  deleteData() {
    this.accessToken = null;
    this.refreshToken = null;
    this.payload = null;
    this.exp = null;

    this.hasDataStored = false;
  }

  getTokenFromResponse(response, tokenProp, tokenName, tokenRoot) {
    if (!response) return undefined;

    const responseTokenProp = response[tokenProp];

    if (typeof responseTokenProp === 'string') {
      return responseTokenProp;
    }

    if (typeof responseTokenProp === 'object') {
      const tokenRootData = tokenRoot && tokenRoot.split('.').reduce(function(o, x) { return o[x]; }, responseTokenProp);
      return tokenRootData ? tokenRootData[tokenName] : responseTokenProp[tokenName];
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
    const provider = this.config.providers[name].type === '1.0' ? this.oAuth1 : this.oAuth2;

    return provider.open(this.config.providers[name], userData);
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
      window.location.href = window.encodeURI(redirectUrl);
    } else if (defaultRedirectUrl) {
      window.location.href = defaultRedirectUrl;
    }
  }
}
