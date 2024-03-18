"use strict";

const { cwd: processCwd, platform } = require("process");

exports.environment = "node";
exports.platform = platform;

exports.getCwd = () => processCwd();

exports.TextDecoder = globalThis.TextDecoder || require("util").TextDecoder;
