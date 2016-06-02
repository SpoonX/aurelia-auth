import {PLATFORM} from 'aurelia-pal';
import {inject} from 'aurelia-dependency-injection';
import {deprecated} from 'aurelia-metadata';
import * as LogManager from 'aurelia-logging';

import {Authentication} from './authentication';
import {BaseConfig} from './baseConfig';

@inject(Authentication, BaseConfig)
export class AuthService {
  /**
   * The Authentication instance that handles the token
   * @type {Authentication}
   */
  authentication;

  /**
   * The Config instance that contains the current configuration setting
   * @type {Config}
   */
  config;

  /**
   * The current login status
   * @type {Boolean}
   */
  authenticated  = false;

  constructor(authentication, config) {
    this.authentication = authentication;
    this.config         = config;

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
   * sets the login timeout
   * @type {Number} timeout time in ms
   */
  setTimeout(ttl) {
    PLATFORM.global.setTimeout(this.timeout, ttl);
  }

  /**
   * clears the login timeout
   */
  clearTimeout() {
    PLATFORM.global.clearTimeout(this.timeout);
  }

  /**
   * refresh or unset authenticated after timeout
   */
  timeout = () => {
    this.clearTimeout();

    if (this.config.autoUpdateToken
      && this.authentication.getAccessToken()
      && this.authentication.getRefreshToken()) {
      this.updateToken();
    } else {
      this.authenticated = false;
    }
  };

  /**
   * Stores and analyses the servers responseObject. Sets loging status and timeout
   * @param {Object} response The servers response as GOJO
   */
  setResponseObject(response) {
    this.clearTimeout();

    this.authentication.setResponseObject(response);

    this.authenticated = this.authentication.isAuthenticated();
    if (this.authenticated && !Number.isNaN(this.authentication.exp)) {
      this.setTimeout(this.getTtl() * 1000);
    }
  }

  /**
   * Get current user profile from server
   *
   * @param {[{}|number|string]}  [criteria object or a Number|String converted to {id:criteria}]
   *
   * @return {Promise<response>}
   */
  getMe(criteria) {
    if (typeof criteria === 'string' || typeof criteria === 'number') {
      criteria = {id: criteria};
    }
    return this.client.find(this.config.joinBase(this.config.profileUrl), criteria);
  }

  /**
   * Send current user profile update to server
   *
   * @param {any}                 request body with data.
   * @param {[{}|Number|String]}  [criteria object or a Number|String converted to {id:criteria}]
   *
   * @return {Promise<response>}
   */
  updateMe(body, criteria) {
    if (typeof criteria === 'string' || typeof criteria === 'number') {
      criteria = { id: criteria };
    }
    if (this.config.profileMethod === 'put') {
      return this.client.update(this.config.joinBase(this.config.profileUrl), criteria, body);
    }
    return this.client.patch(this.config.joinBase(this.config.profileUrl), criteria, body);
  }

  /**
   * Get accessToken from storage
   *
   * @returns {String} current accessToken
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
   * @returns {String} current refreshToken
   */
  getRefreshToken() {
    return this.authentication.getRefreshToken();
  }

 /**
  * Gets authentication status
  *
  * @returns {Boolean} true: for Non-JWT and unexpired JWT, false: else
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
   * Gets ttl in seconds
   *
   * @returns {Number} ttl for JWT tokens, NaN for all other tokens
   */
  getExp() {
    return this.authentication.getExp();
  }

  /**
   * Gets ttl in seconds
   *
   * @returns {Number} ttl for JWT tokens, NaN for all other tokens
   */
  getTtl() {
    return this.authentication.getTtl();
  }

 /**
  * Gets exp from token payload and compares to current time
  *
  * @returns {Boolean} returns (ttl > 0)? for JWT, undefined other tokens
  */
  isTokenExpired() {
    return this.authentication.isTokenExpired();
  }

  /**
  * Get payload from tokens
  *
  * @returns {null | String} null: Non-JWT payload, String: JWT token payload
  */
  getTokenPayload() {
    return this.authentication.getPayload();
  }

  /**
   * Request new accesss token
   *
   * @returns {Promise<Response>} requests new token. can be called multiple times
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
   * Signup locally
   *
   * @param {String|{}}   displayName | object with signup data.
   * @param {[String]|{}} [email | options for post request]
   * @param {[String]}    [password | redirectUri overwrite]
   * @param {[{}]}        [options]
   * @param {[String]}    [redirectUri overwrite]
   *
   * @return {Promise<response>}
   */
  signup(displayName, email, password, options, redirectUri) {
    let content;

    if (typeof arguments[0] === 'object') {
      content = arguments[0];
      options = arguments[1];
      redirectUri = arguments[2];
    } else {
      content = {
        'displayName': displayName,
        'email': email,
        'password': password
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
   * @param {[String]|{}} email | object with signup data.
   * @param {[String]}    [password | options for post request]
   * @param {[{}]}        [options | redirectUri overwrite]]
   * @param {[String]}    [redirectUri overwrite]
   *
   * @return {Promise<response>}
   */
  login(email, password, options, redirectUri) {
    let content;

    if (typeof arguments[0] === 'object') {
      content = arguments[0];
      options = arguments[1];
      redirectUri = arguments[2];
    } else {
      content = {
        'email': email,
        'password': password
      };
      options = options;
    }

    if (this.config.clientId) {
      content.client_id = this.config.clientId;
    }

    return this.client.post(this.config.joinBase(this.config.loginUrl), content, options)
      .then(response => {
        this.setResponseObject(response);

        this.authentication.redirect(redirectUri, this.config.loginRedirect);

        return response;
      });
  }

  /**
   * logout locally and redirect to redirectUri (if set) or redirectUri of config. Sends logout request first if set in config
   *
   * @param {[String]}  [redirectUri]
   *
   * @return {Promise<>|Promise<response>}
   */
  logout(redirectUri) {
    let localLogout = response => new Promise(resolve => {
      this.setResponseObject(null);
      this.clearTimeout();

      this.authentication.redirect(redirectUri, this.config.logoutRedirect);

      resolve(response);
    });

    return (this.config.logoutUrl
      ? this.client.request(this.config.logoutMethod, this.config.joinBase(this.config.logoutUrl)).then(localLogout)
      : localLogout());
  }

  /**
   * Authenticate with third-party and redirect to redirectUri (if set) or redirectUri of config
   *
   * @param {String}    name of the provider
   * @param {[String]}  [redirectUri]
   * @param {[{}]}      [userData]
   *
   * @return {Promise<response>}
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
   * @param {String}  name of the provider
   *
   * @return {Promise<response>}
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
