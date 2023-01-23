export default {
  schema: {
    definitions: {
      $ref: "definitions/definitions.json",
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
        $ref: "#/definitions/name",
      },
    },
    title: "Person",
  },

  definitions: {
    "required string": {
      $ref: "required-string.yaml",
    },
    string: {
      $ref: "#/required%20string/type",
    },
    name: {
      $ref: "../definitions/name.yaml",
    },
  },

  name: {
    required: ["first", "last"],
    type: "object",
    properties: {
      middle: {
        minLength: {
          $ref: "#/properties/first/minLength",
        },
        type: {
          $ref: "#/properties/first/type",
        },
      },
      prefix: {
        minLength: 3,
        $ref: "#/properties/last",
      },
      last: {
        $ref: "./required-string.yaml",
      },
      suffix: {
        $ref: "#/properties/prefix",
        type: "string",
        maxLength: 3,
      },
      first: {
        $ref: "../definitions/definitions.json#/required string",
      },
    },
    title: "name",
  },

  requiredString: {
    minLength: 1,
    type: "string",
    title: "required string",
  },
};
