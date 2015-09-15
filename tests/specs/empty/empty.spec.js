'use strict';

describe('Empty schema', function() {
  it('should parse successfully', function(done) {
    var parser = new $RefParser();
    parser
      .parse(path.rel('specs/empty/empty.json'))
      .catch(helper.shouldNotGetCalled(done))
      .then(function(schema) {
        expect(schema).to.be.an('object');
        expect(schema).to.be.empty;
        expect(parser.schema).to.equal(schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/empty/empty.json')]);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should resolve successfully', function(done) {
    var parser = new $RefParser();
    parser
      .resolve(path.rel('specs/empty/empty.json'))
      .catch(helper.shouldNotGetCalled(done))
      .then(function($refs) {
        expect(parser.schema).to.be.an('object');
        expect(parser.schema).to.be.empty;
        expect(parser.$refs).to.equal($refs);

        var schemaPath = path.abs('specs/empty/empty.json');
        var allPaths = $refs.paths();
        var filePaths = $refs.paths('fs');
        var urlPaths = $refs.paths('http', 'https');
        var values = $refs.values();

        expect(allPaths).to.deep.equal([schemaPath]);
        expect(values).to.have.all.keys([schemaPath]);

        if (userAgent.isNode) {
          expect(filePaths).to.deep.equal(allPaths);
          expect(urlPaths).to.have.lengthOf(0);
        }
        else {
          expect(urlPaths).to.deep.equal(allPaths);
          expect(filePaths).to.have.lengthOf(0);
        }

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should dereference successfully', function(done) {
    var parser = new $RefParser();
    parser
      .dereference(path.rel('specs/empty/empty.json'))
      .catch(helper.shouldNotGetCalled(done))
      .then(function(schema) {
        expect(schema).to.be.an('object');
        expect(schema).to.be.empty;
        expect(parser.schema).to.equal(schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/empty/empty.json')]);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should bundle successfully', function(done) {
    var parser = new $RefParser();
    parser
      .bundle(path.rel('specs/empty/empty.json'))
      .catch(helper.shouldNotGetCalled(done))
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
