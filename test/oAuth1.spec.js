import {Container} from 'aurelia-dependency-injection';
import {Config} from 'aurelia-api';

import {configure} from '../src/aurelia-authentication';
import {BaseConfig} from '../src/baseConfig';
import {Storage} from '../src/storage';
import {OAuth1} from '../src/oAuth1';

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


describe('OAuth1', () => {
  const container = getContainer();
  const storage = container.get(Storage);
  const baseConfig = storage.config;
  const popup = {
    open: () => popup,
    eventListener: ()=>{},
    pollPopup: () => Promise.resolve({access_token: 'someToken'}),
    popupWindow: {location: null}
  };
  const oAuth1 = new OAuth1(storage, popup, baseConfig);

  describe('.exchangeForToken()', () => {
    it('fails with defaults', done => {
      oAuth1.exchangeForToken(
        {access_token: 'someToken'},
        {userData: 'some'},
        baseConfig.providers['twitter']
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
      oAuth1.exchangeForToken(
        {access_token: 'someToken'},
        {userData: 'some'},
        baseConfig.providers['twitter']
      ).then(res => {
        expect(res).toBeDefined();
        expect(res.path).toBe('/auth/twitter');
        expect(res.body.access_token).toBe('someToken');
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
      oAuth1.open(baseConfig.providers['twitter'], {userData: 'some'})
        .then(res=>{
          expect(res).toBeDefined();
          expect(res.path).toBe('/auth/twitter');
          expect(res.body.access_token).toBe('someToken');
          expect(res.body.userData).toBe('some');
          expect(popup.popupWindow.location).toBe('https://api.twitter.com/oauth/authenticate?contentType=application%2Fjson&method=POST&path=%2Fauth%2Ftwitter');

          done();
        })
        .catch(err =>{
          expect(err).toBeUndefined();
          expect(false).toBe(true);
          done();
        });
    });
  });
});
