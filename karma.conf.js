// Karma config
// https://karma-runner.github.io/0.12/config/configuration-file.html
'use strict';


module.exports = function (karma) {
  var config = {
    frameworks: ['mocha', 'chai', 'host-environment'],
    reporters: ['verbose'],

    files: [
      // Polyfills for older browsers
      'test/polyfills/promise.js',
      'test/polyfills/typedarray.js',

      // Json Schema $Ref Parser
      'dist/ref-parser.min.js',
      { pattern: 'dist/*.map', included: false, served: true },

      // Test Fixtures
      'test/fixtures/**/*.js',

      // Test Specs
      'test/specs/**/*.parsed.js',
      'test/specs/**/*.dereferenced.js',
      'test/specs/**/*.bundled.js',
      'test/specs/**/*.spec.js',
      { pattern: 'test/specs/**', included: false, served: true }
    ]
  };

  exitIfDisabled();
  configureCodeCoverage(config);
  configureLocalBrowsers(config);
  configureSauceLabs(config);

  console.log('Karma Config:\n', JSON.stringify(config, null, 2));
  karma.set(config);
};

/**
 * If this is a CI job, and Karma is not enabled, then exit.
 * (useful for CI jobs that are only testing Node.js, not web browsers)
 */
function exitIfDisabled () {
  var CI = process.env.CI === 'true';
  var KARMA = process.env.KARMA === 'true';

  if (CI && !KARMA) {
    console.warn('Karma is not enabled');
    process.exit();
  }
}

/**
 * Configures the code-coverage reporter
 */
function configureCodeCoverage (config) {
  var coverage = process.argv.indexOf('--coverage') > 0;
  var SAUCE = process.env.SAUCE === 'true';

  if (!coverage) {
    console.warn('Code-coverage is not enabled');
    return;
  }
  else if (SAUCE) {
    console.warn('Code-coverage is disabled for SauceLabs');
    return;
  }

  config.reporters.push('coverage');
  config.coverageReporter = {
    reporters: [
      { type: 'text-summary' },
      { type: 'lcov' }
    ]
  };

  config.files = config.files.map(function (file) {
    if (typeof file === 'string') {
      file = file.replace(/^dist\/(.*)\.min\.js$/, 'dist/$1.coverage.js');
    }
    return file;
  });
}

/**
 * Configures the browsers for the current platform
 */
function configureLocalBrowsers (config) {
  var isMac = /^darwin/.test(process.platform);
  var isWindows = /^win/.test(process.platform);
  var isLinux = !isMac && !isWindows;

  if (isMac) {
    config.browsers = ['Firefox', 'Chrome', 'Safari'];
  }
  else if (isLinux) {
    config.browsers = ['Firefox'];
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
  var SAUCE = process.env.SAUCE === 'true';
  var username = process.env.SAUCE_USERNAME;
  var accessKey = process.env.SAUCE_ACCESS_KEY;

  if (!SAUCE || !username || !accessKey) {
    console.warn('SauceLabs is not enabled');
    return;
  }

  var project = require('./package.json');
  var testName = project.name + ' v' + project.version;
  var build = testName + ' Build #' + process.env.TRAVIS_JOB_NUMBER + ' @ ' + new Date();

  config.sauceLabs = {
    build: build,
    testName: testName,
    tags: [project.name],
  };

  config.customLaunchers = {
    SauceLabs_IE_11: {
      base: 'SauceLabs',
      platform: 'Windows 10',
      browserName: 'internet explorer'
    },
    SauceLabs_IE_Edge: {
      base: 'SauceLabs',
      platform: 'Windows 10',
      browserName: 'microsoftedge'
    },
    SauceLabs_Safari_Latest: {
      base: 'SauceLabs',
      platform: 'macOS 10.13',
      browserName: 'safari'
    },
    SauceLabs_Chrome_Latest: {
      base: 'SauceLabs',
      platform: 'Windows 10',
      browserName: 'chrome'
    },
    SauceLabs_Firefox_Latest: {
      base: 'SauceLabs',
      platform: 'Windows 10',
      browserName: 'firefox'
    },
  };

  config.reporters.push('saucelabs');
  config.browsers = Object.keys(config.customLaunchers);
  config.concurrency = 1;
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
