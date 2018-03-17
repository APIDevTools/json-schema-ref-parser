describe('HTTP options', function () {
  'use strict';

  var windowOnError, testDone;

  beforeEach(function () {
    // Some browsers throw global errors on XHR errors
    windowOnError = global.onerror;
    global.onerror = function () {
      testDone();
      return true;
    };
  });

  afterEach(function () {
    global.onerror = windowOnError;
  });

  describe('http.headers', function () {
    it('should override default HTTP headers', function (done) {
      testDone = done;
      var parser = new $RefParser();

      parser.parse('https://httpbin.org/headers', {
        resolve: { http: { headers: {
          accept: 'application/json'
        }}}
      })
        .then(function (schema) {
          expect(schema.headers).to.have.property('Accept', 'application/json');
          done();
        })
        .catch(done);
    });

    // Old versions of IE don't allow setting custom headers
    if (!userAgent.isOldIE) {
      it('should set custom HTTP headers', function (done) {
        testDone = done;
        var parser = new $RefParser();

        parser.parse('https://httpbin.org/headers', {
          resolve: { http: { headers: {
            'my-custom-header': 'hello, world'
          }}}
        })
          .then(function (schema) {
            expect(schema.headers).to.have.property('My-Custom-Header', 'hello, world');
            done();
          })
          .catch(done);
      });
    }
  });

  describe('http.redirect', function () {
    if (userAgent.isKarma) {
      // These tests fail in Safari when running on Sauce Labs (they pass when running on Safari locally).
      // It gets an XHR error when trying to reach httpbin.org.
      // TODO: Only skip these tests on Safari on Sauce Labs
      return;
    }

    beforeEach(function () {
      // Increase the timeout for these tests, to allow for multiple redirects
      this.currentTest.timeout(30000);
      this.currentTest.slow(3000);
    });

    it('should follow 5 redirects by default', function (done) {
      testDone = done;
      var parser = new $RefParser();

      parser.parse('https://httpbin.org/redirect/5')
        .then(function (schema) {
          expect(schema.url).to.equal('https://httpbin.org/get');
          done();
        })
        .catch(done);
    });

    it('should not follow 6 redirects by default', function (done) {
      testDone = done;
      var parser = new $RefParser();

      parser.parse('https://httpbin.org/redirect/6')
        .then(function (schema) {
          if (userAgent.isNode) {
            throw new Error('All 6 redirects were followed. That should NOT have happened!');
          }
          else {
            // Some web browsers will automatically follow redirects.
            // Nothing we can do about that.
            expect(schema.url).to.equal('https://httpbin.org/get');
            done();
          }
        })
        .catch(function (err) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('Error downloading https://httpbin.org/redirect/6');
          if (userAgent.isNode) {
            expect(err.message).to.equal(
              'Error downloading https://httpbin.org/redirect/6. \n' +
              'Too many redirects: \n' +
              '  https://httpbin.org/redirect/6 \n' +
              '  https://httpbin.org/relative-redirect/5 \n' +
              '  https://httpbin.org/relative-redirect/4 \n' +
              '  https://httpbin.org/relative-redirect/3 \n' +
              '  https://httpbin.org/relative-redirect/2 \n' +
              '  https://httpbin.org/relative-redirect/1'
            );
          }
          done();
        })
        .catch(done);
    });

    it('should follow 10 redirects if http.redirects = 10', function (done) {
      testDone = done;
      var parser = new $RefParser();

      parser.parse('https://httpbin.org/redirect/10', {
        resolve: { http: { redirects: 10 }}
      })
        .then(function (schema) {
          expect(schema.url).to.equal('https://httpbin.org/get');
          done();
        })
        .catch(done);
    });

    it('should not follow any redirects if http.redirects = 0', function (done) {
      testDone = done;
      var parser = new $RefParser();

      parser.parse('https://httpbin.org/redirect/1', {
        resolve: { http: { redirects: 0 }}
      })
        .then(function (schema) {
          if (userAgent.isNode) {
            throw new Error('The redirect was followed. That should NOT have happened!');
          }
          else {
          // Some web browsers will automatically follow redirects.
          // Nothing we can do about that.
            expect(schema.url).to.equal('https://httpbin.org/get');
            done();
          }
        })
        .catch(function (err) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('Error downloading https://httpbin.org/redirect/1');
          if (userAgent.isNode) {
            expect(err.message).to.equal(
              'Error downloading https://httpbin.org/redirect/1. \n' +
            'Too many redirects: \n' +
            '  https://httpbin.org/redirect/1'
            );
          }
          done();
        })
        .catch(done);
    });
  });

  describe('http.withCredentials', function () {
    it('should work by default with CORS "Access-Control-Allow-Origin: *"', function (done) {
      testDone = done;
      var parser = new $RefParser();

      // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
      // This should work by-default.
      parser.parse('http://petstore.swagger.io:80/v2/swagger.json')
        .then(function (schema) {
          expect(schema).to.be.an('object');
          expect(schema).not.to.be.empty;
          expect(parser.schema).to.equal(schema);
          done();
        })
        .catch(done);
    });

    it('should download successfully with http.withCredentials = false (default)', function (done) {
      testDone = done;
      var parser = new $RefParser();

      // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
      // So, withCredentials MUST be false (this is the default, but we're testing it explicitly here)
      parser.parse('http://petstore.swagger.io:80/v2/swagger.json', {
        resolve: { http: { withCredentials: false }}
      })
        .then(function (schema) {
          expect(schema).to.be.an('object');
          expect(schema).not.to.be.empty;
          expect(parser.schema).to.equal(schema);
          done();
        })
        .catch(done);
    });

    if (userAgent.isBrowser) {
      it('should throw error in browser if http.withCredentials = true', function (done) {
        testDone = done;
        var parser = new $RefParser();

        // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
        // So, withCredentials MUST be false (this is the default, but we're testing it explicitly here)
        parser.parse('http://petstore.swagger.io:80/v2/swagger.json', {
          resolve: { http: { withCredentials: true }}
        })
          .then(function (schema) {
          // The request succeeded, which means this browser doesn't support CORS.
            expect(schema).to.be.an('object');
            expect(schema).not.to.be.empty;
            expect(parser.schema).to.equal(schema);
            done();
          })
          .catch(function (err) {
          // The request failed, which is expected
            expect(err.message).to.contain('Error downloading http://petstore.swagger.io:80/v2/swagger.json');
            done();
          });
      });
    }
  });
});
