// Karma config
// https://karma-runner.github.io/0.12/config/configuration-file.html
'use strict';

var baseConfig = {
  frameworks: ['mocha'],
  reporters: ['verbose'],
  files: [
    // Third-Party Libraries
    'www/bower_components/chai/chai.js',

    // Polyfills for older browsers
    'www/polyfills/promise.js',
    'www/polyfills/typedarray.js',

    // Json Schema $Ref Parser
    'dist/ref-parser.min.js',
    { pattern: 'dist/*.map', included: false, served: true },

    // Test Fixtures
    'test/fixtures/**/*.js',

    // Tests
    'test/specs/**/*.js',
    { pattern: 'test/specs/**', included: false, served: true }
  ]
};

module.exports = function (config) {
  var ci = process.env.CI ? process.env.CI === 'true' : false;
  var karma = process.env.KARMA ? process.env.KARMA === 'true' : false;
  var debug = process.env.DEBUG ? process.env.DEBUG === 'true' : false;
  var coverage = process.env.KARMA_COVERAGE ? process.env.KARMA_COVERAGE === 'true' : false;
  var sauce = process.env.KARMA_SAUCE ? process.env.KARMA_SAUCE === 'true' : false;
  var sauceUsername = process.env.SAUCE_USERNAME;
  var sauceAccessKey = process.env.SAUCE_ACCESS_KEY;

  if (ci && !karma) {
    // Karma is disabled, so abort immediately
    process.exit();
    return;
  }

  if (debug) {
    configureForDebugging(baseConfig);
  }
  else {
    if (coverage) {
      configureCodeCoverage(baseConfig);
    }

    if (sauce && sauceUsername && sauceAccessKey) {
      configureSauceLabs(baseConfig);
    }
    else {
      configureLocalBrowsers(baseConfig);
    }
  }

  console.log('Karma Config:\n', JSON.stringify(baseConfig, null, 2));
  config.set(baseConfig);
};

/**
 * Configures Karma to only run Chrome, and with unminified source code.
 * This is intended for debugging purposes only.
 */
function configureForDebugging (config) {
  config.files.splice(config.files.indexOf('dist/ref-parser.min.js'), 1, 'dist/ref-parser.js');
  config.browsers = ['Chrome'];
}

/**
 * Configures the code-coverage reporter
 */
function configureCodeCoverage (config) {
  config.reporters.push('coverage');
  config.files.splice(config.files.indexOf('dist/ref-parser.min.js'), 1, 'dist/ref-parser.test.js');
  config.coverageReporter = {
    reporters: [
      { type: 'text-summary' },
      { type: 'lcov' }
    ]
  };
}

/**
 * Configures the browsers for the current platform
 */
function configureLocalBrowsers (config) {
  var isMac = /^darwin/.test(process.platform),
      isWindows = /^win/.test(process.platform),
      isLinux = !(isMac || isWindows);

  if (isMac) {
    config.browsers = ['Firefox', 'Chrome', 'Safari'];
  }
  else if (isLinux) {
    config.browsers = ['Firefox', 'ChromeHeadless'];
  }
  else if (isWindows) {
    config.browsers = ['Firefox', 'Chrome', 'IE', 'Edge'];
  }
}

/**
 * Configures Sauce Labs emulated browsers/devices.
 * https://github.com/karma-runner/karma-sauce-launcher
 */
function configureSauceLabs (config) {
  var project = require('./package.json');
  var testName = project.name + ' v' + project.version;
  var build = testName + ' Build #' + process.env.TRAVIS_JOB_NUMBER + ' @ ' + new Date();

  config.sauceLabs = {
    build: build,
    testName: testName,
    tags: [project.name],
    recordVideo: true,
    recordScreenshots: true
  };

  config.customLaunchers = {
    'Chrome-Latest': {
      base: 'SauceLabs',
      platform: 'Windows 7',
      browserName: 'chrome'
    },
    'Firefox-Latest': {
      base: 'SauceLabs',
      platform: 'Windows 7',
      browserName: 'firefox'
    },
    'Safari-Latest': {
      base: 'SauceLabs',
      platform: 'OS X 10.10',
      browserName: 'safari'
    },
    'IE-11': {
      base: 'SauceLabs',
      platform: 'Windows 7',
      browserName: 'internet explorer'
    },
    'IE-Edge': {
      base: 'SauceLabs',
      platform: 'Windows 10',
      browserName: 'microsoftedge'
    }
  };

  config.reporters.push('saucelabs');
  config.browsers = Object.keys(config.customLaunchers);
  config.captureTimeout = 60000;
  config.browserDisconnectTimeout = 15000;
  config.browserNoActivityTimeout = 15000;
  // config.logLevel = 'debug';

  // The following tests tend to fail on SauceLabs,
  // probably due to zero-byte files and special characters in the paths.
  // So, exclude these tests when running on SauceLabs.
  config.exclude = [
    'test/specs/__*/**',
    'test/specs/blank/**',
    'test/specs/parsers/**'
  ];
}
