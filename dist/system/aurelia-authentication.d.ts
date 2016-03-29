declare module 'aurelia-authentication' {
  export class AuthFilterValueConverter {
    toView(routes: any, isAuthenticated: any): any;
  }
  export class BaseConfig {
    configure(incomingConfig: any): any;
    current: any;
    constructor();
  }
  export class Popup {
    constructor(config: any);
    open(url: any, windowName: any, options: any, redirectUri: any): any;
    eventListener(redirectUri: any): any;
    pollPopup(): any;
    prepareOptions(options: any): any;
    stringifyOptions(options: any): any;
  }
  export class Storage {
    constructor(config: any);
    get(key: any): any;
    set(key: any, value: any): any;
    remove(key: any): any;
  }
  export class Authentication {
    constructor(storage: any, config: any);
    tokenName: any;
    getLoginRoute(): any;
    getLoginRedirect(): any;
    getLoginUrl(): any;
    getSignupUrl(): any;
    getProfileUrl(): any;
    getToken(): any;
    getPayload(): any;
    setTokenFromResponse(response: any, redirect: any): any;
    removeToken(): any;
    isAuthenticated(): any;
    logout(redirect: any): any;
  }
  export class OAuth1 {
    constructor(storage: any, popup: any, config: any);
    open(options: any, userData: any): any;
    exchangeForToken(oauthData: any, userData: any, current: any): any;
    buildQueryString(obj: any): any;
  }
  export class OAuth2 {
    constructor(storage: any, popup: any, config: any);
    open(options: any, userData: any): any;
    exchangeForToken(oauthData: any, userData: any, current: any): any;
    buildQueryString(current: any): any;
  }
  export class FetchConfig {
    
    /**
       * Construct the FetchConfig
       *
       * @param {HttpClient} httpClient
       * @param {Config} clientConfig
       * @param {Authentication} authService
       * @param {BaseConfig} config
       */
    constructor(httpClient: any, clientConfig: any, authentication: any, config: any);
    
    /**
       * Interceptor for HttpClient
       *
       * @return {{request: Function}}
       */
    interceptor: any;
    
    /**
       * @param {HttpClient|Rest[]} client
       *
       * @return {HttpClient[]}
       */
    configure(client: any): any;
  }
  export class AuthorizeStep {
    constructor(auth: any);
    run(routingContext: any, next: any): any;
  }
  export class AuthService {
    constructor(auth: any, oAuth1: any, oAuth2: any, config: any);
    getMe(criteria: any): any;
    updateMe(body: any, criteria: any): any;
    isAuthenticated(): any;
    getTokenPayload(): any;
    signup(displayName: any, email: any, password: any): any;
    login(email: any, password: any): any;
    logout(redirectUri: any): any;
    authenticate(name: any, redirect: any, userData: any): any;
    unlink(provider: any): any;
  }
}