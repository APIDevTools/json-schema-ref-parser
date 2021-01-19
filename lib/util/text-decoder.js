"use strict";

const { TextDecoder: NodeTextDecoder } = require("fastestsmallesttextencoderdecoder");

module.exports = typeof TextDecoder === "undefined" ? NodeTextDecoder : TextDecoder;
