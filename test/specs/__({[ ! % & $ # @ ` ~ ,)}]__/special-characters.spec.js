describe('File names with special characters', function() {
  'use strict';

  it('should parse successfully', function() {
    return $RefParser.parse(path.rel('specs/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Only the main schema file should be resolved
        helper.validateFiles(schema.files, [
          path.abs('specs/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__.yaml'),
        ]);

        // This schema is not circular
        expect(schema.circular).to.equal(false);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.root).to.deep.equal(helper.parsed.specialCharacters.schema);
      });
  });

  it('should resolve successfully', function() {
    return $RefParser.resolve(path.rel('specs/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        // NOTE: We're checking the file URLs here, which is why they're encoded
        helper.validateFiles(schema.files, [
          path.abs('specs/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__.yaml'),
          path.abs('specs/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__.json'),
        ]);

        // File.path should NOT be encoded (unlike File.url)
        expect(schema.files[0].path).to.equal(path.abs('specs/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.yaml'));
        expect(schema.files[1].path).to.equal(path.abs('specs/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.json'));

        // This schema is not circular
        expect(schema.circular).to.equal(false);

        // The schema should be parsed, but not dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('__({[ ! % & $ # @ ` ~ ,)}]__.yaml').data)
          .to.deep.equal(helper.parsed.specialCharacters.schema);
        expect(schema.files.get('__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.json').data)
          .to.deep.equal(helper.parsed.specialCharacters.file);
      });
  });

  it('should dereference successfully', function() {
    return $RefParser.dereference(path.rel('specs/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__.yaml'),
          path.abs('specs/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__.json'),
        ]);

        // This schema is not circular
        expect(schema.circular).to.equal(false);

        // The schema should be fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: true});
        expect(schema.files.get('__({[ ! % & $ # @ ` ~ ,)}]__.yaml').data)
          .to.deep.equal(helper.dereferenced.specialCharacters);
      });
  });

  it('should bundle successfully', function() {
    return $RefParser.bundle(path.rel('specs/__({[ ! % & $ # @ ` ~ ,)}]__/__({[ ! % & $ # @ ` ~ ,)}]__.yaml'))
      .then(function(schema) {
        helper.validateSchema(schema);

        // Make sure all of the schema's files were found
        helper.validateFiles(schema.files, [
          path.abs('specs/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__.yaml'),
          path.abs('specs/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__/__(%7B%5B%20!%20%25%20&%20$%20%23%20@%20%60%20~%20,)%7D%5D__.json'),
        ]);

        // This schema is not circular
        expect(schema.circular).to.equal(false);

        // The schema should be bundled, but not fully dereferenced
        helper.expectAll(schema.files, {parsed: true, dereferenced: false});
        expect(schema.files.get('__({[ ! % & $ # @ ` ~ ,)}]__.yaml').data)
          .to.deep.equal(helper.dereferenced.specialCharacters);
      });
  });
});
