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

        // Reference equality
        expect(schema.definitions.person.properties.spouse.type).to.equal(schema.definitions.person);
        expect(schema.definitions.parent.properties.children.items).to.equal(schema.definitions.child);
        expect(schema.definitions.child.properties.parents.items).to.equal(schema.definitions.parent);

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
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });
});
