import {inject} from 'aurelia-dependency-injection';
import {buildQueryString} from 'aurelia-path';
import extend from 'extend';
import {Storage} from './storage';
import {Popup} from './popup';
import {BaseConfig} from './baseConfig';

/**
 * OAuth2 service class
 *
 * @export
 * @class OAuth2
 */
@inject(Storage, Popup, BaseConfig)
export class OAuth2 {
  /**
   * Creates an instance of OAuth2.
   *
   * @param {Storage} storage The Storage instance
   * @param {Popup}   popup   The Popup instance
   * @param {Config}  config  The Config instance
   *
   * @memberOf OAuth2
   */
  constructor(storage: Storage, popup: Popup, config: BaseConfig) {
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

  /**
   * Open OAuth2 flow
   *
   * @param {{}} options  OAuth2 and dialog options
   * @param {{}} userData Extra data for the authentications server
   * @returns {Promise<any>} Authentication server response
   *
   * @memberOf OAuth2
   */
  open(options: {}, userData: {}): Promise<any> {
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

  /**
   * Exchange the code from the external provider by a token from the authentication server
   *
   * @param {{}} oauthData The oauth data from the external provider
   * @param {{}} userData Extra data for the authentications server
   * @param {string} provider The name of the provider
   * @returns {Promise<any>} The authenticaion server response with the token
   *
   * @memberOf OAuth2
   */
  exchangeForToken(oauthData: {}, userData: {}, provider: string): Promise<any> {
    const data = extend(true, {}, userData, {
      clientId   : provider.clientId,
      redirectUri: provider.redirectUri
    }, oauthData);

    const serverUrl   = this.config.joinBase(provider.url);
    const credentials = this.config.withCredentials ? 'include' : 'same-origin';

    return this.config.client.post(serverUrl, data, {credentials: credentials});
  }

  /**
   * Create the query string for a provider
   *
   * @param {string} provider The provider name
   * @returns {string} The resulting query string
   *
   * @memberOf OAuth2
   */
  buildQuery(provider: string): string {
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

  /**
   * Send logout request to oath2 rpovider
   *
   * @param {[{}]} options Logout option
   * @returns {Promise<any>} The OAuth provider response
   *
   * @memberOf OAuth2
   */
  close(options?: {}): Promise<any> {
    const provider  = extend(true, {}, this.defaults, options);
    const url       = provider.logoutEndpoint + '?'
                    + buildQueryString(this.buildLogoutQuery(provider));
    const popup     = this.popup.open(url, provider.name, provider.popupOptions);
    const openPopup = (this.config.platform === 'mobile')
                    ? popup.eventListener(provider.postLogoutRedirectUri)
                    : popup.pollPopup();

    return openPopup;
  }

  /**
   * Build query for logout request
   *
   * @param {string} provider The rpovider name
   * @returns {string} The logout query string
   *
   * @memberOf OAuth2
   */
  buildLogoutQuery(provider: string): string {
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

/**
 * camelCase a string
 *
 * @param {any} name String to be camelized
 * @returns {string} The camelized name
 */
function camelCase(name: string): string {
  return name.replace(/([:\-_]+(.))/g, function(_, separator, letter, offset) {
    return offset ? letter.toUpperCase() : letter;
  });
}
