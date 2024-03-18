"use strict";

const node = require("./environment/node.js");
const { env } = require("./environment/index.js");

Object.assign(env, node);

module.exports = require("./index.js");
