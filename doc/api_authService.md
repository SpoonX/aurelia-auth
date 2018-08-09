# AuthService class

```js
import {AuthService} from 'aurelia-authentication';
```

----------

## Binding signals

----------

### authentication-change

Whenever the authentication status changes, a binding signal 'authentication-change' is emitted.

Example:

```html
<div>Time: ${logTime | timeConverter & signal:'authentication-change'}</div>
```

----------

## EventAggregator

----------

### authentication-change

Whenever the authentication status changes, the new status is published with the EventAggregator on the 'authentication-change' channel. 

Example:

```js
  this.eventAggregator.subscribe('authentication-change', authenticated => {
    // your code
  });
```

----------


## Properties

----------

### .client

| Type | Description                                                                   |
| ---- | ----------------------------------------------------------------------------- |
| Rest | The configured aurelia-api Rest instance used for all authentication requests |

----------

### .config

| Type       | Description                                                     |
| ---------- | --------------------------------------------------------------- |
| BaseConfig | The BaseConfig instance with the current configuration settings |

----------

### .authentication

| Type           | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| Authentication | The Authentication instance which manages all the authentication requests |

----------

### .timeoutID

| Type      | Description                              |
| --------- | ---------------------------------------- |
| timeoutID | Id of the currently set login timeout id |

----------

### .authenticated

| Type    | Description                                 |
| ------- | ------------------------------------------- |
| Boolean | Automatically updated authentication status |

----------

## Methods

----------

### .setTimeout(ttl)

Sets the login timeout.

CAUTION: .authenticated and isAuthenticated() might get different results when set manually.

WARNING: Maximum timeout is 2^31 - 1 ms (ca. 24.85d).

#### Parameters

| Parameter | Type     | Description        |
| --------- | ---------| ------------------ |
| ttl       | {Number} | Timeout time in ms |

#### Example

```js
this.authService.setTimeout(10000);
```

----------

### .clearTimeout()

Clears the login timeout. CAUTION: .authenticated and isAuthenticated() might get different results when called manually.

#### Example

```js
this.authService.clearTimeout();
```

----------

### .setResponseObject(response)

Stores and analyses the servers response as Object. Sets login status and timeout.  Publishes 'authentication-change' with the EventAggregator and emits the binding signal 'authentication-change' when the authorization status has changed.

#### Parameters

| Parameter | Type     | Description                |
| --------- | -------- | -------------------------- |
| response  | {Object} | The servers login response |

#### Example

```js
this.authService.setResponseObject({access_token: 'a_fake_token'});
```

----------

### .getMe([criteria])

Retrieves (GET) the profile from the BaseConfig.profileUrl. Accepts criteria. If the criteria is a string or a number, {id: criteria} will be passed to the server.

#### Parameters

| Parameter | Type                     | Description                           |
| --------- | ------------------------ | ------------------------------------- |
| criteria  | {[{} | number | string]} | An ID, or object of supported filters |

#### Returns

A new `Promise` to be resolved with the request, or rejected with an error.

#### Example

```js
this.authService.getMe()
  .then(profile => {
    console.log(profile.username);
  });
```

----------

### .updateMe(body[, criteria])

Updates the profile to the BaseConfig.profileUrl using BaseConfig.profileMethod (default PUT). Accepts criteria. If the criteria is a string or a number, {id: criteria} will be passed to the server.

#### Parameters

| Parameter | Type                     | Description                           |
| --------- | ------------------------ | ------------------------------------- |
| body      | {}                       | The body                              |
| criteria  | [{} | number | string]   | An ID, or object of supported filters |

#### Returns

A new `Promise` to be resolved with the request, or rejected with an error.

#### Example

```js
this.authService.updateMe({fullname: 'Jane Doe'})
  .then(profile => {
    console.log(profile.fullname);
  });
```

----------

### .getAccessToken()

Gets the current access token from storage

#### Returns

A `string` with the access token or `null`.

#### Example

```js
let currentToken = this.authService.getAccessToken();
```

----------

### .getRefreshToken()

Gets the current refresh token from storage

#### Returns

A `string` with the refresh token or `null`.

#### Example

```js
let currentToken = this.authService.getRefreshToken();
```

----------

### .isAuthenticated(callback)

Checks if there is a (valid) token in storage. If the token is isExpired and  BaseConfig.autoUpdateToken===true, it returns true and a new access token automatically requested using the refesh_token. If you use it in a getter, aurelia will dirty check on uodates. Hence, may better either use .authenticated or use the binding signal 'authentication-change' to ensure udpdates.

