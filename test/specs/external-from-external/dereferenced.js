"use strict";

module.exports = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  definitions: {
    externalOne: { type: "string", enum: ["EXTERNAL", "ONE"]},
    internalOne: { type: "string", enum: ["EXTERNAL", "ONE"]},
  },
  properties: {
    pageOne: {
      type: "object",
      properties: {
        nestedProperty: {
          $bespokeKey: {
            append: {
              component: "Callout",
              props: { type: "warning" },
              on: ["GB", ["PROHIBITED", ["EXTERNAL", "TWO"]]],
            },
          },
          not: { enum: ["EXTERNAL", "TWO"]},
          type: "string",
          enum: ["EXTERNAL", "ONE"],
        },
      },
      allOf: [
        {
          if: {
            properties: {
              nestedProperty: {
                type: "string",
                enum: ["EXTERNAL", "THREE"],
              },
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
                enum: ["EXTERNAL", "THREE"],
              },
              otherBooleanProperty: { const: false },
            },
          },
          then: {
            properties: {
              nestedOtherProperty: {
                $bespokeKey: {
                  append: {
                    component: "Callout",
                    props: { type: "warning" },
                    on: [["PROHIBITED", ["EXTERNAL", "TWO"]]],
                  },
                },
                not: { enum: ["EXTERNAL", "TWO"]},
                type: "string",
                enum: ["EXTERNAL", "ONE"],
              },
            },
          },
        },
      ],
    },
  },
};
