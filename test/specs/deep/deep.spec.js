describe('Schema with deeply-nested $refs', function () {
  'use strict';

  it('should parse successfully', function () {
    var parser = new $RefParser();
    return parser
      .parse(path.rel('specs/deep/deep.yaml'))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.deep.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/deep/deep.yaml')]);
      });
  });

  it('should resolve successfully', helper.testResolve(
    path.rel('specs/deep/deep.yaml'),
    path.abs('specs/deep/deep.yaml'), helper.parsed.deep.schema,
    path.abs('specs/deep/definitions/name.yaml'), helper.parsed.deep.name,
    path.abs('specs/deep/definitions/required-string.yaml'), helper.parsed.deep.requiredString
  ));

  it('should dereference successfully', function () {
    var parser = new $RefParser();
    return parser
      .dereference(path.rel('specs/deep/deep.yaml'))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.deep);

        // Reference equality
        expect(schema.properties.name.type)
          .to.equal(schema.properties['level 1'].properties.name.type)
          .to.equal(schema.properties['level 1'].properties['level 2'].properties.name.type)
          .to.equal(schema.properties['level 1'].properties['level 2'].properties['level 3'].properties.name.type)
          .to.equal(schema.properties['level 1'].properties['level 2'].properties['level 3'].properties['level 4'].properties.name.type);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it('should bundle successfully', function () {
    var parser = new $RefParser();
    return parser
      .bundle(path.rel('specs/deep/deep.yaml'))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.deep);
      });
  });
});
