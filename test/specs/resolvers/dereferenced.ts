export default {
  definitions: {
    foo: {
      bar: {
        baz: "hello world",
      },
    },
    bar: {
      Foo: {
        Baz: "hello world",
      },
    },
    name: {
      required: ["first", "last"],
      type: "object",
      properties: {
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
    pet: {
      type: "object",
      properties: {
        age: {
          type: "number",
        },
        name: {
          type: "string",
        },
        species: {
          enum: ["cat", "dog", "bird", "fish"],
          type: "string",
        },
      },
      title: "pet",
    },
  },
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
