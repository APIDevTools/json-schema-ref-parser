import { describe, it } from "vitest";
import { expect } from "vitest";
import $RefParser from "../../../lib/index.js";
const schema = {
  type: "object",
  allOf: [
    {
      description: "REMOVED for better readbility",
    },
    {
      type: "object",
      properties: {
        payload: {
          type: "array",
          items: {
            allOf: [
              {
                description: "REMOVED for better readbility",
              },
              {
                type: "object",
                properties: {
                  reservationActionMetaData: {
                    allOf: [
                      {
                        allOf: [
                          {
                            type: "object",
                            properties: {
                              supplierPriceElements: {
                                allOf: [
                                  {
                                    description: "REMOVED for better readbility",
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      purchaseRate: {
                                        allOf: [
                                          {
                                            type: "object",
                                            required: ["amount"],
                                            properties: {
                                              amount: {
                                                type: "number",
                                              },
                                            },
                                          },
                                          {
                                            type: "object",
                                            properties: {
                                              inDetail: {
                                                type: "object",
                                                properties: {
                                                  perDate: {
                                                    type: "array",
                                                    items: {
                                                      type: "object",
                                                      properties: {
                                                        amount: {
                                                          $ref: "#/allOf/1/properties/payload/items/allOf/1/properties/reservationActionMetaData/allOf/0/allOf/0/properties/supplierPriceElements/allOf/1/properties/fee/properties/modificationFee/properties/amount",
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        ],
                                      },
                                      fee: {
                                        type: "object",
                                        properties: {
                                          modificationFee: {
                                            $ref: "#/allOf/1/properties/payload/items/allOf/1/properties/reservationActionMetaData/allOf/0/allOf/0/properties/supplierPriceElements/allOf/1/properties/purchaseRate/allOf/0",
                                          },
                                        },
                                      },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                          {
                            description: "REMOVED for better readbility",
                          },
                        ],
                      },
                      {
                        description: "REMOVED for better readbility",
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    },
  ],
};

describe("Schema with nested pointers", () => {
  it("should throw an error for missing pointer", async () => {
    // todo - get original schema from #338
    const bundle = await $RefParser.bundle(schema);
    expect(bundle).to.equal(schema);
  });
});
