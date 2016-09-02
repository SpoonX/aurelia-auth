import {PLATFORM} from 'aurelia-pal';
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
export function configure(aurelia, config) {
  // ie9 polyfill
  if (!PLATFORM.location.origin) {
    PLATFORM.location.origin = PLATFORM.location.protocol + '//' + PLATFORM.location.hostname + (PLATFORM.location.port ? ':' + PLATFORM.location.port : '');
  }

  let baseConfig = aurelia.container.get(BaseConfig);

  if (typeof config === 'function') {
    config(baseConfig);
  } else if (typeof config === 'object') {
    baseConfig.configure(config);
  }

  // after baseConfig was configured
  for (let converter of baseConfig.globalValueConverters) {
    aurelia.globalResources(`./${converter}`);
    LogManager.getLogger('authentication').info(`Add globalResources value-converter: ${converter}`);
  }

  let fetchConfig  = aurelia.container.get(FetchConfig);

  // Array? Configure the provided endpoints.
  if (Array.isArray(baseConfig.configureEndpoints)) {
    baseConfig.configureEndpoints.forEach(endpointToPatch => {
      fetchConfig.configure(endpointToPatch);
    });
  }
}
