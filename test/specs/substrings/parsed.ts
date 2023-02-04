export default {
  schema: {
    definitions: {
      $ref: "definitions/definitions.json",
    },
    required: ["name"],
    type: "object",
    properties: {
      middleName: {
        $ref: "#/definitions/name-with-min-length",
      },
      lastName: {
        $ref: "#/definitions/name-with-min-length-max-length",
      },
      firstName: {
        $ref: "#/definitions/name",
      },
    },
    title: "Person",
  },

  definitions: {
    name: {
      $ref: "strings.yaml#/definitions/string",
    },
    "name-with-min-length": {
      $ref: "../definitions/strings.yaml#/definitions/string-with-min-length",
    },
    "name-with-min-length-max-length": {
      $ref: "./strings.yaml#/definitions/string-with-min-length-max-length",
    },
  },

  strings: {
    definitions: {
      "string-with-min-length": {
        type: "string",
        "min-length": 1,
      },
      "string-with-min-length-max-length": {
        type: "string",
        "min-length": 1,
        "max-length": 20,
      },
      string: {
        type: "string",
      },
    },
  },
};
