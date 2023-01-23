export default {
  schema: {
    type: "object",
    required: ["user", "token"],
    properties: {
      token: {
        type: "string",
      },
      user: {
        $ref: "definitions.yaml#/User",
      },
    },
    example: {
      token: "11111111",
      user: {
        $ref: "definitions.yaml#/User/example",
      },
    },
  },

  definitions: {
    User: {
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
};
