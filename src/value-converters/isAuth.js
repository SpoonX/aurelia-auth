import {inject} from 'aurelia-dependency-injection';

import {AuthService} from '../aurelia-authentication';

@inject(AuthService)
export class IsAuthValueConverter {
  constructor(authService) {
    this.authService = authService;
  }

  toView() {
    return this.authService.isAuthenticated();
  }
}
