export default {
  $id: "schemaA/1.0",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  allOf: [
    {
      type: "object",
      required: ["eventId", "payload"],
      properties: {
        eventId: {
          type: "string",
        },
      },
    },
    {
      type: "object",
      properties: {
        payload: {
          type: "array",
          items: {
            allOf: [
              {
                type: "object",
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
                            required: ["supplierPriceElements"],
                            properties: {
                              supplierPriceElements: {
                                allOf: [
                                  {
                                    required: ["type"],
                                    properties: {
                                      type: {
                                        type: "string",
                                      },
                                    },
                                  },
                                  {
                                    type: "object",
                                    required: ["purchaseRate"],
                                    properties: {
                                      purchaseRate: {
                                        allOf: [
                                          {
                                            type: "object",
                                            required: ["amount", "currency"],
                                            properties: {
                                              amount: {
                                                type: "number",
                                                format: "float",
                                              },
                                              currency: {
                                                type: "string",
                                                minLength: 1,
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
                                                        date: {
                                                          type: "string",
                                                          format: "date",
                                                        },
                                                        amount: {
                                                          $ref: "#/allOf/1/properties/payload/items/allOf/1/properties/reservationActionMetaData/allOf/0/allOf/0/properties/supplierPriceElements/allOf/1/properties/fee/properties/modificationFee/properties/amount",
                                                        },
                                                        detailedPriceInformation: {
                                                          type: "array",
                                                          items: {
                                                            type: "object",
                                                            properties: {
                                                              amount: {
                                                                $ref: "#/allOf/1/properties/payload/items/allOf/1/properties/reservationActionMetaData/allOf/0/allOf/0/properties/supplierPriceElements/allOf/1/properties/fee/properties/modificationFee/properties/amount",
                                                              },
                                                              paxId: {
                                                                type: "string",
                                                              },
                                                              inDetail: {
                                                                type: "object",
                                                                properties: {
                                                                  rate: {
                                                                    $ref: "#/allOf/1/properties/payload/items/allOf/1/properties/reservationActionMetaData/allOf/0/allOf/0/properties/supplierPriceElements/allOf/1/properties/fee/properties/modificationFee/properties/amount",
                                                                  },
                                                                  board: {
                                                                    $ref: "#/allOf/1/properties/payload/items/allOf/1/properties/reservationActionMetaData/allOf/0/allOf/0/properties/supplierPriceElements/allOf/1/properties/fee/properties/modificationFee/properties/amount",
                                                                  },
                                                                  taxes: {
                                                                    type: "array",
                                                                    items: {
                                                                      $ref: "#/allOf/1/properties/payload/items/allOf/1/properties/reservationActionMetaData/allOf/0/allOf/0/properties/supplierPriceElements/allOf/1/properties/purchaseRate/allOf/1/properties/inDetail/properties/perDate/items/properties/detailedPriceInformation/items/properties/inDetail/properties/fees/items",
                                                                    },
                                                                  },
                                                                  fees: {
                                                                    type: "array",
                                                                    items: {
                                                                      type: "object",
                                                                      properties: {
                                                                        id: {
                                                                          type: "string",
                                                                        },
                                                                        amount: {
                                                                          $ref: "#/allOf/1/properties/payload/items/allOf/1/properties/reservationActionMetaData/allOf/0/allOf/0/properties/supplierPriceElements/allOf/1/properties/fee/properties/modificationFee/properties/amount",
                                                                        },
                                                                      },
                                                                    },
                                                                  },
                                                                  supplements: {
                                                                    type: "array",
                                                                    items: {
                                                                      $ref: "#/allOf/1/properties/payload/items/allOf/1/properties/reservationActionMetaData/allOf/0/allOf/0/properties/supplierPriceElements/allOf/1/properties/purchaseRate/allOf/1/properties/inDetail/properties/perDate/items/properties/detailedPriceInformation/items/properties/inDetail/properties/fees/items",
                                                                    },
                                                                  },
                                                                  salesOfferIds: {
                                                                    type: "array",
                                                                    items: {
                                                                      $ref: "#/allOf/1/properties/payload/items/allOf/1/properties/reservationActionMetaData/allOf/0/allOf/0/properties/supplierPriceElements/allOf/1/properties/purchaseRate/allOf/1/properties/inDetail/properties/perDate/items/properties/detailedPriceInformation/items/properties/inDetail/properties/fees/items",
                                                                    },
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                  perPax: {
                                                    type: "array",
                                                    items: {
                                                      type: "object",
                                                      properties: {
                                                        id: {
                                                          type: "string",
                                                        },
                                                        amount: {
                                                          $ref: "#/allOf/1/properties/payload/items/allOf/1/properties/reservationActionMetaData/allOf/0/allOf/0/properties/supplierPriceElements/allOf/1/properties/fee/properties/modificationFee/properties/amount",
                                                        },
                                                        salesOfferIds: {
                                                          type: "array",
                                                          items: {
                                                            type: "string",
                                                          },
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
                                          cancellationFee: {
                                            $ref: "#/allOf/1/properties/payload/items/allOf/1/properties/reservationActionMetaData/allOf/0/allOf/0/properties/supplierPriceElements/allOf/1/properties/purchaseRate/allOf/0",
                                          },
                                        },
                                      },
                                    },
                                  },
                                ],
                              },
                              type: {
                                type: "string",
                              },
                            },
                          },
                          {
                            type: "object",
                            required: ["test"],
                            properties: {
                              test: {
                                type: "string",
                              },
                            },
                          },
                        ],
                        properties: {
                          type: {
                            type: "string",
                          },
                        },
                      },
                      {
                        type: "object",
                        required: ["test"],
                        properties: {
                          test: {
                            type: "string",
                          },
                        },
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
