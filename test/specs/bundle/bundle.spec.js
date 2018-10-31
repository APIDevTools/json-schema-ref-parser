describe('Bundle', function () {
  'use strict';

  it('should bundle multiple files, with multiple refs', function () {
    var parser = new $RefParser();
    return parser.bundle(path.rel('specs/bundle/outter.yaml'))
      .then(function (bundled) {
        var secondParse = new $RefParser();
        return secondParse.dereference(bundled);
      })
      .then(function (deref) {
        expect(deref).to.deep.equal(helper.dereferenced.bundled);
      });
  });

});

