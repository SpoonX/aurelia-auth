import {Container} from 'aurelia-dependency-injection';

import {Storage} from '../src/storage';
import {BaseConfig} from '../src/baseConfig';

describe('Storage', () => {
  const container  = new Container();
  const storage    = container.get(Storage);
  const baseConfig = storage.config;
  const defaultKey = 'localStorage';

  afterEach(() => {
    baseConfig.storage = defaultKey;
  });

  describe('.get', () => {
    it('with defaults', () => {
      window.localStorage.setItem('key', 'value');

      expect(storage.get('key')).toBe('value');
    });

    it('with sessionStorage', () => {
      window.sessionStorage.setItem('key', 'value');
      baseConfig.storage = 'sessionStorage';

      expect(storage.get('key')).toBe('value');
    });
  });

  describe('.set', () => {
    it('with defaults', () => {
      storage.set('key', 'value');

      expect(window.localStorage.getItem('key')).toBe('value');
    });

    it('with sessionStorage', () => {
      baseConfig.storage = 'sessionStorage';

      storage.set('key', 'value');
      expect(window.sessionStorage.getItem('key')).toBe('value');
    });
  });

  describe('.remove', () => {
    it('with defaults', () => {
      window.localStorage.setItem('key', 'value');

      storage.remove('key');
      expect(window.localStorage.getItem('key')).toBe(null);
    });

    it('with sessionStorage', () => {
      window.sessionStorage.setItem('key', 'value');
      baseConfig.storage = 'sessionStorage';

      storage.remove('key', 'value');
      expect(window.sessionStorage.getItem('key')).toBe(null);
    });
  });
});
