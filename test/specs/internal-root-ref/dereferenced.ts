export default {
  definitions: {
    user: {
      type: "object",
      properties: {
        userId: {
          type: "integer",
        },
      },
      required: ["userId"],
    },
  },
  type: "object",
  properties: {
    userId: {
      type: "integer",
    },
  },
  required: ["userId"],
};
