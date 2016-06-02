import {inject} from 'aurelia-dependency-injection';
import {AuthService} from '../authService';

@inject(AuthService)
export class AuthenticatedValueConverter {
  constructor(authService) {
    this.authService = authService;
  }

  /**
   * element toView predictator on authService.isAuthenticated()
   * @return {Boolean}  show/hide element
   */
  toView() {
    return this.authService.authenticated;
  }
}
