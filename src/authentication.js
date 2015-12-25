import {inject} from 'aurelia-framework';
import {BaseConfig}  from './baseConfig';
import {Storage} from './storage';
import authUtils from './authUtils';

@inject(Storage, BaseConfig)
export class Authentication {
  constructor(storage, config) {
    this.storage   = storage;
    this.config    = config.current;
    this.tokenName = this.config.tokenPrefix ? this.config.tokenPrefix + '_' + this.config.tokenName : this.config.tokenName;
    if (this.config.userIdName)
      this.userIdName = this.config.tokenPrefix ? this.config.tokenPrefix + '_' + this.config.userIdName : this.config.userIdName;
  }

  getLoginRoute() {
    return this.config.loginRoute;
  }

  getLoginRedirect() {
    return this.config.loginRedirect;
  }

  getLoginUrl() {
    return this.config.baseUrl ? authUtils.joinUrl(this.config.baseUrl, this.config.loginUrl) : this.config.loginUrl;
  }

  getSignupUrl() {
    return this.config.baseUrl ? authUtils.joinUrl(this.config.baseUrl, this.config.signupUrl) : this.config.signupUrl;
  }

  getProfileUrl() {
    let profileUrl = this.config.profileUrl.replace(/:userid/i,this.getUserId());
    return this.config.baseUrl ? authUtils.joinUrl(this.config.baseUrl, profileUrl) : profileUrl;
  }

  getToken() {
    return this.storage.get(this.tokenName);
  }

  getUserId() {
    if (this.config.userIdName)
      return this.storage.get(this.userIdName);
    throw Error('UserId not set')
  }

  getPayload() {
    let token = this.storage.get(this.tokenName);

    if (token && token.split('.').length === 3) {
      let base64Url = token.split('.')[1];
      let base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(window.atob(base64))));
    }
  }

  setTokenFromResponse(response, redirect) {
    let tokenName   = this.tokenName;
    let accessToken = response && response.access_token;
    let token;

    if (accessToken) {
      if (authUtils.isObject(accessToken) && authUtils.isObject(accessToken.data)) {
        response = accessToken;
      } else if (authUtils.isString(accessToken)) {
        token = accessToken;
      }
    }

    if (!token && response) {
      token = this.config.tokenRoot && response[this.config.tokenRoot] ? response[this.config.tokenRoot][this.config.tokenName] : response[this.config.tokenName];
    }

    if (!token) {
      let tokenPath = this.config.tokenRoot ? this.config.tokenRoot + '.' + this.config.tokenName : this.config.tokenName;

      throw new Error('Expecting a token named "' + tokenPath + '" but instead got: ' + JSON.stringify(response));
    }

    this.storage.set(tokenName, token);

    if (this.config.loginRedirect && !redirect) {
      window.location.href = this.config.loginRedirect;
    } else if (redirect && authUtils.isString(redirect)) {
      window.location.href = window.encodeURI(redirect);
    }
  }

  removeToken() {
    this.storage.remove(this.tokenName);
    if (this.config.userIdName)
      this.storage.remove(this.userIdName);
  }

  setUserIdFromResponse(response) {
    if (!this.config.userIdName)
        return;

    let userIdName   = this.userIdName;
    let userId;


    if (response) {
      userId = this.config.tokenRoot && response[this.config.tokenRoot] ? response[this.config.tokenRoot][this.config.userIdName] : response[this.config.userIdName];
    }

    if (!userId) {
      let userIdPath = this.config.tokenRoot ? this.config.tokenRoot + '.' + this.config.userIdName : this.config.userIdName;

      throw new Error('Expecting a userId named "' + userIdPath + '" but instead got: ' + JSON.stringify(response));
    }

    this.storage.set(userIdName, userId);
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
    let exp       = JSON.parse(window.atob(base64)).exp;

    if (exp) {
      return Math.round(new Date().getTime() / 1000) <= exp;
    }

    return true;
  }

  logout(redirect) {
    return new Promise(resolve => {
      this.storage.remove(this.tokenName);

      if (this.config.logoutRedirect && !redirect) {
        window.location.href = this.config.logoutRedirect;
      } else if (authUtils.isString(redirect)) {
        window.location.href = redirect;
      }

      resolve();
    });
  }
}
