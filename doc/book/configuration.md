# Configuration

Aurelia-authentication comes mostly pre-configured. During plugin configuration you can apply your custom setting. For configuration options and defaults see [baseConfig](baseConfig.md).

## Configure with object or function

Aurelia-authentication can be configured with either an object or an configuration function.

```js
import authConfig from './authConfig';

export function configure(aurelia) {
  aurelia.use
    /* Your other plugins and init code */

    /* configure aurelia-authentication with a config object */
    .plugin('aurelia-authentication', {baseUrl: 'https://api.example.com/auth'});

    /* configure aurelia-authentication from config file */
    .plugin('aurelia-authentication', baseConfig => {
        baseConfig.configure(authConfig);
    });
  });
```

## With aurelia-fetch-client

Aurelia-authentication can be used with the aurelia-fetch-client. After configuration, the HttpClient is wrapped automatically in an aurelia-api Rest client. The Rest client is then available under baseConfig.client or authService.client and the HttpClient under baseConfig.client.client or authService.client.client.

```js
import authConfig from './authConfig';

export function configure(aurelia) {
  aurelia.use
    /* Your other plugins and init code */

    .plugin('aurelia-authentication', baseConfig => {
        baseConfig.configure(authConfig);
    });

    /* At this point, baseConfig.client is the aurelia-api Rest client. The HttpClient is the baseConfig.client.client */
    baseConfig.client.client
      .withBaseUrl('api/')
      .withDefaults({
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'Fetch'
        }
      })
      .withInterceptor({
        request(request) {
          console.log(`Requesting ${request.method} ${request.url}`);
          return request; // you can return a modified Request, or you can short-circuit the request by returning a Response
        },
        response(response) {
          console.log(`Received ${response.status} ${response.url}`);
          return response; // you can return a modified Response
        }
      });
   });
```

## With aurelia-api

Aurelia-authentication is best used with the endpoints of aurelia-api.

```js
export function configure(aurelia) {
  aurelia.use
    /* Your other plugins and init code */

    /* setup the api endpoints first */
    .plugin('aurelia-api', configure => {
      configure
        .registerEndpoint('auth', 'https://myapi.org/auth')
        .registerEndpoint('protected-api', 'https://myapi.org/protected-api')
        .registerEndpoint('public-api', 'http://myapi.org/public-api');
        .setDefaultEndpoint('auth');
    })

    /* configure aurelia-authentication to use above aurelia-api endpoints */
    .plugin('aurelia-authentication', baseConfig => {
        baseConfig.configure({
          endpoint: 'auth',                   // '' for the default endpoint
          configureEndpoints: ['auth', 'api'] // '' for the default endpoint
        });

        /* At this point, baseConfig.client is the aurelia-api Rest client from the 'auth' endpoint. The HttpClient is baseConfig.client.client */
    });
  });
```
