export default {
  type: "object",
  required: ["user", "token"],
  properties: {
    token: {
      type: "string",
    },
    user: {
      type: "object",
      required: ["name"],
      properties: {
        name: {
          type: "string",
        },
      },
      example: {
        name: "Homer",
      },
    },
  },
  example: {
    token: "11111111",
    user: {
      name: "Homer",
    },
  },
};
