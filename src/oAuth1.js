import {inject} from 'aurelia-dependency-injection';
import {buildQueryString} from 'aurelia-path';
import extend from 'extend';
import {Storage} from './storage';
import {Popup} from './popup';
import {BaseConfig} from './baseConfig';

@inject(Storage, Popup, BaseConfig)
export class OAuth1 {
  constructor(storage, popup, config) {
    this.storage  = storage;
    this.config   = config;
    this.popup    = popup;
    this.defaults = {
      name: null,
      url: null,
      authorizationEndpoint: null,
      scope: null,
      scopePrefix: null,
      scopeDelimiter: null,
      redirectUri: null,
      requiredUrlParams: null,
      defaultUrlParams: null,
      oauthType: '1.0',
      popupOptions: { width: null, height: null }
    };
  }

  open(options, userData) {
    const provider  = extend(true, {}, this.defaults, options);
    const serverUrl = this.config.joinBase(provider.url);

    if (this.config.platform !== 'mobile') {
      this.popup = this.popup.open('', provider.name, provider.popupOptions);
    }

    return this.config.client.post(serverUrl)
      .then(response => {
        const url = provider.authorizationEndpoint + '?' + buildQueryString(response);

        if (this.config.platform === 'mobile') {
          this.popup = this.popup.open(url, provider.name, provider.popupOptions);
        } else {
          this.popup.popupWindow.location = url;
        }

        const popupListener = this.config.platform === 'mobile'
                            ? this.popup.eventListener(provider.redirectUri)
                            : this.popup.pollPopup(provider.redirectUri);

        return popupListener.then(result => this.exchangeForToken(result, userData, provider));
      });
  }

  exchangeForToken(oauthData, userData, provider) {
    const data        = extend(true, {}, userData, oauthData);
    const serverUrl   = this.config.joinBase(provider.url);
    const credentials = this.config.withCredentials ? 'include' : 'same-origin';

    return this.config.client.post(serverUrl, data, {credentials: credentials});
  }
}
