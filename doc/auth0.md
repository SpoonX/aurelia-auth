# Authenticating with Auth0 using the Lock widget

The Auth0 provider is different than the other providers you normally use with `aurelia-authentication`. It should be the only provider configured in your app, and you need to set at least the `clientId` and `clientDomain` config properties. The `oauthType` property must be set equal to *auth0-lock*.

At the time of writing this, it relies by default on the [Auth0 Lock](https://auth0.com/lock) library, that handles both the UI and the logic for all the authentication tasks. You can load it by including a script tag directly in your index.html file, or alternatively with a loader of your choice.

You cannot use the `open` method with this provider, but you'll always call `authenticate` instead (see the code snippet at the end of this article). The `authenticate` method will return an object with an `access_token` property, but despite its name that property will contain an **ID Token** (in the form of a *JWT*) containing at least the user's `sub` id. The login flow is described better in this [article](https://auth0.com/docs/protocols#oauth-for-native-clients-and-javascript-in-the-browser).

Other *Lock* properties should be set under the `lockOptions` config property, except for:

- `popupOptions` should be set on the root of the provider config object, for consistency with other providers
- `state` should be set on the root of the provider option, and its completely optional like with other providers

## Sample login method snippet (ES6)

```js
import {Cookie} from 'aurelia-cookie';

...

  login() {
    // AuthService.onLogout() will be called, when the token expires
    // or AuthService.logout() is called manually
    this.authService.onLogout = () => {
      Cookie.delete('cookie-bearer');
    }

    return this.authService.authenticate('auth0')
      .then(response => {
        // you can set a cookie for cookie based authentication
        let jwtExp = this.authService.getExp();
        let expiryDate = new Date(0);
        expiryDate.setUTCSeconds(jwtExp);
        Cookie.set('cookie-bearer', response.access_token, {
          expire: expiryDate,
          secure: window.location.protocol === 'https:' ? true : false  // true in production
        });
      });
  };
```

## Setting auth0 lock params
In case you need to get more than just an accesstoken, you must modify the lockOptions as shown below. Parameters are described here: [Lock Authentication params](https://auth0.com/docs/libraries/lock/v10/sending-authentication-parameters)

```
const config = {
    baseUrl: endpoints.auth,
    configureEndpoints: ['auth', 'api'],
    providers: {
        auth0: {
            name: 'auth0',
            oauthType: 'auth0-lock',
            responseType: 'token',
            clientId: '.......',
            clientDomain: '..........auth0.com',
            lockOptions: {
                popup: false,
                auth: {
                    params: { scope: 'openid email name picture' }
               }
            },
            state: function () {
                return Math.random().toString(36).substr(2);
            }
        },
    }
};
```
