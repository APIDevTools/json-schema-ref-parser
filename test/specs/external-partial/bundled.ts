export default {
  title: "Person",
  type: "object",
  required: ["name"],
  properties: {
    name: {
      title: "name",
      type: "object",
      required: ["first", "last"],
      properties: {
        first: {
          $ref: "#/properties/name/properties/last",
        },
        last: {
          title: "required string",
          type: "string",
          minLength: 1,
        },
        middle: {
          type: {
            $ref: "#/properties/name/properties/last/type",
          },
          minLength: {
            $ref: "#/properties/name/properties/last/minLength",
          },
        },
        prefix: {
          $ref: "#/properties/name/properties/last",
          minLength: 3,
        },
        suffix: {
          $ref: "#/properties/name/properties/prefix",
          type: "string",
          maxLength: 3,
        },
      },
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
};
