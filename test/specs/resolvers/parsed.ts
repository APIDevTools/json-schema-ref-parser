export default {
  definitions: {
    foo: {
      $ref: "foo://bar.baz",
    },
    bar: {
      $ref: "bar://Foo.Baz",
    },
    pet: {
      $ref: "definitions/pet.yaml",
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
