export default {
  schema: {
    $ref: "definitions/root.json",
  },

  root: {
    $ref: "../definitions/extended.yaml",
  },

  extended: {
    title: "Extending a root $ref",
    $ref: "name.yaml",
  },

  name: {
    title: "name",
    required: ["first", "last"],
    type: "object",
    properties: {
      last: {
        $ref: "./name.yaml#/properties/first",
      },
      first: {
        type: "string",
      },
    },
  },
};
