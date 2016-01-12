'use strict';

describe('options.resolve', function() {
  it('should not resolve external links if "resolve.external" is disabled', function() {
    return $RefParser
      .dereference(path.abs('specs/resolvers/resolvers.yaml'), {resolve: {external: false}})
      .then(function(schema) {
        expect(schema).to.deep.equal(helper.parsed.resolvers);
      });
  });

  it('should throw an error for unrecognized protocols', function() {
    return $RefParser
      .dereference(path.abs('specs/resolvers/resolvers.yaml'))
      .then(helper.shouldNotGetCalled)
      .catch(function(err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.equal('Unable to resolve $ref pointer "foo://bar.baz"');
      });
  });

  it('should use a custom resolver that calls a callback', function() {
    // A custom resolver for "foo://" URLs
    function myCustomResolver(path, options, callback) {
      if (path.substr(0, 6) === 'foo://') {
        // Resolve with a fake object
        callback(null, {
          bar: {
            baz: "hello world"
          }
        });
      }
      else {
        callback('Not a foo:// URL');   // <-- Any truthy value is treated as an error
      }
    }

    return $RefParser
      .dereference(path.abs('specs/resolvers/resolvers.yaml'), {resolve: {custom: myCustomResolver}})
      .then(function(schema) {
        expect(schema).to.deep.equal(helper.dereferenced.resolvers);
      });
  });

  it('should use a custom resolver that returns a promise', function() {
    // A custom resolver for "foo://" URLs
    function myCustomResolver(path, options) {
      return new Promise(function(resolve, reject) {
        if (path.substr(0, 6) === 'foo://') {
          // Resolve with a fake object
          resolve({
            bar: {
              baz: "hello world"
            }
          });
        }
        else {
          reject('Not a foo:// URL');   // <-- Any truthy value is treated as an error
        }
      });
    }

    return $RefParser
      .dereference(path.abs('specs/resolvers/resolvers.yaml'), {resolve: {custom: myCustomResolver}})
      .then(function(schema) {
        expect(schema).to.deep.equal(helper.dereferenced.resolvers);
      });
  });

});
