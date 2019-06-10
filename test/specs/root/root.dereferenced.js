"use strict";

const helper = require("../../fixtures/helper");

helper.dereferenced.root =
{
  title: "Extending a root $ref",
  required: [
    "first",
    "last"
  ],
  type: "object",
  properties: {
    last: {
      type: "string"
    },
    first: {
      type: "string"
    }
  },
};
