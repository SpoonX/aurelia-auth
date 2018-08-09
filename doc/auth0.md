# Authenticating with Auth0 using the Lock widget

The Auth0 provider is different than the other providers you normally use with `aurelia-authentication`. It should be the only provider configured in your app, and you need to set at least the `clientId` and `clientDomain` config properties. The `oauthType` property must be set equal to *auth0-lock*.

At the time of writing this, it relies by default on the [Auth0 Lock](https://auth0.com/lock) library, that handles both the UI and the logic for all the authentication tasks. You can load it by including a script tag directly in your index.html file, or alternatively with a loader of your choice.  It is highly encouraged to use Lock version 11 or greater as in mid 2018, Auth0 is beginning to decpreciate acccess to and ability to integrate with older API endpoints and versions of Lock.

You cannot use the `open` method with this provider, but you'll always call `authenticate` instead (see the code snippet at the end of this article). The `authenticate` method will return an object with an `access_token` and `id_token` properties.  The login flow is described better in this [article](https://auth0.com/docs/protocols#oauth-for-native-clients-and-javascript-in-the-browser).

Previous versions of the Auth0 integration only returned an `access_token`, but despite its name the property contained an **ID Token** (in the form of a *JWT*) containing at least the user's `sub` id. To better conform with Auth0 standards, this has changed and you will now recieve both the `access_token` and `id_token`.  With the new `getIdTokenPayload()` function you can then easily grab the payload of the `id_token` and use it within your application.

With the change to the returned object, if you want to use the `access_token`, you must set the configuration option `getAccessTokenFromResponse` to `true`.  The `access_token` returned from Auth0 will be opaque and not in a standard JWT format. However it can still be used to authenticate to certain Auth0 API endpoints such as [/userinfo](https://auth0.com/docs/api/authentication#user-profile).  

If you want an `access_token` in JWT format that is not opaque and be also be used to store/retreive information in it, then in the Auth0 portion of the config you must pass along an `audience`.  It would look something like this (other options omitted for brevity):
```
{
  auth0: {
    lockOptions: {
      auth: {
        audience: 'https://YOUR_AUTH0_URL/api/v2/'
      }
    }
  }
}
```


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
If you need to configure additional parameters to pass to Auth0, then you can pass those in the `lockOptions` object as seen below. Parameters are described here: [Lock Authentication params](https://auth0.com/docs/libraries/lock/v11/configuration)

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
