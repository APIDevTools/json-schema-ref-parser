// Karma config
// https://karma-runner.github.io/0.12/config/configuration-file.html
"use strict";

module.exports = function (karma) {
  var config = {
    frameworks: ["mocha", "chai", "host-environment"],
    reporters: ["verbose"],

    files: [
      // Polyfills for older browsers
      "test/polyfills/promise.js",
      "test/polyfills/typedarray.js",

      // Json Schema $Ref Parser
      "dist/ref-parser.min.js",
      { pattern: "dist/*.map", included: false, served: true },

      // Test Fixtures
      "test/fixtures/**/*.js",

      // Test Specs
      "test/specs/**/*.parsed.js",
      "test/specs/**/*.dereferenced.js",
      "test/specs/**/*.bundled.js",
      "test/specs/**/*.spec.js",
      { pattern: "test/specs/**", included: false, served: true }
    ]
  };

  configureCodeCoverage(config);
  configureBrowsers(config);

  console.log("Karma Config:\n", JSON.stringify(config, null, 2));
  karma.set(config);
};

/**
 * Configures the code-coverage reporter
 */
function configureCodeCoverage (config) {
  if (process.argv.indexOf("--coverage") === -1) {
    console.warn("Code-coverage is not enabled");
    return;
  }

  config.reporters.push("coverage");
  config.coverageReporter = {
    reporters: [
      { type: "text-summary" },
      { type: "lcov" }
    ]
  };

  config.files = config.files.map(function (file) {
    if (typeof file === "string") {
      file = file.replace(/^dist\/(.*)\.min\.js$/, "dist/$1.coverage.js");
    }
    return file;
  });
}

/**
 * Configures the browsers for the current platform
 */
function configureBrowsers (config) {
  let isWindows = /^win/.test(process.platform) || process.env.WINDOWS === "true";
  let isMac = /^darwin/.test(process.platform);
  let isLinux = !isMac && !isWindows;
  let isCI = process.env.CI === "true";

  if (isCI) {
    if (isWindows) {
      // IE and Edge aren't available in CI, so use SauceLabs
      configureSauceLabs(config);
    }
    else if (isMac) {
      config.browsers = ["FirefoxHeadless", "ChromeHeadless", "Safari"];
    }
    else if (isLinux) {
      config.browsers = ["FirefoxHeadless", "ChromeHeadless"];
    }
  }
  else if (isMac) {
    config.browsers = ["Firefox", "Chrome", "Safari"];
  }
  else if (isLinux) {
    config.browsers = ["Firefox", "Chrome"];
  }
  else if (isWindows) {
    config.browsers = ["Firefox", "Chrome", "IE", "Edge"];
  }
}

/**
 * Configures Sauce Labs emulated browsers/devices.
 * https://github.com/karma-runner/karma-sauce-launcher
 */
function configureSauceLabs (config) {
  let username = process.env.SAUCE_USERNAME;
  let accessKey = process.env.SAUCE_ACCESS_KEY;

  if (!username || !accessKey) {
    throw new Error(`SAUCE_USERNAME and/or SAUCE_ACCESS_KEY is not set`);
  }

  let project = require("./package.json");

  config.sauceLabs = {
    build: `${project.name} v${project.version} Build #${process.env.TRAVIS_JOB_NUMBER}`,
    testName: `${project.name} v${project.version}`,
    tags: [project.name],
  };

  config.customLaunchers = {
    IE_11: {
      base: "SauceLabs",
      platform: "Windows 7",
      browserName: "internet explorer"
    },
    Edge: {
      base: "SauceLabs",
      platform: "Windows 10",
      browserName: "microsoftedge"
    },
  };

  config.reporters.push("saucelabs");
  config.browsers = Object.keys(config.customLaunchers);
  // config.concurrency = 1;
  config.captureTimeout = 60000;
  config.browserDisconnectTolerance = 5,
  config.browserDisconnectTimeout = 60000;
  config.browserNoActivityTimeout = 60000;
  // config.logLevel = "debug";

  // The following tests tend to fail on SauceLabs,
  // probably due to zero-byte files and special characters in the paths.
  // So, exclude these tests when running on SauceLabs.
  config.exclude = [
    "test/specs/__*/**",
    "test/specs/blank/**/*.spec.js",
    "test/specs/circular*/**/*.spec.js",
    "test/specs/empty/**/*.spec.js",
    "test/specs/invalid/**/*.spec.js",
    "test/specs/parsers/**/*.spec.js"
  ];
}
