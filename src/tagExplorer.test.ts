import * as jsdom from 'jsdom';
import * as tagExplorer from './tagExplorer';
import { assert } from 'chai';

describe('tag-explorer', function () {
  let window: Window;
  let document: Document;
  let container: HTMLElement;

  beforeEach(done => {
    jsdom.env('', (err, w) => {
      window = w;
      document = window.document;
      container = document.createElement('div');
      document.body.appendChild(container);
      done();
    });
  });

  describe('tagExplorer', function () {
    beforeEach(function () {
      const articles = [];
      tagExplorer(container, articles, ['a', 'aa', 'b', 'bb'], window);
    });

    it('Creates a menu element', function () {
      assert.equal(container.children.length, 1);
      assert.equal((<HTMLElement>container.firstChild).tagName, 'MENU');
    });

    it('Creates a button for each tag', function () {
      const buttons = container.querySelectorAll('menu > li > button');
      assert.equal(buttons.length, 4);
      assert.equal(buttons[0].textContent, 'a');
      assert.equal(buttons[1].textContent, 'aa');
      assert.equal(buttons[2].textContent, 'b');
      assert.equal(buttons[3].textContent, 'bb');
    });
  });
});
