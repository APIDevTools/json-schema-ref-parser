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

    it.only('should dereference successfully', function() {
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

          // The schema should be fully dereferenced
          helper.expectAll(schema.files, {parsed: true, dereferenced: true});
          expect(schema.files.get('circular-extended-self.yaml').data)
            .to.deep.equal(helper.dereferenced.circular.self);
        });
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-self.yaml'), {dereference: {circular: 'ignore'}})
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circularExtended.self);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);
        });
    });

    it('should throw an error if "options.$refs.circular" is false', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-self.yaml'), {dereference: {circular: false}})
        .then(
          helper.shouldNotGetCalled,
          function(err) {
            // A ReferenceError should have been thrown
            expect(err).to.be.an.instanceOf(ReferenceError);
            expect(err.message).to.contain('Circular $ref pointer found at ');
            expect(err.message).to.contain('specs/circular-extended/circular-extended-self.yaml#/definitions/thing');

            // $Refs.circular should be true
            expect(parser.$refs.circular).to.equal(true);
          });
    });

    it('should bundle successfully', function() {
      return $RefParser.bundle(path.rel('specs/circular-extended/circular-extended-self.yaml'))
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.bundled.circularExtended.self);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });
  });

  describe('$ref to ancestor', function() {
    it('should parse successfully', function() {
      return $RefParser.parse(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'))
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.parsed.circularExtended.ancestor);
          expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular-extended/circular-extended-ancestor.yaml')]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });

    it('should resolve successfully', helper.testResolve(
      path.rel('specs/circular-extended/circular-extended-ancestor.yaml'),
      path.abs('specs/circular-extended/circular-extended-ancestor.yaml'), helper.parsed.circularExtended.ancestor,
      path.abs('specs/circular-extended/definitions/person-with-spouse.yaml'), helper.parsed.circularExtended.personWithSpouse,
      path.abs('specs/circular-extended/definitions/pet.yaml'), helper.parsed.circularExtended.pet,
      path.abs('specs/circular-extended/definitions/animals.yaml'), helper.parsed.circularExtended.animals
    ));

    it('should dereference successfully', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'))
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circularExtended.ancestor.fullyDereferenced);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);

          // Reference equality
          expect(schema.definitions.person.properties.spouse.properties)
            .to.equal(schema.definitions.person.properties);
          expect(schema.definitions.person.properties.pet.properties)
            .to.equal(schema.definitions.pet.properties);
        });
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'), {dereference: {circular: 'ignore'}})
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circularExtended.ancestor.ignoreCircular$Refs);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);
        });
    });

    it('should throw an error if "options.$refs.circular" is false', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'), {dereference: {circular: false}})
        .then(
          helper.shouldNotGetCalled,
          function(err) {
            // A ReferenceError should have been thrown
            expect(err).to.be.an.instanceOf(ReferenceError);
            expect(err.message).to.contain('Circular $ref pointer found at ');
            expect(err.message).to.contain('specs/circular-extended/definitions/person-with-spouse.yaml#/properties/spouse');

            // $Refs.circular should be true
            expect(parser.$refs.circular).to.equal(true);
          });
    });

    it('should bundle successfully', function() {
      return $RefParser.bundle(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'))
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.bundled.circularExtended.ancestor);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });
  });

  describe('indirect circular $refs', function() {
    it('should parse successfully', function() {
      return $RefParser.parse(path.rel('specs/circular-extended/circular-extended-indirect.yaml'))
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.parsed.circularExtended.indirect);
          expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular-extended/circular-extended-indirect.yaml')]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });

    it('should resolve successfully', helper.testResolve(
      path.rel('specs/circular-extended/circular-extended-indirect.yaml'),
      path.abs('specs/circular-extended/circular-extended-indirect.yaml'), helper.parsed.circularExtended.indirect,
      path.abs('specs/circular-extended/definitions/parent-with-children.yaml'), helper.parsed.circularExtended.parentWithChildren,
      path.abs('specs/circular-extended/definitions/child-with-parents.yaml'), helper.parsed.circularExtended.childWithParents,
      path.abs('specs/circular-extended/definitions/pet.yaml'), helper.parsed.circularExtended.pet,
      path.abs('specs/circular-extended/definitions/animals.yaml'), helper.parsed.circularExtended.animals
    ));

    it('should dereference successfully', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-indirect.yaml'))
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circularExtended.indirect.fullyDereferenced);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);

          // Reference equality
          expect(schema.definitions.parent.properties.children.items.properties)
            .to.equal(schema.definitions.child.properties);
          expect(schema.definitions.child.properties.parents.items.properties)
            .to.equal(schema.definitions.parent.properties);
          expect(schema.definitions.child.properties.pet.properties)
            .to.equal(schema.definitions.pet.properties);
        });
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-indirect.yaml'), {dereference: {circular: 'ignore'}})
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circularExtended.indirect.ignoreCircular$Refs);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);
        });
    });

    it('should throw an error if "options.$refs.circular" is false', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-indirect.yaml'), {dereference: {circular: false}})
        .then(
          helper.shouldNotGetCalled,
          function(err) {
            // A ReferenceError should have been thrown
            expect(err).to.be.an.instanceOf(ReferenceError);
            expect(err.message).to.contain('Circular $ref pointer found at ');
            expect(err.message).to.contain('specs/circular-extended/definitions/child-with-parents.yaml#/properties/parents/items');

            // $Refs.circular should be true
            expect(parser.$refs.circular).to.equal(true);
          });
    });

    it('should bundle successfully', function() {
      return $RefParser.bundle(path.rel('specs/circular-extended/circular-extended-indirect.yaml'))
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.bundled.circularExtended.indirect);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });
  });

  describe('indirect circular and ancestor $refs', function() {
    it('should parse successfully', function() {
      return $RefParser.parse(path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'))
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.parsed.circularExtended.indirectAncestor);
          expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular-extended/circular-extended-indirect-ancestor.yaml')]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });

    it('should resolve successfully', helper.testResolve(
      path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'),
      path.abs('specs/circular-extended/circular-extended-indirect-ancestor.yaml'), helper.parsed.circularExtended.indirectAncestor,
      path.abs('specs/circular-extended/definitions/parent-with-child.yaml'), helper.parsed.circularExtended.parentWithChild,
      path.abs('specs/circular-extended/definitions/child-with-children.yaml'), helper.parsed.circularExtended.childWithChildren,
      path.abs('specs/circular-extended/definitions/pet.yaml'), helper.parsed.circularExtended.pet,
      path.abs('specs/circular-extended/definitions/animals.yaml'), helper.parsed.circularExtended.animals
    ));

    it('should dereference successfully', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'))
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circularExtended.indirectAncestor.fullyDereferenced);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);

          // Reference equality
          expect(schema.definitions.parent.properties.child.properties)
            .to.equal(schema.definitions.child.properties);
          expect(schema.definitions.child.properties.children.items.properties)
            .to.equal(schema.definitions.child.properties);
          expect(schema.definitions.pet.properties)
            .to.equal(schema.definitions.child.properties.pet.properties);
        });
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'), {dereference: {circular: 'ignore'}})
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circularExtended.indirectAncestor.ignoreCircular$Refs);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);
        });
    });

    it('should throw an error if "options.$refs.circular" is false', function() {
      return $RefParser.dereference(path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'), {dereference: {circular: false}})
        .then(
          helper.shouldNotGetCalled,
          function(err) {
            // A ReferenceError should have been thrown
            expect(err).to.be.an.instanceOf(ReferenceError);
            expect(err.message).to.contain('Circular $ref pointer found at ');
            expect(err.message).to.contain('specs/circular-extended/definitions/child-with-children.yaml#/properties');

            // $Refs.circular should be true
            expect(parser.$refs.circular).to.equal(true);
          });
    });

    it('should bundle successfully', function() {
      return $RefParser.bundle(path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'))
        .then(function(schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.bundled.circularExtended.indirectAncestor);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });
  });

});
