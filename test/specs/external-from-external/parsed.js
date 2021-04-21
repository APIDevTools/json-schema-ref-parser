"use strict";

module.exports = {
  schema: {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    definitions: {
      externalOne: {
        type: "string",
        enum: {
          $ref: "./external-one.yaml",
        },
      },
      internalOne: {
        $ref: "#/definitions/externalOne",
      },
    },
    properties: {
      pageOne: {
        $ref: "./page-one.yaml",
      },
    },
  },

  pageOne: {
    type: "object",
    properties: {
      nestedProperty: {
        $ref: "./external-from-external.yaml#/definitions/externalOne",
        $bespokeKey: {
          append: {
            component: "Callout",
            props: {
              type: "warning",
            },
            on: [
              "GB",
              [
                "PROHIBITED",
                {
                  $ref: "./external-two.yaml",
                },
              ],
            ],
          },
        },
        not: {
          enum: {
            $ref: "./external-two.yaml",
          },
        },
      },
    },
    allOf: [
      {
        if: {
          properties: {
            nestedProperty: {
              type: "string",
              enum: {
                $ref: "./external-three.yaml",
              },
            },
          },
        },
        then: {
          required: ["otherBooleanProperty"],
          properties: {
            otherBooleanProperty: {
              type: "boolean",
            },
          },
        },
      },
      {
        if: {
          properties: {
            nestedProperty: {
              type: "string",
              enum: {
                $ref: "./external-three.yaml",
              },
            },
            otherBooleanProperty: {
              const: false,
            },
          },
        },
        then: {
          properties: {
            nestedOtherProperty: {
              $ref: "./external-from-external.yaml#/definitions/externalOne",
              $bespokeKey: {
                append: {
                  component: "Callout",
                  props: {
                    type: "warning",
                  },
                  on: [
                    [
                      "PROHIBITED",
                      {
                        $ref: "./external-two.yaml",
                      },
                    ],
                  ],
                },
              },
              not: {
                enum: {
                  $ref: "./external-two.yaml",
                },
              },
            },
          },
        },
      },
    ],
  },

  externalOne: [
    "EXTERNAL",
    "ONE"
  ],

  externalTwo: [
    "EXTERNAL",
    "TWO"
  ],
  externalThree: [
    "EXTERNAL",
    "THREE"
  ]
};
