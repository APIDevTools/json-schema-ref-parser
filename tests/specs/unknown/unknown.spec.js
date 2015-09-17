'use strict';

describe('Schema with $refs to unknown file types', function() {
  var windowOnError, testDone;

  beforeEach(function() {
    // Some old Webkit browsers throw an error when downloading zero-byte files.
    windowOnError = global.onerror;
    global.onerror = function() {
      testDone();
      return true;
    }
  });

  afterEach(function() {
    global.onerror = windowOnError;
  });

  it('should parse successfully', function(done) {
    testDone = done;
    var parser = new $RefParser();
    parser
      .parse(path.rel('specs/unknown/unknown.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.unknown.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/unknown/unknown.yaml')]);
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should resolve successfully', function(done) {
    testDone = done;
    helper.testResolve(
      'specs/unknown/unknown.yaml', helper.parsed.unknown.schema,
      'specs/unknown/files/blank', helper.parsed.unknown.blank,
      'specs/unknown/files/text.txt', helper.parsed.unknown.text,
      'specs/unknown/files/page.html', helper.parsed.unknown.html,
      'specs/unknown/files/binary.png', helper.parsed.unknown.binary
    )(done);
  });

  it('should dereference successfully', function(done) {
    testDone = done;
    var parser = new $RefParser();
    parser
      .dereference(path.rel('specs/unknown/unknown.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);

        // Serialize the schema, to convert the Buffers into POJOs
        schema = JSON.parse(JSON.stringify(schema));
        expect(schema).to.deep.equal(helper.dereferenced.unknown);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should bundle successfully', function(done) {
    testDone = done;
    var parser = new $RefParser();
    parser
      .bundle(path.rel('specs/unknown/unknown.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);

        // Serialize the schema, to convert the Buffers into POJOs
        schema = JSON.parse(JSON.stringify(schema));
        expect(schema).to.deep.equal(helper.dereferenced.unknown);

        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });
});
