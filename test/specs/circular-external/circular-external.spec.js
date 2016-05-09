describe('Schema with circular (recursive) external $refs', function() {
  'use strict';

  it('should parse successfully', function() {
    return $RefParser.parse(path.rel('specs/circular-external/circular-external.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Only the main schema file should be resolved
        helper.validateFiles(schema.files, [
          path.abs('specs/circular-external/circular-external.yaml'),
        ]);

        // The "circular" flag should NOT be set
        // (it only gets set by `dereference` or `bundle`)
        expect(schema.circular).to.equal(false);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.root).to.deep.equal(helper.parsed.circularExternal.schema);
      });
  });

  it('should resolve successfully', function() {
    return $RefParser.resolve(path.rel('specs/circular-external/circular-external.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/circular-external/circular-external.yaml'),
          path.abs('specs/circular-external/definitions/pet.yaml'),
          path.abs('specs/circular-external/definitions/person.yaml'),
          path.abs('specs/circular-external/definitions/parent.yaml'),
          path.abs('specs/circular-external/definitions/child.yaml'),
        ]);

        // The "circular" flag should NOT be set
        // (it only gets set by `dereference` or `bundle`)
        expect(schema.circular).to.equal(false);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('circular-external.yaml').data)
          .to.deep.equal(helper.parsed.circularExternal.schema);
        expect(schema.files.get('definitions/pet.yaml').data)
          .to.deep.equal(helper.parsed.circularExternal.pet);
        expect(schema.files.get('definitions/person.yaml').data)
          .to.deep.equal(helper.parsed.circularExternal.person);
        expect(schema.files.get('definitions/parent.yaml').data)
          .to.deep.equal(helper.parsed.circularExternal.parent);
        expect(schema.files.get('definitions/child.yaml').data)
          .to.deep.equal(helper.parsed.circularExternal.child);
      });
  });

  it('should dereference successfully', function() {
    return $RefParser.dereference(path.rel('specs/circular-external/circular-external.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/circular-external/circular-external.yaml'),
          path.abs('specs/circular-external/definitions/pet.yaml'),
          path.abs('specs/circular-external/definitions/person.yaml'),
          path.abs('specs/circular-external/definitions/parent.yaml'),
          path.abs('specs/circular-external/definitions/child.yaml'),
        ]);

        // The "circular" flag should be set
        expect(schema.circular).to.equal(true);

        // The schema should be fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: true});
        expect(schema.files.get('circular-external.yaml').data)
          .to.deep.equal(helper.dereferenced.circularExternal);

          // Reference equality
        expect(schema.root.definitions.person.properties.spouse)
          .to.equal(schema.root.definitions.person);
        expect(schema.root.definitions.parent.properties.children.items)
          .to.equal(schema.root.definitions.child);
        expect(schema.root.definitions.child.properties.parents.items)
          .to.equal(schema.root.definitions.parent);
      });
  });

  it('should throw an error if "dereference.circular" is false', function() {
    return $RefParser.dereference(
      path.rel('specs/circular-external/circular-external.yaml'), {dereference: {circular: false}})
      .then(
        helper.shouldNotGetCalled,
        function(err) {
          // A ReferenceError should have been thrown
          expect(err).to.be.an.instanceOf(ReferenceError);
          expect(err.message).to.contain('Circular $ref pointer found at ');
          expect(err.message).to.contain('specs/circular-external/circular-external.yaml#/definitions/thing');
        });
  });

  it('should bundle successfully', function() {
    return $RefParser.bundle(path.rel('specs/circular-external/circular-external.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/circular-external/circular-external.yaml'),
          path.abs('specs/circular-external/definitions/pet.yaml'),
          path.abs('specs/circular-external/definitions/person.yaml'),
          path.abs('specs/circular-external/definitions/parent.yaml'),
          path.abs('specs/circular-external/definitions/child.yaml'),
        ]);

        // The "circular" flag should be set
        expect(schema.circular).to.equal(true);

        // The schema should be bundled, but not fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('circular-external.yaml').data)
          .to.deep.equal(helper.bundled.circularExternal);
      });
  });
});
