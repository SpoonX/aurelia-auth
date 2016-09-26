import {PLATFORM, DOM} from 'aurelia-pal';
import {parseQueryString} from 'aurelia-path';
import extend from 'extend';

export class PopupError extends Error {
  constructor(msg, error) {
    super(msg);
    this.data  = msg;   // BC
    this.error = error;
  }
}

export class Popup {
  constructor() {
    this.popupWindow = null;
    this.polling     = null;
    this.url         = '';
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

        const parser  = DOM.createElement('a');
        parser.href = event.url;

        if (parser.search || parser.hash) {
          const qs = parseUrl(parser);

          if (qs.error) {
            reject(new PopupError('Query contains error', qs.error));
          } else {
            resolve(qs);
          }

          this.popupWindow.close();
        }
      });

      this.popupWindow.addEventListener('exit', () => {
        reject(new PopupError('Provider Popup was closed'));
      });

      this.popupWindow.addEventListener('loaderror', () => {
        reject(new PopupError('Authorization Failed'));
      });
    });
  }

  pollPopup() {
    return new Promise((resolve, reject) => {
      this.polling = PLATFORM.global.setInterval(() => {
        let errorData;

        try {
          if (this.popupWindow.location.host ===  PLATFORM.global.document.location.host
            && (this.popupWindow.location.search || this.popupWindow.location.hash)) {
            const qs = parseUrl(this.popupWindow.location);

            if (qs.error) {
              reject(new PopupError('Query contains error', qs.error));
            } else {
              resolve(qs);
            }

            this.popupWindow.close();
            PLATFORM.global.clearInterval(this.polling);
          }
        } catch (error) {
          errorData = error;
        }

        if (!this.popupWindow) {
          PLATFORM.global.clearInterval(this.polling);
          reject(new PopupError('Provider Popup Blocked', errorData));
        } else if (this.popupWindow.closed) {
          PLATFORM.global.clearInterval(this.polling);
          reject(new PopupError('Problem poll popup', errorData));
        }
      }, 35);
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
