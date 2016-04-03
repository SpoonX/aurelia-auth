import {inject} from 'aurelia-dependency-injection';
import {BaseConfig}  from './baseConfig';
import {Storage} from './storage';
import {authUtils} from './authUtils';

@inject(Storage, BaseConfig)
export class Authentication {
  constructor(storage, config) {
    this.storage = storage;
    this.config  = config.current;
  }

  getLoginRoute() {
    return this.config.loginRoute;
  }

  getLoginRedirect() {
    return this.config.loginRedirect;
  }

  getLoginUrl() {
    return authUtils.joinUrl(this.config.baseUrl, this.config.loginUrl);
  }

  getSignupUrl() {
    return authUtils.joinUrl(this.config.baseUrl, this.config.signupUrl);
  }

  getProfileUrl() {
    return authUtils.joinUrl(this.config.baseUrl, this.config.profileUrl);
  }

  getToken() {
    return this.storage.get(this.config.accessTokenStorage);
  }

  getRefreshToken() {
    return this.storage.get(this.config.refreshTokenStorage);
  }

  getPayload() {
    let token = this.storage.get(this.config.accessTokenStorage);

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
    let accessToken = response && response[this.config.accessTokenProp];
    let token;

    if (accessToken) {
      if (authUtils.isObject(accessToken) && authUtils.isObject(accessToken.data)) {
        response = accessToken;
      } else if (authUtils.isString(accessToken)) {
        token = accessToken;
      }
    }

    if (!token && response) {
      token = this.config.accessTokenRoot && response[this.config.accessTokenRoot]
        ? response[this.config.accessTokenRoot][this.config.accessTokenName]
        : response[this.config.accessTokenName];
    }

    if (!token) {
      let accessTokenPath = this.config.accessTokenRoot
        ? this.config.accessTokenRoot + '.' + this.config.accessTokenName
        : this.config.accessTokenName;

      throw new Error('Expecting a token named "' + accessTokenPath + '" but instead got: ' + JSON.stringify(response));
    }

    this.storage.set(this.config.accessTokenStorage, token);

    if (this.config.loginRedirect && !redirect) {
      window.location.href = this.config.loginRedirect;
    } else if (redirect && authUtils.isString(redirect)) {
      window.location.href = window.encodeURI(redirect);
    }
  }

  setRefreshTokenFromResponse(response) {
    let refreshToken = response && response[this.config.refreshTokenProp];
    let token;

    if (refreshToken) {
      if (authUtils.isObject(refreshToken) && authUtils.isObject(refreshToken.data)) {
        response = refreshToken;
      } else if (authUtils.isString(refreshToken)) {
        token = refreshToken;
      }
    }

    if (!token && response) {
      token = this.config.refreshTokenRoot && response[this.config.refreshTokenRoot]
        ? response[this.config.refreshTokenRoot][this.config.refreshTokenName]
        : response[this.config.refreshTokenName];
    }

    if (!token) {
      let refreshTokenPath = this.config.refreshTokenRoot
        ? this.config.refreshTokenRoot + '.' + this.config.refreshTokenName
        : this.config.refreshTokenName;

      throw new Error('Expecting a refresh token named "' + refreshTokenPath + '" but instead got: ' + JSON.stringify(response.content));
    }

    this.storage.set(this.config.refreshTokenStorage, token);
  }

  removeToken() {
    this.storage.remove(this.config.accessTokenStorage);
  }

  removeRefreshToken() {
    this.storage.remove(this.config.refreshTokenStorage);
  }

  isAuthenticated() {
    let token = this.storage.get(this.config.accessTokenStorage);

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
      this.storage.remove(this.config.accessTokenStorage);
      this.storage.remove(this.config.refreshTokenStorage);

      if (this.config.logoutRedirect && !redirect) {
        window.location.href = this.config.logoutRedirect;
      } else if (authUtils.isString(redirect)) {
        window.location.href = redirect;
      }

      resolve();
    });
  }
}
