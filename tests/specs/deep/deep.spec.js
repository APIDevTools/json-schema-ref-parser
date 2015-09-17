'use strict';

describe('Schema with deeply-nested $refs', function() {
  it('should parse successfully', function(done) {
    var parser = new $RefParser();
    parser
      .parse(path.rel('specs/deep/deep.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.deep.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/deep/deep.yaml')]);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should resolve successfully', helper.testResolve(
    'specs/deep/deep.yaml', helper.parsed.deep.schema,
    'specs/deep/definitions/name.yaml', helper.parsed.deep.name,
    'specs/deep/definitions/required-string.yaml', helper.parsed.deep.requiredString
  ));

  it('should dereference successfully', function(done) {
    var parser = new $RefParser();
    parser
      .dereference(path.rel('specs/deep/deep.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.deep);

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
      .bundle(path.rel('specs/deep/deep.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.deep);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });
});
