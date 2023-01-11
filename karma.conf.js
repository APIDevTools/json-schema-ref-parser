// Karma config
// https://karma-runner.github.io/0.12/config/configuration-file.html
// https://jstools.dev/karma-config/

"use strict";

const nodeUtil = require("util");
const { buildConfig } = require("@jsdevtools/karma-config");
const { host } = require("@jsdevtools/host-environment");

module.exports = (karma) => {

  const browsers = [];
  const CI = isCI();
  browsers.push(CI ? "ChromeHeadless" : "Chrome");
  browsers.push(CI ? "FirefoxHeadless" : "Firefox");
  host.os.mac && browsers.push("Safari");
  host.os.windows && browsers.push("Edge");

  const plugins = [
    require("@jsdevtools/karma-host-environment"),
    require("karma-verbose-reporter"),
    require("karma-mocha"),
    require("karma-webpack"), 
  ]
  plugins.push(require("karma-chrome-launcher"))
  plugins.push(require("karma-firefox-launcher"))
  host.os.mac && plugins.push(require("karma-safari-launcher"))
  host.os.windows && plugins.push(require("karma-edge-launcher"))
  plugins.push(require("karma-coverage-istanbul-reporter"))
  
  const config = buildConfig({
    sourceDir: "lib",
    fixtures: "test/fixtures/**/*.js",
    browsers: {
      chrome: true,
      firefox: true,
      safari: host.os.mac,
      edge: host.os.windows,
      ie: false
    },
    config: {
      browsers: browsers,
      plugins: plugins
    }
  });

  if (config.logLevel !== karma.LOG_DISABLE) {
    console.debug("Karma Config:\n", nodeUtil.inspect(config, {
      depth: 10,
      colors: true,
      compact: false,
    }));
  }

  karma.set(config);
};

function isCI() {
  let CI = environmentFlag("CI");
  let karmaCI = environmentFlag("KARMA_CI");

  return Boolean(CI || karmaCI || host.ci);
};

function environmentFlag(name) {
  let value = environmentVariable(name);
  return !["", "false", "off", "no"].includes(value);
}

function environmentVariable(name) {
  return (process.env[name] || "").trim().toLowerCase();
}
