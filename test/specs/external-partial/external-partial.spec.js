describe('Schema with $refs to parts of external files', function() {
  'use strict';

  it('should parse successfully', function() {
    return $RefParser.parse(path.rel('specs/external-partial/external-partial.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Only the main schema file should be resolved
        helper.validateFiles(schema.files, [
          path.abs('specs/external-partial/external-partial.yaml'),
        ]);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.root).to.deep.equal(helper.parsed.externalPartial.schema);
      });
  });

  it('should resolve successfully', function() {
    return $RefParser.resolve(path.rel('specs/external-partial/external-partial.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/external-partial/external-partial.yaml'),
          path.abs('specs/external-partial/definitions/definitions.json'),
          path.abs('specs/external-partial/definitions/required-string.yaml'),
          path.abs('specs/external-partial/definitions/name.yaml'),
        ]);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('external-partial.yaml').data)
          .to.deep.equal(helper.parsed.externalPartial.schema);
        expect(schema.files.get('definitions/definitions.json').data)
          .to.deep.equal(helper.parsed.externalPartial.definitions);
        expect(schema.files.get('definitions/required-string.yaml').data)
          .to.deep.equal(helper.parsed.externalPartial.requiredString);
        expect(schema.files.get('definitions/name.yaml').data)
          .to.deep.equal(helper.parsed.externalPartial.name);
      });
  });

  it('should dereference successfully', function() {
    return $RefParser.dereference(path.rel('specs/external-partial/external-partial.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/external-partial/external-partial.yaml'),
          path.abs('specs/external-partial/definitions/definitions.json'),
          path.abs('specs/external-partial/definitions/required-string.yaml'),
          path.abs('specs/external-partial/definitions/name.yaml'),
        ]);

        // This schema is not circular
        expect(schema.circular).to.equal(false);

        // The schema should be fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: true});
        expect(schema.files.get('external-partial.yaml').data).to.deep.equal(helper.dereferenced.externalPartial);

        // Reference equality
        expect(schema.root.properties.name.properties.first)
          .to.equal(schema.root.properties.name.properties.last);
      });
  });

  it('should bundle successfully', function() {
    return $RefParser.bundle(path.rel('specs/external-partial/external-partial.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/external-partial/external-partial.yaml'),
          path.abs('specs/external-partial/definitions/definitions.json'),
          path.abs('specs/external-partial/definitions/required-string.yaml'),
          path.abs('specs/external-partial/definitions/name.yaml'),
        ]);

        // This schema is not circular
        expect(schema.circular).to.equal(false);

        // The schema should be bundled, but not fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('external-partial.yaml').data).to.deep.equal(helper.bundled.externalPartial);
      });
  });
});
