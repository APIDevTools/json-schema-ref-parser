"use strict";

const helper = require("../../fixtures/helper");

helper.parsed.resolvers =
{
  definitions: {
    foo: {
      $ref: "foo://bar.baz"
    },
    pet: {
      $ref: "definitions/pet.yaml"
    },
    name: {
      required: [
        "first",
        "last"
      ],
      type: "object",
      properties: {
        last: {
          minLength: 1,
          type: "string"
        },
        first: {
          minLength: 1,
          type: "string"
        }
      }
    }
  },
  required: [
    "name"
  ],
  type: "object",
  properties: {
    gender: {
      enum: [
        "male",
        "female"
      ],
      type: "string"
    },
    age: {
      minimum: 0,
      type: "integer"
    },
    name: {
      required: [
        "first",
        "last"
      ],
      type: "object",
      properties: {
        last: {
          minLength: 1,
          type: "string"
        },
        first: {
          minLength: 1,
          type: "string"
        }
      }
    }
  },
  title: "Person"
};
