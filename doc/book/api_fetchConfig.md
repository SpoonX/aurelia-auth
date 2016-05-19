# FetchConfig

## Configuring the aurelia fetch client

Aurelia-authentication uses [aurelia-api](https://github.com/SpoonX/aurelia-api), which has support for [multiple endpoints](https://spoonx-aurelia-api/getting-started#multiple-endpoints).
By default, aurelia-authentication uses the HttpClient from [aurelia-fetch-client](https://github.com/aurelia/fetch-client) when no specific endpoint has been configured, and if no [default endpoint](https://spoonx-aurelia-api/getting-started#default-endpoint) was configured.
So, if you want aurelia-authentication to use your **default** endpoint, you only have to configure aurelia-api.
If you wish to use a **specific** endpoint to have aurelia-authentication talk to, you have to set the `endpoint` config option to a string, being the endpoint name.

### Configure aurelia-api endpoints

If you are using [aurelia-api](https://spoonx-aurelia-api/), you can simply use the `configureEndpoints` config option. Set this to an array of endpoint names to configure, and aurelia-authentication will do the rest, and make sure that all requests to these endpoints (when authenticated) get enriched with the authorization header.

## Configure the Fetch Client

### The aurelia Fetch Client singleton

If you don't want to use aurelia-api, you have to configure the aurelia-fetch-client. In your aurelia app file, inject the {FetchConfig} class from aurelia-authentication. We need to explicitly opt-in for the configuration of your fetch client by calling the configure function of the FetchConfig class:

```js
import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {FetchConfig} from 'aurelia-authentication';

@inject(Router,FetchConfig)
export class App {

  constructor(router, fetchConfig) {
    this.router = router;
    this.fetchConfig = fetchConfig;
    //...
  }

  activate() {
    // this will add the interceptor for the Authorization header to the HttpClient singleton
    this.fetchConfig.configure();
  }
}
```

### An own Fetch Client, Rest Client or endpoint

You also can configure you own Fetch Client instance:

```js
this.fetchConfig.configure(new HttpClient);
```

Or a Rest Client instance:

```js
this.fetchConfig.configure(new Rest);
```

Or an enpoint by name:

```js
this.fetchConfig.configure('api');
```

Or any of the above in an Array:

```js
this.fetchConfig.configure(['api', 'github']);
```
