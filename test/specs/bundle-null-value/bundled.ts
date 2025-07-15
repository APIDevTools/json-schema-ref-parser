const bundledSchema = {
  defintions: {
    Pet: {
      example: {
        breed: "dog",
        name: null,
      },
      properties: {
        breed: {
          enum: ["dog", "cat"],
          type: "string",
        },
        name: {
          type: "string",
        },
      },
      type: "object",
    },
  },
};

export default bundledSchema;
