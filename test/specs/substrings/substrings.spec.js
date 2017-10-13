describe('$refs that are substrings of each other', function () {
  'use strict';

  it('should parse successfully', function () {
    var parser = new $RefParser();
    return parser
      .parse(path.rel('specs/substrings/substrings.yaml'))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.substrings.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/substrings/substrings.yaml')]);
      });
  });

  it('should resolve successfully', helper.testResolve(
    path.rel('specs/substrings/substrings.yaml'),
    path.abs('specs/substrings/substrings.yaml'), helper.parsed.substrings.schema,
    path.abs('specs/substrings/definitions/definitions.json'), helper.parsed.substrings.definitions,
    path.abs('specs/substrings/definitions/strings.yaml'), helper.parsed.substrings.strings
  ));

  it('should dereference successfully', function () {
    var parser = new $RefParser();
    return parser
      .dereference(path.rel('specs/substrings/substrings.yaml'))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.substrings);

        // Reference equality
        expect(schema.properties.firstName).to.equal(schema.definitions.name);
        expect(schema.properties.middleName).to.equal(schema.definitions['name-with-min-length']);
        expect(schema.properties.lastName).to.equal(schema.definitions['name-with-min-length-max-length']);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it('should bundle successfully', function () {
    var parser = new $RefParser();
    return parser
      .bundle(path.rel('specs/substrings/substrings.yaml'))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.substrings);
      });
  });
});
