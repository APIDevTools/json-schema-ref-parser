'use strict';

var isNode = typeof(window) === 'undefined';

var helper = {
  isNode: isNode,
  isBrowser: !isNode,
  cwd: cwd(),
  relPath: relPath,
  absPath: absPath
};

if (helper.isNode) {
  module.exports = helper;
}
else if (helper.isBrowser) {
  // Fake `require()` for browsers
  window.require = function(name) {
    if (~name.indexOf('../')) { return window.$RefParser; }
    if (~name.indexOf('./helper')) { return helper; }
    return window[name];
  }
}

/**
 * Set global settings for all tests
 */
beforeEach(function() {
  this.currentTest.timeout(2000);
  this.currentTest.slow(100);
});

/**
 * Returns the absolute path of the "tests" directory
 */
function cwd() {
  if (isNode) {
    return __dirname;
  }
  else {
    var __filename = document.querySelector('script[src*="helper.js"]').src;
    return __filename.substr(0, __filename.lastIndexOf('/'));
  }
}

/**
 * Returns the relative path of a file in the "tests/files" directory
 *
 * NOTE: When running in a test-runner (such as Karma) the absolute path is returned instead
 */
function relPath(file) {
  if (helper.isNode) {
    // Return the relative path from the project root
    return require('path').join('tests', 'files', file);
  }

  // Encode special characters in paths when running in a browser
  file = encodeURIComponent(file).split('%2F').join('/');

  if (window.location.href.indexOf(helper.cwd) === 0) {
    // Return the relative path from "/tests/index.html"
    return 'files/' + file;
  }

  // We're running in a test-runner (such as Karma), so return an absolute path,
  // since we don't know the relative path of the "files" directory.
  return helper.cwd.replace(/^https?:\/\/[^\/]+(\/.*)/, '$1/files/' + file);
}

/**
 * Returns the absolute path of a file in the "tests/files" directory
 */
function absPath(file) {
  if (helper.isNode) {
    return path.join(__dirname, 'files', file || '/');
  }
  else {
    return helper.cwd + '/files/' + file;
  }
}
