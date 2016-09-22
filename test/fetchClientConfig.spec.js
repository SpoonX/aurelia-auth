import {Container} from 'aurelia-dependency-injection';
import {HttpClient} from 'aurelia-fetch-client';
import {Config as ApiConfig} from 'aurelia-api';

import {FetchConfig} from '../src/fetchClientConfig';
import {AuthService} from '../src/authService';

function getContainer() {
  let container = new Container();
  let apiConfig    = container.get(ApiConfig);

  apiConfig
    .registerEndpoint('sx/default', 'http://localhost:1927/')
    .registerEndpoint('sx/custom', 'http://localhost:1927/custom')
    .setDefaultEndpoint('sx/default');

  return container;
}

describe('FetchConfig', function() {
  let container      = getContainer();
  let clientConfig   = container.get(ApiConfig);
  let fetchConfig    = container.get(FetchConfig);
  let authService    = container.get(AuthService);

  describe('.intercept()', function() {
    it('Should intercept requests when authenticated.', function(done) {
      let client     = container.get(HttpClient);
      client.baseUrl = 'http://localhost:1927/';
      authService.setResponseObject({token: 'xy'});

      fetchConfig.configure();
      client.fetch('some')
        .then(response => response.json())
        .then(response => {
          expect(response.Authorization).toEqual('Bearer xy');
          done();
        })
        .catch(err => {
          expect(err).toBeUndefined();
          expect(true).toBe(false);
          done();
        });
    });

    it('Should not intercept requests when unauthenticated.', function(done) {
      let client                 = new HttpClient();
      client.baseUrl             = 'http://localhost:1927/';
      authService.accessToken = null;

      fetchConfig.configure();
      client.fetch('some')
        .then(response => response.json())
        .then(response => {
          expect(response.Authorization).toBeUndefined();
          done();
        })
        .catch(err => {
          expect(err).toBeUndefined();
          expect(true).toBe(false);
          done();
        });
    });

    it('Should not intercept requests when authenticated with the httpInterceptor disabled.', function(done) {
      let client                   = new HttpClient();
      client.baseUrl               = 'http://localhost:1927/';
      authService.accessToken   = 'xy';
      clientConfig.httpInterceptor = false;

      fetchConfig.configure();
      client.fetch('some')
        .then(response => response.json())
        .then(response => {
          expect(response.Authorization).toBeUndefined();
          done();
        })
        .catch(err => {
          expect(err).toBeUndefined();
          expect(true).toBe(false);
          done();
        });
    });
  });

  clientConfig.httpInterceptor = true;

  describe('.configure()', function() {
    it('Should configure the HttpClient singleton without any arguments.', function(done) {
      let client                 = container.get(HttpClient);
      client.baseUrl             = 'http://localhost:1927/';
      authService.accessToken = 'xy';

      fetchConfig.configure();
      client.fetch('some')
        .then(response => {
          expect(response instanceof Response).toEqual(true);
          return response.json();
        })
        .then(response => {
          expect(response.path).toEqual('/some');
          expect(response.Authorization).toEqual('Bearer xy');
          done();
        })
        .catch(err => {
          expect(err).toBeUndefined();
          expect(true).toBe(false);
          done();
        });
    });

    it('Should configure given client as instance of HttpClient.', function(done) {
      let client                 = new HttpClient();
      client.baseUrl             = 'http://localhost:1927/';
      authService.accessToken = 'xy';

      fetchConfig.configure(client);
      client.fetch('some')
        .then(response => {
          expect(response instanceof Response).toEqual(true);
          return response.json();
        })
        .then(response => {
          expect(response.path).toEqual('/some');
          expect(response.Authorization).toEqual('Bearer xy');
          done();
        })
        .catch(err => {
          expect(err).toBeUndefined();
          expect(true).toBe(false);
          done();
        });
    });

    it('Should configure given client as instance of Rest.', function(done) {
      let rest = clientConfig.getEndpoint('sx/default');
      authService.accessToken = 'xy';

      fetchConfig.configure(rest);
      rest.find('some')
        .then(response => {
          expect(response.path).toEqual('/some');
          expect(response.Authorization).toEqual('Bearer xy');
          done();
        })
        .catch(err => {
          expect(err).toBeUndefined();
          expect(true).toBe(false);
          done();
        });
    });

    it('Should not configure given client being an unknown endpoint string.', function() {
      let endpoint = 'unknown';

      let configureWithTypo = () =>  fetchConfig.configure(endpoint);
      expect(configureWithTypo).toThrow();
    });

    it('Should configure given client being the default endpoint.', function(done) {
      let rest                   = clientConfig.getEndpoint('sx/default');
      let endpoint               = '';
      authService.accessToken = 'xy';

      fetchConfig.configure(endpoint);
      rest.find('some')
        .then(response => {
          expect(response.path).toEqual('/some');
          expect(response.Authorization).toEqual('Bearer xy');
          done();
        })
        .catch(err => {
          expect(err).toBeUndefined();
          expect(true).toBe(false);
          done();
        });
    });

    it('Should configure given client being an endpoint string.', function(done) {
      let rest                   = clientConfig.getEndpoint('sx/default');
      let endpoint               = 'sx/default';
      authService.accessToken = 'xy';

      fetchConfig.configure(endpoint);
      rest.find('some')
        .then(response => {
          expect(response.path).toEqual('/some');
          expect(response.Authorization).toEqual('Bearer xy');
          done();
        })
        .catch(err => {
          expect(err).toBeUndefined();
          expect(true).toBe(false);
          done();
        });
    });

    it('Should configure given client as array of HttpClient instances.', function(done) {
      let clients                = [new HttpClient(), new HttpClient()];
      clients[1].baseUrl         = 'http://localhost:1927/';
      authService.accessToken = 'xy';

      fetchConfig.configure(clients);
      clients[1].fetch('some')
        .then(response => {
          expect(response instanceof Response).toEqual(true);
          return response.json();
        })
        .then(response => {
          expect(response.path).toEqual('/some');
          expect(response.Authorization).toEqual('Bearer xy');
          done();
        })
        .catch(err => {
          expect(err).toBeUndefined();
          expect(true).toBe(false);
          done();
        });
    });

    it('Should configure given client as array of Rest instances.', function(done) {
      let rests                  = [clientConfig.getEndpoint('sx/default'), clientConfig.getEndpoint('sx/custom')];
      rests[1]                   = clientConfig.getEndpoint('sx/default');
      authService.accessToken = 'xy';

      fetchConfig.configure(rests);
      rests[1].find('some')
        .then(response => {
          expect(response.path).toEqual('/some');
          expect(response.Authorization).toEqual('Bearer xy');
          done();
        })
        .catch(err => {
          expect(err).toBeUndefined();
          expect(true).toBe(false);
          done();
        });
    });

    it('Should configure given client as array of strings.', function(done) {
      let endpoints              = ['sx/default', 'sx/custom'];
      let rest                   = clientConfig.getEndpoint('sx/default');
      authService.accessToken = 'xy';

      fetchConfig.configure(endpoints);
      rest.find('some')
        .then(response => {
          expect(response.path).toEqual('/some');
          expect(response.Authorization).toEqual('Bearer xy');
          done();
        })
        .catch(err => {
          expect(err).toBeUndefined();
          expect(true).toBe(false);
          done();
        });
    });
  });

  authService.accessToken = null;
});
