import {Container} from 'aurelia-dependency-injection';
import {Config, Rest} from 'aurelia-api';
import {HttpClient} from 'aurelia-fetch-client';

import {configure} from '../src/aurelia-authentication';
import {AuthService} from '../src/authService';
import {AuthorizeStep} from '../src/authorizeStep';
import {AuthenticateStep} from '../src/authenticateStep';
import {FetchConfig} from '../src/fetchClientConfig';
import {BaseConfig} from '../src/baseConfig';

let noop = () => {};

function getContainer() {
  let container = new Container();
  let config    = container.get(Config);

  config
    .registerEndpoint('sx/default', 'http://localhost:1927/')
    .registerEndpoint('sx/custom', 'http://localhost:1927/custom')
    .setDefaultEndpoint('sx/default');

  return container;
}

describe('aurelia-authentication', function() {
  describe('export', function() {
    it('Should export configure', function() {
      expect(configure).toBeDefined();
    });

    it('Should export FetchConfig', function() {
      expect(FetchConfig).toBeDefined();
    });

    it('Should export AuthService', function() {
      expect(AuthService).toBeDefined();
    });

    it('Should export AuthorizeStep', function() {
      expect(AuthorizeStep).toBeDefined();
    });

    it('Should export AuthenticateStep', function() {
      expect(AuthenticateStep).toBeDefined();
    });
  });

  describe('configure()', function() {
    it('Should call globalResources configuration to be passed as a function.', function() {
      let container = new Container();

      let globalResources = [];
      configure({
        container: container, globalResources: resource => {
          globalResources.push(resource);
        }
      }, noop);

      const expected = ['./authFilterValueConverter'];

      expect(globalResources.toString()).toEqual(expected.toString());
    });

    it('Should allow configuration with a function.', function() {
      let container = new Container();
      let baseConfig = container.get(BaseConfig);

      configure({container: container, globalResources: noop}, builder => {
        expect(builder instanceof BaseConfig).toBe(true);
        const myConfig = {foo: 'bar'};

        builder.configure(myConfig);
        expect(baseConfig.foo).toBe('bar');
      });
    });

    it('Should allow configuration to be passed as an object.', function() {
      let container  = new Container();
      let baseConfig = container.get(BaseConfig);
      const myConfig = {foo: 'bar2'};

      configure({container: container, globalResources: noop}, myConfig);
      expect(baseConfig.foo).toBe('bar2');
    });

    it('Should not allow configuration with unregistered endpoint', function() {
      let container = new Container();

      let configureEndpoint = () => configure({container: container, globalResources: noop}, {endpoint: 'something'});
      let configureConfigureEndpoints = () => configure({container: container, globalResources: noop}, {configureEndpoints: ['another']});

      expect(configureEndpoint).toThrow();
      expect(configureConfigureEndpoints).toThrow();
    });

    it('Should allow configuration with configured endpoints.', function() {
      let container = getContainer();

      let configureEndpoint = () => configure({container: container, globalResources: noop}, {endpoint: 'sx/default'});
      let configureConfigureEndpoints = () => configure({container: container, globalResources: noop}, {configureEndpoints: ['sx/default', 'sx/custom']});

      expect(configureEndpoint).not.toThrow();
      expect(configureConfigureEndpoints).not.toThrow();
    });

    it('Should allow configuration with default endpoint.', function() {
      let container = getContainer();

      let configureEndpoint = () => configure({container: container, globalResources: noop}, {endpoint: ''});
      let configureConfigureEndpoints = () => configure({container: container, globalResources: noop}, {configureEndpoints: ['']});

      expect(configureEndpoint).not.toThrow();
      expect(configureConfigureEndpoints).not.toThrow();
    });

    it('Should set the configured endpoint as a client.', function() {
      let container    = getContainer();
      let baseConfig   = container.get(BaseConfig);
      let clientConfig = container.get(Config);

      configure({container: container, globalResources: noop}, {endpoint: 'sx/custom'});

      expect(baseConfig.endpoint).toEqual('sx/custom');
      expect(baseConfig.client).toBe(clientConfig.getEndpoint('sx/custom'));
      expect(baseConfig.client.endpoint).toBe('sx/custom');
    });

    it('Should set the default endpoint as a client.', function() {
      let container    = getContainer();
      let baseConfig   = container.get(BaseConfig);
      let clientConfig = container.get(Config);

      configure({container: container, globalResources: noop}, {endpoint: ''});

      expect(baseConfig.endpoint).toEqual('');
      expect(baseConfig.client).toBe(clientConfig.getEndpoint('sx/default'));
      expect(baseConfig.client.endpoint).toBe('sx/default');
    });

    it('Should set provided HttpClient instance as a client.', function() {
      let container  = new Container();
      let baseConfig = container.get(BaseConfig);
      baseConfig.endpoint = new HttpClient;

      configure({container: container, globalResources: noop}, {});

      expect(baseConfig.client instanceof Rest).toBe(true);
      expect(baseConfig.client.client).toBe(baseConfig.endpoint);
      expect(baseConfig.client.endpoint).toBe('instance');
    });

    it('Should set the default HttpClient as client if no endpoint was supplied.', function() {
      let container  = new Container();
      let baseConfig = container.get(BaseConfig);

      configure({container: container, globalResources: noop}, {});

      expect(baseConfig.endpoint).toEqual(null);
      expect(baseConfig.client instanceof Rest).toBe(true);
      expect(baseConfig.client.client).toBe(container.get(HttpClient));
      expect(baseConfig.client.endpoint).toBe('singleton');
    });
  });
});
