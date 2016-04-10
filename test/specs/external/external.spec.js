'use strict';

describe('Schema with external $refs', function() {
  it('should parse successfully from an absolute path', function() {
    var parser = new $RefParser();
    return parser
      .parse(path.abs('specs/external/external.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.external.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/external/external.yaml')]);
      });
  });

  it('should parse successfully from a relative path', function() {
    var parser = new $RefParser();
    return parser
      .parse(path.rel('specs/external/external.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.external.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/external/external.yaml')]);
      });
  });

  it('should parse successfully from a url', function() {
    var parser = new $RefParser();
    return parser
      .parse(path.url('specs/external/external.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.external.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.url('specs/external/external.yaml')]);
      });
  });

  it('should resolve successfully from an absolute path', helper.testResolve(
    path.abs('specs/external/external.yaml'),
    path.abs('specs/external/external.yaml'), helper.parsed.external.schema,
    path.abs('specs/external/definitions/definitions.json'), helper.parsed.external.definitions,
    path.abs('specs/external/definitions/name.yaml'), helper.parsed.external.name,
    path.abs('specs/external/definitions/required-string.yaml'), helper.parsed.external.requiredString
  ));

  it('should resolve successfully from a relative path', helper.testResolve(
    path.rel('specs/external/external.yaml'),
    path.abs('specs/external/external.yaml'), helper.parsed.external.schema,
    path.abs('specs/external/definitions/definitions.json'), helper.parsed.external.definitions,
    path.abs('specs/external/definitions/name.yaml'), helper.parsed.external.name,
    path.abs('specs/external/definitions/required-string.yaml'), helper.parsed.external.requiredString
  ));

  // Skip this test on Node v0.x, due to bugs in `url.resolve()`
  if (!userAgent.isOldNode) {
    it('should resolve successfully from a url', helper.testResolve(
      path.url('specs/external/external.yaml'),
      path.url('specs/external/external.yaml'), helper.parsed.external.schema,
      path.url('specs/external/definitions/definitions.json'), helper.parsed.external.definitions,
      path.url('specs/external/definitions/name.yaml'), helper.parsed.external.name,
      path.url('specs/external/definitions/required-string.yaml'), helper.parsed.external.requiredString
    ));
  }

  it('should dereference successfully', function() {
    var parser = new $RefParser();
    return parser
      .dereference(path.rel('specs/external/external.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.external);

        // Reference equality
        expect(schema.properties.name).to.equal(schema.definitions.name);
        expect(schema.definitions['required string'])
          .to.equal(schema.definitions.name.properties.first)
          .to.equal(schema.definitions.name.properties.last)
          .to.equal(schema.properties.name.properties.first)
          .to.equal(schema.properties.name.properties.last);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it('should bundle successfully', function() {
    var parser = new $RefParser();
    return parser
      .bundle(path.rel('specs/external/external.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.external);
      });
  });
});
