"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const path = require("../../utils/path");
const nock = require("nock");
const { getDefaultsForOAS2, getDefaultsForOAS3 } = require("../../../lib/bundle/defaults");

describe("Custom bundling roots", () => {
  describe("reference files", () => {
    before(() => {
      nock("https://example.com")
        .persist(true)
        .get("/api/nodes.raw/")
        .query({
          srn: "org/proj/data-model-dictionary/reference/common/models/Airport",
        })
        .reply(200, require("./reference/mocks/airport-unmasked.json"));

      nock("https://example.com")
        .persist(true)
        .get("/api/nodes.raw/")
        .query({
          srn: "org/proj/data-model-dictionary/reference/common/models/Airport",
          mid: "123"
        })
        .reply(200, require("./reference/mocks/airport-masked.json"));
    });

    after(() => {
      nock.cleanAll();
    });

    it("should allow to customize bundling roots for OAS2", async () => {
      let parser = new $RefParser();

      const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/reference/openapi-2.json"), {
        bundle: getDefaultsForOAS2(),
      });

      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(require("./reference/openapi-2-bundled.js"));
    });

    it("should allow to customize bundling roots for OAS3", async () => {
      let parser = new $RefParser();

      const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/reference/openapi-3.json"), {
        bundle: getDefaultsForOAS3(),
      });

      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(require("./reference/openapi-3.bundled.js"));
    });
  });

  it("mixed inline", async () => {
    let parser = new $RefParser();

    const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/mixed-inline.json"), {
      bundle: getDefaultsForOAS2(),
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      swagger: "2.0",
      definitions: {
        Id: {
          in: "path",
          name: "id",
          required: true,
          type: "number"
        },
      },
      paths: {
        "/flight/{id}": {
          get: {
            responses: {
              200: {
                schema: {
                  $ref: "#/definitions/Id"
                }
              },
              400: {
                schema: {
                  foo: {
                    $ref: "#/definitions/Id/type"
                  }
                }
              }
            }
          },
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              type: "number"
            }
          ]
        }
      },
    });
  });
});
