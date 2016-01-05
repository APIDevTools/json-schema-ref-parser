'use strict';

describe('Caching options', function() {
  it('should only cache the main file when calling `parse()`', function() {
    var parser = new $RefParser();
    return parser
      .parse(path.abs('specs/external/external.yaml'))
      .then(function(schema) {
        var cache = parser.$refs.paths();
        expect(cache).to.have.same.members([
          path.abs('specs/external/external.yaml')
        ]);
      });
  });

  it('should cache all files when calling `resolve()`', function() {
    var parser = new $RefParser();
    return parser
      .resolve(path.abs('specs/external/external.yaml'))
      .then(function($refs) {
        expect($refs).to.equal(parser.$refs);

        var cache = $refs.paths();
        expect(cache).to.have.same.members([
          path.abs('specs/external/external.yaml'),
          path.abs('specs/external/definitions/definitions.json'),
          path.abs('specs/external/definitions/name.yaml'),
          path.abs('specs/external/definitions/required-string.yaml')
        ]);
      });
  });

  it('should not be expired yet', function() {
    return $RefParser
      .resolve(path.abs('specs/external/external.yaml'))
      .then(function($refs) {
        $refs.paths().forEach(function(path) {
          expect($refs.isExpired(path)).to.be.false;
        });
      });
  });

  it('should not expire if the cache duration is set to zero', function(done) {
    $RefParser
      .resolve(path.abs('specs/external/external.yaml'), {cache: {fs: 0, http: 0, https: 0}})
      .then(function($refs) {
        setTimeout(function() {
          $refs.paths().forEach(function(path) {
            expect($refs.isExpired(path)).to.be.false;
          });
          done();
        }, 1000);
      });
  });

  it('should expire after 1 second', function(done) {
    $RefParser
      .resolve(path.abs('specs/external/external.yaml'), {cache: {fs: 1, http: 1, https: 1}})
      .then(function($refs) {
        setTimeout(function() {
          $refs.paths().forEach(function(path) {
            expect($refs.isExpired(path)).to.be.true;
          });
          done();
        }, 1000);
      });
  });

});
