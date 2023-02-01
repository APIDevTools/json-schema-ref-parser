export default {
  schema: {
    required: ["name"],
    type: "object",
    properties: {
      gender: {
        $ref: "definitions/definitions.json#/gender",
      },
      age: {
        $ref: "definitions/definitions.json#/age",
      },
      name: {
        $ref: "definitions/definitions.json#/name",
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
    age: {
      type: "integer",
      minimum: 0,
    },
    gender: {
      type: "string",
      enum: ["male", "female"],
    },
  },

  name: {
    required: ["first", "last"],
    type: "object",
    properties: {
      middle: {
        minLength: {
          $ref: "definitions.json#/name/properties/first/minLength",
        },
        type: {
          $ref: "definitions.json#/name/properties/first/type",
        },
      },
      prefix: {
        minLength: 3,
        $ref: "../definitions/definitions.json#/name/properties/last",
      },
      last: {
        $ref: "./required-string.yaml",
      },
      suffix: {
        $ref: "definitions.json#/name/properties/prefix",
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
