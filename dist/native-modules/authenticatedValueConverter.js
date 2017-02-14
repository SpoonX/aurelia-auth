'use strict';

exports.__esModule = true;
exports.AuthenticatedValueConverter = undefined;

var _dec, _class;

var _aureliaDependencyInjection = require('aurelia-dependency-injection');

var _aureliaAuthentication = require('./aurelia-authentication');



var AuthenticatedValueConverter = exports.AuthenticatedValueConverter = (_dec = (0, _aureliaDependencyInjection.inject)(_aureliaAuthentication.AuthService), _dec(_class = function () {
  function AuthenticatedValueConverter(authService) {
    

    this.authService = authService;
  }

  AuthenticatedValueConverter.prototype.toView = function toView() {
    return this.authService.authenticated;
  };

  return AuthenticatedValueConverter;
}()) || _class);