CAUTION: When you cancel or manually set the timeout, .isAuthenticated and .authenticated could yield different results.

#### Parameters

| Parameter  | Type                             | Description                                              |
| ---------- | -------------------------------- | -------------------------------------------------------- |
| [callback] | (authenticated: boolean) => void | optional callback executed once the status is determined |

#### Returns

`true`, for Non-JWT and unexpired JWT, `false` for no token or expired JWT

#### Example

```js
  isAuthenticated() {
    return this.authService.isAuthenticated();
  }
```

```html
<li repeat.for="row of router.navigation | authFilter: isAuthenticated & signal: 'authentication-change" class="${row.isActive ? 'active' : ''}">
      <a data-toggle="collapse" data-target="#bs-example-navbar-collapse-1.in" href.bind="row.href">${row.title}</a>
  </li>

```

----------

### .isAuthenticatedAsync()

Asynchronously checks if there is a (valid) token in storage. If the token is isExpired and  BaseConfig.autoUpdateToken===true, it resolves when a new access token automatically requested using the refesh_token.

CAUTION: When you cancel or manually set the timeout, .isAuthenticatedAsync and .authenticated could yield different results.

#### Returns

`Promise.resolve(true)`, for Non-JWT and unexpired JWT, `Promise.resolve(false)` for no token or expired JWT

#### Example

```js
  isAuthenticatedAsync() {
    return this.authService.isAuthenticatedAsync().then(result => {
      console.log("is authenticated=",result);
      return result;
    });
  }
```

----------

### .getExp()

Gets exp of the access token in milliseconds

#### Returns

A `Number` for JWT or `NaN` for other tokens.

#### Example

```js
let exp = this.authService.getExp();
```

----------

### .getTtl()

Gets ttl of the access token in seconds

#### Returns

A `Number` for JWT or `NaN` for other tokens.

#### Example

```js
let ttl = this.authService.getTtl();
```

----------

### .isTokenExpired()

Checks whether the token is expired

#### Returns

A `boolean` for JWT or `undefined` for other tokens.

#### Example

```js
let isExpired = this.authService.isTokenExpired();
```

----------

### .getTokenPayload()

Gets the current token payload from storage

#### Returns

A `Object` for JWT or `null` for other tokens.

#### Example

```js
let payload = this.authService.getTokenPayload();
```

----------

### .getIdTokenPayload()

Gets the current id token payload from storage

#### Returns

A `Object` for JWT or `null` for other tokens.

#### Example

```js
let payload = this.authService.getIdTokenPayload();
```

----------

### .updateToken()

Request a new token using the refresh_token. Returns a Promise< boolean > with the isAuthenticated() result afterwards. Parallel calls will resolve with the same server response.

#### Returns

Promise< boolean > with the isAuthenticated() result.

#### Example

```js
this.authService.updateToken()
  .then(result => auth = result);
```

----------

### .signup(displayName, email, password[, options[, redirectUri]])

### .signup(credentials[, options[, redirectUri]])

Signup locally using BaseConfig.signupUrl either with credentials strings or an object. Can pass options to aurelia-apis Rest.post request. Logs in if BaseConfig.loginOnSignup is set and saves the login response in local storage (default). Else redirects to BaseConfig.signupRedirect if set. The redirectUri parameter overwrites the BaseConfig.signupRedirect setting. Set to 0 it prevents redirection and set to a string, will redirect there.

#### Parameters v1

| Parameter     | Type                    | Description                                          |
| ------------- | ----------------------- | ---------------------------------------------------- |
| displayName   | string                  | Passed on as displayName: displayName                |
| email         | string                  | Passed on as email: email                            |
| password      | string                  | Passed on as password: password                      |
| [options]     | [{}]                    | Options object passed to aurelia-api                 |
| [redirectUri] | [string]                | redirectUri overwrite. '' = no redirection           |

#### Parameters v2

| Parameter     | Type                    | Description                                          |
| ------------- | ----------------------- | ---------------------------------------------------- |
| credentials   | {}                      | Passed on credentials object                         |
| [options]     | [{}]                    | Options object passed to aurelia-api                 |
| [redirectUri] | [string]                | redirectUri overwrite. '' = no redirection           |

#### Returns

Promise: response

#### Examples

