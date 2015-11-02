'use strict';

describe('parse from CORS with Access-Control-Allow-Origin: *', function() {
  var windowOnError, testDone;

  beforeEach(function() {
    windowOnError = global.onerror;
    global.onerror = function() {
      testDone();
      return true;
    }
  });

  afterEach(function() {
    global.onerror = windowOnError;
  });

  it('should parse successfully with http.withCredentials = false', function() {
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
    it('should throw error in browser if http.withCredentials = true (default)', function(done) {
      testDone = done;
      var parser = new $RefParser();
      return parser
        .parse('http://petstore.swagger.io:80/v2/swagger.json', {
          http: { withCredentials: true }
        })
        .then(helper.shouldNotGetCalled)
        .catch(function(err) {
          expect(err.message).to.contain('Error downloading file');
          done();
        });
    });
  }
});
