export default {
  $ref: "#/definitions/user",
  definitions: {
    user: {
      properties: {
        userId: {
          type: "integer",
        },
      },
      required: ["userId"],
      type: "object",
    },
  },
};
