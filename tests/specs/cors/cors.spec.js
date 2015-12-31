'use strict';

describe('CORS support', function() {
  it('should download successfully by default', function() {
    // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
    // This should work by-default.
    var parser = new $RefParser();
    return parser
      .parse('http://petstore.swagger.io:80/v2/swagger.json')
      .then(function(schema) {
        expect(schema).to.be.an('object');
        expect(schema).not.to.be.empty;
        expect(parser.schema).to.equal(schema);
      });
  });

  it('should download successfully with http.withCredentials = false (default)', function() {
    // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
    // So, withCredentials MUST be false (this is the default, but we're testing it explicitly here)
    var parser = new $RefParser();
    return parser
      .parse('http://petstore.swagger.io:80/v2/swagger.json', {
        http: { withCredentials: false }
      })
      .then(function(schema) {
        expect(schema).to.be.an('object');
        expect(schema).not.to.be.empty;
        expect(parser.schema).to.equal(schema);
      });
  });

  if (userAgent.isBrowser) {
    it('should throw error in browser if http.withCredentials = true', function() {
      // Some old Webkit browsers throw a global error
      var oldOnError = global.onerror;
      global.onerror = function() {
        global.onerror = oldOnError; // restore the original error handler (failsafe)
        return true;  // ignore the error
      };

      var parser = new $RefParser();
      return parser
        .parse('http://petstore.swagger.io:80/v2/swagger.json', {
          http: { withCredentials: true }
        })
        .catch(function(err) {
          // The request failed, which is expected
          expect(err.message).to.contain('Error downloading file');
        })
        .then(function(schema) {
          // The request succeeded, which means this browser doesn't support CORS.
          expect(schema).to.be.an('object');
          expect(schema).not.to.be.empty;
          expect(parser.schema).to.equal(schema);
        })
        .then(function() {
          // Restore the original error handler
          global.onerror = oldOnError;
        })
    });
  }
});
