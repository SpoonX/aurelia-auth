import {Container} from 'aurelia-dependency-injection';
import {Config} from 'aurelia-api';
import extend from 'extend';

import {configure} from '../src/aurelia-authentication';
import {BaseConfig} from '../src/baseConfig';
import {Storage} from '../src/storage';
import {OAuth2} from '../src/oAuth2';

let noop = () => {};

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

let oidcProviderConfig = {
  providers: {
    oidcProvider: {
      name: 'oidcProvider',
      postLogoutRedirectUri: 'http://localhost:1927/',
      logoutEndpoint: 'http://localhost:54540/connect/logout',
      popupOptions: { width: 1028, height: 529 }
    }
  }
};

describe('OAuth2', () => {
  const container = getContainer();
  const storage = container.get(Storage);
  const baseConfig = container.get(BaseConfig);
  let popup = {
    open: (url, name, popupOptions, redirectUri) => {
      popup.url = url;
      popup.name = name;
      popup.popupOptions = popupOptions;
      popup.redirectUri = redirectUri;
      return popup;
    },
    eventListener: ()=>{},
    pollPopup: () => Promise.resolve({code: 'someToken'}),
    popupWindow: {location: null}
  };
  const oAuth2 = new OAuth2(storage, popup, baseConfig);

  describe('.exchangeForToken()', () => {
    it('fails with defaults', done => {
      oAuth2.exchangeForToken(
        {code: 'someToken'},
        {userData: 'some'},
        baseConfig.providers.facebook
      ).then(res => {
        expect(res).toBeUndefined();
        expect(false).toBe(true);
        done();
      })
      .catch(err =>{
        expect(err instanceof TypeError);
        done();
      });
    });

    it('not fails with withCredentials = false', done => {
      baseConfig.withCredentials = false;
      oAuth2.exchangeForToken(
        {code: 'someToken'},
        {userData: 'some'},
         extend({}, oAuth2.defaults, baseConfig.providers.facebook)
      ).then(res => {
        expect(res).toBeDefined();
        expect(res.path).toBe('/auth/facebook');
        expect(res.body.code).toBe('someToken');
        expect(res.body.userData).toBe('some');

        done();
      }).catch(err =>{
        expect(err).toBeUndefined();
        expect(false).toBe(true);
        done();
      });
    });
  });

  describe('.open()', () => {
    it('not fails with withCredentials = false', done => {
      baseConfig.withCredentials = false;
      oAuth2.open(baseConfig.providers.facebook, {userData: 'some'})
        .then(res => {
          expect(res).toBeDefined();
          expect(res.path).toBe('/auth/facebook');
          expect(res.body.code).toBe('someToken');
          expect(res.body.userData).toBe('some');
          expect(popup.url).toBe('https://www.facebook.com/v2.5/dialog/oauth?display=popup&redirect_uri=http%3A%2F%2Flocalhost%3A9876%2F&response_type=code&scope=email');

          done();
        })
        .catch(err =>{
          expect(err).toBeUndefined();
          expect(false).toBe(true);
          done();
        });
    });
  });

  describe('.buildQuery()', () => {
    it('return query', () => {
      const query = oAuth2.buildQuery(baseConfig.providers.facebook);
      expect(query.display).toBe('popup');
      expect(query.scope).toBe('email');
    });
  });

  describe('.close()', () => {
    it('logout popup url correct', done => {
      const expectedIdToken = 'Some Id Token';
      const expectedLogoutRedirect = 'http://localhost:1927/';
      const expectedState = '1234567890';

      spyOn(storage, 'get').and.callFake((key) => {
        if (key === 'oidcProvider_state') {
          return expectedState;
        }
        if (key === oAuth2.config.storageKey) {
          return `{ "id_token": "${expectedIdToken}" }`;
        }
      });
      oAuth2.close(oidcProviderConfig.providers.oidcProvider)
        .then(res => {
          const expectedUrl = `http://localhost:54540/connect/logout?id_token_hint=${encodeURIComponent(expectedIdToken)}&post_logout_redirect_uri=${encodeURIComponent(expectedLogoutRedirect)}&state=${encodeURIComponent(expectedState)}`;
          expect(popup.url).toBe(expectedUrl);
          done();
        });
    });
  });

  describe('.buildLogoutQuery()', () => {
    it('return query parameters', () => {
      spyOn(storage, 'get').and.callFake((key) => {
        if (key === 'oidcProvider_state') {
          return '123456789';
        }
        if (key === oAuth2.config.storageKey) {
          return '{ "id_token": "IdTokenHere" }';
        }
      });
      const query = oAuth2.buildLogoutQuery(oidcProviderConfig.providers.oidcProvider);
      expect(query.post_logout_redirect_uri).toBe('http://localhost:1927/');
      expect(query.state).toBe('123456789');
      expect(query.id_token_hint).toBe('IdTokenHere');
    });
  });
});
