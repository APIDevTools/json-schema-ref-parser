'use strict';

describe('Schema with circular (recursive) $refs', function() {
  it('should parse successfully', function(done) {
    var parser = new $RefParser();
    parser
      .parse(path.rel('specs/circular/circular.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.circular);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular/circular.yaml')]);

        // The "circular" flag should NOT be set
        // (it only gets set by `dereference`)
        expect(parser.$refs.circular).to.equal(false);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should resolve successfully', helper.testResolve(
    'specs/circular/circular.yaml', helper.parsed.circular
  ));

  it('should dereference successfully', function(done) {
    var parser = new $RefParser();
    parser
      .dereference(path.rel('specs/circular/circular.yaml'))
      .catch(helper.shouldNotGetCalled(done))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.circular);

        // The "circular" flag should be set
        expect(parser.$refs.circular).to.equal(true);

        // Reference equality
        expect(schema.definitions.person.properties.spouse.type).to.equal(schema.definitions.person);
        expect(schema.definitions.parent.properties.children.items).to.equal(schema.definitions.child);
        expect(schema.definitions.child.properties.parents.items).to.equal(schema.definitions.parent);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should throw an error if "options.allow.circular" is false', function(done) {
    var parser = new $RefParser();
    parser
      .dereference(path.rel('specs/circular/circular.yaml'), {allow: {circular: false}})
      .then(helper.shouldNotGetCalled(done))
      .catch(function(err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain('Circular $ref pointer found at ');
        expect(err.message).to.contain('specs/circular/circular.yaml#/definitions/thing');

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should bundle successfully', function(done) {
    var parser = new $RefParser();
    parser
      .bundle(path.rel('specs/circular/circular.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.circular);

        // The "circular" flag should NOT be set
        // (it only gets set by `dereference`)
        expect(parser.$refs.circular).to.equal(false);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });
});
