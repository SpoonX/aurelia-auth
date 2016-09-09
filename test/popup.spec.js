import {Popup} from '../src/popup';

describe('Popup', () => {
  const popup = new Popup();

  describe('.open()', () => {
    it('fails with defaults', done => {
      popup.open('http://localhost:1927', 'windowName', {options: 'none'});

      expect(popup.popupWindow.name, 'windowName');
      popup.popupWindow.close();

      done();
    });
  });
});
