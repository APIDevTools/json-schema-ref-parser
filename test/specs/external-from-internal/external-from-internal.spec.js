describe('Schema with two external refs to the same value and internal ref before', function () {
  'use strict';
  /* details here: https://github.com/BigstickCarpet/json-schema-ref-parser/pull/62 */

  it('should bundle successfully', function () {
    var parser = new $RefParser();
    return parser
      .bundle(path.rel('specs/external-from-internal/external-from-internal.yaml'))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.externalFromInternal);
      });
  });
});

