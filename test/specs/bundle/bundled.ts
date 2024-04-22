export default {
  $id: "schemaA/1.0",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    purchaseRate: {
      allOf: [
        {
          type: "object",
          properties: {
            amount: {
              type: "number",
              format: "float",
            },
          },
        },
        {
          type: "object",
          $ref: "#/properties/fee/properties/modificationFee/properties/amount",
        },
      ],
    },
    fee: {
      type: "object",
      properties: {
        modificationFee: {
          $ref: "#/properties/purchaseRate/allOf/0",
        },
      },
    },
  },
};
