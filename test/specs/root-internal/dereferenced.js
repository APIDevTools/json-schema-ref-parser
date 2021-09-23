"use strict";

module.exports =
{
  title: "name",
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
