'use strict';

describe('Schema with allOf composition', function() {
  it('should parse successfully', function(done) {
    var parser = new $RefParser();
    parser
      .parse(path.rel('specs/expand/expand.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.expand);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/expand/expand.yaml')]);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should resolve successfully', helper.testResolve(
    'specs/expand/expand.yaml', helper.parsed.expand
  ));

  it('should dereference successfully', function(done) {
    var parser = new $RefParser();
    parser
      .dereference(path.rel('specs/expand/expand.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.expand);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should bundle successfully', function(done) {
    var parser = new $RefParser();
    parser
      .bundle(path.rel('specs/expand/expand.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.expand);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });
  
  it('should expand successfully', function(done) {
  var parser = new $RefParser();
  parser
    .expand(path.rel('specs/expand/expand.yaml'))
    .then(function(schema) {
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(helper.expanded.expand);
      done();
    })
    .catch(helper.shouldNotGetCalled(done));
  });
});
