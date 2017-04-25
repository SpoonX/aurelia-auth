/* eslint-disable max-lines */
import {PLATFORM} from 'aurelia-pal';
import {buildQueryString} from 'aurelia-path';
import {inject} from 'aurelia-dependency-injection';
import {deprecated} from 'aurelia-metadata';
import jwtDecode from 'jwt-decode';
import {logger} from './logger';
import {BaseConfig}  from './baseConfig';
import {Storage} from './storage';
import {OAuth1} from './oAuth1';
import {OAuth2} from './oAuth2';
import {AuthLock} from './authLock';

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
