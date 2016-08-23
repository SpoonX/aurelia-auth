import * as LogManager from 'aurelia-logging';
import {PLATFORM,DOM} from 'aurelia-pal';
import {parseQueryString,join,buildQueryString} from 'aurelia-path';
import {inject} from 'aurelia-dependency-injection';
import {deprecated} from 'aurelia-metadata';
import {EventAggregator} from 'aurelia-event-aggregator';
import {BindingSignaler} from 'aurelia-templating-resources';
import {Redirect} from 'aurelia-router';
import {HttpClient} from 'aurelia-fetch-client';
import {Config,Rest} from 'aurelia-api';

export declare class Popup {
  constructor();
  open(url?: any, windowName?: any, options?: any): any;
  eventListener(redirectUri?: any): any;
  pollPopup(): any;
}
export declare class BaseConfig {
  
  /**
     * Prepends baseUrl to a given url
     * @param  {String} url The relative url to append
     * @return {String}     joined baseUrl and url
     */
  joinBase(url?: any): any;
  
  /**
     * Merge current settings with incomming settings
     * @param  {Object} incomming Settings object to be merged into the current configuration
     * @return {Config}           this
     */
  configure(incomming?: any): any;
  
  /* ----------- default  config ----------- */
  // Used internally. The used Rest instance; set during configuration (see index.js)
  client: any;
  
  // If using aurelia-api:
  // =====================
  // This is the name of the endpoint used for any requests made in relation to authentication (login, logout, etc.). An empty string selects the default endpoint of aurelia-api.
  endpoint: any;
  
  // When authenticated, these endpoints will have the token added to the header of any requests (for authorization). Accepts an array of endpoint names. An empty string selects the default endpoint of aurelia-api.
  configureEndpoints: any;
  
  // SPA related options
  // ===================
  // The SPA url to which the user is redirected after a successful login
  loginRedirect: any;
  
  // The SPA url to which the user is redirected after a successful logout
  logoutRedirect: any;
  
  // The SPA route used when an unauthenticated user tries to access an SPA page that requires authentication
  loginRoute: any;
  
  // Whether or not an authentication token is provided in the response to a successful signup
  loginOnSignup: any;
  
  // If loginOnSignup == false: The SPA url to which the user is redirected after a successful signup (else loginRedirect is used)
  signupRedirect: any;
  
  // The SPA url to load when the token expires
  expiredRedirect: any;
  
  // The SPA url to load when the authentication status changed in other tabs/windows (detected through storageEvents)
  storageChangedRedirect: any;
  
  // API related options
  // ===================
  // The base url used for all authentication related requests, including provider.url below.
  // This appends to the httpClient/endpoint base url, it does not override it.
  baseUrl: any;
  
  // The API endpoint to which login requests are sent
  loginUrl: any;
  
  // The API endpoint to which logout requests are sent (not needed for jwt)
  logoutUrl: any;
  
  // The HTTP method used for 'unlink' requests (Options: 'get' or 'post')
  logoutMethod: any;
  
  // The API endpoint to which signup requests are sent
  signupUrl: any;
  
  // The API endpoint used in profile requests (inc. `find/get` and `update`)
  profileUrl: any;
  
  // The method used to update the profile ('put' or 'patch')
  profileMethod: any;
  
  // The API endpoint used with oAuth to unlink authentication
  unlinkUrl: any;
  
  // The HTTP method used for 'unlink' requests (Options: 'get' or 'post')
  unlinkMethod: any;
  
  // The API endpoint to which refreshToken requests are sent. null = loginUrl
  refreshTokenUrl: any;
  
  // Token Options
  // =============
  // The header property used to contain the authToken in the header of API requests that require authentication
  authHeader: any;
  
  // The token name used in the header of API requests that require authentication
  authTokenType: any;
  
  // The the property from which to get the access token after a successful login or signup. Can also be dotted eg "accessTokenProp.accessTokenName"
  accessTokenProp: any;
  
  // If the property defined by `accessTokenProp` is an object:
  // ------------------------------------------------------------
  //This is the property from which to get the token `{ "accessTokenProp": { "accessTokenName" : '...' } }`
  accessTokenName: any;
  
