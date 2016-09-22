import {Container} from 'aurelia-dependency-injection';
import {EventAggregator} from 'aurelia-event-aggregator';
import {bindingMode, BindingEngine, createScopeForTest} from 'aurelia-binding';
import {SignalBindingBehavior, BindingSignaler} from 'aurelia-templating-resources';
import {Config as ApiConfig, Rest} from 'aurelia-api';

import {configure} from '../src/aurelia-authentication';
import {AuthService} from '../src/authService';
import {Authentication} from '../src/authentication';
import {AuthFilterValueConverter} from '../src/authFilterValueConverter';

const tokenFuture = {
  payload: {
    name: 'tokenFuture',
    admin: true,
    exp: '2460017154'
  },
  jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoidG9rZW5GdXR1cmUiLCJhZG1pbiI6dHJ1ZSwiZXhwIjoiMjQ2MDAxNzE1NCJ9.iHXLzWGY5U9WwVT4IVRLuKTf65XpgrA1Qq_Jlynv6bc'
};

const noop = () => {};

function getContainer() {
  const container = new Container();
  const config    = container.get(ApiConfig);

  config
    .registerEndpoint('sx/default', 'http://localhost:1927/')
    .registerEndpoint('sx/custom', 'http://localhost:1927/custom')
    .setDefaultEndpoint('sx/default');

  configure({container: container, globalResources: noop}, {
    endpoint: '',
    loginRedirect: false,
    logoutRedirect: false,
    signupRedirect: false,
    baseUrl: 'http://localhost:1927/'
  });

  return container;
}

let oidcProviderConfig = {
  providers: {
    oidcProvider: {
      name: 'oidcProvider',
      oauthType: '2.0',
      postLogoutRedirectUri: 'http://localhost:1927/',
      logoutEndpoint: 'http://localhost:54540/connect/logout',
      popupOptions: { width: 1028, height: 529 }
    }
  }
};

