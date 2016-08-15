define(['exports', './aurelia-authentication'], function (exports, _aureliaAuthentication) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.keys(_aureliaAuthentication).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return _aureliaAuthentication[key];
      }
    });
  });
});