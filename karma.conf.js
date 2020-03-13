// Karma config
// https://karma-runner.github.io/0.12/config/configuration-file.html
// https://jstools.dev/karma-config/

"use strict";

const { karmaConfig } = require("@jsdevtools/karma-config");
const { host } = require("@jsdevtools/host-environment");

module.exports = karmaConfig({
  sourceDir: "lib",
  fixtures: "test/fixtures/**/*.js",
  browsers: {
    chrome: !host.os.windows,
    firefox: host.os.linux,
    safari: host.os.linux,    // SauceLabs
    edge: host.os.linux,      // SauceLabs
    ie: host.os.windows,
  },

  // Increse timouts and tolerances when running in slow CI environments
  config: host.ci && {
    captureTimeout: 60000,
    browserDisconnectTolerance: 5,
    browserDisconnectTimeout: 60000,
    browserNoActivityTimeout: 60000,
  }
});
