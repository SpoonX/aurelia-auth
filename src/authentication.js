/// <reference path="../test/oAuth2.spec.js" />
import {PLATFORM} from 'aurelia-pal';
import {buildQueryString} from 'aurelia-path';
import {inject} from 'aurelia-dependency-injection';
import {deprecated} from 'aurelia-metadata';
import jwtDecode from 'jwt-decode';
import * as LogManager from 'aurelia-logging';
import {BaseConfig}  from './baseConfig';
import {Storage} from './storage';
import {OAuth1} from './oAuth1';
import {OAuth2} from './oAuth2';
import {AuthLock} from './authLock';

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

  get responseObject() {
    LogManager.getLogger('authentication').warn('Getter Authentication.responseObject is deprecated. Use Authentication.getResponseObject() instead.');
    return this.getResponseObject();
  }

  set responseObject(response) {
    LogManager.getLogger('authentication').warn('Setter Authentication.responseObject is deprecated. Use AuthServive.setResponseObject(response) instead.');
    this.setResponseObject(response);
  }

  get hasDataStored() {
    LogManager.getLogger('authentication').warn('Authentication.hasDataStored is deprecated. Use Authentication.responseAnalyzed instead.');
    return this.responseAnalyzed;
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

    this.accessToken      = null;
    this.refreshToken     = null;
    this.idToken          = null;
    this.payload          = null;
    this.exp              = null;
    this.responseAnalyzed = false;

    this.storage.remove(this.config.storageKey);
  }


  /* get data, update if needed first */

  getAccessToken() {
    if (!this.responseAnalyzed) {
      this.getDataFromResponse(this.getResponseObject());
    }

    return this.accessToken;
  }

  getRefreshToken() {
    if (!this.responseAnalyzed) {
      this.getDataFromResponse(this.getResponseObject());
    }

    return this.refreshToken;
  }

  getIdToken() {
    if (!this.responseAnalyzed) {
      this.getDataFromResponse(this.getResponseObject());
    }

    return this.idToken;
  }

  getPayload() {
    if (!this.responseAnalyzed) {
      this.getDataFromResponse(this.getResponseObject());
    }

    return this.payload;
  }

  getExp() {
    if (!this.responseAnalyzed) {
      this.getDataFromResponse(this.getResponseObject());
    }

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

    if (isTokenExpired === undefined ) {
      return this.accessToken ? true : false;
    }

    return !isTokenExpired;
  }


  /* get and set from response */

  getDataFromResponse(response) {
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

        LogManager.getLogger('authentication').warn('useRefreshToken is set, but could not extract a refresh token');
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
    } catch (_) {_;}

    // get exp either with from jwt or with supplied function
    this.exp = typeof this.config.getExpirationDateFromResponse === 'function'
            ? this.config.getExpirationDateFromResponse(response)
            : (this.payload && parseInt(this.payload.exp, 10)) ||  NaN;

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
    if (!response) {
      return undefined;
    }

    const responseTokenProp = tokenProp.split('.').reduce((o, x) => o[x], response);

    if (typeof responseTokenProp === 'string') {
      return responseTokenProp;
    }

    if (typeof responseTokenProp === 'object') {
      const tokenRootData = tokenRoot && tokenRoot.split('.').reduce((o, x) => o[x], responseTokenProp);
      const token = tokenRootData ? tokenRootData[tokenName] : responseTokenProp[tokenName];

      if (!token) {
        throw new Error('Token not found in response');
      }

      return token;
    }

    const token = response[tokenName] === undefined ? null : response[tokenName];

    if (!token) {
      throw new Error('Token not found in response');
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

  logout(name) {
    let rtnValue = Promise.resolve('Not Applicable');
    if (this.config.providers[name].oauthType !== '2.0' || !this.config.providers[name].logoutEndpoint) {
      return rtnValue;
    }
    return this.oAuth2.close(this.config.providers[name]);
  }

  redirect(redirectUrl, defaultRedirectUrl, query) {
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
      PLATFORM.location.href = encodeURI(redirectUrl + (query ? `?${buildQueryString(query)}` : ''));
    } else if (defaultRedirectUrl) {
      PLATFORM.location.href = defaultRedirectUrl + (query ? `?${buildQueryString(query)}` : '');
    }
  }
}
