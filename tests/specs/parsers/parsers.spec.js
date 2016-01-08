'use strict';

describe.skip('References to non-JSON files', function() {
  it('should parse successfully', function() {
    return $RefParser
      .parse(path.rel('specs/parsers/parsers.yaml'))
      .then(function(schema) {
        expect(schema).to.deep.equal(helper.parsed.parsers.schema);
      });
  });

  it('should resolve successfully', helper.testResolve(
    path.rel('specs/parsers/parsers.yaml'),
    path.abs('specs/parsers/parsers.yaml'), helper.parsed.parsers.schema,
    path.abs('specs/parsers/files/blank'), helper.parsed.parsers.blank,
    path.abs('specs/parsers/files/text.txt'), helper.parsed.parsers.text,
    path.abs('specs/parsers/files/page.html'), helper.parsed.parsers.html,
    path.abs('specs/parsers/files/binary.png'), helper.parsed.parsers.binary
  ));

  it('should dereference successfully', function() {
    return $RefParser
      .dereference(path.rel('specs/parsers/parsers.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);

        schema.definitions.html = helper.convertNodeBuffersToPOJOs(schema.definitions.html);
        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        expect(schema).to.deep.equal(helper.dereferenced.parsers);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it('should bundle successfully', function() {
    return $RefParser
      .bundle(path.rel('specs/parsers/parsers.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);

        schema.definitions.html = helper.convertNodeBuffersToPOJOs(schema.definitions.html);
        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        expect(schema).to.deep.equal(helper.dereferenced.parsers);
      });
  });
});
