'use strict';

describe('Dereferencing', function() {
  it('should support circular $refs',
    function(done) {
      var parser = new $RefParser();
      parser.dereference(helper.relPath('circular-external-refs.yaml'))
        .then(function(schema) {
          expect(schema).to.be.an('object').and.not.empty;
          expect(schema).to.equal(parser.schema);
          expect(parser.$refs).to.be.an('object');

          var keys = parser.$refs.keys();
          expect(keys).to.satisfy(arrayOfStrings);
          if (userAgent.isBrowser) {
            expect(parser.$refs.urlKeys()).to.deep.equal(keys);
          }
          else {
            expect(parser.$refs.fileKeys()).to.deep.equal(keys);
          }

          done();
        })
        .catch(done);
    }
  );
});

function arrayOfStrings(array) {
  expect(array).to.be.an('array').with.length.above(0);
  for (var i = 0; i < array.length; i++) {
    expect(array[i]).to.be.a('string');
  }
  return true;
}
