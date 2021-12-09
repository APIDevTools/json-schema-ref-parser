"use strict";

module.exports =
{
  title: "Person",
  type: "object",
  required: [
    "name"
  ],
  properties: {
    name: {
      title: "name",
      type: "object",
      required: [
        "first",
        "last"
      ],
      properties: {
        first: {
          "$ref": "#/properties/requiredString"
        },
        last: {
          "$ref": "#/properties/requiredString"
        }
      }
    },
    age: {
      type: "integer",
      minimum: 0
    },
    gender: {
      type: "string",
      enum: [
        "male",
        "female"
      ]
    },
    requiredString: {
      minLength: 1,
      title: "required string",
      type: "string"
    }
  }
};
