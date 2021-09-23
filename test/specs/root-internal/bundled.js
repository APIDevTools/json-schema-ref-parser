"use strict";

module.exports =
{
  definitions: {
    name: {
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
    }
  },
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
