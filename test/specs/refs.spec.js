describe('$Refs object', function () {
  'use strict';

  describe('paths', function () {
    it('should only contain the main file when calling `parse()`', function () {
      var parser = new $RefParser();
      return parser
        .parse(path.abs('specs/external/external.yaml'))
        .then(function (schema) {
          var paths = parser.$refs.paths();
          expect(paths).to.have.same.members([
            path.abs('specs/external/external.yaml')
          ]);
        });
    });

    it('should contain all files when calling `resolve()`', function () {
      var parser = new $RefParser();
      return parser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          expect($refs).to.equal(parser.$refs);

          var paths = $refs.paths();
          expect(paths).to.have.same.members([
            path.abs('specs/external/external.yaml'),
            path.abs('specs/external/definitions/definitions.json'),
            path.abs('specs/external/definitions/name.yaml'),
            path.abs('specs/external/definitions/required-string.yaml')
          ]);
        });
    });

    it('should return only local files', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          var paths = $refs.paths('file');
          if (host.node) {
            expect(paths).to.have.same.members([
              path.abs('specs/external/external.yaml'),
              path.abs('specs/external/definitions/definitions.json'),
              path.abs('specs/external/definitions/name.yaml'),
              path.abs('specs/external/definitions/required-string.yaml')
            ]);
          }
          else {
            expect(paths).to.be.an('array').with.lengthOf(0);
          }
        });
    });

    it('should return only URLs', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          var paths = $refs.paths(['http']);
          if (host.browser) {
            expect(paths).to.have.same.members([
              path.url('specs/external/external.yaml'),
              path.url('specs/external/definitions/definitions.json'),
              path.url('specs/external/definitions/name.yaml'),
              path.url('specs/external/definitions/required-string.yaml')
            ]);
          }
          else {
            expect(paths).to.be.an('array').with.lengthOf(0);
          }
        });
    });
  });

  describe('values', function () {
    it('should be the same as `toJSON()`', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          expect($refs.values).to.equal($refs.toJSON);
        });
    });

    it('should return the paths and values of all resolved files', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          var expected = {};
          expected[path.abs('specs/external/external.yaml')] = helper.parsed.external.schema;
          expected[path.abs('specs/external/definitions/definitions.json')] = helper.parsed.external.definitions;
          expected[path.abs('specs/external/definitions/name.yaml')] = helper.parsed.external.name;
          expected[path.abs('specs/external/definitions/required-string.yaml')] = helper.parsed.external.requiredString;

          var values = $refs.values();
          expect(values).to.deep.equal(expected);
        });
    });

    it('should return the paths and values of all dereferenced files', function () {
      var parser = new $RefParser();
      return parser
        .dereference(path.abs('specs/external/external.yaml'))
        .then(function () {
          var expected = {};
          expected[path.abs('specs/external/external.yaml')] = helper.dereferenced.external;
          expected[path.abs('specs/external/definitions/definitions.json')] = helper.dereferenced.external.definitions;
          expected[path.abs('specs/external/definitions/name.yaml')] = helper.dereferenced.external.definitions.name;
          expected[path.abs('specs/external/definitions/required-string.yaml')] = helper.dereferenced.external.definitions['required string'];

          var values = parser.$refs.values();
          expect(values).to.deep.equal(expected);
        });
    });

    it('should return the paths and values of all bundled files', function () {
      var parser = new $RefParser();
      return parser
        .bundle(path.abs('specs/external/external.yaml'))
        .then(function () {
          var expected = {};
          expected[path.abs('specs/external/external.yaml')] = helper.bundled.external;
          expected[path.abs('specs/external/definitions/definitions.json')] = helper.bundled.external.definitions;
          expected[path.abs('specs/external/definitions/name.yaml')] = helper.bundled.external.definitions.name;
          expected[path.abs('specs/external/definitions/required-string.yaml')] = helper.bundled.external.definitions['required string'];

          var values = parser.$refs.values();
          expect(values).to.deep.equal(expected);
        });
    });

    it('should return only local files and values', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          var values = $refs.values('file');
          if (host.node) {
            var expected = {};
            expected[path.abs('specs/external/external.yaml')] = helper.parsed.external.schema;
            expected[path.abs('specs/external/definitions/definitions.json')] = helper.parsed.external.definitions;
            expected[path.abs('specs/external/definitions/name.yaml')] = helper.parsed.external.name;
            expected[path.abs('specs/external/definitions/required-string.yaml')] = helper.parsed.external.requiredString;

            values = $refs.values();
            expect(values).to.deep.equal(expected);
          }
          else {
            expect(values).to.be.an('object').and.empty;
          }
        });
    });

    it('should return only URLs and values', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          var values = $refs.values(['http']);
          if (host.browser) {
            var expected = {};
            expected[path.url('specs/external/external.yaml')] = helper.parsed.external.schema;
            expected[path.url('specs/external/definitions/definitions.json')] = helper.parsed.external.definitions;
            expected[path.url('specs/external/definitions/name.yaml')] = helper.parsed.external.name;
            expected[path.url('specs/external/definitions/required-string.yaml')] = helper.parsed.external.requiredString;

            values = $refs.values();
            expect(values).to.deep.equal(expected);
          }
          else {
            expect(values).to.be.an('object').and.empty;
          }
        });
    });
  });

  describe('exists', function () {
    it('should work with absolute paths', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          expect($refs.exists(path.abs('specs/external/external.yaml'))).to.be.true;
          expect($refs.exists(path.abs('specs/external/definitions/definitions.json'))).to.be.true;
          expect($refs.exists(path.abs('specs/external/definitions/name.yaml'))).to.be.true;
          expect($refs.exists(path.abs('specs/external/definitions/required-string.yaml'))).to.be.true;
        });
    });

    it('should work with relative paths', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          expect($refs.exists('external.yaml')).to.be.true;
          expect($refs.exists('definitions/definitions.json')).to.be.true;
          expect($refs.exists('definitions/name.yaml')).to.be.true;
          expect($refs.exists('definitions/required-string.yaml')).to.be.true;
        });
    });

    it('should return false if the $ref does not exist', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          expect($refs.exists('foo bar')).to.be.false;
        });
    });
  });

  describe('get', function () {
    it('should work with absolute paths', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          expect($refs.get(path.abs('specs/external/external.yaml'))).to.deep.equal(helper.parsed.external.schema);
          expect($refs.get(path.abs('specs/external/definitions/definitions.json'))).to.deep.equal(helper.parsed.external.definitions);
          expect($refs.get(path.abs('specs/external/definitions/name.yaml'))).to.deep.equal(helper.parsed.external.name);
          expect($refs.get(path.abs('specs/external/definitions/required-string.yaml'))).to.deep.equal(helper.parsed.external.requiredString);
        });
    });

    it('should work with relative paths', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          expect($refs.get('external.yaml')).to.deep.equal(helper.parsed.external.schema);
          expect($refs.get('definitions/definitions.json')).to.deep.equal(helper.parsed.external.definitions);
          expect($refs.get('definitions/name.yaml')).to.deep.equal(helper.parsed.external.name);
          expect($refs.get('definitions/required-string.yaml')).to.deep.equal(helper.parsed.external.requiredString);
        });
    });

    it('should get the entire file if there is no hash', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          var value = $refs.get('definitions/name.yaml');
          expect(value).to.deep.equal(helper.parsed.external.name);
        });
    });

    it('should get the entire file if the hash is empty', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          var value = $refs.get('definitions/name.yaml#');
          expect(value).to.deep.equal(helper.parsed.external.name);
        });
    });

    it('should try to get an empty key if the hash is "#/"', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          $refs.get('definitions/name.yaml#/');
        })
        .then(helper.shouldNotGetCalled)
        .catch(function (err) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal(
            'Error resolving $ref pointer "definitions/name.yaml#/". ' +
            '\nToken "" does not exist.'
          );
        });
    });

    it('should resolve values across multiple files if necessary', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          expect($refs.get('external.yaml#/properties/name/properties/first')).to.deep.equal({
            title: 'required string',
            type: 'string',
            minLength: 1
          });
          expect($refs.get('external.yaml#/properties/name/properties/first/title')).to.equal('required string');
        });
    });

    it('should throw an error if the file does not exist', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          $refs.get('foo-bar.yaml#/some/value');
        })
        .then(helper.shouldNotGetCalled)
        .catch(function (err) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('Error resolving $ref pointer "foo-bar.yaml#/some/value".');
          expect(err.message).to.contain('foo-bar.yaml" not found.');
        });
    });

    it('should throw an error if the JSON Pointer path does not exist', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          $refs.get('external.yaml#/foo/bar');
        })
        .then(helper.shouldNotGetCalled)
        .catch(function (err) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal(
            'Error resolving $ref pointer "external.yaml#/foo/bar". ' +
            '\nToken "foo" does not exist.'
          );
        });
    });
  });

  describe('set', function () {
    it('should work with absolute paths', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          var $ref = path.abs('specs/external/external.yaml') + '#/properties/name';
          $refs.set($ref, { foo: 'bar' });
          expect($refs.get('external.yaml#/properties/name')).to.deep.equal({ foo: 'bar' });
        });
    });

    it('should work with relative paths', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          $refs.set('external.yaml#/properties/name', { foo: 'bar' });
          expect($refs.get('external.yaml#/properties/name')).to.deep.equal({ foo: 'bar' });
        });
    });

    it('should resolve values across multiple files if necessary', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          $refs.set('external.yaml#/properties/name/properties/first/title', 'foo bar');
          expect($refs.get('external.yaml#/properties/name/properties/first/title')).to.equal('foo bar');
        });
    });

    it('should throw an error if the file does not exist', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          $refs.set('foo-bar.yaml#/some/path', 'some value');
        })
        .then(helper.shouldNotGetCalled)
        .catch(function (err) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('Error resolving $ref pointer "foo-bar.yaml#/some/path".');
          expect(err.message).to.contain('foo-bar.yaml" not found.');
        });
    });

    it('should NOT throw an error if the JSON Pointer path does not exist (it creates the new value instead)', function () {
      return $RefParser
        .resolve(path.abs('specs/external/external.yaml'))
        .then(function ($refs) {
          $refs.set('external.yaml#/foo/bar/baz', { hello: 'world' });
          expect($refs.get('external.yaml#/foo/bar/baz')).to.deep.equal({ hello: 'world' });
        });
    });
  });

});
