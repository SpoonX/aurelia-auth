<a name="3.3.0"></a>
# [3.3.0](https://github.com/spoonx/aurelia-authentication/compare/v3.2.0...v3.3.0) (2017-03-06)


### Bug Fixes

* **authService:** handle logout also if server logoutUrl fails ([403a498](https://github.com/spoonx/aurelia-authentication/commit/403a498))


### Features

* **authentication:** include response object in 'Token not found in response' errors ([d5131ca](https://github.com/spoonx/aurelia-authentication/commit/d5131ca))



<a name="3.2.0"></a>
# [3.2.0](https://github.com/spoonx/aurelia-authentication/compare/v3.1.0...v3.2.0) (2017-01-13)


### Bug Fixes

* **authService:** allow object passed as second arg to authService.login() ([da294c4](https://github.com/spoonx/aurelia-authentication/commit/da294c4))
* **interceptor:** fix automatic refresh token usage ([62d61de](https://github.com/spoonx/aurelia-authentication/commit/62d61de))



<a name="3.1.0"></a>
# [3.1.0](https://github.com/spoonx/aurelia-authentication/compare/v3.0.3...v3.1.0) (2016-11-02)


### Bug Fixes

* **auth0:** Close popup after an unrecoverable error ([36aa441](https://github.com/spoonx/aurelia-authentication/commit/36aa441))
* **auth0:** Fix auth rejection for non severe errors ([9a91ef2](https://github.com/spoonx/aurelia-authentication/commit/9a91ef2))


### Features

* **authService:** Add focus handler to check token expiration ([38381c3](https://github.com/spoonx/aurelia-authentication/commit/38381c3))
* **authService:** changed redirection overwrite to empty string ([cc8b79e](https://github.com/spoonx/aurelia-authentication/commit/cc8b79e))
* **authService:** optional callback for isAuthenticated ([fdbe4b5](https://github.com/spoonx/aurelia-authentication/commit/fdbe4b5))



<a name="3.0.3"></a>
## [3.0.3](https://github.com/spoonx/aurelia-authentication/compare/v3.0.2...v3.0.3) (2016-10-14)


### Bug Fixes

* **baseConfig:** explain getExpirationDateFromResponse and ensure format ([ee30ce4](https://github.com/spoonx/aurelia-authentication/commit/ee30ce4))
* **isAuthenticated:** always check access_token existence ([72fb377](https://github.com/spoonx/aurelia-authentication/commit/72fb377))



<a name="3.0.2"></a>
## [3.0.2](https://github.com/spoonx/aurelia-authentication/compare/v3.0.1...v3.0.2) (2016-10-14)


### Bug Fixes

* **authService:** storageChangedReload  optional (default: false) ([8c5b1cb](https://github.com/spoonx/aurelia-authentication/commit/8c5b1cb))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/spoonx/aurelia-authentication/compare/3.0.0...v3.0.1) (2016-10-13)


### Bug Fixes

* **authServive:** fix ie11 storage event loop ([b9ce956](https://github.com/spoonx/aurelia-authentication/commit/b9ce956))


### Features

* **authService:** ensure page reload after storage events ([7125cc5](https://github.com/spoonx/aurelia-authentication/commit/7125cc5))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/spoonx/aurelia-authentication/compare/3.0.0-rc10...v3.0.0) (2016-10-05)


### Bug Fixes

* **authService:** storage events do not work properly in IE11 ([944a716](https://github.com/spoonx/aurelia-authentication/commit/944a716))


### Features

* **auth0lock:** Upgrade code to work with Auth0 Lock 10.x (no backwards compat) ([fe3adc7](https://github.com/spoonx/aurelia-authentication/commit/fe3adc7))
* **authService:** add logout handling for openid connect ([91e9217](https://github.com/spoonx/aurelia-authentication/commit/91e9217))



<a name="3.0.0-rc11"></a>
# [3.0.0-rc11](https://github.com/spoonx/aurelia-authentication/compare/3.0.0-rc10...v3.0.0-rc11) (2016-09-22)


### Bug Fixes

* **authService:** storage events do not work properly in IE11 ([944a716](https://github.com/spoonx/aurelia-authentication/commit/944a716))


### Features

* **authService:** add logout handling for openid connect ([91e9217](https://github.com/spoonx/aurelia-authentication/commit/91e9217))



<a name="3.0.0-rc10"></a>
# [3.0.0-rc10](https://github.com/spoonx/aurelia-authentication/compare/3.0.0-rc9...v3.0.0-rc10) (2016-08-25)


### Bug Fixes

* **bundle:** re-add imports for bundling ([4b6208c](https://github.com/spoonx/aurelia-authentication/commit/4b6208c))



<a name="3.0.0-rc9"></a>
# [3.0.0-rc9](https://github.com/spoonx/aurelia-authentication/compare/3.0.0-rc8...v3.0.0-rc9) (2016-08-23)


### Bug Fixes

* **authService:** let authService.isAuthenticated analyse token from storage each time (as was intended) ([e2ef686](https://github.com/spoonx/aurelia-authentication/commit/e2ef686))
* **authService:** listen to storage events. fixes login/logout in other tabs ([52c2f67](https://github.com/spoonx/aurelia-authentication/commit/52c2f67))
* **oauth implicit:** removed encoding of space character between response types when returning token from popup. ([e444e0b](https://github.com/spoonx/aurelia-authentication/commit/e444e0b))


### Features

* **authService:** add getIdToken method to authenticaton and authService ([00a7368](https://github.com/spoonx/aurelia-authentication/commit/00a7368))
* **config:** optional functions getExpirationDateFromResponse, getAccessTokenFromResponse and getRefreshTokenFromResponse ([352e5a4](https://github.com/spoonx/aurelia-authentication/commit/352e5a4))


### BREAKING CHANGES

* authService: hasDataAnalyzed renamed to responseAnalyzed



<a name="3.0.0-rc8"></a>
## [3.0.0-rc8](https://github.com/spoonx/aurelia-authentication/compare/3.0.0-rc7...v3.0.0-rc8) (2016-08-03)


### Bug Fixes

* **popup:** removed '#' character from hash fragment in redirect URL from popup. (Issue [#223](https://github.com/spoonx/aurelia-authentication/issues/223)). ([baf9148](https://github.com/spoonx/aurelia-authentication/commit/baf9148))


<a name="3.0.0-rc7"></a>
## [3.0.0-rc7](https://github.com/spoonx/aurelia-authentication/compare/3.0.0-rc2...v3.0.0-rc7) (2016-07-22)


<a name="3.0.0-rc6"></a>
## [3.0.0-rc6](https://github.com/spoonx/aurelia-authentication/compare/3.0.0-rc5...v3.0.0-rc6) (2016-07-04)


<a name"3.0.0-rc5"></a>
### 3.0.0-rc5 (2016-06-15)


#### Bug Fixes

([41454e39](https://github.com/spoonx/aurelia-authentication/commit/41454e39))
* **baseConfig:**
  * remove double entry current ([15f221c8](https://github.com/spoonx/aurelia-authentication/commit/15f221c8))
  *  revert to only globalValueConverters=["authFilterValueConverter"] (again) ([118cbd2d](https://github.com/spoonx/aurelia-authentication/commit/118cbd2d))


<a name"3.0.0-rc4"></a>
### 3.0.0-rc4 (2016-06-09)


#### Bug Fixes

* **ValueConverter:** fix ValueConverter build ([c0b71009](https://github.com/spoonx/aurelia-authentication/commit/c0b71009))
* **ValueConverters:** bring back old authFilter version since new one can't be auto bundled ([a66394dc](https://github.com/spoonx/aurelia-authentication/commit/a66394dc))
* **authService:**
  * actually clear timeout ([1a887abf](https://github.com/spoonx/aurelia-authentication/commit/1a887abf))
  * initialize with stored responseObject ([d50f9257](https://github.com/spoonx/aurelia-authentication/commit/d50f9257))
* **authentication:** consistent throw if token not found ([41454e39](https://github.com/spoonx/aurelia-authentication/commit/41454e39))
* **popup:**
  * use PLATFOTM.global.document.location ([fa0e8a30](https://github.com/spoonx/aurelia-authentication/commit/fa0e8a30))
* **project:**
  * use auth:true for authenticationStep and isAuth ([caf4a3be](https://github.com/spoonx/aurelia-authentication/commit/caf4a3be))


#### Features

* **authService:**
  * redirection when token expired optional ([b6ed192f](https://github.com/spoonx/aurelia-authentication/commit/b6ed192f))
  * add onLogout. something is needed to eg clear cookies after authomatic logout ([8ade299d](https://github.com/spoonx/aurelia-authentication/commit/8ade299d))
  * actually logout on timeout ([d65ca7ba](https://github.com/spoonx/aurelia-authentication/commit/d65ca7ba))
* **authenticateStep:** use authService.authenticate ([5b9306fe](https://github.com/spoonx/aurelia-authentication/commit/5b9306fe))
* **project:**
([234e1024](https://github.com/spoonx/aurelia-authentication/commit/234e1024))
* **value-converters:** move/rename/add valueConverters ([4d2ee936](https://github.com/spoonx/aurelia-authentication/commit/4d2ee936))


<a name"3.0.0-rc3"></a>
### 3.0.0-rc3 (2016-06-02)


#### Bug Fixes

* **aurelia-authentication:** add ie9 window.origin polyfill ([a06e66b0](https://github.com/spoonx/aurelia-authentication/commit/a06e66b0))
* **auth0Lock:** add missing aurelia-pal dependency for webpack ([a8056dc3](https://github.com/spoonx/aurelia-authentication/commit/a8056dc3))
* **authentication:** consistent throw if token not found ([41454e39](https://github.com/spoonx/aurelia-authentication/commit/41454e39))
* **popup:** encodeURIComponent all query parameters ([82e023c2](https://github.com/spoonx/aurelia-authentication/commit/82e023c2))
* **project:** restore missing props in package.json for jspm 0.17+ ([17f9e81d](https://github.com/spoonx/aurelia-authentication/commit/17f9e81d))


#### Features

* **BaseConfig:** copied over current sahat/satellizer settings ([70dfb814](https://github.com/spoonx/aurelia-authentication/commit/70dfb814))
* **authService:**
  * use authenticated and setTimeout for login status ([d57e1142](https://github.com/spoonx/aurelia-authentication/commit/d57e1142))
  * add getExp() ([026d0d82](https://github.com/spoonx/aurelia-authentication/commit/026d0d82))
  * add profileMethod config option ([218fffc1](https://github.com/spoonx/aurelia-authentication/commit/218fffc1))
  * optional logout request ([d65ca7ba](https://github.com/spoonx/aurelia-authentication/commit/d65ca7ba))
* **authentication:**
  * use jwt-decode to decode token ([f5056ce9](https://github.com/spoonx/aurelia-authentication/commit/f5056ce9))
  * add support for auth0 login using lock ([97e625e8](https://github.com/spoonx/aurelia-authentication/commit/97e625e8))
  * allow dotted accessTokenProp ([27198f8f](https://github.com/spoonx/aurelia-authentication/commit/27198f8f))
  * add deprecation warning for provider.type (replaced by provider.oauthType) ([bcdf06ba](https://github.com/spoonx/aurelia-authentication/commit/bcdf06ba))
* **project:**
  * use aurelia-pal for window and document ([fdbb9189](https://github.com/spoonx/aurelia-authentication/commit/fdbb9189))
  * add AuthenticationStep and deprecate AuthorizeStep ([baeb35c4](https://github.com/spoonx/aurelia-authentication/commit/baeb35c4))
* **refresh-token:** optional refreshTokenUrl ([234e1024](https://github.com/spoonx/aurelia-authentication/commit/234e1024))


<a name"3.0.0-rc2"></a>
### 3.0.0-rc2 (2016-05-04)


#### Bug Fixes

* **authentication:** let the storageKey be  the storageKey ([a302352b](https://github.com/spoonx/aurelia-authentication/commit/a302352b))
* **typings:** mark optional parameters ([f56df76a](https://github.com/spoonx/aurelia-authentication/commit/f56df76a))


<a name"3.0.0-rc1"></a>
## 3.0.0-rc1 (2016-04-28)


#### Bug Fixes

* **BaseConfig:** encode redirect url for all providers ([adc90827](https://github.com/spoonx/aurelia-authentication/commit/adc90827))
* **authUtils:** quote string ([ab4756f2](https://github.com/spoonx/aurelia-authentication/commit/ab4756f2))
* **d.ts:** include only necessary imports ([2c292ac4](https://github.com/spoonx/aurelia-authentication/commit/2c292ac4))


#### Features

* **AuthService:**
  * updateToken handles multiple calls ([b6199531](https://github.com/spoonx/aurelia-authentication/commit/b6199531))
  * isAuthenticated optionally as promise ([9c85af79](https://github.com/spoonx/aurelia-authentication/commit/9c85af79))
* **authService:** add request options to signup and login as well as optional redirecUri overwrite ([e8072e54](https://github.com/spoonx/aurelia-authentication/commit/e8072e54))
* **baseConfig:**
  * standardize access token option names (breaking) ([29d22c5a](https://github.com/spoonx/aurelia-authentication/commit/29d22c5a))
  * change `refreshTokenName` option value and add `refreshTokenProp` (breaking) ([c8885d7b](https://github.com/spoonx/aurelia-authentication/commit/c8885d7b))
  * replace both `tokenPrefix` options with `tokenStorage` (breaking) ([4f98493b](https://github.com/spoonx/aurelia-authentication/commit/4f98493b))
* **project:**
  * revert isAuthenticated to just boolean again. use aurelia-logger and @deprecated ([49fe1e0f](https://github.com/spoonx/aurelia-authentication/commit/49fe1e0f))
  * store the complete response in storage. AuthService.getTimeLeft() added ([b98d839e](https://github.com/spoonx/aurelia-authentication/commit/b98d839e))
  * bundle into single file ([6984c590](https://github.com/spoonx/aurelia-authentication/commit/6984c590))
  * Rename project to remove spoonx prefix. enable npm installation ([637aac41](https://github.com/spoonx/aurelia-authentication/commit/637aac41))
  * name auth appropriatly and refactor ([95259767](https://github.com/spoonx/aurelia-authentication/commit/95259767))


#### Breaking Changes

* for AuthService(provider, redirectUri, userData) redirectUri===false means "Do not redirect" now. Set redirectUrl to undefined or null to use the defaultRedirectUrl.(which is in this case  BaseConfig.loginRedirect)
DEPRECATED: for AuthService(provider, redirectUri, userData) redirectUri === true to actually not redirect is deprecated. Set redirectUrl===false instead.

 ([2c15244b](https://github.com/spoonx/aurelia-authentication/commit/2c15244b))
* authUtils got removed. Extend and aurelia-path are used instead for some functions

 ([671f087a](https://github.com/spoonx/aurelia-authentication/commit/671f087a))
* This aligns access token option names with the refresh token option names. The option changes are as follows:

```
tokenStorage      => accessTokenStorage
responseTokenProp => accessTokenProp
tokenName         => accessTokenName
tokenRoot         => accessTokenRoot
```

 ([29d22c5a](https://github.com/spoonx/aurelia-authentication/commit/29d22c5a))
* `refreshTokenName` option value has been changed from 'refresh_token' to 'token'. The new `refreshTokenProp` option is set to 'refresh_token' by default (a non-breaking change).

 ([c8885d7b](https://github.com/spoonx/aurelia-authentication/commit/c8885d7b))
* Token prefixes were using another 'unrelated' option to make up the full storage keys. This was unnecessary, confusing and could have resulted in the same storage location being shared between both the refresh and access tokens. README updated to reflect current design.

 ([4f98493b](https://github.com/spoonx/aurelia-authentication/commit/4f98493b))
* all imports need to use 'aurelia-authenticaton'

 ([6984c590](https://github.com/spoonx/aurelia-authentication/commit/6984c590))
* `spoonx/` prefix dropped from install name for authentication and api. Update `package.json` and `config.js` accordingly.

 ([637aac41](https://github.com/spoonx/aurelia-authentication/commit/637aac41))
* AuthService instance renamed to authService and Authentication instance renamed to authentication

 ([95259767](https://github.com/spoonx/aurelia-authentication/commit/95259767))


<a name"2.1.0"></a>
## 2.1.0 (2016-03-31)


#### Bug Fixes

* **configure:** fail if specified endpoints are not registered ([4a444253](https://github.com/spoonx/aurelia-authentication/commit/4a444253))
* **interceptor:** set authorization header instead of appending ([4e53457d](https://github.com/spoonx/aurelia-authentication/commit/4e53457d))


#### Features

* **project:** add refresh token ([77bdbe49](https://github.com/spoonx/aurelia-authentication/commit/77bdbe49))


<a name"2.0.2"></a>
### 2.0.2 (2016-03-30)


#### Bug Fixes

* **authFilter:** Import authfilter for bundling ([d5461fd6](https://github.com/spoonx/aurelia-authentication/commit/d5461fd6))


<a name"2.0.1"></a>
### 2.0.1 (2016-03-29)


<a name"2.0.0"></a>
## 2.0.0 (2016-03-29)


<a name"1.1.2"></a>
### 1.1.2 (2016-03-26)
#### Bug Fixes

* **project:** fix wrong dependency introduced in 1.1.1 ([1b288214](https://github.com/spoonx/aurelia-authentication/commit/1b288214))


<a name"1.1.1"></a>
### 1.1.1 (2016-03-25)


<a name"1.1.0"></a>
### 1.1.0 (2016-03-25)


#### Features

* **authUtils:** make authUtils a named export, export  authUtils from index -- breaking change!  ([7de0aa23](https://github.com/spoonx/aurelia-authentication/commit/7de0aa23))


<a name"1.0.1"></a>
### 1.0.1 (2016-03-22)


#### Bug Fixes

* **FetchConfig:** keep client settings when adding interceptor ([18c052c1](git+https://github.com/spoonx/aurelia-authentication.git/commit/18c052c1))


<a name"1.0.0"></a>
## 1.0.0 (2016-03-19)


#### Breaking Changes

* The project now must be imported with aurelia-authentication

 ([ba66705d](git+https://github.com/spoonx/aurelia-authentication.git/commit/ba66705d))


<a name"0.13.9"></a>
### 0.13.9 (2016-03-17)


#### Bug Fixes

* **authorizeStep:** fix redirect if isLoggedIn and on login route ([65986f7c](git+https://github.com/spoonx/aurelia-authentication.git/commit/65986f7c))
* **baseConfig:** SPA redirects should be hashed ([a24ce935](git+https://github.com/spoonx/aurelia-authentication.git/commit/a24ce935))
* **project:** import authFilter for inclusion when bundling ([d70a5c6f](git+https://github.com/spoonx/aurelia-authentication.git/commit/d70a5c6f), closes [#44](git+https://github.com/spoonx/aurelia-authentication.git/issues/44))


<a name"0.13.8"></a>
### 0.13.8 (2016-03-02)


<a name"0.13.7"></a>
### 0.13.7 (2016-02-09)


<a name"0.13.6"></a>
### 0.13.6 (2016-02-08)


#### Bug Fixes

* **oauth:** use current provider settings ([9c860c23](git+https://github.com/spoonx/aurelia-authentication.git/commit/9c860c23))


<a name"0.13.4"></a>
### 0.13.4 (2016-01-28)


#### Bug Fixes

* **oAuth:** reset defaults properly ([968abfcf](git+https://github.com/spoonx/aurelia-authentication.git/commit/968abfcf))


<a name"0.13.3"></a>
### 0.13.3 (2016-01-24)


#### Features

* **typescript:** Add proper build support ([9ebfd763](git+https://github.com/spoonx/aurelia-authentication.git/commit/9ebfd763))
* **authentication:** use current tokenName ([bd58f00b](git+https://github.com/spoonx/aurelia-authentication.git/commit/bd58f00b))


<a name"0.13.2"></a>
### 0.13.2 (2016-01-23)


#### Bug Fixes

* **index:** fetchConfig needs configured baseConfig ([e62c9eb9](git+https://github.com/spoonx/aurelia-authentication.git/commit/e62c9eb9))


<a name"0.13.1"></a>
### 0.13.1 (2016-01-21)


#### Bug Fixes

* **popup:** Referrence popupWindow on this; popupWindow is undefined. ([212117e9](git+https://github.com/spoonx/aurelia-authentication.git/commit/212117e9))


<a name"0.13.0"></a>
## 0.13.0 (2016-01-19)


#### Bug Fixes

* **test:** Added tests ([846d1bf9](git+https://github.com/spoonx/aurelia-authentication.git/commit/846d1bf9))
* **typescript:** Update d.ts ([edbd7304](git+https://github.com/spoonx/aurelia-authentication.git/commit/edbd7304))


#### Features

* **build:**
  * Create typescript definitions file on build ([09f63b1b](git+https://github.com/spoonx/aurelia-authentication.git/commit/09f63b1b))
  * Added typescript ds file generating ([e5d4726a](git+https://github.com/spoonx/aurelia-authentication.git/commit/e5d4726a))
* **fetch-config:** Added endpoint configuring, and configurable client. ([c1e30f61](git+https://github.com/spoonx/aurelia-authentication.git/commit/c1e30f61))
* **project:** Added typescript definition file ([28804352](git+https://github.com/spoonx/aurelia-authentication.git/commit/28804352))
* **snyk:** Added snyk ([562ba14e](git+https://github.com/spoonx/aurelia-authentication.git/commit/562ba14e))


### 0.12.4 (2016-01-14)


#### Bug Fixes

* **typescript:** Update d.ts ([edbd7304](git+https://github.com/spoonx/aurelia-authentication.git/commit/edbd7304))


### 0.12.3 (2016-01-14)


#### Features

* **project:** Added typescript definition file ([28804352](git+https://github.com/spoonx/aurelia-authentication.git/commit/28804352ebff34b617d0afb2600ad94887f99810))


### 0.12.2 (2016-01-14)


#### Bug Fixes

* **authentication:** Catch corrupt json ([b971cfc1](git+https://github.com/spoonx/aurelia-authentication.git/commit/b971cfc184fd01c6f7da42d09aa446c41373ff7e))


#### Features

* **authService:** getMe with optional criteria ([99b8ed62](git+https://github.com/spoonx/aurelia-authentication.git/commit/99b8ed620317202d29d5f804e237b2b8b8ebe82b))


### 0.12.1 (2016-01-13)


#### Features

* **authService:** getMe with optional criteria ([99b8ed62](git+https://github.com/spoonx/aurelia-authentication.git/commit/99b8ed620317202d29d5f804e237b2b8b8ebe82b))


### 0.12.0 (2016-01-02)


#### Bug Fixes

* **project:** Version bump to higher than all previous ones ([c4ceae9b](git+https://github.com/spoonx/aurelia-authentication.git/commit/c4ceae9b18422dd7ca2adc3e26dc88a4f8cefb8c))


### 0.1.2 (2015-12-29)


#### Refactor

* **authentication:** Made response token configurable ([8281d906](git+https://github.com/spoonx/aurelia-authentication.git/commit/d166129d8501d66bca66c1a69e55a40281fa8c00))

### 0.1.1 (2015-12-24)


#### Features

* **fetch-client:** Recover baseUrl from singleton ([8281d906](git+https://github.com/spoonx/aurelia-authentication.git/commit/8281d9062e7a695402992f0db068c020efbeb3e1))
* **lint:** Added linting ([5cf127b2](git+https://github.com/spoonx/aurelia-authentication.git/commit/5cf127b20b673c63d3b78d8b5c00e69b296312bf))
