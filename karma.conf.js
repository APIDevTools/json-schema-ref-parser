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
    chrome: false, //host.ci ? host.os.linux : true,
    firefox: false, //host.ci ? host.os.linux : true,
    safari: true, //host.ci ? host.os.linux : host.os.mac,
    edge: false, //host.ci ? host.os.linux : host.os.windows,
    ie: false, //host.os.windows,
  },
});
