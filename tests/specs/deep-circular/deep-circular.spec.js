'use strict';

describe('Schema with deeply-nested circular $refs', function() {
  it('should parse successfully', function(done) {
    var parser = new $RefParser();
    parser
      .parse(path.rel('specs/deep-circular/deep-circular.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.deepCircular.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/deep-circular/deep-circular.yaml')]);

        // The "circular" flag should NOT be set
        // (it only gets set by `dereference`)
        expect(parser.$refs.circular).to.equal(false);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should resolve successfully', helper.testResolve(
    'specs/deep-circular/deep-circular.yaml', helper.parsed.deepCircular.schema,
    'specs/deep-circular/definitions/name.yaml', helper.parsed.deepCircular.name,
    'specs/deep-circular/definitions/required-string.yaml', helper.parsed.deepCircular.requiredString
  ));

  it('should dereference successfully', function(done) {
    var parser = new $RefParser();
    parser
      .dereference(path.rel('specs/deep-circular/deep-circular.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.deepCircular);

        // The "circular" flag should be set
        expect(parser.$refs.circular).to.equal(true);

        // Reference equality
        expect(schema.properties.name.type)
          .to.equal(schema.properties.level1.properties.name.type)
          .to.equal(schema.properties.level1.properties.level2.properties.name.type)
          .to.equal(schema.properties.level1.properties.level2.properties.level3.properties.name.type)
          .to.equal(schema.properties.level1.properties.level2.properties.level3.properties.level4.properties.name.type);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should throw an error if "options.$refs.circular" is false', function(done) {
    var parser = new $RefParser();
    parser
      .dereference(path.rel('specs/deep-circular/deep-circular.yaml'), {$refs: {circular: false}})
      .then(helper.shouldNotGetCalled(done))
      .catch(function(err) {
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

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should bundle successfully', function(done) {
    var parser = new $RefParser();
    parser
      .bundle(path.rel('specs/deep-circular/deep-circular.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.deepCircular);

        // The "circular" flag should NOT be set
        // (it only gets set by `dereference`)
        expect(parser.$refs.circular).to.equal(false);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });
});
