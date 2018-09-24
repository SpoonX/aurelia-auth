import {PLATFORM} from 'aurelia-pal';
import {inject} from 'aurelia-dependency-injection';
import extend from 'extend';
import {Storage} from './storage';
import {BaseConfig} from './baseConfig';

@inject(Storage, BaseConfig)
export class AuthLock {
  constructor(storage: Storage, config: BaseConfig) {
    this.storage  = storage;
    this.config   = config;
    this.defaults = {
      name          : null,
      state         : null,
      scope         : null,
      scopeDelimiter: ' ',
      redirectUri   : null,
      clientId      : null,
      clientDomain  : null,
      display       : 'popup',
      lockOptions   : {},
      popupOptions  : null,
      responseType  : 'token'
    };
  }

  open(options: {}, userData?: {}): Promise<any> {
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

    // transform provider options into auth0-lock options
    let opts = {
      auth: {
        params: {}
      }
    };

    if (Array.isArray(provider.scope) && provider.scope.length) {
      opts.auth.params.scope = provider.scope.join(provider.scopeDelimiter);
    }
    if (provider.state) {
      opts.auth.params.state = this.storage.get(provider.name + '_state');
    }
    if (provider.display === 'popup') {
      opts.auth.redirect = false;
    } else if (typeof provider.redirectUri === 'string') {
      opts.auth.redirect = true;
      opts.auth.redirectUrl = provider.redirectUri;
    }
    if (typeof provider.popupOptions === 'object') {
      opts.popupOptions = provider.popupOptions;
    }
    if (typeof provider.responseType === 'string') {
      opts.auth.responseType = provider.responseType;
    }
    let lockOptions = extend(true, {}, provider.lockOptions, opts);

    this.lock = this.lock || new PLATFORM.global.Auth0Lock(provider.clientId, provider.clientDomain, lockOptions);

    const openPopup = new Promise((resolve, reject) => {
      this.lock.on('authenticated', authResponse => {
        if (!lockOptions.auth.redirect) {
          // hides the lock popup, as it doesn't do so automatically
          this.lock.hide();
        }
        resolve({
          access_token: authResponse.accessToken,
          id_token    : authResponse.idToken
        });
      });
      this.lock.on('unrecoverable_error', err => {
        if (!lockOptions.auth.redirect) {
          // hides the lock popup, as it doesn't do so automatically
          this.lock.hide();
        }
        reject(err);
      });
      this.lock.show();
    });

    return openPopup
      .then(lockResponse => {
        if (provider.responseType === 'token'
          || provider.responseType === 'id_token%20token'
          || provider.responseType === 'token%20id_token'
          || provider.responseType === 'token id_token'
        ) {
          return lockResponse;
        }
        //NOTE: 'code' responseType is not supported, this is an OpenID response (JWT token)
        //      and code flow is not secure client-side
        throw new Error('Only `token` responseType is supported');
      });
  }
}
