export class AuthFilterValueConverter {
  constructor() {
    LogManager.getLogger('authentication').warn('authFilter is deprecated. Use routeAuthenticated instead and use {settings: {authenticate: true}} in your route configuration.');
  }

  toView(routes, isAuthenticated) {
    return routes.filter(route => route.config.auth === isAuthenticated);
  }
}
