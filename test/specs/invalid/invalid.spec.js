'use strict';

describe('Invalid syntax', function() {
  describe('in main file', function() {
    it('should throw an error for an invalid YAML file', function() {
      return $RefParser
        .dereference(path.rel('specs/invalid/invalid.yaml'))
        .then(helper.shouldNotGetCalled)
        .catch(function(err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain('Error parsing ');
          expect(err.message).to.contain('invalid/invalid.yaml');
        });
    });

    it('should throw an error for an invalid JSON file', function() {
      return $RefParser
        .dereference(path.rel('specs/invalid/invalid.json'))
        .then(helper.shouldNotGetCalled)
        .catch(function(err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain('Error parsing ');
          expect(err.message).to.contain('invalid/invalid.json');
        });
    });

    it('should throw an error for an invalid JSON file with YAML disabled', function() {
      return $RefParser
        .dereference(path.rel('specs/invalid/invalid.json'), {parse: {yaml: false}})
        .then(helper.shouldNotGetCalled)
        .catch(function(err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain('Error parsing ');
          expect(err.message).to.contain('invalid/invalid.json');
        });
    });

    it('should throw an error for an invalid YAML file with JSON and YAML disabled', function() {
      return $RefParser
        .dereference(path.rel('specs/invalid/invalid.yaml'), {parse: {yaml: false, json: false}})
        .then(helper.shouldNotGetCalled)
        .catch(function(err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain('invalid/invalid.yaml" is not a valid JSON Schema');
        });
    });
  });

  describe('in referenced files', function() {
    it('should throw an error for an invalid YAML file', function() {
      return $RefParser
        .dereference({foo: {$ref: path.rel('specs/invalid/invalid.yaml')}})
        .then(helper.shouldNotGetCalled)
        .catch(function(err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain('Error parsing ');
          expect(err.message).to.contain('invalid/invalid.yaml');
        });
    });

    it('should throw an error for an invalid JSON file', function() {
      return $RefParser
        .dereference({foo: {$ref: path.rel('specs/invalid/invalid.json')}})
        .then(helper.shouldNotGetCalled)
        .catch(function(err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain('Error parsing ');
          expect(err.message).to.contain('invalid/invalid.json');
        });
    });

    it('should throw an error for an invalid JSON file with YAML disabled', function() {
      return $RefParser
        .dereference({foo: {$ref: path.rel('specs/invalid/invalid.json')}}, {
          parse: {yaml: false}
        })
        .then(helper.shouldNotGetCalled)
        .catch(function(err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain('Error parsing ');
          expect(err.message).to.contain('invalid/invalid.json');
        });
    });

    it('should NOT throw an error for an invalid YAML file with JSON and YAML disabled', function() {
      return $RefParser
        .dereference({foo: {$ref: path.rel('specs/invalid/invalid.yaml')}}, {
          parse: {yaml: false, json: false}
        })
        .then(function(schema) {
          // Because the JSON and YAML parsers were disabled, the invalid YAML file got parsed as plain text
          expect(schema).to.deep.equal({
            foo: ":\n"
          });
        });
    });
  });
});
