export default {
  schema: {
    internal1: {
      $ref: "#/internal2",
    },
    internal2: {
      $ref: "#/external1",
    },
    internal3: {
      $ref: "#/internal4",
    },
    internal4: {
      $ref: "#/external2",
    },
    external1: {
      test: {
        $ref: "definitions.yaml#/thing",
      },
    },
    external2: {
      test: {
        $ref: "definitions.yaml#/thing",
      },
    },
  },

  definitions: {
    thing: {
      type: "string",
    },
  },
};
