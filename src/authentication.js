import {inject} from 'aurelia-dependency-injection';
import {BaseConfig}  from './baseConfig';
import {Storage} from './storage';
import {authUtils} from './authUtils';

@inject(Storage, BaseConfig)
export class Authentication {
  constructor(storage, config) {
    this.storage = storage;
    this.config  = config;
  }

  get refreshTokenName() {
    return authUtils.addTokenPrefix(this.config.current.refreshTokenPrefix, this.config.current.refreshTokenName);
  }

  get tokenName() {
    return authUtils.addTokenPrefix(this.config.current.tokenPrefix, this.config.current.tokenName);
  }

  getLoginRoute() {
    return this.config.current.loginRoute;
  }

  getLoginRedirect() {
    return this.config.current.loginRedirect;
  }

  getLoginUrl() {
    return authUtils.joinUrl(this.config.current.baseUrl, this.config.current.loginUrl);
  }

  getSignupUrl() {
    return authUtils.joinUrl(this.config.current.baseUrl, this.config.current.signupUrl);
  }

  getProfileUrl() {
    return authUtils.joinUrl(this.config.current.baseUrl, this.config.current.profileUrl);
  }

  getToken() {
    return this.storage.get(this.tokenName);
  }

  getRefreshToken() {
    return this.storage.get(this.refreshTokenName);
  }

  getPayload() {
    let token = this.storage.get(this.tokenName);

    if (token && token.split('.').length === 3) {
      let base64Url = token.split('.')[1];
      let base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      try {
        return JSON.parse(decodeURIComponent(escape(window.atob(base64))));
      } catch (error) {
        return null;
      }
    }
  }

  setTokenFromResponse(response, redirect) {
    let tokenName   = this.tokenName;
    let accessToken = response && response[this.config.current.responseTokenProp];
    let token;

    if (accessToken) {
      if (authUtils.isObject(accessToken) && authUtils.isObject(accessToken.data)) {
        response = accessToken;
      } else if (authUtils.isString(accessToken)) {
        token = accessToken;
      }
    }

    if (!token && response) {
      token = this.config.current.tokenRoot && response[this.config.current.tokenRoot] ? response[this.config.current.tokenRoot][this.config.current.tokenName] : response[this.config.current.tokenName];
    }

    if (!token) {
      let tokenPath = this.config.current.tokenRoot ? this.config.current.tokenRoot + '.' + this.config.current.tokenName : this.config.current.tokenName;

      throw new Error('Expecting a token named "' + tokenPath + '" but instead got: ' + JSON.stringify(response));
    }

    this.storage.set(tokenName, token);

    if (this.config.current.loginRedirect && !redirect) {
      window.location.href = this.config.current.loginRedirect;
    } else if (redirect && authUtils.isString(redirect)) {
      window.location.href = window.encodeURI(redirect);
    }
  }

  setRefreshTokenFromResponse(response) {
    let refreshTokenName = this.refreshTokenName;
    let refreshToken     = response && response.refresh_token;
    let refreshTokenPath;
    let token;

    if (refreshToken) {
      if (authUtils.isObject(refreshToken) && authUtils.isObject(refreshToken.data)) {
        response = refreshToken;
      } else if (authUtils.isString(refreshToken)) {
        token = refreshToken;
      }
    }

    if (!token && response) {
      token = this.config.current.refreshTokenRoot && response[this.config.current.refreshTokenRoot]
        ? response[this.config.current.refreshTokenRoot][this.config.current.refreshTokenName]
        : response[this.config.current.refreshTokenName];
    }
    if (!token) {
      refreshTokenPath = this.config.current.refreshTokenRoot
        ? this.config.current.refreshTokenRoot + '.' + this.config.current.refreshTokenName
        : this.config.current.refreshTokenName;

      throw new Error('Expecting a refresh token named "' + refreshTokenPath + '" but instead got: ' + JSON.stringify(response.content));
    }

    this.storage.set(refreshTokenName, token);
  }

  removeToken() {
    this.storage.remove(this.tokenName);
  }

  removeRefreshToken() {
    this.storage.remove(this.refreshTokenName);
  }

  isAuthenticated() {
    let token = this.storage.get(this.tokenName);

    // There's no token, so user is not authenticated.
    if (!token) {
      return false;
    }

    // There is a token, but in a different format. Return true.
    if (token.split('.').length !== 3) {
      return true;
    }

    let base64Url = token.split('.')[1];
    let base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let exp;

    try {
      exp = JSON.parse(window.atob(base64)).exp;
    } catch (error) {
      return false;
    }

    if (exp) {
      return Math.round(new Date().getTime() / 1000) <= exp;
    }

    return true;
  }


  isTokenExpired() {
    let payload = this.getPayload();
    let exp     = payload ? payload.exp : null;
    if (exp) {
      return Math.round(new Date().getTime() / 1000) > exp;
    }

    return undefined;
  }

  logout(redirect) {
    return new Promise(resolve => {
      this.storage.remove(this.tokenName);
      this.storage.remove(this.refreshTokenName);

      if (this.config.current.logoutRedirect && !redirect) {
        window.location.href = this.config.current.logoutRedirect;
      } else if (authUtils.isString(redirect)) {
        window.location.href = redirect;
      }

      resolve();
    });
  }
}
