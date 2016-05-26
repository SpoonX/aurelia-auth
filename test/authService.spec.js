import {Container} from 'aurelia-dependency-injection';
import {Config, Rest} from 'aurelia-api';

import {configure} from '../src/aurelia-authentication';
import {AuthService} from '../src/aurelia-authentication';
import {BaseConfig} from '../src/baseConfig';
import {Authentication} from '../src/authentication';

const noop = () => {};

function getContainer() {
  const container = new Container();
  const config    = container.get(Config);

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


describe('AuthService', () => {
  describe('.client', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);
    it('to be instanceof HttpClient', () => {
      expect(authService.client instanceof Rest).toBe(true);
    });
  });


  describe('.getMe()', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);

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
    const container      = getContainer();
    const authService    = container.get(AuthService);
    
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
    const container      = getContainer();
    const authService    = container.get(AuthService);
    
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
  

  describe('.getAccessToken()', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);

    it('should return authentication.accessToken', () => {
      authService.authentication.responseObject = {token: 'some'};

      const token = authService.getAccessToken();

      expect(token).toBe('some');
    });
  });


  describe('.getRefreshToken()', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);

    it('should return authentication.refreshToken', () => {
      authService.config.useRefreshToken = true;
      authService.authentication.responseObject = {token: 'some', refresh_token: 'another'};

      expect(authService.getRefreshToken()).toBe('another');
      authService.config.useRefreshToken = false;
    });
  });

  describe('.isAuthenticated()', () => {
    const container      = getContainer();
    const authentication = container.get(Authentication);
    const baseConfig     = container.get(BaseConfig);
    const authService    = container.get(AuthService);

    afterEach(done => {
      authService.logout().then(done);
      baseConfig.autoUpdateToken = false;
    });

    it('should return boolean', () => {
      const result = authService.isAuthenticated();

      expect(typeof result).toBe('boolean');
    });

    describe('with autoUpdateToken=true', () => {
      it('should return boolean true', () => {
        authService.config.useRefreshToken = true;
        baseConfig.autoUpdateToken  = true;
        authService.authentication.responseObject = {token: 'some', refresh_token: 'another'};

        spyOn(authService, 'updateToken').and.returnValue(Promise.resolve(false));
        spyOn(authentication, 'isAuthenticated').and.returnValue(false);

        const result = authService.isAuthenticated();

        expect(typeof result).toBe('boolean');
        expect(result).toBe(true);
      });
    });
  });

  describe('.getTtl()', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);

    it('should return authentication.getTtl() result', () => {
      spyOn(authService.authentication, 'getTtl').and.returnValue('any');

      const expired = authService.getTtl();

      expect(expired).toBe('any');
    });
  });


  describe('.isTokenExpired()', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);

    it('should return authentication.isTokenExpired() result', () => {
      spyOn(authService.authentication, 'isTokenExpired').and.returnValue('expired');

      const expired = authService.isTokenExpired();

      expect(expired).toBe('expired');
    });
  });


  describe('.getTokenPayload()', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);

    it('should return authentication.getTokenPayload() result ', () => {
      spyOn(authService.authentication, 'getPayload').and.returnValue('payload');

      const payload = authService.getTokenPayload();

      expect(payload).toBe('payload');
    });
  });


  describe('.updateToken()', () => {
    const container      = new Container();
    const authService = container.get(AuthService);
    authService.config.useRefreshToken = true;

    afterEach(done => {
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
      authService.authentication.responseObject = {token: 'some', refresh_token: 'another'};
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
      authService.authentication.responseObject = {token: 'some', refresh_token: 'another'};
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
    const container      = getContainer();
    const authService = container.get(AuthService);

    beforeEach(() => {
      authService.authentication.responseObject = {token: 'some', refresh_token: 'another'};
      authService.config.logoutRedirect = 'nowhere';
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
        });
    });
  });


  describe('.authenticate()', () => {
    const container      = getContainer();
    const authentication = container.get(Authentication);
    const baseConfig     = container.get(BaseConfig);

    authentication.oAuth1.open = (provider, userData) => Promise.resolve({
      provider: provider,
      userData: userData,
      access_token: 'oauth1'
    });

    authentication.oAuth2.open = (provider, userData) => Promise.resolve({
      provider: provider,
      userData: userData,
      access_token: 'oauth2'
    });

    afterEach(done => {
      const authService = container.get(AuthService);
      authService.config.loginRedirect = null;
      authService.logout().then(done);
    });

    it('Should authenticate with oAuth1 provider, login and not redirect.', done => {
      const authService = new AuthService(authentication, baseConfig);
      spyOn(authentication.oAuth1, 'open').and.callThrough();
      authService.config.loginRedirect = 'nowhere';

      authService.authenticate('twitter', 0, {data: 'some'})
        .then(response => {
          expect(response.provider).toBe(baseConfig.providers['twitter']);
          expect(response.userData.data).toBe('some');
          expect(response.access_token).toBe('oauth1');

          expect(authService.getAccessToken()).toBe('oauth1');
          expect(authService.isAuthenticated()).toBe(true);
          done();
        });
    });

    it('Should authenticate with oAuth2 provider, login and not redirect.', done => {
      const authService = new AuthService(authentication, baseConfig);
      spyOn(authentication.oAuth2, 'open').and.callThrough();
      authService.config.loginRedirect = null;

      authService.authenticate('facebook', null, {data: 'some'})
        .then(response => {
          expect(response.provider).toBe(baseConfig.providers['facebook']);
          expect(response.userData.data).toBe('some');
          expect(response.access_token).toBe('oauth2');

          expect(authService.getAccessToken()).toBe('oauth2');
          expect(authService.isAuthenticated()).toBe(true);
          done();
        });
    });

    it('Should try to authenticate and fail.', done => {
      const authService = new AuthService(authentication, baseConfig);
      spyOn(authentication.oAuth2, 'open').and.returnValue(Promise.resolve({error: 'any'}));

      authService.authenticate('facebook')
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.isAuthenticated()).toBe(false);

          done();
        });
    });
  });


  describe('.unlink()', () => {
    const container = getContainer();
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
