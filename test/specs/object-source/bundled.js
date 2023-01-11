export default {
  title: "Person",
  type: "object",
  required: [
    "name"
  ],
  properties: {
    name: {
      $ref: "#/definitions/name"
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
    }
  },
  definitions: {
    requiredString: {
      title: "requiredString",
      type: "string",
      minLength: 1
    },
    string: {
      $ref: "#/definitions/requiredString/type"
    },
    name: {
      title: "name",
      type: "object",
      required: [
        "first",
        "last"
      ],
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
          $ref: "#/definitions/name/properties/prefix",
          type: "string",
          maxLength: 3
        }
      }
    }
  }
};
