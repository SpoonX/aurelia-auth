import {PLATFORM} from 'aurelia-pal';
import {HttpClient} from 'aurelia-fetch-client';
import {Config as ApiConfig, Rest} from 'aurelia-api';
import {BaseConfig} from './baseConfig';
import {FetchConfig} from './fetchClientConfig';
import * as LogManager from 'aurelia-logging';

// added for bundling
import {AuthFilterValueConverter} from './authFilterValueConverter'; // eslint-disable-line no-unused-vars
import {AuthenticatedFilterValueConverter} from './authenticatedFilterValueConverter'; // eslint-disable-line no-unused-vars
import {AuthenticatedValueConverter} from './authenticatedValueConverter'; // eslint-disable-line no-unused-vars

/**
 * Configure the plugin.
 *
 * @param {{globalResources: Function, container: {Container}}} aurelia
 * @param {{}|Function}                                         config
 */
export function configure(aurelia, configOrConfigure) {
  // ie9 polyfill
  if (!PLATFORM.location.origin) {
    PLATFORM.location.origin = PLATFORM.location.protocol + '//' + PLATFORM.location.hostname + (PLATFORM.location.port ? ':' + PLATFORM.location.port : '');
  }

  let baseConfig = aurelia.container.get(BaseConfig);

  // set user config
  if (typeof configOrConfigure === 'function') {
    configOrConfigure(baseConfig);
  } else {
    baseConfig.configure(configOrConfigure);
  }

  // after baseConfig was configured
  for (let converter of baseConfig.globalValueConverters) {
    aurelia.globalResources(`./${converter}`);
    LogManager.getLogger('authentication').info(`Add globalResources value-converter: ${converter}`);
  }

  // Array? Configure the provided endpoints.
  if (Array.isArray(baseConfig.configureEndpoints)) {
    aurelia.container.get(FetchConfig).configure(baseConfig.configureEndpoints);
  }

  let client = baseConfig.client;

  // Let's see if there's a configured named or default endpoint or a HttpClient.
  if (!client && baseConfig.endpoint !== null) {
    if (typeof baseConfig.endpoint === 'string') {
      const endpoint =  aurelia.container.get(ApiConfig).getEndpoint(baseConfig.endpoint);
      if (!endpoint) {
        throw new Error(`There is no '${baseConfig.endpoint || 'default'}' endpoint registered.`);
      }
      client = endpoint;
    } else if (baseConfig.endpoint instanceof HttpClient) {
      client = new Rest(baseConfig.endpoint);
    }
  }

  // No? Fine. Default to HttpClient. BC all the way.
  if (!(client instanceof Rest)) {
    client = new Rest(aurelia.container.get(HttpClient));
  }

  // Set the client on the config, for use throughout the plugin.
  baseConfig.client = client;
}
