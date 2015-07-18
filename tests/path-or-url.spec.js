'use strict';

var PathOrUrl = require('../lib/path-or-url'),
    helper    = require('./helper'),
    expect    = require('chai').expect;

describe('PathOrUrl', function() {
  it('testing...',
    function(done) {
      if (helper.isBrowser) {
        return done();
      }

      var cwd = PathOrUrl.cwd();
      console.log('\n====> cwd = %s\n', JSON.stringify(cwd, null, 2));

      var relPath = helper.relPath('circular-external-refs.yaml');
      var rel = new PathOrUrl(relPath + '?foo=ba r&biz=baz#/definitio??ns/#pet',
        {allowFileHash: true, allowFileQuery: true});
      console.log('\n====> rel = %s\n', JSON.stringify(rel, null, 2));

      rel = rel.toUrlString();
      console.log('\n====> url = %s\n', rel);
      done();
    }
  );
});
