import {inject} from 'aurelia-framework';
import {Authentication} from './authentication';
import {BaseConfig} from './baseConfig';
import {OAuth1} from './oAuth1';
import {OAuth2} from './oAuth2';
import authUtils from './authUtils';
import {Rest} from 'spoonx/aurelia-api';

@inject(Rest, Authentication, OAuth1, OAuth2, BaseConfig)
export class AuthService {
  constructor(rest, auth, oAuth1, oAuth2, config) {
    this.rest   = rest;
    this.auth   = auth;
    this.oAuth1 = oAuth1;
    this.oAuth2 = oAuth2;
    this.config = config.current;
  }

  getMe() {
    return this.rest.find(this.auth.getProfileUrl());
  }

  updateMe(body, criteria=null) {
    return this.rest.update(this.auth.getProfileUrl(), criteria, body);
  }

  isAuthenticated() {
    return this.auth.isAuthenticated();
  }

  getTokenPayload() {
    return this.auth.getPayload();
  }

  signup(displayName, email, password) {
    let signupUrl = this.auth.getSignupUrl();
    let content;
    if (typeof arguments[0] === 'object') {
      content = arguments[0];
    } else {
      content = {
        'displayName': displayName,
        'email': email,
        'password': password
      };
    }
    return this.rest.post(signupUrl, content)
      .then(response => {
        if (this.config.loginOnSignup) {
          this.auth.setUserIdFromResponse(response);
          this.auth.setTokenFromResponse(response);
        } else if (this.config.signupRedirect) {
          window.location.href = this.config.signupRedirect;
        }

        return response;
      });
  }

  login(email, password) {
    let loginUrl = this.auth.getLoginUrl();
    let content;
    if (typeof arguments[1] !== 'string') {
      content = arguments[0];
    } else {
      content = {
        'email': email,
        'password': password
      };
    }

    return this.rest.post(loginUrl, content)
      .then(response => {
        this.auth.setUserIdFromResponse(response);
        this.auth.setTokenFromResponse(response);

        return response;
      });
  }

  logout(redirectUri) {
    return this.auth.logout(redirectUri);
  }

  authenticate(name, redirect, userData) {
    let provider = this.oAuth2;
    if (this.config.providers[name].type === '1.0') {
      provider = this.oAuth1;
    }

    return provider.open(this.config.providers[name], userData || {})
      .then(response => {
        this.auth.setTokenFromResponse(response, redirect);
        return response;
      });
  }

  unlink(provider) {
    let unlinkUrl = this.config.baseUrl ? authUtils.joinUrl(this.config.baseUrl, this.config.unlinkUrl) : this.config.unlinkUrl;

    if (this.config.unlinkMethod === 'get') {
      return this.rest.find(unlinkUrl + provider);
    } else if (this.config.unlinkMethod === 'post') {
      return this.rest.post(unlinkUrl, provider);
    }
  }
}
