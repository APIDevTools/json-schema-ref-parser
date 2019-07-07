"use strict";

module.exports =
{
  definitions: {
    requiredString: {
      title: "requiredString",
      minLength: 1,
      type: "string"
    },
    genderEnum: {
      enum: [
        "male",
        "female"
      ],
      type: "string",
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
          $ref: "#/definitions/requiredString"
        },
        middle: {
          type: {
            $ref: "#/definitions/requiredString/type"
          },
          minLength: {
            $ref: "#/definitions/requiredString/minLength"
          }
        },
        prefix: {
          $ref: "#/definitions/requiredString",
          minLength: 3
        },
        suffix: {
          type: "string",
          $ref: "#/definitions/name/properties/prefix",
          maxLength: 3
        }
      }
    }
  },
  required: [
    "name"
  ],
  type: "object",
  properties: {
    gender: {
      $ref: '#/definitions/genderEnum'
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
