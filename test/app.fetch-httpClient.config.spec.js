import {Container} from 'aurelia-dependency-injection';
import {FetchConfig} from '../src/aurelia-auth';
import {HttpClient} from 'aurelia-fetch-client';
import {Config, Rest} from 'spoonx/aurelia-api';

function getContainer() {
  let container = new Container();
  let config    = container.get(Config);

  config
    .registerEndpoint('sx/default', 'http://localhost:1927/')
    .registerEndpoint('sx/custom', 'http://localhost:1927/custom')
    .setDefaultEndpoint('sx/default');

  return container;
}

function getInterceptorStubs(isAuthenticated, httpInterceptor) {
  let authenticationStub = {
    isAuthenticated: () => { return isAuthenticated; },
    getToken: () => { return 'someToken'; }
  };
  
  let configStub = {
    current: {
      httpInterceptor: httpInterceptor,
      authHeader: 'AuthoriseHeader',
      authToken: 'AuthoriseToken'
    }
  };
  
  let requestStub = {
    headers: {
      append: (header, value) => {}
    }
  };
  
  return {
    authenticationStub: authenticationStub,
    configStub: configStub,
    requestStub: requestStub
  };
}

describe('FetchConfig', function() {
  describe('.intercept()', function() {
    it('Should intercept requests when authenticated.', function() {
      let { authenticationStub, configStub, requestStub } = getInterceptorStubs(true, true);
      
      spyOn(requestStub.headers, 'append');

      let fetchConfig = new FetchConfig(null, null, authenticationStub, configStub);
      let chain = fetchConfig.interceptor.request(requestStub);
      
      expect(chain).toBe(requestStub);
      expect(requestStub.headers.append).toHaveBeenCalledWith('AuthoriseHeader', 'AuthoriseToken someToken');
    });
    
    it('Should not intercept requests when unauthenticated.', function() {
      let { authenticationStub, configStub, requestStub } = getInterceptorStubs(false, true);
      
      spyOn(requestStub.headers, 'append');

      let fetchConfig = new FetchConfig(null, null, authenticationStub, configStub);
      let chain = fetchConfig.interceptor.request(requestStub);
      
      expect(chain).toBe(requestStub);
      expect(requestStub.headers.append).not.toHaveBeenCalled();
    });
    
    it('Should not intercept requests when authenticated with the httpInterceptor disabled.', function() {
      let { authenticationStub, configStub, requestStub } = getInterceptorStubs(true, false);
      
      spyOn(requestStub.headers, 'append');

      let fetchConfig = new FetchConfig(null, null, authenticationStub, configStub);
      let chain = fetchConfig.interceptor.request(requestStub);
      
      expect(chain).toBe(requestStub);
      expect(requestStub.headers.append).not.toHaveBeenCalled();
    });
  });
  
  describe('.configure()', function() {
    it('Should configure given client as instance of HttpClient.', function() {
      let container   = new Container();
      let client      = container.get(HttpClient);
      let fetchConfig = container.get(FetchConfig);

      expect(client.baseUrl).toEqual('');

      fetchConfig.configure(client);

      let clientInterceptor = client.interceptors[0];
      let configInterceptor = fetchConfig.interceptor;

      expect(clientInterceptor.request.toString()).toEqual(configInterceptor.request.toString());
      expect(client.baseUrl).toEqual('');
    });

    it('Should configure given client as instance of Rest.', function() {
      let container    = getContainer();
      let clientConfig = container.get(Config);
      let client       = clientConfig.getEndpoint('sx/default');
      let fetchConfig  = container.get(FetchConfig);

      fetchConfig.configure(client);

      let clientInterceptor = client.client.interceptors[0];
      let configInterceptor = fetchConfig.interceptor;

      expect(clientInterceptor.request.toString()).toEqual(configInterceptor.request.toString());
      expect(client.client.baseUrl).toEqual('http://localhost:1927/');
    });

    it('Should configure given client being a string.', function() {
      let container         = getContainer();
      let client            = 'sx/default';
      let fetchConfig       = container.get(FetchConfig);
      let configuredClient  = fetchConfig.configure(client);
      let clientInterceptor = configuredClient.interceptors[0];
      let configInterceptor = fetchConfig.interceptor;

      expect(clientInterceptor.request.toString()).toEqual(configInterceptor.request.toString());
      expect(configuredClient.baseUrl).toEqual('http://localhost:1927/');
    });

    it('Should configure given client as array of HttpClient instances.', function() {
      let container   = new Container();
      let fetchConfig = container.get(FetchConfig);
      let clients     = [new HttpClient(), new HttpClient()];

      expect(clients[0].baseUrl).toEqual('');
      expect(clients[1].baseUrl).toEqual('');

      fetchConfig.configure(clients).forEach(configuredClient => {
        let clientInterceptor = configuredClient.interceptors[0];
        let configInterceptor = fetchConfig.interceptor;

        expect(clientInterceptor.request.toString()).toEqual(configInterceptor.request.toString());
        expect(configuredClient.baseUrl).toEqual('');
      });
    });

    it('Should configure given client as array of Rest instances.', function() {
      let container         = getContainer();
      let clientConfig      = container.get(Config);
      let clients           = [clientConfig.getEndpoint('sx/default'), clientConfig.getEndpoint('sx/custom')];
      let fetchConfig       = container.get(FetchConfig);
      let configuredClients = fetchConfig.configure(clients);

      configuredClients.forEach(configuredClient => {
        let clientInterceptor = configuredClient.interceptors[0];
        let configInterceptor = fetchConfig.interceptor;

        expect(clientInterceptor.request.toString()).toEqual(configInterceptor.request.toString());
      });

      expect(configuredClients[0].baseUrl).toEqual('http://localhost:1927/');
      expect(configuredClients[1].baseUrl).toEqual('http://localhost:1927/custom');
    });

    it('Should configure given client as array of strings.', function() {
      let container         = getContainer();
      let clients           = ['sx/default', 'sx/custom'];
      let fetchConfig       = container.get(FetchConfig);
      let configuredClients = fetchConfig.configure(clients);

      configuredClients.forEach(configuredClient => {
        let clientInterceptor = configuredClient.interceptors[0];
        let configInterceptor = fetchConfig.interceptor;

        expect(clientInterceptor.request.toString()).toEqual(configInterceptor.request.toString());
      });

      expect(configuredClients[0].baseUrl).toEqual('http://localhost:1927/');
      expect(configuredClients[1].baseUrl).toEqual('http://localhost:1927/custom');
    });

    it('Should configure without any arguments.', function() {
      let container   = new Container();
      let client      = container.get(HttpClient);
      let fetchConfig = container.get(FetchConfig);

      expect(client.baseUrl).toEqual('');
      expect(client.interceptors.length).toEqual(0);

      let configuredClient  = fetchConfig.configure();
      let clientInterceptor = client.interceptors[0];
      let configInterceptor = configuredClient.interceptors[0];

      expect(clientInterceptor.request.toString()).toEqual(configInterceptor.request.toString());
      expect(client.interceptors.length).toEqual(1);
      expect(client.baseUrl).toEqual('');
    });
  });
});















