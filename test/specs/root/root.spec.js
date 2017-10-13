describe('Schema with a top-level (root) $ref', function () {
  'use strict';

  it('should parse successfully', function () {
    var parser = new $RefParser();
    return parser
      .parse(path.rel('specs/root/root.yaml'))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.root.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/root/root.yaml')]);
      });
  });

  it('should resolve successfully', helper.testResolve(
    path.rel('specs/root/root.yaml'),
    path.abs('specs/root/root.yaml'), helper.parsed.root.schema,
    path.abs('specs/root/definitions/root.json'), helper.parsed.root.root,
    path.abs('specs/root/definitions/extended.yaml'), helper.parsed.root.extended,
    path.abs('specs/root/definitions/name.yaml'), helper.parsed.root.name
  ));

  it('should dereference successfully', function () {
    var parser = new $RefParser();
    return parser
      .dereference(path.rel('specs/root/root.yaml'))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.root);

        // Reference equality
        expect(schema.properties.first).to.equal(schema.properties.last);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it('should bundle successfully', function () {
    var parser = new $RefParser();
    return parser
      .bundle(path.rel('specs/root/root.yaml'))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.root);
      });
  });
});
