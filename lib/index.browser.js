"use strict";

const browser = require("./environment/browser.js");
const { env } = require("./environment/index.js");

Object.assign(env, browser);

module.exports = require("./index.js");
