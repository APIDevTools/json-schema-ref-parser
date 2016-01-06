'use strict';

describe('Blank files', function() {
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

  it('should throw an error if parsed as YAML', function(done) {
    testDone = done;
    return $RefParser
      .parse(path.rel('specs/blank/blank.yaml'))
      .then(helper.shouldNotGetCalled)
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('blank/blank.yaml" is not a valid JSON Schema');
        done();
      });
  });

  it('should throw an error if parsed as JSON', function(done) {
    testDone = done;
    return $RefParser
      .parse(path.rel('specs/blank/blank.yaml'), {allow: {yaml: false}})
      .then(helper.shouldNotGetCalled)
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing "');
        expect(err.message).to.contain('blank/blank.yaml"');
        done();
      })
      .catch(done);
  });

  it('should throw an error if "options.allow.empty" is disabled', function(done) {
    testDone = done;
    return $RefParser
      .parse(path.rel('specs/blank/blank.yaml'), {allow: {empty: false}})
      .then(helper.shouldNotGetCalled)
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing "');
        expect(err.message).to.contain('blank/blank.yaml"');
        expect(err.message).to.contain('Parsed value is empty');
        done();
      })
      .catch(done);
  });
});
