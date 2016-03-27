'use strict';

describe.only('References to non-JSON files', function() {
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
    path.abs('specs/parsers/files/README.md'), helper.dereferenced.parsers.defaultParsers.definitions.markdown,
    path.abs('specs/parsers/files/page.html'), helper.dereferenced.parsers.defaultParsers.definitions.html,
    path.abs('specs/parsers/files/style.css'), helper.dereferenced.parsers.defaultParsers.definitions.css,
    path.abs('specs/parsers/files/binary.png'), helper.dereferenced.parsers.defaultParsers.definitions.binary,
    path.abs('specs/parsers/files/unknown.foo'), helper.dereferenced.parsers.defaultParsers.definitions.unknown,
    path.abs('specs/parsers/files/empty'), helper.dereferenced.parsers.defaultParsers.definitions.empty
  ));

  it('should dereference successfully', function() {
    var parser = new $RefParser();
    return parser
      .dereference(path.rel('specs/parsers/parsers.yaml'))
      .then(function(schema) {
        expect(schema).to.equal(parser.schema);

        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        expect(schema).to.deep.equal(helper.dereferenced.parsers.defaultParsers);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it('should bundle successfully', function() {
    return $RefParser
      .bundle(path.rel('specs/parsers/parsers.yaml'))
      .then(function(schema) {
        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        expect(schema).to.deep.equal(helper.dereferenced.parsers.defaultParsers);
      });
  });

  it('should parse text as binary if "parse.text" is disabled', function() {
    return $RefParser
      .dereference(path.rel('specs/parsers/parsers.yaml'), {parse: {text: false, binary: {ext: ''}}})
      .then(function(schema) {
        schema.definitions.markdown = helper.convertNodeBuffersToPOJOs(schema.definitions.markdown);
        schema.definitions.html = helper.convertNodeBuffersToPOJOs(schema.definitions.html);
        schema.definitions.css = helper.convertNodeBuffersToPOJOs(schema.definitions.css);
        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        schema.definitions.unknown = helper.convertNodeBuffersToPOJOs(schema.definitions.unknown);
        schema.definitions.empty = helper.convertNodeBuffersToPOJOs(schema.definitions.empty);
        expect(schema).to.deep.equal(helper.dereferenced.parsers.binaryParser);
      });
  });

  it('should throw an error if "parse.text" and "parse.binary" are disabled', function() {
    return $RefParser
      .dereference(path.rel('specs/parsers/parsers.yaml'), {parse: {text: false, binary: false}})
      .then(helper.shouldNotGetCalled)
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing ');
      });
  });

  it('should use a custom parser that returns a value', function() {
    // A custom parser that returns reversed strings
    function myCustomParser(data, path, options, callback) {
      return data.toString().split('').reverse().join('');
    }

    // This parser only parses .foo files
    myCustomParser.ext = '.foo';

    return $RefParser
      .dereference(path.rel('specs/parsers/parsers.yaml'), {parse: {custom: myCustomParser}})
      .then(function(schema) {
        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        expect(schema).to.deep.equal(helper.dereferenced.parsers.customParser);
      });
  });

  it('should use a custom parser that calls a callback', function() {
    // A custom parser that returns reversed strings
    function myCustomParser(data, path, options, callback) {
      var reversed = data.toString().split('').reverse().join('');
      callback(null, reversed);
    }

    // This parser only parses .foo files
    myCustomParser.ext = '.foo';

    return $RefParser
      .dereference(path.rel('specs/parsers/parsers.yaml'), {parse: {custom: myCustomParser}})
      .then(function(schema) {
        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        expect(schema).to.deep.equal(helper.dereferenced.parsers.customParser);
      });
  });

  it('should use a custom parser that returns a promise', function() {
    // A custom parser that returns reversed strings
    function myCustomParser(data, path, options) {
      return new Promise(function(resolve, reject) {
        var reversed = data.toString().split('').reverse().join('');
        resolve(reversed);
      });
    }

    // This parser parses .foo files and .bar files
    myCustomParser.ext = /\.(foo|bar)$/i;

    return $RefParser
      .dereference(path.rel('specs/parsers/parsers.yaml'), {parse: {custom: myCustomParser}})
      .then(function(schema) {
        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        expect(schema).to.deep.equal(helper.dereferenced.parsers.customParser);
      });
  });

  it('should continue parsing if a custom parser fails', function() {
    // A custom parser that always fails
    function myCustomParser(data, path, options, callback) {
      callback('BOMB!!!');  // Any truthy value is considered an error
    }

    // This parser runs first, before any other parser
    myCustomParser.order = 1;

    // This parser parses all file types
    myCustomParser.ext = ['.json', '.yaml', '.html', '.css', '.md', '.png'];

    return $RefParser
      .dereference(path.rel('specs/parsers/parsers.yaml'), {parse: {custom: myCustomParser}})
      .then(function(schema) {
        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        expect(schema).to.deep.equal(helper.dereferenced.parsers.defaultParsers);
      });
  });

});
