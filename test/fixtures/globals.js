/**
 * This script exposes everything as globals, to allow tests to run in Node and in browsers.
 *
 * Why not use Browserify instead of globals?
 *  - To make sure Json Schema Ref Parser works properly when Node and CommonJS are not available
 *  - Some of our devDependencies have separate packages packages for Node vs. Browser (e.g. Mocha, Sinon)
 *  - This reduces redundant boilerplate code in the .spec files
 */
(function() {
  'use strict';

  if (typeof(window) === 'object') {
    // Expose Browser globals
    window.global = window;
    window.expect = chai.expect;
    window.userAgent = {
      isNode: false,
      isBrowser: true,
      isOldIE: navigator.userAgent.indexOf('MSIE') >= 0,
      isKarma: !!window.__karma__
    };
  }
  else {
    // Expose Node globals
    global.$RefParser = require('../../');
    global.expect = require('chai').expect;
    global.sinon = require('sinon');

    global.userAgent = {
      isNode: true,
      isOldNode: /^v0\./.test(process.version),
      isBrowser: false,
      isTravisCI: !!process.env.TRAVIS
    };
  }

})();