  // This allows the token to be a further object deeper `{ "accessTokenProp": { "accessTokenRoot" : { "accessTokenName" : '...' } } }`
  accessTokenRoot: any;
  
  // Refresh Token Options
  // =====================
  // Option to turn refresh tokens On/Off
  useRefreshToken: any;
  
  // The option to enable/disable the automatic refresh of Auth tokens using Refresh Tokens
  autoUpdateToken: any;
  
  // Oauth Client Id
  clientId: any;
  
  // The the property from which to get the refresh token after a successful token refresh. Can also be dotted eg "refreshTokenProp.refreshTokenProp"
  refreshTokenProp: any;
  
  // If the property defined by `refreshTokenProp` is an object:
  // -----------------------------------------------------------
  // This is the property from which to get the token `{ "refreshTokenProp": { "refreshTokenName" : '...' } }`
  refreshTokenName: any;
  
  // This allows the refresh token to be a further object deeper `{ "refreshTokenProp": { "refreshTokenRoot" : { "refreshTokenName" : '...' } } }`
  refreshTokenRoot: any;
  
  // The property name from which to get the user authentication token. Can also be dotted idTokenProp.idTokenName
  idTokenProp: any;
  
  // This is the property from which to get the id token `{ "idTokenProp": { "idTokenName" : '...' } }`
  idTokenName: any;
  
  // This allows the id_token to be a further object deeper `{ "idTokenProp": { "idTokenRoot" : { "idTokenName" : '...' } } }`
  idTokenRoot: any;
  
  // Miscellaneous Options
  // =====================
  // Whether to enable the fetch interceptor which automatically adds the authentication headers
  // (or not... e.g. if using a session based API or you want to override the default behaviour)
  httpInterceptor: any;
  
  // For OAuth only: Tell the API whether or not to include token cookies in the response (for session based APIs)
  withCredentials: any;
  
  // Controls how the popup is shown for different devices (Options: 'browser' or 'mobile')
  platform: any;
  
  // Determines the `PLATFORM` property name upon which aurelia-authentication data is stored (Default: `PLATFORM.localStorage`)
  storage: any;
  
  // The key used for storing the authentication response locally
  storageKey: any;
  
  // optional function to extract the expiration date. takes the server response as parameter
  // eg (expires_in in sec): getExpirationDateFromResponse = serverResponse => new Date().getTime() + serverResponse.expires_in * 1000;
  getExpirationDateFromResponse: any;
  
  // optional function to extract the access token from the response. takes the server response as parameter
  // eg: getAccessTokenFromResponse = serverResponse => serverResponse.data[0].access_token;
  getAccessTokenFromResponse: any;
  
  // optional function to extract the refresh token from the response. takes the server response as parameter
  // eg: getRefreshTokenFromResponse = serverResponse => serverResponse.data[0].refresh_token;
  getRefreshTokenFromResponse: any;
  
  // List of value-converters to make global
  globalValueConverters: any;
  
  //OAuth provider specific related configuration
  // ============================================
  providers: any;
  authToken: any;
  responseTokenProp: any;
  tokenRoot: any;
  tokenName: any;
  tokenPrefix: any;
  
  /**
     * @deprecated
     */
  current: any;
}
export declare class Storage {
  constructor(config?: any);
  get(key?: any): any;
  set(key?: any, value?: any): any;
  remove(key?: any): any;
}
export declare class AuthLock {
  constructor(storage?: any, config?: any);
  open(options?: any, userData?: any): any;
}
export declare class OAuth1 {
  constructor(storage?: any, popup?: any, config?: any);
  open(options?: any, userData?: any): any;
  exchangeForToken(oauthData?: any, userData?: any, provider?: any): any;
}
export declare class OAuth2 {
  constructor(storage?: any, popup?: any, config?: any);
  open(options?: any, userData?: any): any;
  exchangeForToken(oauthData?: any, userData?: any, provider?: any): any;
  buildQuery(provider?: any): any;
}
export declare class Authentication {
  constructor(storage?: any, config?: any, oAuth1?: any, oAuth2?: any, auth0Lock?: any);
  
  /* deprecated methods */
  getLoginRoute(): any;
  getLoginRedirect(): any;
  getLoginUrl(): any;
  getSignupUrl(): any;
  getProfileUrl(): any;
  getToken(): any;
  responseObject: any;
  hasDataStored: any;
  
