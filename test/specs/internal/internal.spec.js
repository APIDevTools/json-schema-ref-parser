describe('Schema with internal $refs', function() {
  'use strict';

  it('should parse successfully', function() {
    return $RefParser.parse(path.rel('specs/internal/internal.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Only the main schema file should be resolved
        helper.validateFiles(schema.files, [
          path.abs('specs/internal/internal.yaml'),
        ]);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.root).to.deep.equal(helper.parsed.internal);
      });
  });

  it('should resolve successfully', function() {
    return $RefParser.resolve(path.rel('specs/internal/internal.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // There's only one file in this schema
        helper.validateFiles(schema.files, [
          path.abs('specs/internal/internal.yaml'),
        ]);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('internal.yaml').data).to.deep.equal(helper.parsed.internal);
      });
  });

  it('should dereference successfully', function() {
    return $RefParser.dereference(path.rel('specs/internal/internal.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // There's only one file in this schema
        helper.validateFiles(schema.files, [
          path.abs('specs/internal/internal.yaml'),
        ]);

        // This schema is not circular
        expect(schema.circular).to.equal(false);

        // The schema should be fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: true});
        expect(schema.root).to.deep.equal(helper.dereferenced.internal);

        // Reference equality
        expect(schema.root.properties.name).to.equal(schema.root.definitions.name);
        expect(schema.root.definitions.requiredString)
          .to.equal(schema.root.definitions.name.properties.first)
          .to.equal(schema.root.definitions.name.properties.last)
          .to.equal(schema.root.properties.name.properties.first)
          .to.equal(schema.root.properties.name.properties.last);
      });
  });

  it('should bundle successfully', function() {
    return $RefParser.bundle(path.rel('specs/internal/internal.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // There's only one file in this schema
        helper.validateFiles(schema.files, [
          path.abs('specs/internal/internal.yaml'),
        ]);

        // This schema is not circular
        expect(schema.circular).to.equal(false);

        // The schema should be bundled, but not fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.root).to.deep.equal(helper.bundled.internal);
      });
  });
});
