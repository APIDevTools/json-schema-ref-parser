export default {
  schema: {
    yaml: {
      $ref: "files/blank.yaml",
    },
    json: {
      $ref: "files/blank.json",
    },
    text: {
      $ref: "files/blank.txt",
    },
    binary: {
      $ref: "files/blank.png",
    },
    unknown: {
      $ref: "files/blank.foo",
    },
  },

  yaml: undefined,

  json: undefined,

  text: "",

  binary: { type: "Buffer", data: [] },

  unknown: undefined,
};