  /* get/set responseObject */
  getResponseObject(): any;
  setResponseObject(response?: any): any;
  
  /* get data, update if needed first */
  getAccessToken(): any;
  getRefreshToken(): any;
  getIdToken(): any;
  getPayload(): any;
  getExp(): any;
  
  /* get status from data */
  getTtl(): any;
  isTokenExpired(): any;
  isAuthenticated(): any;
  
  /* get and set from response */
  getDataFromResponse(response?: any): any;
  getTokenFromResponse(response?: any, tokenProp?: any, tokenName?: any, tokenRoot?: any): any;
  toUpdateTokenCallstack(): any;
  resolveUpdateTokenCallstack(response?: any): any;
  
  /**
     * Authenticate with third-party
     *
     * @param {String}    name of the provider
     * @param {[{}]}      [userData]
     *
     * @return {Promise<response>}
     */
  authenticate(name?: any, userData?: any): any;
  redirect(redirectUrl?: any, defaultRedirectUrl?: any, query?: any): any;
}
export declare class AuthService {
  
  /**
     * The Authentication instance that handles the token
     *
     * @param  {Authentication}
     */
  authentication: any;
  
  /**
     * The Config instance that contains the current configuration setting
     *
     * @param  {Config}
     */
  config: any;
  
  /**
     * The current login status
     *
     * @param  {Boolean}
     */
  authenticated: any;
  
  /**
     * The currently set timeoutID
     *
     * @param  {Number}
     */
  timeoutID: any;
  
  /**
     *  Create an AuthService instance
     *
     * @param  {Authentication}  authentication  The Authentication instance to be used
     * @param  {Config}          config          The Config instance to be used
     * @param  {BindingSignaler} bindingSignaler The BindingSignaler instance to be used
     * @param  {EventAggregator} eventAggregator The EventAggregator instance to be used
     */
  constructor(authentication?: any, config?: any, bindingSignaler?: any, eventAggregator?: any);
  
  /**
     * The handler used for storage events. Detects and handles authentication changes in other tabs/windows
     *
     * @param {StorageEvent}
     */
  storageEventHandler: any;
  
  /**
     * Getter: The configured client for all aurelia-authentication requests
     *
     * @return {HttpClient}
     */
  client: any;
  
  /**
     * Getter: The authentication class instance
     *
     * @return {boolean}
     * @deprecated
     */
  auth: any;
  
  /**
     * Sets the login timeout
     *
     * @param  {Number} ttl  Timeout time in ms
     */
  setTimeout(ttl?: any): any;
  
  /**
     * Clears the login timeout
     */
  clearTimeout(): any;
  
  /**
     * Stores and analyses the servers responseObject. Sets login status and timeout
     *
     * @param {Object} response The servers response as GOJO
     */
  setResponseObject(response?: any): any;
  
  /**
     * Update authenticated. Sets login status and timeout
     */
  updateAuthenticated(): any;
  
  /**
     * Get current user profile from server
     *
     * @param {[{}|number|string]}  [criteriaOrId object or a Number|String converted to {id: criteriaOrId}]
     *
     * @return {Promise<response>}
     */
  getMe(criteriaOrId?: any): any;
  
  /**
     * Send current user profile update to server
  
     * @param {any}                 Request body with data.
     * @param {[{}|Number|String]}  [criteriaOrId object or a Number|String converted to {id: criteriaOrId}]
     *
     * @return {Promise<response>}
     */
  updateMe(body?: any, criteriaOrId?: any): any;
  
  /**
     * Get accessToken from storage
     *
     * @returns {String} Current accessToken
     */
  getAccessToken(): any;
  getCurrentToken(): any;
  
  /**
     * Get refreshToken from storage
     *
     * @returns {String} Current refreshToken
     */
  getRefreshToken(): any;
  
  /**
     * Get idToken from storage
     *
     * @returns {String} Current idToken
     */
  getIdToken(): any;
  
  /**
    * Gets authentication status from storage
    *
    * @returns {Boolean} For Non-JWT and unexpired JWT: true, else: false
    */
  isAuthenticated(): any;
  
