describe('$refs that are in the same file but also circular', function () {
  'use strict';

  it('should bundle successfully', function () {
    var parser = new $RefParser();

    return parser
      .bundle(path.rel('specs/complexOrder/definitions/root.json'))
      .then(function (schema) {
        expect(schema).to.deep.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.complexOrder);
      });
  });
});
