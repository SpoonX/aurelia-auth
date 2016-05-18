# Refresh tokens

A refresh_token is just another jwt with a longer ttl than the access_token. The refresh tokens is then used to refresh the access_token, either automatically, whenever the access_token expires, or by calling `authService.updateToken()` manually.

For example, you could set the ttl of the access_token to 1 day and the ttl of the refresh_token to 30 days. As a result, a user stays logged in for 30 days after his last activity.

## Configuration

### Client

Following are the configuration options for refresh token. Most importantly, you want to set `useRefreshToken: true` in your `authConfig.js`. The `refreshTokenProp` property in the login response body will then be used later to refresh your access_token.

```js
// Refresh Token Options
// =====================

// Option to turn refresh tokens On/Off
useRefreshToken: false,
// The option to enable/disable the automatic refresh of Auth tokens using Refresh Tokens
autoUpdateToken: true,
// Oauth Client Id
clientId: false,
// The the property from which to get the refresh token after a successful token refresh
refreshTokenProp: 'refresh_token',

// If the property defined by `refreshTokenProp` is an object:
// -----------------------------------------------------------

// This is the property from which to get the token `{ "refreshTokenProp": { "refreshTokenName" : '...' } }`
refreshTokenName: 'token',
// This allows the refresh token to be a further object deeper `{ "refreshTokenProp": { "refreshTokenRoot" : { "refreshTokenName" : '...' } } }`
refreshTokenRoot: false,

```

### Server

Upon login your server needs to send a second jwt with a longer ttl which will be used as refresh_token. So, the body of your server response might look like this:

```js
{
  userId: 6143772,
  access_token: 'this_is_the.access_token.jwt',
  refresh_token: 'this_is_the.refresh_token.jwt'
}
```

On calling `authService.updateToken()` or after expiration of the access_token if `autoUpdateToken` is set true (default), a post request is send to your configs `loginUrl` with the (probably now expired) access_token in the header and following body:

```js
{
  grant_type: 'refresh_token',
  refresh_token: 'the_refresh_token'
  // client_id: 'the_client_id'  // if selected in your config
}
```

If all goes well, the server sends back the same response as after regular login and the now refreshed tokens will replace the old ones.
