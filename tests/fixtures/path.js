(function() {
  'use strict';

  var path = global.path = {};
  var _path = userAgent.isNode ? require('path') : null;
  var _testsDir = getTestsDir();

  /**
   * Returns the relative path of a file in the "tests" directory
   *
   * NOTE: When running in a test-runner (such as Karma) the absolute path is returned instead
   */
  path.rel = function(file) {
    if (userAgent.isNode) {
      // Return the relative path from the project root
      return _path.join('tests', file);
    }

    // Encode special characters in paths when running in a browser
    file = encodeFile(file);

    if (window.location.href.indexOf(_testsDir) === 0) {
      // Return the relative path from "/tests/index.html"
      return file;
    }

    // We're running in a test-runner (such as Karma), so return an absolute path,
    // since we don't know the relative path of the "tests" directory.
    return _testsDir.replace(/^https?:\/\/[^\/]+(\/.*)/, '$1' + file);
  };

  /**
   * Returns the absolute path of a file in the "tests" directory
   */
  path.abs = function(file) {
    if (userAgent.isNode) {
      return _path.join(_testsDir, file || '/');
    }
    else {
      return _testsDir + encodeFile(file);
    }
  };

  /**
   * Returns the path of the "tests" directory
   */
  function getTestsDir() {
    if (userAgent.isNode) {
      return _path.resolve('tests');
    }
    else {
      var filename = document.querySelector('script[src*="fixtures/helper.js"]').src;
      return filename.substr(0, filename.indexOf('fixtures/helper.js'));
    }
  }

  /**
   * URI-encodes the given file name
   */
  function encodeFile(file) {
    return encodeURIComponent(file).split('%2F').join('/');
  }

})();
