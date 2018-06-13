import {inject} from 'aurelia-dependency-injection';
import {HttpClient} from 'aurelia-fetch-client';
import {Config, Rest} from 'aurelia-api';
import {AuthService} from './authService';
import {BaseConfig} from './baseConfig';

@inject(HttpClient, Config, AuthService, BaseConfig)
export class FetchConfig {
  /**
   * Construct the FetchConfig
   *
   * @param {HttpClient} httpClient httpClient
   * @param {Config} clientConfig clientConfig
   * @param {Authentication} authService authService
   * @param {BaseConfig} config baseConfig
   */
  constructor(httpClient: HttpClient, clientConfig: Config, authService: Authentication, config: BaseConfig) {
    this.httpClient   = httpClient;
    this.clientConfig = clientConfig;
    this.authService  = authService;
    this.config       = config;
  }

  /**
   * Interceptor for HttpClient
   *
   * @return {{request: Function, response: Function}} The interceptor
   */
  get interceptor(): {request: Function, response: Function} {
    return {
      request: request => {
        if (!this.config.httpInterceptor || !this.authService.isAuthenticated()) {
          return request;
        }
        let token = this.authService.getAccessToken();

        if (this.config.authTokenType) {
          token = `${this.config.authTokenType} ${token}`;
        }

        request.headers.set(this.config.authHeader, token);

        return request;
      },
      response: (response, request) => {
        return new Promise((resolve, reject) => {
          // resolve success
          if (response.ok) {
            return resolve(response);
          }
          // resolve all non-authorization errors
          if (response.status !== 401) {
            return resolve(response);
          }
          // when we get a 401 and are not logged in, there's not much to do except reject the request
          if (!this.authService.authenticated) {
            return reject(response);
          }
          // logout when server invalidated the authorization token but the token itself is still valid
          if (this.config.httpInterceptor && this.config.logoutOnInvalidToken && !this.authService.isTokenExpired()) {
            return reject(this.authService.logout());
          }
          // resolve unexpected authorization errors (not a managed request or token not expired)
          if (!this.config.httpInterceptor || !this.authService.isTokenExpired()) {
            return resolve(response);
          }
          // resolve expected authorization error without refresh_token setup
          if (!this.config.useRefreshToken || !this.authService.getRefreshToken()) {
            return resolve(response);
          }

          // refresh token and try again
          return this.authService.updateToken().then(() => {
            let token = this.authService.getAccessToken();

            if (this.config.authTokenType) {
              token = `${this.config.authTokenType} ${token}`;
            }

            request.headers.set(this.config.authHeader, token);

            return this.httpClient.fetch(request).then(resolve);
          })
          // reject if could not update the token
          .catch(e => reject(e));
        });
      }
    };
  }

  /**
   * Configure client(s) with authorization interceptor
   *
   * @param {HttpClient|Rest|string[]} client HttpClient, rest client or api endpoint name, or an array thereof
   *
   * @return {HttpClient[]} The configured client(s)
   */
  configure(client: HttpClient|Rest|Array<string>): HttpClient|Array<HttpClient> {
    if (Array.isArray(client)) {
      let configuredClients = [];

      client.forEach(toConfigure => {
        configuredClients.push(this.configure(toConfigure));
      });

      return configuredClients;
    }

    if (typeof client === 'string') {
      const endpoint = this.clientConfig.getEndpoint(client);

      if (!endpoint) {
        throw new Error(`There is no '${client || 'default'}' endpoint registered.`);
      }
      client = endpoint.client;
    } else if (client instanceof Rest) {
      client = client.client;
    } else if (!(client instanceof HttpClient)) {
      client = this.httpClient;
    }

    client.interceptors.push(this.interceptor);

    return client;
  }
}
