'use strict';

describe('Invalid syntax', function() {
  it('Invalid YAML file should throw an error', function() {
    return $RefParser
      .parse(path.rel('specs/invalid/invalid.yaml'))
      .then(helper.shouldNotGetCalled)
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing "');
        expect(err.message).to.contain('invalid/invalid.yaml"');
      });
  });

  it('Invalid JSON file should throw an error', function() {
    return $RefParser
      .parse(path.rel('specs/invalid/invalid.json'))
      .then(helper.shouldNotGetCalled)
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing "');
        expect(err.message).to.contain('invalid/invalid.json"');
      });
  });

  it('Invalid JSON file should throw an error when parsed as JSON', function() {
    return $RefParser
      .parse(path.rel('specs/invalid/invalid.json'), {allow: {yaml: false}})
      .then(helper.shouldNotGetCalled)
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing "');
        expect(err.message).to.contain('invalid/invalid.json"');
      });
  });

  it('should throw an error if "options.allow.unknown" is disabled', function() {
    return $RefParser
      .parse(path.rel('specs/invalid/invalid.yaml'), {allow: {unknown: false}})
      .then(helper.shouldNotGetCalled)
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing "');
        expect(err.message).to.contain('invalid/invalid.yaml"');
      });
  });
});
