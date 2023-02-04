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
          title: "required string",
          type: "string",
          minLength: 1,
        },
        last: {
          title: "required string",
          type: "string",
          minLength: 1,
        },
        middle: {
          type: "string",
          minLength: 1,
        },
        prefix: {
          title: "required string",
          type: "string",
          minLength: 3,
        },
        suffix: {
          title: "required string",
          type: "string",
          minLength: 3,
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
