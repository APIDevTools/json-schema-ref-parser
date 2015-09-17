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

  it('should bundle successfully', function(done) {
    var parser = new $RefParser();
    parser
      .bundle(path.rel('specs/deep-circular/deep-circular.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.deepCircular);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });
});
