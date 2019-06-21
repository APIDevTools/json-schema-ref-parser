"use strict";

module.exports =
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
