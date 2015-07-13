'use strict';

// Karma config
// https://karma-runner.github.io/0.12/config/configuration-file.html
module.exports = function(config) {
  var isMac      = /^darwin/.test(process.platform),
      isWindows  = /^win/.test(process.platform),
      isLinux    = !(isMac || isWindows);

  config.set({
    frameworks: ['mocha', 'chai', 'sinon'],
    reporters: ['mocha'],

    files: [
      // json-schema-ref-parser
      'dist/ref-parser.min.js',

      // Unit tests
      'tests/test-environment.js',
      'tests/**/*.spec.js'
    ],

    browsers: (function() {
      // Test on all browsers that are available for the environment
      if (isMac) {
        return ['PhantomJS', 'Firefox', 'Chrome', 'Safari'];
      }
      else if (isWindows) {
        return ['PhantomJS', 'Firefox', 'Chrome', 'Safari', 'IE'];
      }
      else if (isLinux) {
        return ['PhantomJS', 'Firefox', 'Chrome'];
      }
    })()
  });
};
