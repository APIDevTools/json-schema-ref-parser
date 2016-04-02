'use strict';

describe('Empty schema', function() {
  it('should parse successfully', function() {
    var parser = new $RefParser();
    return parser
      .parse(path.rel('specs/empty/empty.json'))
      .then(function(schema) {
        expect(schema).to.be.an('object');
        expect(schema).to.be.empty;
        expect(parser.schema).to.equal(schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/empty/empty.json')]);
      });
  });

  it('should resolve successfully', helper.testResolve(
    path.rel('specs/empty/empty.json'),
    path.abs('specs/empty/empty.json'), {}
  ));

  it('should dereference successfully', function() {
    var parser = new $RefParser();
    return parser
      .dereference(path.rel('specs/empty/empty.json'))
      .then(function(schema) {
        expect(schema).to.be.an('object');
        expect(schema).to.be.empty;
        expect(parser.schema).to.equal(schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/empty/empty.json')]);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it('should bundle successfully', function() {
    var parser = new $RefParser();
    return parser
      .bundle(path.rel('specs/empty/empty.json'))
      .then(function(schema) {
        expect(schema).to.be.an('object');
        expect(schema).to.be.empty;
        expect(parser.schema).to.equal(schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/empty/empty.json')]);
      });
  });

  it('should throw an error if "parse.json.allowEmpty" is disabled', function() {
    return $RefParser
      .parse(path.rel('specs/empty/empty.json'), {parse: {json: {allowEmpty: false}}})
      .then(helper.shouldNotGetCalled)
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing ');
        expect(err.message).to.contain('empty/empty.json"');
        expect(err.message).to.contain('Parsed value is empty');
      });
  });
});
