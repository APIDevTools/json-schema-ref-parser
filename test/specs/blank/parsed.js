"use strict";

module.exports =
{
  schema: {
    yaml: {
      $ref: "files/blank.yaml"
    },
    json: {
      $ref: "files/blank.json"
    },
    text: {
      $ref: "files/blank.txt"
    },
    unknown: {
      $ref: "files/blank.foo"
    },
  },

  yaml: undefined,

  json: undefined,

  text: "",

  unknown: undefined
};
