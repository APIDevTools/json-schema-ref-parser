'use strict';

describe('Blank files', function() {
  var windowOnError, testDone;

  beforeEach(function() {
    // Some old Webkit browsers throw an error when downloading zero-byte files.
    windowOnError = global.onerror;
    global.onerror = function() {
      testDone();
      return true;
    };
  });

  afterEach(function() {
    global.onerror = windowOnError;
  });

  describe('main file', function() {
    it('should throw an error for a blank YAML file', function(done) {
      testDone = done;
      return $RefParser
        .parse(path.rel('specs/blank/files/blank.yaml'))
        .then(helper.shouldNotGetCalled(done))
        .catch(function(err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain('blank/files/blank.yaml" is not a valid JSON Schema');
          done();
        })
        .catch(done);
    });

    it('should throw a different error if "parse.yaml.allowEmpty" is disabled', function(done) {
      testDone = done;
      return $RefParser
        .parse(path.rel('specs/blank/files/blank.yaml'), {parse: {yaml: {allowEmpty: false}}})
        .then(helper.shouldNotGetCalled(done))
        .catch(function(err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain('Error parsing ');
          expect(err.message).to.contain('blank/files/blank.yaml');
          expect(err.message).to.contain('Parsed value is empty');
          done();
        })
        .catch(done);
    });

    it('should throw an error for a blank JSON file', function(done) {
      testDone = done;
      return $RefParser
        .parse(path.rel('specs/blank/files/blank.json'), {parse: {json: { allowEmpty: false }}})
        .then(helper.shouldNotGetCalled(done))
        .catch(function(err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain('Error parsing ');
          expect(err.message).to.contain('blank/files/blank.json');
          done();
        })
        .catch(done);
    });
  });

  describe('referenced files', function() {
    it('should parse successfully', function(done) {
      testDone = done;
      return $RefParser
        .parse(path.rel('specs/blank/blank.yaml'))
        .then(function(schema) {
          expect(schema).to.deep.equal(helper.parsed.blank.schema);
          done();
        })
        .catch(done);
    });

    it('should resolve successfully', helper.testResolve(
      path.rel('specs/blank/blank.yaml'),
      path.abs('specs/blank/blank.yaml'), helper.parsed.blank.schema,
      path.abs('specs/blank/files/blank.yaml'), helper.parsed.blank.yaml,
      path.abs('specs/blank/files/blank.json'), helper.parsed.blank.json,
      path.abs('specs/blank/files/blank.txt'), helper.parsed.blank.text,
      path.abs('specs/blank/files/blank.png'), helper.parsed.blank.binary,
      path.abs('specs/blank/files/blank.foo'), helper.parsed.blank.unknown
    ));

    it('should dereference successfully', function(done) {
      testDone = done;
      return $RefParser
        .dereference(path.rel('specs/blank/blank.yaml'))
        .then(function(schema) {
          schema.binary = helper.convertNodeBuffersToPOJOs(schema.binary);
          expect(schema).to.deep.equal(helper.dereferenced.blank);
          done();
        })
        .catch(done);
    });

    it('should bundle successfully', function(done) {
      testDone = done;
      return $RefParser
        .bundle(path.rel('specs/blank/blank.yaml'))
        .then(function(schema) {
          schema.binary = helper.convertNodeBuffersToPOJOs(schema.binary);
          expect(schema).to.deep.equal(helper.dereferenced.blank);
          done();
        })
        .catch(done);
    });

    it('should throw an error if "allowEmpty" is disabled', function(done) {
      testDone = done;
      return $RefParser
        .dereference(path.rel('specs/blank/blank.yaml'), {
          parse: {binary: {allowEmpty: false}}
        })
        .then(helper.shouldNotGetCalled(done))
        .catch(function(err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain('Error parsing ');
          expect(err.message).to.contain('blank/files/blank.png');
          expect(err.message).to.contain('Parsed value is empty');
          done();
        })
        .catch(done);
    });
  });
});
