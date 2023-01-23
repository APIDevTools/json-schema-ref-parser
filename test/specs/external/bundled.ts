export default {
  title: "Person",
  type: "object",
  required: ["name"],
  properties: {
    name: {
      $ref: "#/definitions/name",
    },
    age: {
      type: "integer",
      minimum: 0,
    },
    gender: {
      type: "string",
      enum: ["male", "female"],
    },
  },
  definitions: {
    "required string": {
      title: "required string",
      type: "string",
      minLength: 1,
    },
    string: {
      $ref: "#/definitions/required%20string/type",
    },
    name: {
      title: "name",
      type: "object",
      required: ["first", "last"],
      properties: {
        first: {
          $ref: "#/definitions/required%20string",
        },
        last: {
          $ref: "#/definitions/required%20string",
        },
        middle: {
          type: {
            $ref: "#/definitions/required%20string/type",
          },
          minLength: {
            $ref: "#/definitions/required%20string/minLength",
          },
        },
        prefix: {
          $ref: "#/definitions/required%20string",
          minLength: 3,
        },
        suffix: {
          $ref: "#/definitions/name/properties/prefix",
          type: "string",
          maxLength: 3,
        },
      },
    },
  },
};
