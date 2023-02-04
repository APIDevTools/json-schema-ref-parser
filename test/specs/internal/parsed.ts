export default {
  definitions: {
    fragment: {
      $id: "#fragment",
    },
    requiredString: {
      title: "requiredString",
      minLength: 1,
      type: "string",
    },
    name: {
      required: ["first", "last"],
      type: "object",
      properties: {
        first: {
          $ref: "#/definitions/requiredString",
        },
        last: {
          $ref: "#/definitions/name/properties/first",
        },
        middle: {
          type: {
            $ref: "#/definitions/name/properties/first/type",
          },
          minLength: {
            $ref: "#/definitions/name/properties/last/minLength",
          },
        },
        prefix: {
          $ref: "#/definitions/name/properties/last",
          minLength: 3,
        },
        suffix: {
          type: "string",
          $ref: "#/definitions/name/properties/prefix",
          maxLength: 3,
        },
      },
    },
  },
  required: ["name"],
  type: "object",
  properties: {
    fragment: {
      $ref: "#fragment",
    },
    gender: {
      enum: ["male", "female"],
      type: "string",
    },
    age: {
      minimum: 0,
      type: "integer",
    },
    name: {
      $ref: "#/definitions/name",
    },
  },
  title: "Person",
};
