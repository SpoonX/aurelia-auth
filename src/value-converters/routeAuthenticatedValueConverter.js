import {inject} from 'aurelia-dependency-injection';
import {AuthService} from '../authService';

@inject(AuthService)
export class RouteAuthenticatedValueConverter {
  constructor(authService) {
    this.authService = authService;
  }

  /**
   * route toView predictator on route.config.settings.authenticate === (parameter || authService.isAuthenticated())
   * @param  {RouteConfig}  routes            the routes array to convert
   * @param  {[Boolean]}    [isAuthenticated] optional isAuthenticated value. default: this.authService.isAuthenticated()
   * @return {Boolean}      show/hide element
   */
  toView(routes, isAuthenticated = this.authService.authenticated) {
    return routes.filter(route => route.config.settings.authenticate === isAuthenticated);
  }
}
