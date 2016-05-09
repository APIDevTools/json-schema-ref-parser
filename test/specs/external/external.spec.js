describe('Schema with external $refs', function() {
  'use strict';

  it('should parse successfully from an absolute path', function() {
    return $RefParser.parse(path.abs('specs/external/external.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Only the main schema file should be resolved
        helper.validateFiles(schema.files, [
          path.abs('specs/external/external.yaml'),
        ]);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.root).to.deep.equal(helper.parsed.external.schema);
      });
  });

  it('should parse successfully from a relative path', function() {
    return $RefParser.parse(path.rel('specs/external/external.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Only the main schema file should be resolved
        helper.validateFiles(schema.files, [
          path.abs('specs/external/external.yaml'),
        ]);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.root).to.deep.equal(helper.parsed.external.schema);
      });
  });

  it('should parse successfully from a url', function() {
    return $RefParser.parse(path.url('specs/external/external.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Only the main schema file should be resolved
        helper.validateFiles(schema.files, [
          path.url('specs/external/external.yaml'),
        ]);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.root).to.deep.equal(helper.parsed.external.schema);
      });
  });

  it('should resolve successfully from an absolute path', function() {
    return $RefParser.resolve(path.abs('specs/external/external.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/external/external.yaml'),
          path.abs('specs/external/definitions/definitions.json'),
          path.abs('specs/external/definitions/required-string.yaml'),
          path.abs('specs/external/definitions/name.yaml'),
        ]);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('external.yaml').data)
          .to.deep.equal(helper.parsed.external.schema);
        expect(schema.files.get('definitions/definitions.json').data)
          .to.deep.equal(helper.parsed.external.definitions);
        expect(schema.files.get('definitions/required-string.yaml').data)
          .to.deep.equal(helper.parsed.external.requiredString);
        expect(schema.files.get('definitions/name.yaml').data)
          .to.deep.equal(helper.parsed.external.name);
      });
  });

  it('should resolve successfully from a relative path', function() {
    return $RefParser.resolve(path.rel('specs/external/external.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/external/external.yaml'),
          path.abs('specs/external/definitions/definitions.json'),
          path.abs('specs/external/definitions/required-string.yaml'),
          path.abs('specs/external/definitions/name.yaml'),
        ]);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('external.yaml').data)
          .to.deep.equal(helper.parsed.external.schema);
        expect(schema.files.get('definitions/definitions.json').data)
          .to.deep.equal(helper.parsed.external.definitions);
        expect(schema.files.get('definitions/required-string.yaml').data)
          .to.deep.equal(helper.parsed.external.requiredString);
        expect(schema.files.get('definitions/name.yaml').data)
          .to.deep.equal(helper.parsed.external.name);
      });
  });

  // Skip this test on Node v0.x, due to bugs in `url.resolve()`
  if (!userAgent.isOldNode) {
    it('should resolve successfully from a url', function() {
      return $RefParser.resolve(path.url('specs/external/external.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.url('specs/external/external.yaml'),
            path.url('specs/external/definitions/definitions.json'),
            path.url('specs/external/definitions/required-string.yaml'),
            path.url('specs/external/definitions/name.yaml'),
          ]);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('external.yaml').data)
            .to.deep.equal(helper.parsed.external.schema);
          expect(schema.files.get('definitions/definitions.json').data)
            .to.deep.equal(helper.parsed.external.definitions);
          expect(schema.files.get('definitions/required-string.yaml').data)
            .to.deep.equal(helper.parsed.external.requiredString);
          expect(schema.files.get('definitions/name.yaml').data)
            .to.deep.equal(helper.parsed.external.name);
        });
    });
  }

  it('should dereference successfully', function() {
    return $RefParser.dereference(path.rel('specs/external/external.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/external/external.yaml'),
          path.abs('specs/external/definitions/definitions.json'),
          path.abs('specs/external/definitions/required-string.yaml'),
          path.abs('specs/external/definitions/name.yaml'),
        ]);

        // This schema is not circular
        expect(schema.circular).to.equal(false);

        // The schema should be fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: true});
        expect(schema.files.get('external.yaml').data).to.deep.equal(helper.dereferenced.external);

        // Reference equality
        expect(schema.root.properties.name).to.equal(schema.root.definitions.name);
        expect(schema.root.definitions['required string'])
          .to.equal(schema.root.definitions.name.properties.first)
          .to.equal(schema.root.definitions.name.properties.last)
          .to.equal(schema.root.properties.name.properties.first)
          .to.equal(schema.root.properties.name.properties.last);
      });
  });

  it('should bundle successfully', function() {
    return $RefParser.bundle(path.rel('specs/external/external.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/external/external.yaml'),
          path.abs('specs/external/definitions/definitions.json'),
          path.abs('specs/external/definitions/required-string.yaml'),
          path.abs('specs/external/definitions/name.yaml'),
        ]);

        // This schema is not circular
        expect(schema.circular).to.equal(false);

        // The schema should be bundled, but not fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('external.yaml').data).to.deep.equal(helper.bundled.external);
      });
  });
});