  /**
     * Gets exp in milliseconds
     *
     * @returns {Number} Exp for JWT tokens, NaN for all other tokens
     */
  getExp(): any;
  
  /**
     * Gets ttl in seconds
     *
     * @returns {Number} Ttl for JWT tokens, NaN for all other tokens
     */
  getTtl(): any;
  
  /**
    * Gets exp from token payload and compares to current time
    *
    * @returns {Boolean} Returns (ttl > 0)? for JWT, undefined other tokens
    */
  isTokenExpired(): any;
  
  /**
    * Get payload from tokens
    *
    * @returns {Object} Payload for JWT, else null
    */
  getTokenPayload(): any;
  
  /**
     * Request new accesss token
     *
     * @returns {Promise<Response>} Requests new token. can be called multiple times
     */
  updateToken(): any;
  
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
  signup(displayNameOrCredentials?: any, emailOrOptions?: any, passwordOrRedirectUri?: any, options?: any, redirectUri?: any): any;
  
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
  login(emailOrCredentials?: any, passwordOrOptions?: any, optionsOrRedirectUri?: any, redirectUri?: any): any;
  
  /**
     * logout locally and redirect to redirectUri (if set) or redirectUri of config. Sends logout request first, if set in config
     *
     * @param {[String]}    [redirectUri]                     [optional redirectUri overwrite]
     *
     * @return {Promise<>|Promise<Object>|Promise<Error>}     Server response as Object
     */
  logout(redirectUri?: any, query?: any): any;
  
  /**
     * Authenticate with third-party and redirect to redirectUri (if set) or redirectUri of config
     *
     * @param {String}    name          Name of the provider
     * @param {[String]}  [redirectUri] [optional redirectUri overwrite]
     * @param {[{}]}      [userData]    [optional userData for the local authentication server]
     *
     * @return {Promise<Object>|Promise<Error>}     Server response as Object
     */
  authenticate(name?: any, redirectUri?: any, userData?: any): any;
  
  /**
     * Unlink third-party
     *
     * @param {String}      name                  Name of the provider
     *
     * @return {Promise<Object>|Promise<Error>}  Server response as Object
     */
  unlink(name?: any, redirectUri?: any): any;
}
export declare class AuthenticateStep {
  constructor(authService?: any);
  run(routingContext?: any, next?: any): any;
}
export declare class AuthorizeStep {
  constructor(authService?: any);
  run(routingContext?: any, next?: any): any;
}
export declare class FetchConfig {
  
  /**
     * Construct the FetchConfig
     *
     * @param {HttpClient} httpClient
     * @param {Config} clientConfig
     * @param {Authentication} authService
     * @param {BaseConfig} config
     */
  constructor(httpClient?: any, clientConfig?: any, authService?: any, config?: any);
  
  /**
     * Interceptor for HttpClient
     *
     * @return {{request: Function, response: Function}}
     */
  interceptor: any;
  
  /**
     * Configure client(s) with authorization interceptor
     *
     * @param {HttpClient|Rest|string[]} client HttpClient, rest client or api endpoint name, or an array thereof
     *
     * @return {HttpClient[]}
     */
  configure(client?: any): any;
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
export declare function configure(aurelia?: any, config?: any): any;
export declare class AuthenticatedFilterValueConverter {
  constructor(authService?: any);
  
  /**
     * route toView predictator on route.config.auth === (parameter || authService.isAuthenticated())
     * @param  {RouteConfig}  routes            the routes array to convert
     * @param  {[Boolean]}    [isAuthenticated] optional isAuthenticated value. default: this.authService.authenticated
     * @return {Boolean}      show/hide element
     */
  toView(routes?: any, isAuthenticated?: any): any;
}
export declare class AuthenticatedValueConverter {
  constructor(authService?: any);
  
  /**
     * element toView predictator on authService.isAuthenticated()
     * @return {Boolean}  show/hide element
     */
  toView(): any;
}
export declare class AuthFilterValueConverter {
  
  /**
     * route toView predictator on route.config.auth === isAuthenticated
     * @param  {RouteConfig}  routes            the routes array to convert
     * @param  {Boolean}      isAuthenticated   authentication status
     * @return {Boolean}      show/hide element
     */
  toView(routes?: any, isAuthenticated?: any): any;
}