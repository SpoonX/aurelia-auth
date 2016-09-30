import {inject} from 'aurelia-dependency-injection';
import {buildQueryString} from 'aurelia-path';
import extend from 'extend';
import {Storage} from './storage';
import {Popup} from './popup';
import {BaseConfig} from './baseConfig';

@inject(Storage, Popup, BaseConfig)
export class OAuth1 {
  constructor(storage: Storage, popup: Popup, config: BaseConfig) {
    this.storage  = storage;
    this.config   = config;
    this.popup    = popup;
    this.defaults = {
      url                  : null,
      name                 : null,
      popupOptions         : null,
      redirectUri          : null,
      authorizationEndpoint: null
    };
  }

  open(options: {}, userData: {}): Promise<any> {
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
                            : this.popup.pollPopup();

        return popupListener.then(result => this.exchangeForToken(result, userData, provider));
      });
  }

  exchangeForToken(oauthData: {}, userData: {}, provider: string): Promise<any> {
    const data        = extend(true, {}, userData, oauthData);
    const serverUrl   = this.config.joinBase(provider.url);
    const credentials = this.config.withCredentials ? 'include' : 'same-origin';

    return this.config.client.post(serverUrl, data, {credentials: credentials});
  }
}
