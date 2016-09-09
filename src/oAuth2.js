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
    this.defaults = {
      name: null,
      url: null,
      clientId: null,
      authorizationEndpoint: null,
      redirectUri: null,
      scope: null,
      scopePrefix: null,
      scopeDelimiter: null,
      state: null,
      requiredUrlParams: null,
      defaultUrlParams: ['response_type', 'client_id', 'redirect_uri'],
      responseType: 'code',
      responseParams: {
        code: 'code',
        clientId: 'clientId',
        redirectUri: 'redirectUri'
      },
      oauthType: '2.0',
      popupOptions: { width: null, height: null }
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
                    : popup.pollPopup(provider.redirectUri);

    return openPopup
      .then(oauthData => {
        if (provider.responseType === 'token' ||
            provider.responseType === 'id_token token' ||
            provider.responseType === 'token id_token'
        ) {
          return oauthData;
        }

        if (oauthData.state && oauthData.state !== this.storage.get(stateName)) {
          throw new Error('OAuth 2.0 state parameter mismatch.');
        }

        return this.exchangeForToken(oauthData, userData, provider);
      });
  }

  exchangeForToken(oauthData, userData, provider) {
    const payload = extend({}, userData);

    // add default responseParameter to the authentication server request
    for (let key in provider.responseParams) {
      let value = provider.responseParams[key];

      switch (key) {
      case 'code':
        payload[value] = oauthData.code;
        break;
      case 'clientId':
        payload[value] = provider.clientId;
        break;
      case 'redirectUri':
        payload[value] = provider.redirectUri;
        break;
      default:
        payload[value] = oauthData[key];
      }
    }

    if (oauthData.state) {
      payload.state = oauthData.state;
    }

    const serverUrl   = this.config.joinBase(provider.url);
    const credentials = this.config.withCredentials ? 'include' : 'same-origin';

    return this.config.client.post(serverUrl, payload, {credentials: credentials});
  }

  buildQuery(provider) {
    let query = {};
    const urlParams   = ['defaultUrlParams', 'requiredUrlParams', 'optionalUrlParams'];

    urlParams.forEach( params => {
      (provider[params] || []).forEach( paramName => {
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

const camelCase = function(name) {
  return name.replace(/([\:\-\_]+(.))/g, function(_, separator, letter, offset) {
    return offset ? letter.toUpperCase() : letter;
  });
};
