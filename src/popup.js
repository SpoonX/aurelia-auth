import {PLATFORM, DOM} from 'aurelia-pal';
import {parseQueryString} from 'aurelia-path';
import extend from 'extend';

export class Popup {
  constructor() {
    this.popupWindow   = null;
    this.polling = null;
    this.url     = '';
  }

  open(url, windowName, options) {
    this.url = url;
    const optionsString = buildPopupWindowOptions(options || {});

    this.popupWindow = PLATFORM.global.open(url, windowName, optionsString);

    if (this.popupWindow && this.popupWindow.focus) {
      this.popupWindow.focus();
    }

    return this;
  }

  eventListener(redirectUri) {
    return new Promise((resolve, reject) => {
      this.popupWindow.addEventListener('loadstart', event => {
        if (event.url.indexOf(redirectUri) !== 0) {
          return;
        }

        const parser = DOM.createElement('a');
        parser.href = event.url;

        if (parser.search || parser.hash) {
          this.popupWindow.close();

          const params = parseUrl(parser);

          return params.error ? reject(new Error(params.error)) : resolve(params);
        }
      });

      this.popupWindow.addEventListener('exit', () => {
        reject(new Error('Provider Popup was closed'));
      });

      this.popupWindow.addEventListener('loaderror', () => {
        reject(new Error('Authorization Failed'));
      });
    });
  }

  pollPopup(redirectUri) {
    return new Promise((resolve, reject) => {
      const redirectUriParser = DOM.createElement('a');
      redirectUriParser.href  = redirectUri;
      const redirectUriPath   = getFullUrlPath(redirectUriParser);

      this.polling = PLATFORM.global.setInterval(() => {
        if (!this.popupWindow || this.popupWindow.closed || this.popupWindow.closed === undefined) {
          PLATFORM.global.clearInterval(this.polling);

          return reject(new Error('The popup window was closed'));
        }

        try {
          const popupWindowPath = getFullUrlPath(this.popupWindow.location);

          if (popupWindowPath === redirectUriPath) {
            this.popupWindow.close();
            PLATFORM.global.clearInterval(this.polling);

            if (this.popupWindow.location.search || this.popupWindow.location.hash) {
              const params = parseUrl(this.popupWindow.location);

              return params.error ? reject(new Error(params.error)) : resolve(params);
            }

            return reject(new Error(
              'OAuth redirect has occurred but no query or hash parameters were found. ' +
              'They were either not set during the redirect, or were removed—typically by a ' +
              'routing library..'
            ));
          }
        } catch (_) {
          // Ignore DOMException: Blocked a frame with origin from accessing a cross-origin frame.
          // A hack to get around same-origin security policy errors in IE.
        }
      }, 500);
    });
  }
}

const buildPopupWindowOptions = options => {
  const width  = options.width || 500;
  const height = options.height || 500;

  const extended = extend({
    width: width,
    height: height,
    left: PLATFORM.global.screenX + ((PLATFORM.global.outerWidth - width) / 2),
    top: PLATFORM.global.screenY + ((PLATFORM.global.outerHeight - height) / 2.5)
  }, options);

  let parts = [];
  Object.keys(extended).map(key => parts.push(key + '=' + extended[key]));

  return parts.join(',');
};

const parseUrl = url => {
  let hash = (url.hash.charAt(0) === '#') ? url.hash.substr(1) : url.hash;

  return extend(true, {}, parseQueryString(url.search), parseQueryString(hash));
};

const getFullUrlPath = location => {
  const isHttps = location.protocol === 'https:';
  return location.protocol + '//' + location.hostname +
    ':' + (location.port || (isHttps ? '443' : '80')) +
    (/^\//.test(location.pathname) ? location.pathname : '/' + location.pathname);
};
