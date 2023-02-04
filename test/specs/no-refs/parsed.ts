export default {
  required: ["name"],
  type: "object",
  properties: {
    gender: {
      enum: ["male", "female"],
      type: "string",
    },
    age: {
      minimum: 0,
      type: "integer",
    },
    name: {
      required: ["first", "last"],
      type: "object",
      properties: {
        middle: {
          type: "string",
        },
        last: {
          minLength: 1,
          type: "string",
        },
        first: {
          minLength: 1,
          type: "string",
        },
      },
    },
  },
  title: "Person",
};
