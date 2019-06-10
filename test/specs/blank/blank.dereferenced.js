"use strict";

const helper = require("../../fixtures/helper");

helper.dereferenced.blank = {
  json: undefined,
  yaml: undefined,
  text: "",
  binary: { type: "Buffer", data: []},
  unknown: undefined
};