```js
this.authService.signup('Jane Doe', 'janedoe@example', 'securePasword')
  .then(response => {
    console.log(response);
  });
//or
this.authService.signup({
  fullname: 'Jane Doe',
  username: 'janedoe',
  password: 'securePasword'
}, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
  "#/confirm-page")
  .then(response => {
    console.log(response);
  });

```

----------

### .login(email, password[, options[, redirectUri]])

### .login(credentials[, options[, redirectUri]])

Login locally using BaseConfig.loginUrl either with credentials strings or an object. Can pass options to aurelia-apis Rest.post request. The login response is saved in local storage (default). Redirects to BaseConfig.loginRedirect if set. The redirectUri parameter overwrites the BaseConfig.loginRedirect setting. Set to 0 it prevents redirection and set to a string, will redirect there.

#### Parameters v1

| Parameter     | Type                    | Description                                          |
| ------------- | ----------------------- | ---------------------------------------------------- |
| email         | string                  | Passed on as email: email                            |
| password      | string                  | Passed on as password: password                      |
| [options]     | [{}]                    | Options object passed to aurelia-api                 |
| [redirectUri] | [string]                | redirectUri overwrite. '' = no redirection           |

#### Parameters v2

| Parameter     | Type                    | Description                                          |
| ------------- | ----------------------- | ---------------------------------------------------- |
| credentials   | {}                      | Passed on credentials object                         |
| [options]     | [{}]                    | Options object passed to aurelia-api                 |
| [redirectUri] | [string]                | redirectUri overwrite. '' = no redirection           |

#### Returns

Promise: response

#### Examples

```js
this.authService.login('janedoe@example.com', 'securePasword')
  .then(response => {
    console.log(response);
  });
//or
this.authService.login({
  username: 'janedoe',
  password: 'securePasword'
}, {headers: {Authorization: 'none'}},
  "#/special-page")
  .then(response => {
    console.log(response);
  });
  // or for eg OpenIddict
this.authService.login({
  username: this.email,
  password: this.password,
  grant_type: "password"
}, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})  
  .then(response => {
    console.log(response);
  });

```

----------

### .logout([redirectUri [, query [, name]]])

Logout locally by deleting the authentication information from the storage. Redirects to BaseConfig.logoutRedirect if set. The redirectUri parameter overwrites the BaseConfig.logoutRedirect setting. Set to 0 it prevents redirection. Set to a string, will redirect there. If BaseConfig.logoutUrl is set, a logout request is send to the server first using the BaseConfig.logoutMethod.

#### Parameters

| Parameter     | Type      | Description                                 |
| ------------- | --------- | ------------------------------------------- |
| [redirectUri] | [string]  | redirectUri overwrite. '' = no redirection  |
| [query]       | [string]  | optional query string for the uri           |
| [name]        | [string]  | optional provider logout and state checking |

#### Returns

Promise: undefined
or if the logoutUrl is set
Promise: response

#### Examples

```js
this.authService.logout("#/special-page");
//or
this.authService.logout()
  .then(() => {
      alert('Bye');
  });

```

----------

### .authenticate(name[, redirectUri[, userData]])

Authenticate with third-party with the BaseConfig.providers settings. The login response is saved in local storage (default). Redirects to BaseConfig.loginRedirect if set. The redirectUri parameter overwrites the BaseConfig.loginRedirect setting. Set to 0 it prevents redirection and set to a string, will redirect there. An optional userData object can be passed on to the third-party server.

#### Parameters

| Parameter     | Type      | Description                                |
| ------------- | --------- | ------------------------------------------ |
| provider      | string    | Provider name of BaseConfig.providers      |
| [redirectUri] | [string]  | redirectUri overwrite. '' = no redirection |
| [userData]    | [{}]      | userData object passed to provider         |

#### Returns

Promise: response

#### Examples

```js
this.authService.authenticate('facebook', '#/facebook-post-page')
  .then(response => {
    console.log(response);
  });  
```

### .unlink(name[, redirectUri])

Unlink third-party with the BaseConfig.providers settings. Optionally redirects afterwards using the redirectUri parameter.

#### Parameters

| Parameter     | Type      | Description                                |
| ------------- | --------- | ------------------------------------------ |
| provider      | string    | Provider name of BaseConfig.providers      |
| [redirectUri] | [string]  | redirectUri overwrite. '' = no redirection |

#### Returns

Promise: response

#### Examples

```js
this.authService.unlink('facebook', '#/facebook-post-unlink')
  .then(response => {
    console.log(response);
  });  
```

----------
