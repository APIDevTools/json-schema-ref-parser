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

  it('should use a custom resolver with static values', function() {
    return $RefParser
      .dereference(path.abs('specs/resolvers/resolvers.yaml'), {
        resolve: {
          // A custom resolver for "foo://" URLs
          foo: {
            canResolve: /^foo\:\/\//i,

            resolve: {bar: {baz: 'hello world'}}
          }
        }
      })
      .then(function(schema) {
        expect(schema).to.deep.equal(helper.dereferenced.resolvers);
      });
  });

  it('should use a custom resolver that returns a value', function() {
    return $RefParser
      .dereference(path.abs('specs/resolvers/resolvers.yaml'), {
        resolve: {
          // A custom resolver for "foo://" URLs
          foo: {
            canResolve: /^foo\:\/\//i,

            resolve: function(file) {
              return {bar: {baz: 'hello world'}};
            }
          }
        }
      })
      .then(function(schema) {
        expect(schema).to.deep.equal(helper.dereferenced.resolvers);
      });
  });

  it('should use a custom resolver that calls a callback', function() {
    return $RefParser
      .dereference(path.abs('specs/resolvers/resolvers.yaml'), {
        resolve: {
          // A custom resolver for "foo://" URLs
          foo: {
            canResolve: /^foo\:\/\//i,

            resolve: function(file, callback) {
              callback(null, {bar: {baz: 'hello world'}});
            }
          }
        }
      })
      .then(function(schema) {
        expect(schema).to.deep.equal(helper.dereferenced.resolvers);
      });
  });

  it('should use a custom resolver that returns a promise', function() {
    return $RefParser
    .dereference(path.abs('specs/resolvers/resolvers.yaml'), {
      resolve: {
        // A custom resolver for "foo://" URLs
        foo: {
          canResolve: /^foo\:\/\//i,

          resolve: function(file) {
            return Promise.resolve({bar: {baz: 'hello world'}});
          }
        }
      }
    })
      .then(function(schema) {
        expect(schema).to.deep.equal(helper.dereferenced.resolvers);
      });
  });

  it('should continue resolving if a custom resolver fails', function() {
    return $RefParser
    .dereference(path.abs('specs/resolvers/resolvers.yaml'), {
      resolve: {
        // A custom resolver that always fails
        badResolver: {
          order: 1,

          canResolve: true,

          resolve: function(file) {
            throw new Error('BOMB!!!');
          }
        },

        // A custom resolver for "foo://" URLs
        foo: {
          canResolve: /^foo\:\/\//i,

          resolve: {bar: {baz: 'hello world'}}
        }
      }
    })
      .then(function(schema) {
        expect(schema).to.deep.equal(helper.dereferenced.resolvers);
      });
  });

});
