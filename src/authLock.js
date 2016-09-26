import {PLATFORM} from 'aurelia-pal';
import {inject} from 'aurelia-dependency-injection';
import extend from 'extend';
import {Storage} from './storage';
import {BaseConfig} from './baseConfig';
import {PopupError} from './popup';

@inject(Storage, BaseConfig)
export class AuthLock {
  constructor(storage, config) {
    this.storage      = storage;
    this.config       = config;
    this.defaults     = {
      name: null,
      state: null,
      scope: null,
      scopeDelimiter: null,
      redirectUri: null,
      clientId: null,
      clientDomain: null,
      display: 'popup',
      lockOptions: {
        popup: true
      },
      popupOptions: null,
      responseType: 'token'
    };
  }

  open(options, userData) {
    // check pre-conditions
    if (typeof PLATFORM.global.Auth0Lock !== 'function') {
      throw new Error('Auth0Lock was not found in global scope. Please load it before using this provider.');
    }
    const provider  = extend(true, {}, this.defaults, options);
    const stateName = provider.name + '_state';

    if (typeof provider.state === 'function') {
      this.storage.set(stateName, provider.state());
    } else if (typeof provider.state === 'string') {
      this.storage.set(stateName, provider.state);
    }

    this.lock = this.lock || new PLATFORM.global.Auth0Lock(provider.clientId, provider.clientDomain);

    const openPopup = new Promise((resolve, reject) => {
      let opts = provider.lockOptions;
      opts.popupOptions = provider.popupOptions;
      opts.responseType = provider.responseType;
      opts.callbackURL = provider.redirectUri;
      opts.authParams = opts.authParams || {};
      if (provider.scope) opts.authParams.scope = provider.scope;
      if (provider.state) opts.authParams.state = this.storage.get(provider.name + '_state');

      this.lock.show(provider.lockOptions, (err, profile, tokenOrCode) => {
        if (err) {
          reject(new PopupError('AuthLock error', err));
        } else {
          resolve({
            //NOTE: this is an id token (JWT) and it shouldn't be named access_token
            access_token: tokenOrCode
          });
        }
      });
    });

    return openPopup
      .then(lockResponse => {
        if (provider.responseType === 'token' ||
            provider.responseType === 'id_token%20token' ||
            provider.responseType === 'token%20id_token'
        ) {
          return lockResponse;
        }
        //NOTE: 'code' responseType is not supported, this is an OpenID response (JWT token)
        //      and code flow is not secure client-side
        throw new Error('Only `token` responseType is supported');
      });
  }
}
