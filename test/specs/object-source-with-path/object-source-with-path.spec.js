'use strict';

describe('Object sources with file paths', function() {
  it('should dereference a single object', function() {
    var parser = new $RefParser();
    return parser
      .dereference(
        // This file doesn't actually need to exist. But its path will be used to resolve external $refs
        path.abs('path/that/does/not/exist.yaml'),

        // This schema object does not contain any external $refs
        helper.cloneDeep(helper.parsed.internal),

        // An options object MUST be passed (even if it's empty)
        {}
      )
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.internal);

        // The schema path should match the one we pass-in
        var expectedPaths = [
          encodeURI(path.abs('path/that/does/not/exist.yaml'))
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
      .dereference(
        // This file doesn't actually need to exist. But its path will be used to resolve external $refs
        path.abs('specs/object-source-with-path/schema-file-that-does-not-exist.yaml'),

        // This schema object contains external $refs
        helper.cloneDeep(helper.parsed.objectSourceWithPath.schema),

        // An options object MUST be passed (even if it's empty)
        {}
      )
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.objectSourceWithPath);

        // The schema path should be blank, and all other paths should be relative (not absolute)
        var expectedPaths = [
          encodeURI(path.abs('specs/object-source-with-path/schema-file-that-does-not-exist.yaml')),
          path.abs('specs/object-source-with-path/definitions/definitions.json'),
          path.abs('specs/object-source-with-path/definitions/name.yaml'),
          path.abs('specs/object-source-with-path/definitions/required-string.yaml')
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
      .bundle(
        // This file doesn't actually need to exist. But its path will be used to resolve external $refs
        path.rel('specs/object-source-with-path/schema-file-that-does-not-exist.yaml'),

        // This schema object contains external $refs
        helper.cloneDeep(helper.parsed.objectSourceWithPath.schema),

        // An options object MUST be passed (even if it's empty)
        {}
      )
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.objectSourceWithPath);

        // The schema path should be blank, and all other paths should be relative (not absolute)
        var expectedPaths = [
          encodeURI(path.abs('specs/object-source-with-path/schema-file-that-does-not-exist.yaml')),
          path.abs('specs/object-source-with-path/definitions/definitions.json'),
          path.abs('specs/object-source-with-path/definitions/name.yaml'),
          path.abs('specs/object-source-with-path/definitions/required-string.yaml')
        ];
        expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
        expect(parser.$refs.values()).to.have.keys(expectedPaths);
      });
  });
});
