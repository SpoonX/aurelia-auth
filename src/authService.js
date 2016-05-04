import {inject} from 'aurelia-dependency-injection';
import {deprecated} from 'aurelia-metadata';
import * as LogManager from 'aurelia-logging';

import {Authentication} from './authentication';
import {BaseConfig} from './baseConfig';

@inject(Authentication, BaseConfig)
export class AuthService {
  constructor(authentication, config) {
    this.authentication = authentication;
    this.config         = config;
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
    return this.client.find(this.config.withBase(this.config.profileUrl), criteria);
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
    return this.client.update(this.config.withBase(this.config.profileUrl), criteria, body);
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
  * Gets authentication status. Auto-updates the token is so specified in the config
  *
  * @returns {Boolean} checks if a token present and, if applicable, that token isn't expired
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
   * @returns {Number} gets ttl from expiration date. if expiration date in unknown, returns NaN
   */
  getTtl() {
    return this.authentication.getTtl();
  }

 /**
  * Tests if the token is expired
  *
  * @returns {Boolean} if ttl is known, returns (ttl > 0)?, else returns undefined
  */
  isTokenExpired() {
    return this.authentication.isTokenExpired();
  }

  /**
  * Gets payload from token or from login response
  *
  * @returns {{}} returns token payload for JWT or login response for other tokens
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

      this.client.post(this.config.withBase(this.config.loginUrl), content)
        .then(response => {
          this.authentication.responseObject = response;
          this.authentication.resolveUpdateTokenCallstack(this.authentication.isAuthenticated());
        })
        .catch(err => {
          this.authentication.responseObject = null;
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
    return this.client.post(this.config.withBase(this.config.signupUrl), content, options)
      .then(response => {
        if (this.config.loginOnSignup) {
          this.authentication.responseObject = response;
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
      data.client_id = this.config.clientId;
    }

    return this.client.post(this.config.withBase(this.config.loginUrl), content, options)
      .then(response => {
        this.authentication.responseObject = response;

        this.authentication.redirect(redirectUri, this.config.loginRedirect);

        return response;
      });
  }

  /**
   * logout locally and redirect to redirectUri (if set) or redirectUri of config
   *
   * @param {[String]}  [redirectUri]
   *
   * @return {Promise<>}
   */
  logout(redirectUri) {
    return new Promise(resolve => {
      this.authentication.responseObject = null;

      this.authentication.redirect(redirectUri, this.config.logoutRedirect);

      resolve();
    });
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
        this.authentication.responseObject = response;

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
    const unlinkUrl = this.config.withBase(this.config.unlinkUrl) + name;
    return this.client.request(this.config.unlinkMethod, unlinkUrl)
      .then(response => {
        this.authentication.redirect(redirectUri);

        return response;
      });
  }
}
