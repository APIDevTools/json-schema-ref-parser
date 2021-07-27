"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const path = require("../../utils/path");

describe("Fields override", () => {
  let model;

  beforeEach(() => {
    model = {
      properties: {
        users: {
          type: "array",
          items: {
            $ref: "./definitions.json#/User",
            summary: "My workspace user",
            description: "A workspace user is -"
          }
        },
        id: {
          $ref: "./definitions.json#/User/properties/id",
          summary: "Entry id",
        }
      }
    };
  });

  it("dereference should allow fields override", async () => {
    let parser = new $RefParser();
    let schema = await parser.dereference(path.rel("specs/fields-override/schema.json"), model, {});

    expect(schema).to.deep.equal({
      properties: {
        users: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "integer",
                summary: "DB id",
                description: "Some description"
              },
            },
            summary: "My workspace user",
            description: "A workspace user is -",
          },
        },
        id: {
          type: "integer",
          summary: "Entry id",
          description: "Some description"
        }
      }
    });
  });

  it("bundle should allow fields override", async () => {
    let parser = new $RefParser();
    let schema = await parser.bundle(path.rel("specs/fields-override/schema.json"), model, {});

    expect(schema).to.deep.equal({
      properties: {
        users: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "integer",
                summary: "DB id",
                description: "Some description"
              },
            },
            summary: "My workspace user",
            description: "A workspace user is -",
          },
        },
        id: {
          $ref: "#/properties/users/items/properties/id",
          summary: "Entry id",
        }
      }
    });
  });
});
