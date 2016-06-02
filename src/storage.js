import {PLATFORM} from 'aurelia-pal';
import {inject} from 'aurelia-dependency-injection';

import {BaseConfig} from './baseConfig';

@inject(BaseConfig)
export class Storage {
  constructor(config) {
    this.config = config;
  }

  get(key) {
    return PLATFORM.global[this.config.storage].getItem(key);
  }

  set(key, value) {
    PLATFORM.global[this.config.storage].setItem(key, value);
  }

  remove(key) {
    PLATFORM.global[this.config.storage].removeItem(key);
  }
}
