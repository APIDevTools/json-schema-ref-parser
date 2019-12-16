// Karma config
// https://karma-runner.github.io/0.12/config/configuration-file.html
// https://jstools.dev/karma-config/

"use strict";
const { karmaConfig } = require("karma-config");
let exclude = [];

if (process.env.WINDOWS && process.env.CI) {
  // We're running in a Windows CI/CD environment, so Karma-Config will use SauceLabs.
  // The following tests tend to fail on SauceLabs, probably due to zero-byte files
  // and special characters in the paths. So, exclude them.
  exclude.push(
    "test/specs/__*/**",
    "test/specs/blank/**/*.spec.js",
    "test/specs/circular*/**/*.spec.js",
    "test/specs/empty/**/*.spec.js",
    "test/specs/invalid/**/*.spec.js",
    "test/specs/parsers/**/*.spec.js"
  );
}

module.exports = karmaConfig({
  sourceDir: "lib",
  fixtures: "test/fixtures/**/*.js",
  browsers: {
    ie: false,
    safari: false
  },
  config: {
    exclude
  }
});
