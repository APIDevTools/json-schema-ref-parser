describe('Schema with circular $refs that extend each other', function() {
  'use strict';

  describe('$ref to self', function() {
    it('should parse successfully', function() {
      return $RefParser.parse(path.rel('specs/circular-extended/circular-extended-self.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Only the main schema file should be resolved
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-self.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.root).to.deep.equal(helper.parsed.circularExtended.self);
        });
    });

    it('should resolve successfully', function() {
      return $RefParser.resolve(path.rel('specs/circular-extended/circular-extended-self.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-self.yaml'),
            path.abs('specs/circular-extended/definitions/thing.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-extended-self.yaml').data)
            .to.deep.equal(helper.parsed.circularExtended.self);
        });
    });

    it('should dereference successfully', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-self.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-self.yaml'),
            path.abs('specs/circular-extended/definitions/thing.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be as dereferenced as possible
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-extended-self.yaml').data)
            .to.deep.equal(helper.dereferenced.circularExtended.self);
        });
    });

    it('should produce the same results if "dereference.circular" is "ignore"', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-self.yaml'), {dereference: {circular: 'ignore'}})
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-self.yaml'),
            path.abs('specs/circular-extended/definitions/thing.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be as dereferenced as possible
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-extended-self.yaml').data)
            .to.deep.equal(helper.dereferenced.circularExtended.self);
        });
    });

    it('should throw an error if "dereference.circular" is false', function() {
      return $RefParser.dereference(
        path.rel('specs/circular-extended/circular-extended-self.yaml'), {dereference: {circular: false}})
        .then(
          helper.shouldNotGetCalled,
          function(err) {
            // A ReferenceError should have been thrown
            expect(err).to.be.an.instanceOf(ReferenceError);
            expect(err.message).to.contain('Circular $ref pointer found at ');
            expect(err.message).to.contain('specs/circular-extended/circular-extended-self.yaml#/definitions/thing');
          });
    });

    it('should bundle successfully', function() {
      return $RefParser.bundle(path.rel('specs/circular-extended/circular-extended-self.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-self.yaml'),
            path.abs('specs/circular-extended/definitions/thing.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be bundled, but not fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-extended-self.yaml').data)
            .to.deep.equal(helper.bundled.circularExtended.self);
        });
    });
  });

  describe('$ref to ancestor', function() {
    it('should parse successfully', function() {
      return $RefParser.parse(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Only the main schema file should be resolved
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-ancestor.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.root).to.deep.equal(helper.parsed.circularExtended.ancestor);
        });
    });

    it('should resolve successfully', function() {
      return $RefParser.resolve(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-ancestor.yaml'),
            path.abs('specs/circular-extended/definitions/person-with-spouse.yaml'),
            path.abs('specs/circular-extended/definitions/pet.yaml'),
            path.abs('specs/circular-extended/definitions/animals.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-extended-ancestor.yaml').data)
            .to.deep.equal(helper.parsed.circularExtended.ancestor);
        });
    });

    it('should dereference successfully', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-ancestor.yaml'),
            path.abs('specs/circular-extended/definitions/person-with-spouse.yaml'),
            path.abs('specs/circular-extended/definitions/pet.yaml'),
            path.abs('specs/circular-extended/definitions/animals.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-extended-ancestor.yaml').data)
            .to.deep.equal(helper.dereferenced.circularExtended.ancestor.fullyDereferenced);

          // Reference equality
          expect(schema.root.definitions.person.properties.spouse.properties)
            .to.equal(schema.root.definitions.person.properties);
          expect(schema.root.definitions.person.properties.pet.properties)
            .to.equal(schema.root.definitions.pet.properties);
        });
    });

    it('should not dereference circular $refs if "dereference.circular" is "ignore"', function() {
      return $RefParser.dereference(
        path.rel('specs/circular-extended/circular-extended-ancestor.yaml'), {dereference: {circular: 'ignore'}})
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-ancestor.yaml'),
            path.abs('specs/circular-extended/definitions/person-with-spouse.yaml'),
            path.abs('specs/circular-extended/definitions/pet.yaml'),
            path.abs('specs/circular-extended/definitions/animals.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          // (except for circular references)
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-extended-ancestor.yaml').data)
            .to.deep.equal(helper.dereferenced.circularExtended.ancestor.ignoreCircular$Refs);
        });
    });

    it('should throw an error if "dereference.circular" is false', function() {
      return $RefParser.dereference(
        path.rel('specs/circular-extended/circular-extended-ancestor.yaml'), {dereference: {circular: false}})
        .then(
          helper.shouldNotGetCalled,
          function(err) {
            // A ReferenceError should have been thrown
            expect(err).to.be.an.instanceOf(ReferenceError);
            expect(err.message).to.contain('Circular $ref pointer found at ');
            expect(err.message).to.contain('specs/circular-extended/definitions/person-with-spouse.yaml#/properties/spouse');
          });
    });

    it('should bundle successfully', function() {
      return $RefParser.bundle(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-ancestor.yaml'),
            path.abs('specs/circular-extended/definitions/person-with-spouse.yaml'),
            path.abs('specs/circular-extended/definitions/pet.yaml'),
            path.abs('specs/circular-extended/definitions/animals.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be bundled, but not fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-extended-ancestor.yaml').data)
            .to.deep.equal(helper.bundled.circularExtended.ancestor);
        });
    });
  });

  describe('indirect circular $refs', function() {
    it('should parse successfully', function() {
      return $RefParser.parse(path.rel('specs/circular-extended/circular-extended-indirect.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Only the main schema file should be resolved
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-indirect.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.root).to.deep.equal(helper.parsed.circularExtended.indirect);
        });
    });

    it('should resolve successfully', function() {
      return $RefParser.resolve(path.rel('specs/circular-extended/circular-extended-indirect.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-indirect.yaml'),
            path.abs('specs/circular-extended/definitions/parent-with-children.yaml'),
            path.abs('specs/circular-extended/definitions/child-with-parents.yaml'),
            path.abs('specs/circular-extended/definitions/pet.yaml'),
            path.abs('specs/circular-extended/definitions/animals.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-extended-indirect.yaml').data)
            .to.deep.equal(helper.parsed.circularExtended.indirect);
        });
    });

    it('should dereference successfully', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-indirect.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-indirect.yaml'),
            path.abs('specs/circular-extended/definitions/parent-with-children.yaml'),
            path.abs('specs/circular-extended/definitions/child-with-parents.yaml'),
            path.abs('specs/circular-extended/definitions/pet.yaml'),
            path.abs('specs/circular-extended/definitions/animals.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-extended-indirect.yaml').data)
            .to.deep.equal(helper.dereferenced.circularExtended.indirect.fullyDereferenced);

          // Reference equality
          expect(schema.root.definitions.parent.properties.children.items.properties)
            .to.equal(schema.root.definitions.child.properties);
          expect(schema.root.definitions.child.properties.parents.items.properties)
            .to.equal(schema.root.definitions.parent.properties);
          expect(schema.root.definitions.child.properties.pet.properties)
            .to.equal(schema.root.definitions.pet.properties);
        });
    });

    it('should not dereference circular $refs if "dereference.circular" is "ignore"', function() {
      return $RefParser.dereference(
        path.rel('specs/circular-extended/circular-extended-indirect.yaml'), {dereference: {circular: 'ignore'}})
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-indirect.yaml'),
            path.abs('specs/circular-extended/definitions/parent-with-children.yaml'),
            path.abs('specs/circular-extended/definitions/child-with-parents.yaml'),
            path.abs('specs/circular-extended/definitions/pet.yaml'),
            path.abs('specs/circular-extended/definitions/animals.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          // (except for circular references)
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-extended-indirect.yaml').data)
            .to.deep.equal(helper.dereferenced.circularExtended.indirect.ignoreCircular$Refs);
        });
    });

    it('should throw an error if "dereference.circular" is false', function() {
      return $RefParser.dereference(
        path.rel('specs/circular-extended/circular-extended-indirect.yaml'), {dereference: {circular: false}})
        .then(
          helper.shouldNotGetCalled,
          function(err) {
            // A ReferenceError should have been thrown
            expect(err).to.be.an.instanceOf(ReferenceError);
            expect(err.message).to.contain('Circular $ref pointer found at ');
            expect(err.message).to.contain('specs/circular-extended/definitions/child-with-parents.yaml#/properties/parents/items');
          });
    });

    it('should bundle successfully', function() {
      return $RefParser.bundle(path.rel('specs/circular-extended/circular-extended-indirect.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-indirect.yaml'),
            path.abs('specs/circular-extended/definitions/parent-with-children.yaml'),
            path.abs('specs/circular-extended/definitions/child-with-parents.yaml'),
            path.abs('specs/circular-extended/definitions/pet.yaml'),
            path.abs('specs/circular-extended/definitions/animals.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be parsed, but not fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-extended-indirect.yaml').data)
            .to.deep.equal(helper.bundled.circularExtended.indirect);
        });
    });
  });

  describe('indirect circular and ancestor $refs', function() {
    it('should parse successfully', function() {
      return $RefParser.parse(path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Only the main schema file should be resolved
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-indirect-ancestor.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.root).to.deep.equal(helper.parsed.circularExtended.indirectAncestor);
        });
    });

    it('should resolve successfully', function() {
      return $RefParser.resolve(path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-indirect-ancestor.yaml'),
            path.abs('specs/circular-extended/definitions/parent-with-child.yaml'),
            path.abs('specs/circular-extended/definitions/child-with-children.yaml'),
            path.abs('specs/circular-extended/definitions/pet.yaml'),
            path.abs('specs/circular-extended/definitions/animals.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-extended-indirect-ancestor.yaml').data)
            .to.deep.equal(helper.parsed.circularExtended.indirectAncestor);
        });
    });

    it('should dereference successfully', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-indirect-ancestor.yaml'),
            path.abs('specs/circular-extended/definitions/parent-with-child.yaml'),
            path.abs('specs/circular-extended/definitions/child-with-children.yaml'),
            path.abs('specs/circular-extended/definitions/pet.yaml'),
            path.abs('specs/circular-extended/definitions/animals.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-extended-indirect-ancestor.yaml').data)
            .to.deep.equal(helper.dereferenced.circularExtended.indirectAncestor.fullyDereferenced);

          // Reference equality
          expect(schema.root.definitions.parent.properties.child.properties)
            .to.equal(schema.root.definitions.child.properties);
          expect(schema.root.definitions.child.properties.children.items.properties)
            .to.equal(schema.root.definitions.child.properties);
          expect(schema.root.definitions.pet.properties)
            .to.equal(schema.root.definitions.child.properties.pet.properties);
        });
    });

    it('should not dereference circular $refs if "dereference.circular" is "ignore"', function() {
      return $RefParser.dereference(
        path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'), {dereference: {circular: 'ignore'}})
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-indirect-ancestor.yaml'),
            path.abs('specs/circular-extended/definitions/parent-with-child.yaml'),
            path.abs('specs/circular-extended/definitions/child-with-children.yaml'),
            path.abs('specs/circular-extended/definitions/pet.yaml'),
            path.abs('specs/circular-extended/definitions/animals.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-extended-indirect-ancestor.yaml').data)
            .to.deep.equal(helper.dereferenced.circularExtended.indirectAncestor.ignoreCircular$Refs);
        });
    });

    it('should throw an error if "dereference.circular" is false', function() {
      return $RefParser.dereference(
        path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'), {dereference: {circular: false}})
        .then(
          helper.shouldNotGetCalled,
          function(err) {
            // A ReferenceError should have been thrown
            expect(err).to.be.an.instanceOf(ReferenceError);
            expect(err.message).to.contain('Circular $ref pointer found at ');
            expect(err.message).to.contain('specs/circular-extended/definitions/child-with-children.yaml#/properties');
          });
    });

    it('should bundle successfully', function() {
      return $RefParser.bundle(path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Make sure all of the schema's files were found
          helper.validateFiles(schema.files, [
            path.abs('specs/circular-extended/circular-extended-indirect-ancestor.yaml'),
            path.abs('specs/circular-extended/definitions/parent-with-child.yaml'),
            path.abs('specs/circular-extended/definitions/child-with-children.yaml'),
            path.abs('specs/circular-extended/definitions/pet.yaml'),
            path.abs('specs/circular-extended/definitions/animals.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be parsed, but not fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-extended-indirect-ancestor.yaml').data)
            .to.deep.equal(helper.bundled.circularExtended.indirectAncestor);
        });
    });
  });

});
