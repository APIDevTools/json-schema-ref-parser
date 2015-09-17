'use strict';

describe('Schema with circular (recursive) external $refs', function() {
  it('should parse successfully', function(done) {
    var parser = new $RefParser();
    parser
      .parse(path.rel('specs/circular-external/circular-external.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.circularExternal.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular-external/circular-external.yaml')]);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should resolve successfully', helper.testResolve(
    'specs/circular-external/circular-external.yaml', helper.parsed.circularExternal.schema,
    'specs/circular-external/definitions/child.yaml', helper.parsed.circularExternal.child,
    'specs/circular-external/definitions/parent.yaml', helper.parsed.circularExternal.parent,
    'specs/circular-external/definitions/person.yaml', helper.parsed.circularExternal.person
  ));

  it('should dereference successfully', function(done) {
    var parser = new $RefParser();
    parser
      .dereference(path.rel('specs/circular-external/circular-external.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.circularExternal);

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
      .bundle(path.rel('specs/circular-external/circular-external.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.circularExternal);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });
});
