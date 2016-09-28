import {inject} from 'aurelia-dependency-injection';
import {buildQueryString} from 'aurelia-path';
import extend from 'extend';
import {Storage} from './storage';
import {Popup} from './popup';
import {BaseConfig} from './baseConfig';

@inject(Storage, Popup, BaseConfig)
export class OAuth2 {
  constructor(storage, popup, config) {
    this.storage      = storage;
    this.config       = config;
    this.popup        = popup;
    this.defaults     = {
      url                  : null,
      name                 : null,
      state                : null,
      scope                : null,
      scopeDelimiter       : null,
      redirectUri          : null,
      popupOptions         : null,
      authorizationEndpoint: null,
      responseParams       : null,
      requiredUrlParams    : null,
      optionalUrlParams    : null,
      defaultUrlParams     : ['response_type', 'client_id', 'redirect_uri'],
      responseType         : 'code'
    };
  }

  open(options, userData) {
    const provider  = extend(true, {}, this.defaults, options);
    const stateName = provider.name + '_state';

    if (typeof provider.state === 'function') {
      this.storage.set(stateName, provider.state());
    } else if (typeof provider.state === 'string') {
      this.storage.set(stateName, provider.state);
    }

    const url       = provider.authorizationEndpoint
                    + '?' + buildQueryString(this.buildQuery(provider));
    const popup     = this.popup.open(url, provider.name, provider.popupOptions);
    const openPopup = (this.config.platform === 'mobile')
                    ? popup.eventListener(provider.redirectUri)
                    : popup.pollPopup();

    return openPopup
      .then(oauthData => {
        if (provider.responseType === 'token'
          || provider.responseType === 'id_token token'
          || provider.responseType === 'token id_token'
        ) {
          return oauthData;
        }
        if (oauthData.state && oauthData.state !== this.storage.get(stateName)) {
          return Promise.reject('OAuth 2.0 state parameter mismatch.');
        }

        return this.exchangeForToken(oauthData, userData, provider);
      });
  }

  exchangeForToken(oauthData, userData, provider) {
    const data = extend(true, {}, userData, {
      clientId   : provider.clientId,
      redirectUri: provider.redirectUri
    }, oauthData);

    const serverUrl   = this.config.joinBase(provider.url);
    const credentials = this.config.withCredentials ? 'include' : 'same-origin';

    return this.config.client.post(serverUrl, data, {credentials: credentials});
  }

  buildQuery(provider) {
    let query = {};
    const urlParams   = ['defaultUrlParams', 'requiredUrlParams', 'optionalUrlParams'];

    urlParams.forEach(params => {
      (provider[params] || []).forEach(paramName => {
        const camelizedName = camelCase(paramName);
        let paramValue      = (typeof provider[paramName] === 'function')
                              ? provider[paramName]()
                              : provider[camelizedName];

        if (paramName === 'state') {
          paramValue = encodeURIComponent(this.storage.get(provider.name + '_state'));
        }

        if (paramName === 'scope' && Array.isArray(paramValue)) {
          paramValue = paramValue.join(provider.scopeDelimiter);

          if (provider.scopePrefix) {
            paramValue = provider.scopePrefix + provider.scopeDelimiter + paramValue;
          }
        }

        query[paramName] = paramValue;
      });
    });

    return query;
  }

  close(options) {
    const provider  = extend(true, {}, this.defaults, options);
    const url       = provider.logoutEndpoint + '?'
                    + buildQueryString(this.buildLogoutQuery(provider));
    const popup     = this.popup.open(url, provider.name, provider.popupOptions);
    const openPopup = (this.config.platform === 'mobile')
                    ? popup.eventListener(provider.postLogoutRedirectUri)
                    : popup.pollPopup();

    return openPopup
      .then(response => {
        return response;
      });
  }

  buildLogoutQuery(provider) {
    let query = {};
    let authResponse = this.storage.get(this.config.storageKey);

    if (provider.postLogoutRedirectUri) {
      query.post_logout_redirect_uri = provider.postLogoutRedirectUri;
    }
    if (this.storage.get(provider.name + '_state')) {
      query.state = this.storage.get(provider.name + '_state');
    }
    if (JSON.parse(authResponse).id_token) {
      query.id_token_hint = JSON.parse(authResponse).id_token;
    }

    return query;
  }
}

function camelCase(name) {
  return name.replace(/([:\-_]+(.))/g, function(_, separator, letter, offset) {
    return offset ? letter.toUpperCase() : letter;
  });
}
