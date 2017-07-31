'use strict';

describe('Object sources (instead of file paths)', function() {
  it('should dereference a single object', function() {
    var parser = new $RefParser();
    return parser
      .dereference(helper.cloneDeep(helper.parsed.internal))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.internal);

        // The schema path should be the current directory
        var expectedPaths = [
          encodeURI(path.cwd())
        ];
        expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
        expect(parser.$refs.values()).to.have.keys(expectedPaths);

        // Reference equality
        expect(schema.properties.name).to.equal(schema.definitions.name);
        expect(schema.definitions.requiredString)
          .to.equal(schema.definitions.name.properties.first)
          .to.equal(schema.definitions.name.properties.last)
          .to.equal(schema.properties.name.properties.first)
          .to.equal(schema.properties.name.properties.last);
      });
  });

  it('should dereference an object that references external files', function() {
    var parser = new $RefParser();
    return parser
      .dereference(helper.cloneDeep(helper.parsed.objectSource.schema))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.objectSource);

        // The schema path should be blank, and all other paths should be relative (not absolute)
        var expectedPaths = [
          encodeURI(path.cwd()),
          path.abs('specs/object-source/definitions/definitions.json'),
          path.abs('specs/object-source/definitions/name.yaml'),
          path.abs('specs/object-source/definitions/required-string.yaml')
        ];
        expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
        expect(parser.$refs.values()).to.have.keys(expectedPaths);

        // Reference equality
        expect(schema.properties.name).to.equal(schema.definitions.name);
        expect(schema.definitions.requiredString)
          .to.equal(schema.definitions.name.properties.first)
          .to.equal(schema.definitions.name.properties.last)
          .to.equal(schema.properties.name.properties.first)
          .to.equal(schema.properties.name.properties.last);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it('should bundle an object that references external files', function() {
    var parser = new $RefParser();
    return parser
      .bundle(helper.cloneDeep(helper.parsed.objectSource.schema))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.objectSource);

        // The schema path should be blank, and all other paths should be relative (not absolute)
        var expectedPaths = [
          encodeURI(path.cwd()),
          path.abs('specs/object-source/definitions/definitions.json'),
          path.abs('specs/object-source/definitions/name.yaml'),
          path.abs('specs/object-source/definitions/required-string.yaml')
        ];
        expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
        expect(parser.$refs.values()).to.have.keys(expectedPaths);
      });
  });
});
