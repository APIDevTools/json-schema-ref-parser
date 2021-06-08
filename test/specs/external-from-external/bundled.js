"use strict";

module.exports = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  definitions: {
    externalOne: { type: "string", enum: ["EXTERNAL", "ONE"]},
    internalOne: { $ref: "#/definitions/externalOne" },
  },
  properties: {
    pageOne: {
      type: "object",
      properties: {
        nestedProperty: {
          $ref: "#/definitions/externalOne",
          $bespokeKey: {
            append: {
              component: "Callout",
              props: { type: "warning" },
              on: [
                "GB",
                [
                  "PROHIBITED",
                  {
                    $ref:
                      "#/properties/pageOne/properties/nestedProperty/not/enum",
                  },
                ],
              ],
            },
          },
          not: { enum: ["EXTERNAL", "TWO"]},
        },
      },
      allOf: [
        {
          if: {
            properties: {
              nestedProperty: { type: "string", enum: ["EXTERNAL", "THREE"]},
            },
          },
          then: {
            required: ["otherBooleanProperty"],
            properties: { otherBooleanProperty: { type: "boolean" }},
          },
        },
        {
          if: {
            properties: {
              nestedProperty: {
                type: "string",
                enum: {
                  $ref:
                    "#/properties/pageOne/allOf/0/if/properties/nestedProperty/enum",
                },
              },
              otherBooleanProperty: { const: false },
            },
          },
          then: {
            properties: {
              nestedOtherProperty: {
                $ref: "#/definitions/externalOne",
                $bespokeKey: {
                  append: {
                    component: "Callout",
                    props: { type: "warning" },
                    on: [
                      [
                        "PROHIBITED",
                        {
                          $ref:
                            "#/properties/pageOne/properties/nestedProperty/not/enum",
                        },
                      ],
                    ],
                  },
                },
                not: {
                  enum: {
                    $ref:
                      "#/properties/pageOne/properties/nestedProperty/not/enum",
                  },
                },
              },
            },
          },
        },
      ],
    },
  },
};
