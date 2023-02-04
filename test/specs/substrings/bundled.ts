export default {
  title: "Person",
  definitions: {
    "name-with-min-length": {
      "min-length": 1,
      type: "string",
    },
    "name-with-min-length-max-length": {
      "min-length": 1,
      "max-length": 20,
      type: "string",
    },
    name: {
      type: "string",
    },
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
};
