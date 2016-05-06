describe('Schema with circular (recursive) $refs', function() {
  'use strict';

  describe('$ref to self', function() {
    it('should parse successfully', function() {
      return $RefParser.parse(path.rel('specs/circular/circular-self.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Only the main schema file should be resolved
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-self.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.root).to.deep.equal(helper.parsed.circular.self);
        });
    });

    it('should resolve successfully', function() {
      return $RefParser.resolve(path.rel('specs/circular/circular-self.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-self.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-self.yaml').data)
            .to.deep.equal(helper.parsed.circular.self);
        });
    });

    it('should dereference successfully', function() {
      return $RefParser.dereference(path.rel('specs/circular/circular-self.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-self.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-self.yaml').data)
            .to.deep.equal(helper.dereferenced.circular.self);

          // Reference equality
          expect(schema.root.definitions.child.properties.pet).to.equal(schema.root.definitions.pet);
        });
    });

    it('should produce the same results if "dereference.circular" is "ignore"', function() {
      return $RefParser.dereference(
        path.rel('specs/circular/circular-self.yaml'), {dereference: {circular: 'ignore'}})
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-self.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-self.yaml').data)
            .to.deep.equal(helper.dereferenced.circular.self);

          // Reference equality
          expect(schema.root.definitions.child.properties.pet)
            .to.equal(schema.root.definitions.pet);
        });
    });

    it('should throw an error if "dereference.circular" is false', function() {
      return $RefParser.dereference(
        path.rel('specs/circular/circular-self.yaml'), {dereference: {circular: false}})
        .then(
          helper.shouldNotGetCalled,
          function(err) {
            // A ReferenceError should have been thrown
            expect(err).to.be.an.instanceOf(ReferenceError);
            expect(err.message).to.contain('Circular $ref pointer found at ');
            expect(err.message).to.contain('specs/circular/circular-self.yaml#/definitions/thing');
          });
    });

    it('should bundle successfully', function() {
      return $RefParser.bundle(path.rel('specs/circular/circular-self.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-self.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be bundled, but not fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-self.yaml').data)
            .to.deep.equal(helper.parsed.circular.self);
        });
    });
  });

  describe('$ref to ancestor', function() {
    it('should parse successfully', function() {
      return $RefParser.parse(path.rel('specs/circular/circular-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Only the main schema file should be resolved
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-ancestor.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.root).to.deep.equal(helper.parsed.circular.ancestor);
        });
    });

    it('should resolve successfully', function() {
      return $RefParser.resolve(path.rel('specs/circular/circular-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-ancestor.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-ancestor.yaml').data)
            .to.deep.equal(helper.parsed.circular.ancestor);
        });
    });

    it('should dereference successfully', function() {
      return $RefParser.dereference(path.rel('specs/circular/circular-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-ancestor.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-ancestor.yaml').data)
            .to.deep.equal(helper.dereferenced.circular.ancestor.fullyDereferenced);

          // Reference equality
          expect(schema.root.definitions.person.properties.spouse)
            .to.equal(schema.root.definitions.person);
          expect(schema.root.definitions.person.properties.pet)
            .to.equal(schema.root.definitions.pet);
        });
    });

    it('should not dereference circular $refs if "dereference.circular" is "ignore"', function() {
      return $RefParser.dereference(
        path.rel('specs/circular/circular-ancestor.yaml'), {dereference: {circular: 'ignore'}})
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-ancestor.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-ancestor.yaml').data)
            .to.deep.equal(helper.dereferenced.circular.ancestor.ignoreCircular$Refs);

          // Reference equality
          expect(schema.root.definitions.person.properties.pet)
            .to.equal(schema.root.definitions.pet);
        });
    });

    it('should throw an error if "options.$refs.circular" is false', function() {
      return $RefParser.dereference(
        path.rel('specs/circular/circular-ancestor.yaml'), {dereference: {circular: false}})
        .then(
          helper.shouldNotGetCalled,
          function(err) {
            // A ReferenceError should have been thrown
            expect(err).to.be.an.instanceOf(ReferenceError);
            expect(err.message).to.contain('Circular $ref pointer found at ');
            expect(err.message).to.contain('specs/circular/circular-ancestor.yaml#/definitions/person/properties/spouse');
          });
    });

    it('should bundle successfully', function() {
      return $RefParser.bundle(path.rel('specs/circular/circular-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-ancestor.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be bundled, but not fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-ancestor.yaml').data)
            .to.deep.equal(helper.parsed.circular.ancestor);
        });
    });
  });

  describe('indirect circular $refs', function() {
    it('should parse successfully', function() {
      return $RefParser.parse(path.rel('specs/circular/circular-indirect.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Only the main schema file should be resolved
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-indirect.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.root).to.deep.equal(helper.parsed.circular.indirect);
        });
    });

    it('should resolve successfully', function() {
      return $RefParser.resolve(path.rel('specs/circular/circular-indirect.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-indirect.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-indirect.yaml').data)
            .to.deep.equal(helper.parsed.circular.indirect);
        });
    });

    it('should dereference successfully', function() {
      return $RefParser.dereference(path.rel('specs/circular/circular-indirect.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-indirect.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-indirect.yaml').data)
            .to.deep.equal(helper.dereferenced.circular.indirect.fullyDereferenced);

          // Reference equality
          expect(schema.root.definitions.parent.properties.children.items)
            .to.equal(schema.root.definitions.child);
          expect(schema.root.definitions.child.properties.parents.items)
            .to.equal(schema.root.definitions.parent);
        });
    });

    it('should not dereference circular $refs if "dereference.circular" is "ignore"', function() {
      return $RefParser.dereference(
        path.rel('specs/circular/circular-indirect.yaml'), {dereference: {circular: 'ignore'}})
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-indirect.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-indirect.yaml').data)
            .to.deep.equal(helper.dereferenced.circular.indirect.ignoreCircular$Refs);

          // Reference equality
          expect(schema.root.definitions.child.properties.pet).to.equal(schema.root.definitions.pet);
        });
    });

    it('should throw an error if "dereference.circular" is false', function() {
      return $RefParser.dereference(
        path.rel('specs/circular/circular-indirect.yaml'), {dereference: {circular: false}})
        .then(
          helper.shouldNotGetCalled,
          function(err) {
            // A ReferenceError should have been thrown
            expect(err).to.be.an.instanceOf(ReferenceError);
            expect(err.message).to.contain('Circular $ref pointer found at ');
            expect(err.message).to.contain('specs/circular/circular-indirect.yaml#/definitions/child/properties/parents/items');
          });
    });

    it('should bundle successfully', function() {
      return $RefParser.bundle(path.rel('specs/circular/circular-indirect.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-indirect.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be bundled, but not fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-indirect.yaml').data)
            .to.deep.equal(helper.parsed.circular.indirect);
        });
    });
  });

  describe('indirect circular and ancestor $refs', function() {
    it('should parse successfully', function() {
      return $RefParser.parse(path.rel('specs/circular/circular-indirect-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // Only the main schema file should be resolved
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-indirect-ancestor.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.root).to.deep.equal(helper.parsed.circular.indirectAncestor);
        });
    });

    it('should resolve successfully', function() {
      return $RefParser.resolve(path.rel('specs/circular/circular-indirect-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-indirect-ancestor.yaml'),
          ]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference` or `bundle`)
          expect(schema.circular).to.equal(false);

          // The schema should be parsed, but not dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-indirect-ancestor.yaml').data)
            .to.deep.equal(helper.parsed.circular.indirectAncestor);
        });
    });

    it('should dereference successfully', function() {
      return $RefParser.dereference(path.rel('specs/circular/circular-indirect-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-indirect-ancestor.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-indirect-ancestor.yaml').data)
            .to.deep.equal(helper.dereferenced.circular.indirectAncestor.fullyDereferenced);

          // Reference equality
          expect(schema.root.definitions.parent.properties.child)
            .to.equal(schema.root.definitions.child);
          expect(schema.root.definitions.child.properties.children.items)
            .to.equal(schema.root.definitions.child);
        });
    });

    it('should not dereference circular $refs if "dereference.circular" is "ignore"', function() {
      return $RefParser.dereference(
        path.rel('specs/circular/circular-indirect-ancestor.yaml'), {dereference: {circular: 'ignore'}})
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-indirect-ancestor.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-indirect-ancestor.yaml').data)
            .to.deep.equal(helper.dereferenced.circular.indirectAncestor.ignoreCircular$Refs);

          // Reference equality
          expect(schema.root.definitions.child.properties.pet)
            .to.equal(schema.root.definitions.pet);
        });
    });

    it('should throw an error if "dereference.circular" is false', function() {
      return $RefParser.dereference(
        path.rel('specs/circular/circular-indirect-ancestor.yaml'), {dereference: {circular: false}})
        .then(
          helper.shouldNotGetCalled,
          function(err) {
            // A ReferenceError should have been thrown
            expect(err).to.be.an.instanceOf(ReferenceError);
            expect(err.message).to.contain('Circular $ref pointer found at ');
            expect(err.message).to.contain('specs/circular/circular-indirect-ancestor.yaml#/definitions/child/properties');
          });
    });

    it('should bundle successfully', function() {
      return $RefParser.bundle(path.rel('specs/circular/circular-indirect-ancestor.yaml'))
        .then(function(schema) {
          helper.validateSchema(schema);

          // This schema only has one file
          helper.validateFiles(schema.files, [
            path.abs('specs/circular/circular-indirect-ancestor.yaml'),
          ]);

          // The "circular" flag should be set
          expect(schema.circular).to.equal(true);

          // The schema should be bundled, but not fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: false});
          expect(schema.files.get('circular-indirect-ancestor.yaml').data)
            .to.deep.equal(helper.parsed.circular.indirectAncestor);
        });
    });
  });

});
