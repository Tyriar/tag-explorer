describe('tag-explorer', function () {
  var container;

  beforeEach(function () {
    container = document.createElement('div');
  });

  describe('tagExplorer', function () {
    beforeEach(function () {
      var articles = [];
      tagExplorer(container, articles, ['a', 'aa', 'b', 'bb']);
    });

    it('Creates a menu element', function () {
      expect(container.children.length).toBe(1);
      expect(container.firstChild.tagName).toBe('MENU');
    });

    it('Creates a button for each tag', function () {
      var buttons = container.querySelectorAll('menu > li > button');
      expect(buttons.length).toBe(4);
      expect(buttons[0].textContent).toBe('a');
      expect(buttons[1].textContent).toBe('aa');
      expect(buttons[2].textContent).toBe('b');
      expect(buttons[3].textContent).toBe('bb');
    });
  });
});
