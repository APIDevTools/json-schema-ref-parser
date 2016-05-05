describe('Schema with deeply-nested circular $refs', function() {
  'use strict';

  it('should parse successfully', function() {
    return $RefParser.parse(path.rel('specs/deep-circular/deep-circular.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Only the main schema file should be resolved
        helper.validateFiles(schema.files, [
          path.abs('specs/deep-circular/deep-circular.yaml'),
        ]);

        // The "circular" flag should NOT be set
        // (it only gets set by `dereference` or `bundle`)
        expect(schema.circular).to.equal(false);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.root).to.deep.equal(helper.parsed.deepCircular.schema);
      });
  });

  it('should resolve successfully', function() {
    return $RefParser.resolve(path.rel('specs/deep-circular/deep-circular.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/deep-circular/deep-circular.yaml'),
          path.abs('specs/deep-circular/definitions/required-string.yaml'),
          path.abs('specs/deep-circular/definitions/name.yaml'),
        ]);

        // The "circular" flag should NOT be set
        // (it only gets set by `dereference` or `bundle`)
        expect(schema.circular).to.equal(false);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('deep-circular.yaml').data).to.deep.equal(helper.parsed.deepCircular.schema);
      });
  });

  it('should dereference successfully', function() {
    return $RefParser.dereference(path.rel('specs/deep-circular/deep-circular.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/deep-circular/deep-circular.yaml'),
          path.abs('specs/deep-circular/definitions/required-string.yaml'),
          path.abs('specs/deep-circular/definitions/name.yaml'),
        ]);

        // The "circular" flag should be set
        expect(schema.circular).to.equal(true);

        // The schema should be fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: true});
        expect(schema.files.get('deep-circular.yaml').data).to.deep.equal(helper.dereferenced.deepCircular);

        // Reference equality
        expect(schema.root.definitions.name)
          .to.equal(schema.root.properties.name)
          .to.equal(schema.root.properties.level1.properties.name)
          .to.equal(schema.root.properties.level1.properties.level2.properties.name)
          .to.equal(schema.root.properties.level1.properties.level2.properties.level3.properties.name)
          .to.equal(schema.root.properties.level1.properties.level2.properties.level3.properties.level4.properties.name);
      });
  });

  it('should throw an error if "dereference.circular" is false', function() {
    return $RefParser.dereference(path.rel('specs/deep-circular/deep-circular.yaml'), {dereference: {circular: false}})
      .then(
        helper.shouldNotGetCalled,
        function(err) {
          // A ReferenceError should have been thrown
          expect(err).to.be.an.instanceOf(ReferenceError);
          expect(err.message).to.contain('Circular $ref pointer found at ');
          expect(err.message).to.contain(
            'specs/deep-circular/deep-circular.yaml#/properties/level1/properties/level2/properties/' +
            'level3/properties/level4/properties/level5/properties/level6/properties/level7/properties/' +
            'level8/properties/level9/properties/level10/properties/level11/properties/level12/properties/' +
            'level13/properties/level14/properties/level15/properties/level16/properties/level17/properties/' +
            'level18/properties/level19/properties/level20/properties/level21/properties/level22/properties/' +
            'level23/properties/level24/properties/level25/properties/level26/properties/level27/properties/' +
            'level28/properties/level29/properties/level30');
        });
  });

  it('should bundle successfully', function() {
    return $RefParser.bundle(path.rel('specs/deep-circular/deep-circular.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/deep-circular/deep-circular.yaml'),
          path.abs('specs/deep-circular/definitions/required-string.yaml'),
          path.abs('specs/deep-circular/definitions/name.yaml'),
        ]);

        // The "circular" flag should be set
        expect(schema.circular).to.equal(true);

        // The schema should be bundled, but not fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('deep-circular.yaml').data).to.deep.equal(helper.bundled.deepCircular);
      });
  });

});
