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
      "min-length": 1,
      type: "string",
    },
    lastName: {
      "min-length": 1,
      "max-length": 20,
      type: "string",
    },
    firstName: {
      type: "string",
    },
  },
};
