'use strict';

describe('Schema with circular (recursive) external $refs', function() {
  it('should parse successfully', function() {
    var parser = new $RefParser();
    return parser
      .parse(path.rel('specs/circular-external/circular-external.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.circularExternal.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular-external/circular-external.yaml')]);

        // The "circular" flag should NOT be set
        // (it only gets set by `dereference`)
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it('should resolve successfully', helper.testResolve(
    path.rel('specs/circular-external/circular-external.yaml'),
    path.abs('specs/circular-external/circular-external.yaml'), helper.parsed.circularExternal.schema,
    path.abs('specs/circular-external/definitions/pet.yaml'), helper.parsed.circularExternal.pet,
    path.abs('specs/circular-external/definitions/child.yaml'), helper.parsed.circularExternal.child,
    path.abs('specs/circular-external/definitions/parent.yaml'), helper.parsed.circularExternal.parent,
    path.abs('specs/circular-external/definitions/person.yaml'), helper.parsed.circularExternal.person
  ));

  it('should dereference successfully', function() {
    var parser = new $RefParser();
    return parser
      .dereference(path.rel('specs/circular-external/circular-external.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.circularExternal);

        // The "circular" flag should be set
        expect(parser.$refs.circular).to.equal(true);

        // Reference equality
        expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
        expect(schema.definitions.parent.properties.children.items).to.equal(schema.definitions.child);
        expect(schema.definitions.child.properties.parents.items).to.equal(schema.definitions.parent);
      });
  });

  it('should throw an error if "options.$refs.circular" is false', function() {
    var parser = new $RefParser();
    return parser
      .dereference(path.rel('specs/circular-external/circular-external.yaml'), {dereference: {circular: false}})
      .then(helper.shouldNotGetCalled)
      .catch(function(err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain('Circular $ref pointer found at ');
        expect(err.message).to.contain('specs/circular-external/circular-external.yaml#/definitions/thing');

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      });
  });

  it('should bundle successfully', function() {
    var parser = new $RefParser();
    return parser
      .bundle(path.rel('specs/circular-external/circular-external.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.circularExternal);

        // The "circular" flag should NOT be set
        // (it only gets set by `dereference`)
        expect(parser.$refs.circular).to.equal(false);
      });
  });
});
