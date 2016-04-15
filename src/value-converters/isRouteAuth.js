import {inject} from 'aurelia-dependency-injection';

import {AuthService} from '../aurelia-authentication';

@inject(AuthService)
export class IsRouteAuthValueConverter {
  constructor(authService) {
    this.authService = authService;
  }

  toView(routes) {
    return routes.filter(r => r.config.auth === undefined || r.config.auth === this.authService.isAuthenticated());
  }
}
