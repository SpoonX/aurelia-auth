import {inject} from 'aurelia-dependency-injection';
import {BaseConfig} from './baseConfig';

@inject(BaseConfig)
export class Storage {
  constructor(config) {
    this.config = config;
  }

  get(key) {
    let storageKey = this.config.current.storage;

    if (window[storageKey]) {
      return window[storageKey].getItem(key);
    }
  }

  set(key, value) {
    let storageKey = this.config.current.storage;

    if (window[storageKey]) {
      return window[storageKey].setItem(key, value);
    }
  }

  remove(key) {
    let storageKey = this.config.current.storage;

    if (window[storageKey]) {
      return window[storageKey].removeItem(key);
    }
  }
}
