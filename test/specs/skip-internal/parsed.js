"use strict";

module.exports =
{
  schema: {
    required: [
      "name"
    ],
    type: "object",
    properties: {
      gender: {
        $ref: "definitions/definitions.json#/gender"
      },
      age: {
        $ref: "definitions/definitions.json#/age"
      },
      name: {
        $ref: "definitions/definitions.json#/name"
      },
      requiredString: {
        $ref: "definitions/required-string.yaml"
      }
    },
    title: "Person"
  },

  definitions: {
    name: {
      $ref: "./name.yaml"
    },
    age: {
      type: "integer",
      minimum: 0
    },
    gender: {
      type: "string",
      enum: ["male", "female"]
    }
  },

  name: {
    required: [
      "first",
      "last"
    ],
    type: "object",
    properties: {
      last: {
        $ref: "#/properties/requiredString"
      },
      first: {
        $ref: "#/properties/requiredString"
      }
    },
    title: "name"
  },

  requiredString: {
    minLength: 1,
    type: "string",
    title: "required string"
  }
};
