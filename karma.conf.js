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
    chrome: host.ci ? host.os.linux : true,
    firefox: host.ci ? host.os.linux : true,
    safari: host.ci ? host.os.linux : host.os.mac,
    edge: host.ci ? host.os.linux : host.os.windows,
    ie: host.os.windows,
  },
});