describe('AuthService', () => {
  describe('.constructor()', () => {
    const container = new Container();

    afterEach(() => {
      container.get(Authentication).setResponseObject(null);
    });

    it('should return old accessToken and delete in storage', () => {
      window.localStorage.setItem('aurelia_token', 'old one');

      const authService = container.get(AuthService);
      const token = authService.getAccessToken();

      expect(token).toBe('old one');
    });
  });

  describe('.client', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    it('to be instanceof HttpClient', () => {
      expect(authService.client instanceof Rest).toBe(true);
    });
  });


  describe('.authenticated', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    describe('should change status if storage changes', () => {
      it('should be true after setResponseObject with token', () => {
        authService.setResponseObject({token: 'some', refresh_token: 'another'});

        expect(authService.authenticated).toBe(true);
      });

      it('should not change after clearing storage directly in same window/tab', () => {
        authService.authentication.storage.remove(authService.config.storageKey);

        expect(authService.authenticated).not.toBe(false);
      });

      it('should be false after setResponseObject with null', () => {
        authService.setResponseObject(null);

        expect(authService.authenticated).toBe(false);
      });
    });
  });


  describe('.getMe()', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    it('without criteria', done => {
      authService.getMe()
        .then(result => {
          expect(result.method).toBe('GET');
          expect(result.path).toBe('/auth/me');
          done();
        });
    });

    it('with criteria a number', done => {
      authService.getMe(5)
        .then(result => {
          expect(result.method).toBe('GET');
          expect(result.path).toBe('/auth/me');
          expect(result.query.id).toBe('5');
          done();
        });
    });

    it('with criteria a string', done => {
      authService.getMe('five')
        .then(result => {
          expect(result.method).toBe('GET');
          expect(result.path).toBe('/auth/me');
          expect(result.query.id).toBe('five');
          done();
        });
    });

    it('with criteria an object', done => {
      authService.getMe({foo: 'bar'})
        .then(result => {
          expect(result.method).toBe('GET');
          expect(result.path).toBe('/auth/me');
          expect(result.query.foo).toBe('bar');
          done();
        });
    });
  });


  describe('.updateMe() with PUT', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    beforeEach(() => {
      authService.config.profileMethod = 'put';
    });

    it('without criteria', done => {
      authService.updateMe({data: 'some'})
        .then(result => {
          expect(result.method).toBe('PUT');
          expect(result.path).toBe('/auth/me');
          expect(JSON.stringify(result.query)).toBe('{}');
          expect(result.body.data).toBe('some');
          done();
        });
    });

    it('with criteria a number', done => {
      authService.updateMe({data: 'some'}, 5)
        .then(result => {
          expect(result.method).toBe('PUT');
          expect(result.path).toBe('/auth/me');
          expect(result.query.id).toBe('5');
          expect(result.body.data).toBe('some');
          done();
        });
    });

    it('with criteria a string', done => {
      authService.updateMe({data: 'some'}, 'five')
        .then(result => {
          expect(result.method).toBe('PUT');
          expect(result.path).toBe('/auth/me');
          expect(result.query.id).toBe('five');
          expect(result.body.data).toBe('some');
          done();
        });
    });

    it('with criteria an object', done => {
      authService.updateMe({data: 'some'}, {foo: 'bar'})
        .then(result => {
          expect(result.method).toBe('PUT');
          expect(result.path).toBe('/auth/me');
          expect(result.query.foo).toBe('bar');
          expect(result.body.data).toBe('some');
          done();
        });
    });
  });


  describe('.updateMe() with PATCH', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    beforeEach(() => {
      authService.config.profileMethod = 'patch';
    });

    it('without criteria', done => {
      authService.updateMe({data: 'some'})
        .then(result => {
          expect(result.method).toBe('PATCH');
          expect(result.path).toBe('/auth/me');
          expect(JSON.stringify(result.query)).toBe('{}');
          expect(result.body.data).toBe('some');
          done();
        });
    });

    it('with criteria a number', done => {
      authService.updateMe({data: 'some'}, 5)
        .then(result => {
          expect(result.method).toBe('PATCH');
          expect(result.path).toBe('/auth/me');
          expect(result.query.id).toBe('5');
          expect(result.body.data).toBe('some');
          done();
        });
    });

    it('with criteria a string', done => {
      authService.updateMe({data: 'some'}, 'five')
        .then(result => {
          expect(result.method).toBe('PATCH');
          expect(result.path).toBe('/auth/me');
          expect(result.query.id).toBe('five');
          expect(result.body.data).toBe('some');
          done();
        });
    });

    it('with criteria an object', done => {
      authService.updateMe({data: 'some'}, {foo: 'bar'})
        .then(result => {
          expect(result.method).toBe('PATCH');
          expect(result.path).toBe('/auth/me');
          expect(result.query.foo).toBe('bar');
          expect(result.body.data).toBe('some');
          done();
        });
    });
  });


  describe('.setTimeout()', () => {
    const container = new Container();
    let authService = container.get(AuthService);

    it('Should set instant timeout', done => {
      let timeoutID = authService.timeoutID;
      authService.setTimeout(0);

      expect(authService.timeoutID).not.toBe(timeoutID);

      setTimeout(done, 1);
    });

    it('Should have timed out', () => {
      expect(authService.timeoutID).toBe(0);
    });

    it('Should set longer timeout', done => {
      let timeoutID = authService.timeoutID;
      authService.setTimeout(10000);

      expect(authService.timeoutID).not.toBe(timeoutID);

      setTimeout(done, 10);
    });

    it('Should not have timeeout', () => {
      expect(authService.timeoutID).not.toBe(0);
    });

    it('Should clear timeout', () => {
      authService.clearTimeout();
      expect(authService.timeoutID).toBe(0);
    });

    // setup signal test
    let bindingEngine = container.get(BindingEngine);
    let bindingBehaviors = {
      signal: container.get(SignalBindingBehavior)
    };
    let valueConverters = {
      'authFilter': AuthFilterValueConverter
    };
    let lookupFunctions = {
      bindingBehaviors: name => bindingBehaviors[name],
      valueConverters: name => valueConverters[name]
    };
    let bindingSignaler = container.get(BindingSignaler);

    it('Should signal manually', () => {
      //create element and bind
      authService.authenticated = true;
      let scope = createScopeForTest(authService);
      let target = document.createElement('div');
      let bindingExpression = bindingEngine.createBindingExpression('innerHTML', 'authenticated | authFilter & signal:\'authentication-change\'', bindingMode.oneWay, lookupFunctions);
      let binding = bindingExpression.createBinding(target);
      binding.bind(scope);
      expect(target.innerHTML).toBe('true');

      // change scope
      authService.authenticated = false;
      expect(target.innerHTML).toBe('true');

      // signal
      bindingSignaler.signal('authentication-change');
      expect(target.innerHTML).toBe('false');
    });

    it('test signalling on expired', done => {
      //create element and bind
      authService.authenticated = true;
      let scope = createScopeForTest(authService);
      let target = document.createElement('div');
      let bindingExpression = bindingEngine.createBindingExpression('innerHTML', 'authenticated | authFilter & signal:\'authentication-change\'', bindingMode.oneWay, lookupFunctions);
      let binding = bindingExpression.createBinding(target);
      binding.bind(scope);
      expect(target.innerHTML).toBe('true');

      // change scope
      authService.setTimeout(0);
      expect(target.innerHTML).toBe('true');

      // process signal from authService.setTimeout
      expect(authService.timeoutID).not.toBe(0);
      setTimeout( function() {
        expect(authService.timeoutID).toBe(0);
        expect(target.innerHTML).toBe('false');
        done();
      }, 1);
    });
  });

  describe('.setResponseObject()', () => {
    it('Should set with object', () => {
      const container = new Container();
      let authService = container.get(AuthService);

      authService.getTtl = () => 0;

      authService.setResponseObject({access_token: 'some'});

      expect(JSON.parse(window.localStorage.getItem('aurelia_authentication')).access_token).toBe('some');
      expect(authService.authenticated).toBe(true);
      authService.setResponseObject(null);
    });

    it('Should set with jwt and not timeout', done => {
      const container = new Container();
      let authService = container.get(AuthService);

      authService.getTtl = () => 0;

      spyOn(authService, 'getTtl').and.returnValue(1);
      spyOn(authService.authentication, 'redirect').and.callThrough();

      authService.setResponseObject({access_token: tokenFuture.jwt});

      expect(JSON.parse(window.localStorage.getItem('aurelia_authentication')).access_token).toBe(tokenFuture.jwt);
      expect(authService.authenticated).toBe(true);

      setTimeout(() => {
        expect(authService.authenticated).toBe(true);
        authService.logout().then(done);
      }, 1);
    });

    it('Should set with jwt and timeout', done => {
      const container = new Container();
      let authService = container.get(AuthService);
      authService.config.expiredReload = 0;

      authService.getTtl = () => 0;

      spyOn(authService, 'getTtl').and.returnValue(0);

      authService.setResponseObject({access_token: tokenFuture.jwt});

      expect(JSON.parse(window.localStorage.getItem('aurelia_authentication')).access_token).toBe(tokenFuture.jwt);
      expect(authService.authenticated).toBe(true);

      setTimeout(() => {
        expect(authService.authenticated).toBe(false);
        done();
      }, 1);
    });

    it('Should delete', () => {
      const container = new Container();
      let authService = container.get(AuthService);

      authService.getTtl = () => 0;

      window.localStorage.setItem('aurelia_authentication', 'another');

      authService.setResponseObject(null);
      expect(window.localStorage.getItem('aurelia_authentication')).toBe(null);
      expect(authService.authenticated).toBe(false);

      authService.authentication.setResponseObject(null);
    });

    it('Should publish authentication-change', () => {
      const container = new Container();
      let authService = container.get(AuthService);

      authService.getTtl = () => 0;
      let expectation;

      let ea = container.get(EventAggregator);
      ea.subscribe('authentication-change', auth => {
        expect(auth).toBe(expectation);
      });

      expectation = true;
      authService.setResponseObject({access_token: 'some'});

      expectation = false;
      authService.setResponseObject(null);
    });
  });


  describe('.getAccessToken()', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    it('should return authentication.accessToken', () => {
      authService.setResponseObject({token: 'some'});

      const token = authService.getAccessToken();

      expect(token).toBe('some');
    });
  });


  describe('.getRefreshToken()', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    it('should return authentication.refreshToken', () => {
      authService.config.useRefreshToken = true;
      authService.setResponseObject({token: 'some', refresh_token: 'another'});

      expect(authService.getRefreshToken()).toBe('another');
      authService.config.useRefreshToken = false;
    });
  });

  describe('.getIdToken()', () => {
    const container = getContainer();
    const authService = container.get(AuthService);

    it('should return authentication.idToken', () => {
      authService.setResponseObject({token: 'some', id_token: 'another'});
      expect(authService.getIdToken()).toBe('another');
    });
  });

  describe('.isAuthenticated()', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    beforeEach(() => {
      authService.config.useRefreshToken = true;
      authService.config.autoUpdateToken = true;
    });
    afterEach(done => {
      authService.config.useRefreshToken = false;
      authService.config.autoUpdateToken = false;
      authService.logout().then(done);
    });

    it('should return boolean', () => {
      const result = authService.isAuthenticated();

      expect(typeof result).toBe('boolean');
    });

    describe('should analyse token from storage each time', () => {
      it('should be true after setResponseObject with token', () => {
        authService.setResponseObject({token: 'some', refresh_token: 'another'});

        expect(authService.isAuthenticated()).toBe(true);
      });

      it('should be false after clearing storage directly', () => {
        authService.authentication.storage.remove(authService.config.storageKey);

        expect(authService.isAuthenticated()).toBe(false);
      });

      it('should be true after setting storage directly', () => {
        authService.authentication.storage.set(authService.config.storageKey, JSON.stringify({token: 'some', refresh_token: 'another'}));

        expect(authService.isAuthenticated()).toBe(true);
      });

      it('should be false after setResponseObject with null', () => {
        authService.setResponseObject(null);

        expect(authService.isAuthenticated()).toBe(false);
      });
    });

    describe('with autoUpdateToken=true', () => {
      it('should return boolean true', () => {
        authService.setResponseObject({token: 'some', refresh_token: 'another'});

        spyOn(authService, 'updateToken').and.returnValue(Promise.resolve(false));
        spyOn(authService.authentication, 'isAuthenticated').and.returnValue(false);

        const result = authService.isAuthenticated();

        expect(typeof result).toBe('boolean');
        expect(result).toBe(true);
      });
    });
  });

  describe('.getTtl()', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    it('should return authentication.getTtl() result', () => {
      spyOn(authService.authentication, 'getTtl').and.returnValue('any');

      const expired = authService.getTtl();

      expect(expired).toBe('any');
    });
  });


  describe('.isTokenExpired()', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    it('should return authentication.isTokenExpired() result', () => {
      spyOn(authService.authentication, 'isTokenExpired').and.returnValue('expired');

      const expired = authService.isTokenExpired();

      expect(expired).toBe('expired');
    });
  });


  describe('.getTokenPayload()', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    it('should return authentication.getTokenPayload() result ', () => {
      spyOn(authService.authentication, 'getPayload').and.returnValue('payload');

      const payload = authService.getTokenPayload();

      expect(payload).toBe('payload');
    });
  });


  describe('.updateToken()', () => {
    const container   = new Container();
    const authService = container.get(AuthService);

    afterEach(() => {
      authService.config.useRefreshToken = true;
    });
    afterEach(done => {
      authService.config.useRefreshToken = false;
      authService.logout().then(done);
    });

    it('fail without refreshToken', done => {
      authService.updateToken()
      .catch(error => {
        expect(error instanceof Error).toBe(true);
        done();
      });
    });

    it('fail on no token in response', done => {
      authService.config.client = {
        post: () => Promise.resolve({Error: 'serverError'})
      };

      authService.updateToken()
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.authentication.isAuthenticated()).toBe(false);
          done();
        });
    });

    it('fail with same response if called several times', done => {
      authService.config.client = {
        post: () => Promise.resolve({Error: 'no token'})
      };

      authService.updateToken()
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.authentication.isAuthenticated()).toBe(false);
        });

      authService.config.client = {
        post: () => Promise.resolve({token: 'valid token'})
      };

      authService.updateToken()
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.authentication.isAuthenticated()).toBe(false);
          done();
        });
    });

    it('get new accessToken', done => {
      authService.setResponseObject({token: 'some', refresh_token: 'another'});
      authService.config.client = {
        post: () => Promise.resolve({token: 'newToken'})
      };

      authService.updateToken()
      .then(result => {
        expect(authService.authentication.isAuthenticated()).toBe(true);
        expect(authService.authentication.accessToken).toBe('newToken');
        expect(result).toBe(true);
        done();
      });
    });

    it('get same new accessToken if called several times', done => {
      authService.setResponseObject({token: 'some', refresh_token: 'another'});
      authService.config.client = {
        post: () => Promise.resolve({token: 'newToken'})
      };

      authService.updateToken()
      .then(result => {
        expect(authService.authentication.isAuthenticated()).toBe(true);
        expect(authService.authentication.accessToken).toBe('newToken');
        expect(result).toBe(true);
      });

      authService.config.client = {
        post: () => Promise.resolve({token: 'other newToken'})
      };
      authService.updateToken()
        .then(result => {
          expect(authService.authentication.isAuthenticated()).toBe(true);
          expect(authService.authentication.accessToken).toBe('newToken');
          expect(result).toBe(true);
          done();
        });
    });
  });


  describe('.signup()', () => {
    const container = getContainer();
    const authService = container.get(AuthService);

    beforeEach(done => {
      authService.logout().then(done);
    });
    afterEach(done => {
      authService.logout().then(done);
    });

    it('Should try to signup with signup data object and fail.', done => {
      authService.signup({user: 'some'})
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.isAuthenticated()).toBe(false);

          expect(authService.getRefreshToken()).toBe(null);
          authService.updateToken()
            .catch(err => {
              expect(err instanceof Error).toBe(true);
              done();
            });
        });
    });

    it('Should signup with signup data object, not login and not redirect.', done => {
      authService.config.loginOnSignup = false;
      authService.config.signupRedirect = true;

      authService.signup({user: 'some', access_token: 'aToken'},  {headers: {Authorization: 'none'}}, 0)
        .then(response => {
          expect(response.path).toBe('/auth/signup');
          expect(response.body.user).toBe('some');
          expect(response.Authorization).toBe('none');
          expect(authService.isAuthenticated()).toBe(false);

          expect(authService.getRefreshToken()).toBe(null);
          authService.updateToken()
            .catch(err => {
              expect(err instanceof Error).toBe(true);
              authService.config.signupRedirect = false;
              done();
            });
        });
    });

    it('Should signup with signup data object, login and not redirect.', done => {
      authService.config.loginOnSignup = true;
      authService.config.loginRedirect = true;

      authService.signup({user: 'some', access_token: 'aToken'}, {headers: {Authorization: 'none'}}, 0)
        .then(response => {
          expect(response.path).toBe('/auth/signup');
          expect(authService.getAccessToken()).toBe('aToken');
          expect(response.body.user).toBe('some');
          expect(response.Authorization).toBe('none');
          expect(authService.isAuthenticated()).toBe(true);

          expect(authService.getRefreshToken()).toBe(null);
          authService.updateToken()
            .catch(err => {
              expect(err instanceof Error).toBe(true);
              authService.config.loginRedirect = false;
              done();
            });
        });
    });
  });

  describe('.login()', () => {
    const container = getContainer();
    const authService = container.get(AuthService);

    beforeEach(done => {
      authService.logout().then(done);
    });
    afterEach(done => {
      authService.logout().then(done);
    });

    it('Should try to login with login data object and fail.', done => {
      authService.login({user: 'some'})
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.isAuthenticated()).toBe(false);

          expect(authService.getRefreshToken()).toBe(null);
          authService.updateToken()
            .catch(err => {
              expect(err instanceof Error).toBe(true);
              done();
            });
        });
    });

    it('Should login with login data object and not redirect.', done => {
      authService.config.loginRedirect = true;

      authService.login({user: 'some', access_token: 'aToken'},  {headers: {Authorization: 'none'}}, 0)
        .then(response => {
          expect(response.path).toBe('/auth/login');
          expect(response.body.user).toBe('some');
          expect(response.Authorization).toBe('none');
          expect(authService.getAccessToken()).toBe('aToken');
          expect(authService.isAuthenticated()).toBe(true);

          expect(authService.getRefreshToken()).toBe(null);
          authService.updateToken()
            .catch(err => {
              expect(err instanceof Error).toBe(true);
              authService.config.loginRedirect = false;
              done();
            });
        });
    });
  });


  describe('.logout()', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    beforeEach(() => {
      authService.setResponseObject({token: 'some', refresh_token: 'another'});
      authService.config.logoutRedirect = 'nowhere';
      authService.config.configure(oidcProviderConfig);
    });

    afterEach(() => {
      authService.config.logoutRedirect = null;
      authService.config.logoutUrl = null;
    });

    it('Should logout and not redirect.', done => {
      authService.logout(0)
        .then(() => {
          expect(authService.isAuthenticated()).toBe(false);

          done();
        }, err => {
          done();
        });
    });

    it('Should send logout request and not redirect.', done => {
      authService.config.logoutUrl = '/auth/logout';

      authService.logout(0)
        .then(response => {
          expect(authService.isAuthenticated()).toBe(false);
          expect(response.path).toBe('/auth/logout');
          expect(response.method).toBe('GET');

          done();
        }, err => {
          done();
        });
    });

    it('should call oAuth2.close() if logoutEndpoint defined', done => {
      spyOn(authService.authentication.oAuth2, 'close').and.returnValue(Promise.resolve({ state: 'ThisIsTheState' }));
      authService.config.logoutRedirect = false;
      authService.authentication.storage.set('oidcProvider_state', 'ThisIsTheState');
      authService.logout(0, undefined, 'oidcProvider')
        .then(response => {
          expect(authService.authentication.oAuth2.close).toHaveBeenCalled();
          done();
        }, err => {
          expect(err).toBeUndefined();
          done();
        });
    });

    it('return reject Promise if states differ', done => {
      spyOn(authService.authentication.oAuth2, 'close').and.callFake( () => {
        return Promise.resolve({ state: 'ThisIsTheState' });
      });
      authService.authentication.storage.set('oidcProvider_state', 'ThisIsNotTheState');
      authService.logout(0, undefined, 'oidcProvider')
        .then(response => {
          expect(authService.authentication.oAuth2.close).toHaveBeenCalled();
          done();
        }, err => {
          expect(err).toBe('OAuth2 response state value differs');
          done();
        });
    });
  });

  describe('.authenticate()', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    authService.authentication.oAuth1.open = (provider, userData) => Promise.resolve({
      provider: provider,
      userData: userData,
      access_token: 'oauth1'
    });

    authService.authentication.oAuth2.open = (provider, userData) => Promise.resolve({
      provider: provider,
      userData: userData,
      access_token: 'oauth2'
    });

    afterEach(done => {
      authService.config.loginRedirect = null;
      authService.logout().then(done);
    });

    it('Should authenticate with oAuth1 provider, login and not redirect.', done => {
      spyOn(authService.authentication.oAuth1, 'open').and.callThrough();
      authService.config.loginRedirect = 'nowhere';

      authService.authenticate('twitter', 0, {data: 'some'})
        .then(response => {
          expect(response.provider).toBe(authService.config.providers.twitter);
          expect(response.userData.data).toBe('some');
          expect(response.access_token).toBe('oauth1');

          expect(authService.getAccessToken()).toBe('oauth1');
          expect(authService.isAuthenticated()).toBe(true);
          done();
        });
    });

    it('Should authenticate with oAuth2 provider, login and not redirect.', done => {
      spyOn(authService.authentication.oAuth2, 'open').and.callThrough();
      authService.config.loginRedirect = null;

      authService.authenticate('facebook', null, {data: 'some'})
        .then(response => {
          expect(response.provider).toBe(authService.config.providers.facebook);
          expect(response.userData.data).toBe('some');
          expect(response.access_token).toBe('oauth2');

          expect(authService.getAccessToken()).toBe('oauth2');
          expect(authService.isAuthenticated()).toBe(true);
          done();
        });
    });

    it('Should try to authenticate and fail.', done => {
      spyOn(authService.authentication.oAuth2, 'open').and.returnValue(Promise.resolve({error: 'any'}));

      authService.authenticate('facebook')
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.isAuthenticated()).toBe(false);

          done();
        });
    });
  });


  describe('.unlink()', () => {
    const container   = getContainer();
    const authService = container.get(AuthService);

    it('Should unlink provider.', done => {
      authService.unlink('some')
        .then(response => {
          expect(response.method).toBe('GET');
          expect(response.path).toBe('/auth/unlink/some');
          done();
        });
    });

    it('Should unlink provider using POST.', done => {
      authService.config.unlinkMethod = 'post';

      authService.unlink('some')
        .then(response => {
          expect(response.method).toBe('POST');
          expect(response.path).toBe('/auth/unlink/some');
          done();
        });
    });
  });
});
