describe('Callback & Promise syntax', function () {
  'use strict';

  ['parse', 'resolve', 'dereference', 'bundle'].forEach(function (method) {
    describe(method + ' method', function () {
      it('should call the callback function upon success', testCallbackSuccess(method));
      it('should call the callback function upon failure', testCallbackError(method));
      it('should resolve the Promise upon success', testPromiseSuccess(method));
      it('should reject the Promise upon failure', testPromiseError(method));
    });
  });

  function testCallbackSuccess (method) {
    return function (done) {
      var parser = new $RefParser();
      parser[method](path.rel('specs/internal/internal.yaml'), function (err, result) {
        try {
          expect(err).to.be.null;
          expect(result).to.be.an('object').and.ok;

          if (method === 'resolve') {
            expect(result).to.equal(parser.$refs);
          }
          else {
            expect(result).to.equal(parser.schema);
          }
          done();
        }
        catch (e) {
          done(e);
        }
      });
    };
  }

  function testCallbackError (method) {
    return function (done) {
      $RefParser[method](path.rel('specs/invalid/invalid.yaml'), function (err, result) {
        try {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(result).to.be.undefined;
          done();
        }
        catch (e) {
          done(e);
        }
      });
    };
  }

  function testPromiseSuccess (method) {
    return function () {
      var parser = new $RefParser();
      return parser[method](path.rel('specs/internal/internal.yaml'))
        .then(function (result) {
          expect(result).to.be.an('object').and.ok;

          if (method === 'resolve') {
            expect(result).to.equal(parser.$refs);
          }
          else {
            expect(result).to.equal(parser.schema);
          }
        });
    };
  }

  function testPromiseError (method) {
    return function () {
      return $RefParser[method](path.rel('specs/invalid/invalid.yaml'))
        .then(helper.shouldNotGetCalled)
        .catch(function (err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
        });
    };
  }
});

