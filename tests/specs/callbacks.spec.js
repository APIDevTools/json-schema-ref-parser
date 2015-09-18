'use strict';

describe('Callback & Promise syntax', function() {
  // NOTE: This delay is so high because TravisCI and SauceLabs,
  // both of which are VERY SLOW
  var delay = global.__karma__ ? 2000 : 200;

  beforeEach(function() {
    // These tests all have a delay, to ensure that all callbacks and promises are called.
    // So we need to increase the test timeouts
    this.currentTest.timeout(delay * 2);
    this.currentTest.slow(delay * 2 + 50);
  });

  ['parse', 'resolve', 'dereference', 'bundle'].forEach(function(method) {
    describe(method + ' method', function() {
      it('should call the callback function and Promise.then()', testCallbackAndPromise_Success(method));
      it('should call the callback function and Promise.catch()', testCallbackAndPromise_Error(method));
    });
  });

  /**
   * Calls the specified $RefParser method, and asserts that the callback function
   * is called without an error, and that Promise.then() is fired.
   */
  function testCallbackAndPromise_Success(method) {
    return function(done) {
      var callbackFn = sinon.spy();
      var thenFn = sinon.spy();
      var catchFn = sinon.spy();

      var parser = new $RefParser();
      parser[method](path.rel('specs/internal/internal.yaml'), callbackFn)
        .then(thenFn)
        .catch(catchFn);

      setTimeout(function() {
        try {
          var result = method === 'resolve' ? parser.$refs : parser.schema;
          var schema = method === 'resolve' ? helper.parsed.internal : helper[method + 'd'].internal;

          expect(parser.schema).to.deep.equal(schema);
          expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/internal/internal.yaml')]);

          sinon.assert.calledOnce(callbackFn);
          sinon.assert.calledWithExactly(callbackFn, null, result);

          sinon.assert.calledOnce(thenFn);
          sinon.assert.calledWithExactly(thenFn, result);

          sinon.assert.notCalled(catchFn);

          done();
        }
        catch (e) {
          done(e)
        }
      }, delay);
    }
  }

  /**
   * Calls the specified $RefParser method, and asserts that the callback function
   * is called with an error, and that Promise.catch() is fired.
   */
  function testCallbackAndPromise_Error(method) {
    return function(done) {
      var callbackFn = sinon.spy();
      var thenFn = sinon.spy();
      var catchFn = sinon.spy();

      var parser = new $RefParser();
      parser[method](path.rel('specs/invalid/invalid.yaml'), callbackFn)
        .then(thenFn)
        .catch(catchFn);

      setTimeout(function() {
        try {
          var result = method === 'resolve' ? parser.$refs : parser.schema;

          expect(parser.schema).to.be.null;
          expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/invalid/invalid.yaml')]);

          sinon.assert.calledOnce(callbackFn);
          sinon.assert.calledWithExactly(callbackFn, sinon.match.instanceOf(SyntaxError), result);

          sinon.assert.calledOnce(catchFn);
          sinon.assert.calledWithExactly(catchFn, sinon.match.instanceOf(SyntaxError));

          sinon.assert.notCalled(thenFn);

          done();
        }
        catch (e) {
          done(e)
        }
      }, delay);
    }
  }
});
