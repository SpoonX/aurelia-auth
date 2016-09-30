import {inject} from 'aurelia-dependency-injection';
import {AuthService} from './aurelia-authentication';

@inject(AuthService)
export class AuthenticatedFilterValueConverter {
  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * route toView predictator on route.config.auth === (parameter || authService.isAuthenticated())
   * @param  {RouteConfig}  routes            the routes array to convert
   * @param  {[Boolean]}    [isAuthenticated] optional isAuthenticated value. default: this.authService.authenticated
   * @return {Boolean}      show/hide element
   */
  toView(routes: RouteConfig, isAuthenticated: Boolean = this.authService.authenticated): Booelan {
    return routes.filter(route => typeof route.config.auth !== 'boolean' || route.config.auth === isAuthenticated);
  }
}
