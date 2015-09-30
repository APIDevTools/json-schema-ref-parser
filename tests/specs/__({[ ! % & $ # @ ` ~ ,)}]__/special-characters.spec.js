'use strict';

describe('File names with special characters', function() {
  it('should parse successfully', function() {
    var parser = new $RefParser();
    return parser
      .parse(path.rel('specs/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.specialCharacters.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.yaml')]);
      });
  });

  it('should resolve successfully', helper.testResolve(
    'specs/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.yaml', helper.parsed.specialCharacters.schema,
    'specs/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.json', helper.parsed.specialCharacters.file
  ));

  it('should dereference successfully', function() {
    var parser = new $RefParser();
    return parser
      .dereference(path.rel('specs/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.specialCharacters);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it('should bundle successfully', function() {
    var parser = new $RefParser();
    return parser
      .bundle(path.rel('specs/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.specialCharacters);
      });
  });
});
