# Usage

## Add a configuration file

Set your custom configuration. You can find all options and the default values in the [baseConfig](baseConfig.md).

```js
/* authConfig.js */
var baseConfig = {
    endpoint: 'auth',             // use 'auth' endpoint for the auth server
    configureEndpoints: ['auth']  // add Authorization header to 'auth' endpoint
    facebook: {
        clientId: 'your client id' // set your third-party providers client ids
    }
```

## Configure the plugin

Register the plugin and apply your `authConfig`.

```js
/* main.js */
import authConfig from './authConfig';

aurelia.use
  /* Your other plugins and init code */
  .plugin('aurelia-api', config => {
    // Register an authentication hosts
    config.registerEndpoint('auth');
  })
  /* configure aurelia-authentication */
  .plugin('aurelia-authentication', baseConfig => {
      baseConfig.configure(authConfig);
  });
```

## Use AuthService in a view-model

```js
import {AuthService} from 'aurelia-authentication';
import {inject} from 'aurelia-framework';

@inject(AuthService)
export class Login {
    constructor(authService) {
        this.authService   = authService;
        this.authenticated = false;
        this.providers     = [];
    };

    // use authService.login(credentialsObject) to login to your auth server
    login(credentialsObject) {
      return this.authService.login(credentialsObject)
        .then(response => {
            this.authenticated = this.authService.isAuthenticated();
        });
    };

    // use authService.logout to delete stored tokens
    logout() {
      return this.authService.logout()
        .then(() => {
          this.authenticated = this.authService.isAuthenticated();
        });
    }

    // use authenticate(providerName) to get third-party authentication
    authenticate(name) {
      return this.authService.authenticate(name)
        .then(response => {
          this.authenticated  = this.authService.isAuthenticated();
          this.provider[name] = true;
        });
    }
}
```
