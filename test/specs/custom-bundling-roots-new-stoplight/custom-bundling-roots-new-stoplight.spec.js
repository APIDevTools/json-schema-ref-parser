/* eslint-disable camelcase */
"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const setupHttpMocks = require("../../utils/setup-http-mocks");
const createStoplightDefaults = require("../../../lib/bundle/stoplight/defaults");

const cwd = typeof window === "object" ? location.origin + "/base/test/specs/custom-bundling-roots-new-stoplight" : __dirname;

describe("Stoplight-specific defaults", () => {
  it("should recognize platform references", async () => {
    let defaults = createStoplightDefaults({
      cwd,
      endpointUrl: "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes",
    });

    setupHttpMocks({
      "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/Book.v1.json": {
        title: "Book"
      },
    });

    const model = {
      properties: {
        id: {
          type: "string"
        },
        book: {
          $ref: "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/Book.v1.json"
        },
      }
    };

    let parser = new $RefParser();

    const schema = await parser.bundle(__dirname, model, {
      bundle: defaults.json_schema,
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      definitions: {
        "Book.v1": {
          title: "Book"
        }
      },
      properties: {
        book: {
          $ref: "#/definitions/Book.v1"
        },
        id: {
          type: "string"
        }
      }
    });
  });
});
