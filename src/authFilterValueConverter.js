export class AuthFilterValueConverter {
  /**
   * route toView predictator on route.config.auth === isAuthenticated
   * @param  {RouteConfig}  routes            the routes array to convert
   * @param  {Boolean}      isAuthenticated   authentication status
   * @return {Boolean}      show/hide element
   */
  toView(routes: RouteConfig, isAuthenticated: Boolean): Boolean {
    return routes.filter(route => typeof route.config.auth !== 'boolean' || route.config.auth === isAuthenticated);
  }
}
