/* eslint-disable max-lines */
import {PLATFORM} from 'aurelia-pal';
import {inject} from 'aurelia-dependency-injection';
import {deprecated} from 'aurelia-metadata';
import {EventAggregator} from 'aurelia-event-aggregator';
import {BindingSignaler} from 'aurelia-templating-resources';
import {logger} from './logger';
import {Rest} from 'aurelia-api';
import {Authentication} from './authentication';
import {BaseConfig} from './baseConfig';

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

    // in case auto refresh tokens are enabled, tokens are allowed to differ
    // logouts (event.newValue===null) and logins (authentication.getAccessToken()===null), need to be handled bellow though
    if (event.newValue && this.config.autoUpdateToken && this.authentication.getAccessToken() && this.authentication.getRefreshToken()) {
      // we just need to check the status of the updated token we have in storage
      this.updateAuthenticated();

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
    const maxTimeout = 2147483647; // maximum period in ms (ca. 24.85d) for windows.setTimeout

    // limit timer ttl to max value allowed for windows.setTimeout function
    if (ttl > maxTimeout) {
      ttl = maxTimeout;
      logger.warn('Token timeout limited to ', maxTimeout, ' ms (ca 24.85d).');
    }

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
        .catch(error => logger.warn(error))
        .then(() => {
          // call callback with now updated status
          if (typeof callback === 'function') {
            try {
              callback(this.authenticated); // eslint-disable-line callback-return
            } catch (error) {
              logger.warn(error.message);
            }
          }
        });

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
  * Asynchronously gets authentication status from storage
  *
  * @returns {Promise<boolean>} For Non-JWT and unexpired JWT: true, else: false
  */
 isAuthenticatedAsync(): Promise<boolean> {
    this.authentication.responseAnalyzed = false;

    let authenticated = this.authentication.isAuthenticated();

    // auto-update token?
    if (!authenticated
      && this.config.autoUpdateToken
      && this.authentication.getAccessToken()
      && this.authentication.getRefreshToken()
    ) {
      return this.updateToken()
        .catch(error => logger.warn(error))
        .then(() => this.authenticated);
    }

    return Promise.resolve(authenticated);
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
  * Get payload from access token
  *
  * @returns {{}} Payload for JWT, else null
  */
  getTokenPayload(): {} {
    return this.authentication.getPayload();
  }

  /**
  * Get payload from id token
  *
  * @returns {{}} Payload for JWT, else null
  */
  getIdTokenPayload(): {} {
    return this.authentication.getIdPayload();
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
        grant_type: 'refresh_token'
      };

      if (this.config.clientId) {
        content.client_id = this.config.clientId;
      }
      if (this.config.clientSecret) {
        content.client_secret = this.config.clientSecret;
      }

      content[this.config.refreshTokenSubmitProp] = this.authentication.getRefreshToken();

      this.client.post(this.config.joinBase(this.config.refreshTokenUrl
                                            ? this.config.refreshTokenUrl
                                            : this.config.loginUrl), content, this.config.getOptionsForTokenRequests())
        .then(response => {
          this.setResponseObject(response);
          if (this.getAccessToken()) {
            this.authentication.resolveUpdateTokenCallstack(this.isAuthenticated());
          } else {
            this.setResponseObject(null);

            if (this.config.expiredRedirect) {
            PLATFORM.location.assign(this.config.expiredRedirect);
            }
            this.authentication.resolveUpdateTokenCallstack(Promise.reject(new Error('accessToken not found in refreshToken response')));
          }
        })
        .catch(error => {
          this.setResponseObject(null);

          if (this.config.expiredRedirect) {
            PLATFORM.location.assign(this.config.expiredRedirect);
          }
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
  login(emailOrCredentials?: string|{}, passwordOrOptions?: string|{}, optionsOrRedirectUri?: {}, redirectUri?: string): Promise<any> {
    let normalized = {};

    if (typeof emailOrCredentials === 'object') {
      normalized.credentials = emailOrCredentials;
      normalized.options     = this.config.getOptionsForTokenRequests(passwordOrOptions);
      normalized.redirectUri = optionsOrRedirectUri;
    } else if (typeof emailOrCredentials === 'string') {
      normalized.credentials = {
        'email'   : emailOrCredentials,
        'password': passwordOrOptions
      };
      normalized.options     = this.config.getOptionsForTokenRequests(optionsOrRedirectUri);
      normalized.redirectUri = redirectUri;
    }

    if (this.config.clientId) {
      normalized.credentials.client_id = this.config.clientId;
    }

    if (this.config.clientSecret) {
      normalized.credentials.client_secret = this.config.clientSecret;
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
