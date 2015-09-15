'use strict';

describe('Invalid syntax', function() {
  it('Invalid YAML file should throw an error', function(done) {
    $RefParser
      .parse(path.rel('specs/invalid/invalid.yaml'))
      .then(helper.shouldNotGetCalled(done))
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing "');
        expect(err.message).to.contain('invalid/invalid.yaml"');
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('Invalid JSON file should throw an error', function(done) {
    $RefParser
      .parse(path.rel('specs/invalid/invalid.json'))
      .then(helper.shouldNotGetCalled(done))
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing "');
        expect(err.message).to.contain('invalid/invalid.json"');
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('Invalid JSON file should throw an error when parsed as JSON', function(done) {
    $RefParser
      .parse(path.rel('specs/invalid/invalid.json'), {allow: {yaml: false}})
      .then(helper.shouldNotGetCalled(done))
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing "');
        expect(err.message).to.contain('invalid/invalid.json"');
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });

  it('should throw an error if "options.allow.unknown" is disabled', function(done) {
    $RefParser
      .parse(path.rel('specs/invalid/invalid.yaml'), {allow: {unknown: false}})
      .then(helper.shouldNotGetCalled(done))
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing "');
        expect(err.message).to.contain('invalid/invalid.yaml"');
        done();
      })
      .catch(helper.shouldNotGetCalled(done));
  });
});
