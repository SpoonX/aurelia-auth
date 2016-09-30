import {inject} from 'aurelia-dependency-injection';
import {Redirect} from 'aurelia-router';
import * as LogManager from 'aurelia-logging';
import {AuthService} from './authService';

@inject(AuthService)
export class AuthorizeStep {
  constructor(authService: AuthService) {
    LogManager.getLogger('authentication').warn('AuthorizeStep is deprecated. Use AuthenticateStep instead.');

    this.authService = authService;
  }

  run(routingContext, next) {
    const isLoggedIn = this.authService.isAuthenticated();
    const loginRoute = this.authService.config.loginRoute;

    if (routingContext.getAllInstructions().some(route => route.config.auth)) {
      if (!isLoggedIn) {
        return next.cancel(new Redirect(loginRoute));
      }
    } else if (isLoggedIn && routingContext.getAllInstructions().some(route => route.fragment === loginRoute)) {
      return next.cancel(new Redirect(this.authService.config.loginRedirect));
    }

    return next();
  }
}
