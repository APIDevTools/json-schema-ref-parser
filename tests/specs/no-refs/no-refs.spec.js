'use strict';

describe('Schema without any $refs', function() {
  it('should parse successfully', function(done) {
    var parser = new $RefParser();
    parser
      .parse(path.rel('specs/no-refs/no-refs.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.noRefs);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/no-refs/no-refs.yaml')]);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should resolve successfully', helper.testResolve(
    'specs/no-refs/no-refs.yaml', helper.parsed.noRefs
  ));

  it('should dereference successfully', function(done) {
    var parser = new $RefParser();
    parser
      .dereference(path.rel('specs/no-refs/no-refs.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.noRefs);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should bundle successfully', function(done) {
    var parser = new $RefParser();
    parser
      .bundle(path.rel('specs/no-refs/no-refs.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.noRefs);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });
});
