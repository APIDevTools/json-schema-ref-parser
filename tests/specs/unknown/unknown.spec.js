'use strict';

describe('Schema with $refs to unknown file types', function() {
  it('should parse successfully', function(done) {
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

  it('should resolve successfully', helper.testResolve(
    'specs/unknown/unknown.yaml', helper.parsed.unknown.schema,
    'specs/unknown/files/blank', helper.parsed.unknown.blank,
    'specs/unknown/files/text.txt', helper.parsed.unknown.text,
    'specs/unknown/files/page.html', helper.parsed.unknown.html,
    'specs/unknown/files/binary.png', helper.parsed.unknown.binary
  ));

  it('should dereference successfully', function(done) {
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
