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
          title: "requiredString",
          type: "string",
          minLength: 1,
        },
        last: {
          title: "requiredString",
          type: "string",
          minLength: 1,
        },
        middle: {
          type: "string",
          minLength: 1,
        },
        prefix: {
          title: "requiredString",
          type: "string",
          minLength: 3,
        },
        suffix: {
          title: "requiredString",
          type: "string",
          minLength: 3,
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
      required: ["first", "last"],
      type: "object",
      properties: {
        first: {
          title: "requiredString",
          type: "string",
          minLength: 1,
        },
        last: {
          title: "requiredString",
          type: "string",
          minLength: 1,
        },
        middle: {
          type: "string",
          minLength: 1,
        },
        prefix: {
          title: "requiredString",
          type: "string",
          minLength: 3,
        },
        suffix: {
          title: "requiredString",
          type: "string",
          minLength: 3,
          maxLength: 3,
        },
      },
    },
  },
  title: "Person",
};
