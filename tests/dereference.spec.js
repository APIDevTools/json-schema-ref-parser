'use strict';

var $RefParser = require('../'),
    helper     = require('./helper'),
    expect     = require('chai').expect;

describe('Dereferencing', function() {
  it('should support circular $refs',
    function(done) {
      var parser = new $RefParser();
      parser.dereference(helper.relPath('external-refs.yaml'))
        .then(function(schema) {
          expect(schema).to.be.an('object').and.not.empty;
          expect(schema).to.equal(parser.schema);
          expect(parser.$refs).to.be.an('object');
          done();
        })
        .catch(done);
    }
  );
});
