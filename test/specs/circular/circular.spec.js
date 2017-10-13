describe('Schema with circular (recursive) $refs', function () {
  'use strict';

  describe('$ref to self', function () {
    it('should parse successfully', function () {
      var parser = new $RefParser();
      return parser
        .parse(path.rel('specs/circular/circular-self.yaml'))
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.parsed.circular.self);
          expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular/circular-self.yaml')]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });

    it('should resolve successfully', helper.testResolve(
      path.rel('specs/circular/circular-self.yaml'),
      path.abs('specs/circular/circular-self.yaml'), helper.parsed.circular.self
    ));

    it('should dereference successfully', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.rel('specs/circular/circular-self.yaml'))
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circular.self);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);

          // Reference equality
          expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
        });
    });

    it('should produce the same results if "options.$refs.circular" is "ignore"', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.rel('specs/circular/circular-self.yaml'), { dereference: { circular: 'ignore' }})
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circular.self);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);
        });
    });

    it('should throw an error if "options.$refs.circular" is false', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.rel('specs/circular/circular-self.yaml'), { dereference: { circular: false }})
        .then(helper.shouldNotGetCalled)
        .catch(function (err) {
          // A ReferenceError should have been thrown
          expect(err).to.be.an.instanceOf(ReferenceError);
          expect(err.message).to.contain('Circular $ref pointer found at ');
          expect(err.message).to.contain('specs/circular/circular-self.yaml#/definitions/thing');

          // $Refs.circular should be true
          expect(parser.$refs.circular).to.equal(true);
        });
    });

    it('should bundle successfully', function () {
      var parser = new $RefParser();
      return parser
        .bundle(path.rel('specs/circular/circular-self.yaml'))
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.parsed.circular.self);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });
  });

  describe('$ref to ancestor', function () {
    it('should parse successfully', function () {
      var parser = new $RefParser();
      return parser
        .parse(path.rel('specs/circular/circular-ancestor.yaml'))
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.parsed.circular.ancestor);
          expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular/circular-ancestor.yaml')]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });

    it('should resolve successfully', helper.testResolve(
      path.rel('specs/circular/circular-ancestor.yaml'),
      path.abs('specs/circular/circular-ancestor.yaml'), helper.parsed.circular.ancestor
    ));

    it('should dereference successfully', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.rel('specs/circular/circular-ancestor.yaml'))
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circular.ancestor.fullyDereferenced);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);

          // Reference equality
          expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
          expect(schema.definitions.person.properties.pet).to.equal(schema.definitions.pet);
        });
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.rel('specs/circular/circular-ancestor.yaml'), { dereference: { circular: 'ignore' }})
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circular.ancestor.ignoreCircular$Refs);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);

          // Reference equality
          expect(schema.definitions.person.properties.pet).to.equal(schema.definitions.pet);
        });
    });

    it('should throw an error if "options.$refs.circular" is false', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.rel('specs/circular/circular-ancestor.yaml'), { dereference: { circular: false }})
        .then(helper.shouldNotGetCalled)
        .catch(function (err) {
          // A ReferenceError should have been thrown
          expect(err).to.be.an.instanceOf(ReferenceError);
          expect(err.message).to.contain('Circular $ref pointer found at ');
          expect(err.message).to.contain('specs/circular/circular-ancestor.yaml#/definitions/person/properties/spouse');

          // $Refs.circular should be true
          expect(parser.$refs.circular).to.equal(true);
        });
    });

    it('should bundle successfully', function () {
      var parser = new $RefParser();
      return parser
        .bundle(path.rel('specs/circular/circular-ancestor.yaml'))
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.parsed.circular.ancestor);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });
  });

  describe('indirect circular $refs', function () {
    it('should parse successfully', function () {
      var parser = new $RefParser();
      return parser
        .parse(path.rel('specs/circular/circular-indirect.yaml'))
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.parsed.circular.indirect);
          expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular/circular-indirect.yaml')]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });

    it('should resolve successfully', helper.testResolve(
      path.rel('specs/circular/circular-indirect.yaml'),
      path.abs('specs/circular/circular-indirect.yaml'), helper.parsed.circular.indirect
    ));

    it('should dereference successfully', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.rel('specs/circular/circular-indirect.yaml'))
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circular.indirect.fullyDereferenced);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);

          // Reference equality
          expect(schema.definitions.parent.properties.children.items)
            .to.equal(schema.definitions.child);
          expect(schema.definitions.child.properties.parents.items)
            .to.equal(schema.definitions.parent);
        });
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.rel('specs/circular/circular-indirect.yaml'), { dereference: { circular: 'ignore' }})
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circular.indirect.ignoreCircular$Refs);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);

          // Reference equality
          expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
        });
    });

    it('should throw an error if "options.$refs.circular" is false', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.rel('specs/circular/circular-indirect.yaml'), { dereference: { circular: false }})
        .then(helper.shouldNotGetCalled)
        .catch(function (err) {
          // A ReferenceError should have been thrown
          expect(err).to.be.an.instanceOf(ReferenceError);
          expect(err.message).to.contain('Circular $ref pointer found at ');
          expect(err.message).to.contain('specs/circular/circular-indirect.yaml#/definitions/child/properties/parents/items');

          // $Refs.circular should be true
          expect(parser.$refs.circular).to.equal(true);
        });
    });

    it('should bundle successfully', function () {
      var parser = new $RefParser();
      return parser
        .bundle(path.rel('specs/circular/circular-indirect.yaml'))
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.parsed.circular.indirect);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });
  });

  describe('indirect circular and ancestor $refs', function () {
    it('should parse successfully', function () {
      var parser = new $RefParser();
      return parser
        .parse(path.rel('specs/circular/circular-indirect-ancestor.yaml'))
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.parsed.circular.indirectAncestor);
          expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular/circular-indirect-ancestor.yaml')]);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });

    it('should resolve successfully', helper.testResolve(
      path.rel('specs/circular/circular-indirect-ancestor.yaml'),
      path.abs('specs/circular/circular-indirect-ancestor.yaml'), helper.parsed.circular.indirectAncestor
    ));

    it('should dereference successfully', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.rel('specs/circular/circular-indirect-ancestor.yaml'))
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circular.indirectAncestor.fullyDereferenced);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);

          // Reference equality
          expect(schema.definitions.parent.properties.child)
            .to.equal(schema.definitions.child);
          expect(schema.definitions.child.properties.children.items)
            .to.equal(schema.definitions.child);
        });
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.rel('specs/circular/circular-indirect-ancestor.yaml'), { dereference: { circular: 'ignore' }})
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.dereferenced.circular.indirectAncestor.ignoreCircular$Refs);

          // The "circular" flag should be set
          expect(parser.$refs.circular).to.equal(true);

          // Reference equality
          expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
        });
    });

    it('should throw an error if "options.$refs.circular" is false', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.rel('specs/circular/circular-indirect-ancestor.yaml'), { dereference: { circular: false }})
        .then(helper.shouldNotGetCalled)
        .catch(function (err) {
          // A ReferenceError should have been thrown
          expect(err).to.be.an.instanceOf(ReferenceError);
          expect(err.message).to.contain('Circular $ref pointer found at ');
          expect(err.message).to.contain('specs/circular/circular-indirect-ancestor.yaml#/definitions/child/properties');

          // $Refs.circular should be true
          expect(parser.$refs.circular).to.equal(true);
        });
    });

    it('should bundle successfully', function () {
      var parser = new $RefParser();
      return parser
        .bundle(path.rel('specs/circular/circular-indirect-ancestor.yaml'))
        .then(function (schema) {
          expect(schema).to.equal(parser.schema);
          expect(schema).to.deep.equal(helper.parsed.circular.indirectAncestor);

          // The "circular" flag should NOT be set
          // (it only gets set by `dereference`)
          expect(parser.$refs.circular).to.equal(false);
        });
    });
  });

});

