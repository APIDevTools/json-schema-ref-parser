export default {
  internal1: {
    $ref: "#/external1",
  },
  internal2: {
    $ref: "#/external1",
  },
  internal3: {
    $ref: "#/external2",
  },
  internal4: {
    $ref: "#/external2",
  },
  external1: {
    test: {
      type: "string",
    },
  },
  external2: {
    test: {
      $ref: "#/external1/test", // <-- It should point to the most direct reference
    },
  },
};
