import {HttpClient} from 'aurelia-fetch-client';
import {AuthService} from './authService';
import {BaseConfig} from './baseConfig';
import {inject} from 'aurelia-dependency-injection';
import {Config, Rest} from 'aurelia-api';

@inject(HttpClient, Config, AuthService, BaseConfig)
export class FetchConfig {
  /**
   * Construct the FetchConfig
   *
   * @param {HttpClient} httpClient
   * @param {Config} clientConfig
   * @param {Authentication} authService
   * @param {BaseConfig} config
   */
  constructor(httpClient, clientConfig, authService, config) {
    this.httpClient   = httpClient;
    this.clientConfig = clientConfig;
    this.authService  = authService;
    this.config       = config;
  }

  /**
   * Interceptor for HttpClient
   *
   * @return {{request: Function}}
   */
  get interceptor() {
    return {
      request: (request) => {
        if (!this.authService.isAuthenticated() || !this.config.current.httpInterceptor) {
          return request;
        }
        let token = this.authService.getCurrentToken();

        if (this.config.current.authHeader && this.config.current.authToken) {
          token = `${this.config.current.authToken} ${token}`;
        }

        request.headers.set(this.config.current.authHeader, token);

        return request;
      },
      response: (response, request) => {
        return new Promise((resolve, reject) => {
          if (response.ok) {
            return resolve(response);
          }
          if (response.status !== 401) {
            return resolve(response);
          }
          if (!this.authService.isTokenExpired() || !this.config.current.httpInterceptor) {
            return resolve(response);
          }
          if (!this.authService.getRefreshToken()) {
            return resolve(response);
          }
          this.authService.updateToken().then(() => {
            let token = this.authService.getCurrentToken();
            if (this.config.current.authHeader && this.config.current.authToken) {
              token = `${this.config.current.authToken} ${token}`;
            }
            request.headers.append('Authorization', token);
            return this.client.fetch(request).then(resolve);
          });
        });
      }
    };
  }

  /**
   * @param {HttpClient|Rest[]} aClient
   *
   * @return {HttpClient[]}
   */
  configure(aClient) {
    if (Array.isArray(aClient)) {
      let configuredClients = [];
      aClient.forEach(toConfigure => {
        configuredClients.push(this.configure(toConfigure));
      });

      return configuredClients;
    }

    if (typeof aClient === 'string') {
      let endpoint = this.clientConfig.getEndpoint(aClient);
      if (!endpoint) {
        throw new Error(`There is no '${aClient || 'default'}' endpoint registered.`);
      }
      aClient = endpoint.client;
    } else if (aClient instanceof Rest) {
      aClient = aClient.client;
    } else if (!(aClient instanceof HttpClient)) {
      aClient = this.httpClient;
    }

    aClient.interceptors.push(this.interceptor);

    return aClient;
  }
}
