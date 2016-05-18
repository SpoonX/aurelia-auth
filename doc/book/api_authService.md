# AuthService class

```javascript
import {AuthService} from 'aurelia-authentication';
```

----------

## Properties

### .client

| Type | Description                                                                   |
| ---- | ----------------------------------------------------------------------------- |
| Rest | The configured aurelia-api Rest instance used for all authentication requests |

### .config

| Type       | Description                                                     |
| ---------- | --------------------------------------------------------------- |
| BaseConfig | The BaseConfig instance with the current configuration settings |

### .authentication

| Type           | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| Authentication | The Authentication instance which manages all the authentication requests |

----------

## Methods

----------

### .getMe([criteria])

Retrieves (GET) the profile from the BaseConfig.profileUrl. Accepts criteria. If the criteria is a string or a number, {id: criteria} will be passed to the server.

#### Parameters

| Parameter | Type                      | Description                           |
| --------- | ------------------------- | ------------------------------------- |
| criteria  | {[{} / number ´/ string]} | An ID, or object of supported filters |

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

Updates (PUT) the profile to the BaseConfig.profileUrl. Accepts criteria. If the criteria is a string or a number, {id: criteria} will be passed to the server.

#### Parameters

| Parameter | Type                     | Description                           |
| --------- | ------------------------ | ------------------------------------- |
| body      | {}                       | The body                              |
| criteria  | [{} / number / string]   | An ID, or object of supported filters |

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

### .isAuthenticated()

Checks if there is a (valid) token in storage. If the token is isExpired and  BaseConfig.autoUpdateToken===true, it returns true and a new access token automatically requested using the refesh_token.

#### Returns

`true`, for Non-JWT and unexpired JWT, `false` for no token or expired JWT

#### Example

```js
let auth = this.authService.isAuthenticated();
```

----------

### .getTtl()

Gets ttl of the access token in seconds

#### Returns

A `Number` for JWT or `NaN` for other tokens.

#### Example

```js
let timeLeft = this.authService.getTimeLeft();
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
let isExpired = this.authService.getTokenPayload();
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

Signup locally using BaseConfig.signupUrl either with credentials strings or an object. Can pass options to aurelia-apis Rest.post request. Logs in if BaseConfig.loginOnSignup is set. Else redirects to BaseConfig.signupRedirect if set. The redirectUri parameter overwrites the BaseConfig.signupRedirect setting. Set to 0 it prevents redirection and set to a string, will redirect there.

#### Parameters v1

| Parameter     | Type                    | Description                                          |
| ------------- | ----------------------- | ---------------------------------------------------- |
| displayName   | string                  | Passed on as displayName: displayName                |
| email         | string                  | Passed on as email: email                            |
| password      | string                  | Passed on as password: password                      |
| [options]     | [{}]                    | Options object passed to aurelia-api                 |
| [redirectUri] | [string/0/null/undef ]  | redirectUri overwrite. 0=off, null/undef=use default |

#### Parameters v2

| Parameter     | Type                    | Description                                          |
| ------------- | ----------------------- | ---------------------------------------------------- |
| credentials   | {}                      | Passed on credentials object                         |
| [options]     | [{}]                    | Options object passed to aurelia-api                 |
| [redirectUri] | [string/0/null/undef ]  | redirectUri overwrite. 0=off, null/undef=use default |

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
}, {headers: {Authorization: 'none'}},
  "#/confirm-page")
  .then(response => {
    console.log(response);
  });

```

----------

### .login(email, password[, options[, redirectUri]])

### .login(credentials[, options[, redirectUri]])

Login locally using BaseConfig.loginUrl either with credentials strings or an object. Can pass options to aurelia-apis Rest.post request. Redirects to BaseConfig.loginRedirect if set. The redirectUri parameter overwrites the BaseConfig.loginRedirect setting. Set to 0 it prevents redirection and set to a string, will redirect there.

#### Parameters v1

| Parameter     | Type                    | Description                                          |
| ------------- | ----------------------- | ---------------------------------------------------- |
| email         | string                  | Passed on as email: email                            |
| password      | string                  | Passed on as password: password                      |
| [options]     | [{}]                    | Options object passed to aurelia-api                 |
| [redirectUri] | [string/0/null/undef ]  | redirectUri overwrite. 0=off, null/undef=use default |

#### Parameters v2

| Parameter     | Type                    | Description                                          |
| ------------- | ----------------------- | ---------------------------------------------------- |
| credentials   | {}                      | Passed on credentials object                         |
| [options]     | [{}]                    | Options object passed to aurelia-api                 |
| [redirectUri] | [string/0/null/undef ]  | redirectUri overwrite. 0=off, null/undef=use default |

#### Returns

Promise: response

#### Examples

```js
this.authService.signup('janedoe@example.com', 'securePasword')
  .then(response => {
    console.log(response);
  });
//or
this.authService.signup({
  username: 'janedoe',
  password: 'securePasword'
}, {headers: {Authorization: 'none'}},
  "#/special-page")
  .then(response => {
    console.log(response);
  });

```

----------

### .logout([redirectUri])

Login locally using BaseConfig.loginUrl either with credentials strings or an object. Can pass options to aurelia-apis Rest.post request. Redirects to BaseConfig.loginRedirect if set. The redirectUri parameter overwrites the BaseConfig.loginRedirect setting. Set to 0 it prevents redirection and set to a string, will redirect there.

#### Parameters

| Parameter     | Type                    | Description                                          |
| ------------- | ----------------------- | ---------------------------------------------------- |
| [redirectUri] | [string/0/null/undef ]  | redirectUri overwrite. 0=off, null/undef=use default |

#### Returns

Promise: undefined

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

Authenticate with third-party with the BaseConfig.providers settings. Redirects to BaseConfig.loginRedirect if set. The redirectUri parameter overwrites the BaseConfig.loginRedirect setting. Set to 0 it prevents redirection and set to a string, will redirect there. An optional userData object can be passed on to the thrird-party server.

#### Parameters

| Parameter     | Type                    | Description                                          |
| ------------- | ----------------------- | ---------------------------------------------------- |
| provider      | string                  | Provider name of BaseConfig.providers                |
| [redirectUri] | [string/0/null/undef ]  | redirectUri overwrite. 0=off, null/undef=use default |
| [userData]    | [{}]                    | userData object passed to provider                   |

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

| Parameter     | Type                    | Description                                          |
| ------------- | ----------------------- | ---------------------------------------------------- |
| provider      | string                  | Provider name of BaseConfig.providers                |
| [redirectUri] | [string/0/null/undef ]  | redirectUri overwrite. 0=off, null/undef=use default |

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

*Note*: The redirectUri options might seem unusual. This is to provide backwards compatibility.
