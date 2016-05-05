describe('Schema with deeply-nested $refs', function() {
  'use strict';

  it('should parse successfully', function() {
    return $RefParser.parse(path.rel('specs/deep/deep.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Only the main schema file should be resolved
        helper.validateFiles(schema.files, [
          path.abs('specs/deep/deep.yaml'),
        ]);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.root).to.deep.equal(helper.parsed.deep.schema);
      });
  });

  it('should resolve successfully', function() {
    return $RefParser.resolve(path.abs('specs/deep/deep.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/deep/deep.yaml'),
          path.abs('specs/deep/definitions/required-string.yaml'),
          path.abs('specs/deep/definitions/name.yaml'),
        ]);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('deep.yaml').data).to.deep.equal(helper.parsed.deep.schema);
      });
  });

  it('should dereference successfully', function() {
    return $RefParser.dereference(path.rel('specs/deep/deep.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/deep/deep.yaml'),
          path.abs('specs/deep/definitions/required-string.yaml'),
          path.abs('specs/deep/definitions/name.yaml'),
        ]);

        // This schema is not circular
        expect(schema.circular).to.equal(false);

        // The schema should be fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: true});
        expect(schema.files.get('deep.yaml').data).to.deep.equal(helper.dereferenced.deep);

        // Reference equality
        expect(schema.root.properties.name.type)
          .to.equal(schema.root.properties['level 1'].properties.name.type)
          .to.equal(schema.root.properties['level 1'].properties['level 2'].properties.name.type)
          .to.equal(schema.root.properties['level 1'].properties['level 2'].properties['level 3'].properties.name.type)
          .to.equal(schema.root.properties['level 1'].properties['level 2'].properties['level 3'].properties['level 4'].properties.name.type);
      });
  });

  it('should bundle successfully', function() {
    return $RefParser.bundle(path.rel('specs/deep/deep.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/deep/deep.yaml'),
          path.abs('specs/deep/definitions/required-string.yaml'),
          path.abs('specs/deep/definitions/name.yaml'),
        ]);

        // This schema is not circular
        expect(schema.circular).to.equal(false);

        // The schema should be bundled, but not fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('deep.yaml').data).to.deep.equal(helper.bundled.deep);
      });
  });
});
