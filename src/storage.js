import {PLATFORM} from 'aurelia-pal';
import {inject} from 'aurelia-dependency-injection';
import {BaseConfig} from './baseConfig';

@inject(BaseConfig)
export class Storage {
  constructor(config: BaseConfig) {
    this.config = config;
  }

  get(key: string): string {
    return PLATFORM.global[this.config.storage].getItem(key);
  }

  set(key: string, value: string) {
    PLATFORM.global[this.config.storage].setItem(key, value);
  }

  remove(key: string) {
    PLATFORM.global[this.config.storage].removeItem(key);
  }
}
