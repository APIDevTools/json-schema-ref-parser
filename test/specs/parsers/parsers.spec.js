'use strict';

describe('References to non-JSON files', function() {
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
      .dereference(path.rel('specs/parsers/parsers.yaml'), {
        parse: {
          // Disable the text parser
          text: false,

          // Parse all non-YAML files as binary
          binary: {
            canParse: function(file) {
              return file.url.substr(-5) !== '.yaml';
            }
          }
        }
      })
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
      .then(
        helper.shouldNotGetCalled,
        function(err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain('Error parsing ');
        });
  });

  it('should use a custom parser with static values', function() {
    return $RefParser
      .dereference(path.rel('specs/parsers/parsers.yaml'), {
        parse: {
          // A custom parser that always returns the same value
          staticParser: {
            order: 201,
            canParse: true,
            parse: 'The quick brown fox jumped over the lazy dog'
          }
        }
      })
      .then(function(schema) {
        expect(schema).to.deep.equal(helper.dereferenced.parsers.staticParser);
      });
  });

  it('should use a custom parser that returns a value', function() {
    return $RefParser
      .dereference(path.rel('specs/parsers/parsers.yaml'), {
        parse: {
          // A custom parser that returns the contents of ".foo" files, in reverse
          reverseFooParser: {
            canParse: function(file) {
              return file.url.substr(-4) === '.foo';
            },

            parse: function(file) {
              return file.data.toString().split('').reverse().join('');
            }
          }
        }
      })
      .then(function(schema) {
        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        expect(schema).to.deep.equal(helper.dereferenced.parsers.customParser);
      });
  });

  it('should use a custom parser that calls a callback', function() {
    return $RefParser
      .dereference(path.rel('specs/parsers/parsers.yaml'), {
        parse: {
          // A custom parser that returns the contents of ".foo" files, in reverse
          reverseFooParser: {
            canParse: /\.FOO$/i,

            parse: function(file, callback) {
              var reversed = file.data.toString().split('').reverse().join('');
              callback(null, reversed);
            }
          }
        }
      })
      .then(function(schema) {
        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        expect(schema).to.deep.equal(helper.dereferenced.parsers.customParser);
      });
  });

  it('should use a custom parser that returns a promise', function() {
    return $RefParser
      .dereference(path.rel('specs/parsers/parsers.yaml'), {
        parse: {
          // A custom parser that returns the contents of ".foo" files, in reverse
          reverseFooParser: {
            canParse: ['.foo'],

            parse: function(file) {
              return new Promise(function(resolve, reject) {
                var reversed = file.data.toString().split('').reverse().join('');
                resolve(reversed);
              });
            }
          }
        }
      })
      .then(function(schema) {
        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        expect(schema).to.deep.equal(helper.dereferenced.parsers.customParser);
      });
  });

  it('should continue parsing if a custom parser fails', function() {
    return $RefParser
      .dereference(path.rel('specs/parsers/parsers.yaml'), {
        parse: {
          // A custom parser that always fails,
          // so the built-in parsers will be used as a fallback
          badParser: {
            order: 1,

            canParse: /\.(md|html|css|png)$/i,

            parse: function(file, callback) {
              callback('BOMB!!!');
            }
          }
        }
      })
      .then(function(schema) {
        schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
        expect(schema).to.deep.equal(helper.dereferenced.parsers.defaultParsers);
      });
  });

});
