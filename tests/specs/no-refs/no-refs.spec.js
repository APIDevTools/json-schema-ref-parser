'use strict';

describe('Schema without any $refs', function() {
  it('should parse successfully', function(done) {
    var parser = new $RefParser();
    parser
      .parse(path.rel('specs/no-refs/no-refs.yaml'))
      .catch(helper.shouldNotGetCalled(done))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.noRefs);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/no-refs/no-refs.yaml')]);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should resolve successfully', function(done) {
    var parser = new $RefParser();
    parser
      .resolve(path.rel('specs/no-refs/no-refs.yaml'))
      .catch(helper.shouldNotGetCalled(done))
      .then(function($refs) {
        expect(parser.schema).to.deep.equal(helper.parsed.noRefs);
        expect(parser.$refs).to.equal($refs);

        var schemaPath = path.abs('specs/no-refs/no-refs.yaml');
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
      .dereference(path.rel('specs/no-refs/no-refs.yaml'))
      .catch(helper.shouldNotGetCalled(done))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.noRefs);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should bundle successfully', function(done) {
    var parser = new $RefParser();
    parser
      .bundle(path.rel('specs/no-refs/no-refs.yaml'))
      .catch(helper.shouldNotGetCalled(done))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.noRefs);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });
});
