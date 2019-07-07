"use strict";

module.exports =
{
  definitions: {
    requiredString: {
      title: "requiredString",
      minLength: 1,
      type: "string"
    },
    name: {
      required: [
        "first",
        "last"
      ],
      type: "object",
      properties: {
        first: {
          $ref: "#/definitions/requiredString"
        },
        last: {
          $ref: "#/definitions/name/properties/first"
        },
        middle: {
          type: {
            $ref: "#/definitions/name/properties/first/type"
          },
          minLength: {
            $ref: "#/definitions/name/properties/last/minLength"
          }
        },
        prefix: {
          $ref: "#/definitions/name/properties/last",
          minLength: 3
        },
        suffix: {
          type: "string",
          $ref: "#/definitions/name/properties/prefix",
          maxLength: 3
        }
      }
    },
    genderEnum: {
      enum: [
        "male",
        "female"
      ],
      type: "string",
    }    
  },
  required: [
    "name"
  ],
  type: "object",
  properties: {
    gender: {
      $ref: "#/definitions/genderEnum"
    },
    age: {
      minimum: 0,
      type: "integer"
    },
    name: {
      $ref: "#/definitions/name"
    }
  },
  title: "Person"
};
