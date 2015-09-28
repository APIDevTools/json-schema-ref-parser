'use strict';

describe('Empty schema', function() {
  it('should parse successfully', function(done) {
    var parser = new $RefParser();
    parser
      .parse(path.rel('specs/empty/empty.json'))
      .then(function(schema) {
        expect(schema).to.be.an('object');
        expect(schema).to.be.empty;
        expect(parser.schema).to.equal(schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/empty/empty.json')]);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should resolve successfully', helper.testResolve(
    'specs/empty/empty.json', {}
  ));

  it('should dereference successfully', function(done) {
    var parser = new $RefParser();
    parser
      .dereference(path.rel('specs/empty/empty.json'))
      .then(function(schema) {
        expect(schema).to.be.an('object');
        expect(schema).to.be.empty;
        expect(parser.schema).to.equal(schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/empty/empty.json')]);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should bundle successfully', function(done) {
    var parser = new $RefParser();
    parser
      .bundle(path.rel('specs/empty/empty.json'))
      .then(function(schema) {
        expect(schema).to.be.an('object');
        expect(schema).to.be.empty;
        expect(parser.schema).to.equal(schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/empty/empty.json')]);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should throw an error if "options.allow.empty" is disabled', function(done) {
    $RefParser
      .parse(path.rel('specs/empty/empty.json'), {allow: {empty: false}})
      .then(helper.shouldNotGetCalled(done))
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing "');
        expect(err.message).to.contain('empty/empty.json"');
        expect(err.message).to.contain('Parsed value is empty');
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });
});
