/**
 * This script exposes everything as globals, to allow tests to run in Node and in browsers.
 *
 * Why not use Browserify instead of globals?
 *  - To make sure Json Schema Ref Parser works properly when Node and CommonJS are not available
 *  - Some of our devDependencies have separate packages packages for Node vs. Browser (e.g. Mocha, Sinon)
 *  - This reduces redundant boilerplate code in the .spec files
 */
(function () {
  "use strict";

  if (host.browser) {
    // Expose Browser globals
    host.global.expect = chai.expect;
  }
  else {
    // Expose Node globals
    host.global.$RefParser = require("../../");
    host.global.expect = require("chai").expect;
  }

}());
