/* eslint-disable camelcase */
"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const path = require("../../utils/path");
const setupHttpMocks = require("../../utils/setup-http-mocks");
const createStoplightDefaults = require("../../../lib/bundle/stoplight/legacy");

const cwd = typeof window === "object" ? location.origin + "/base/test/specs/custom-bundling-roots-legacy-stoplight" : __dirname;

describe("Stoplight-specific (legacy) defaults", () => {
  describe("reference files", () => {
    let defaults;
    beforeEach(() => {
      setupHttpMocks({
        "https://example.com/api/nodes.raw?srn=org/proj/data-model-dictionary/reference/common/models/Airport": require("./reference/mocks/airport-unmasked.json"),
        "https://example.com/api/nodes.raw?srn=org/proj/data-model-dictionary/reference/common/models/Airport&mid=123": require("./reference/mocks/airport-masked.json"),
      });

      defaults = createStoplightDefaults({
        cwd,
        endpointUrl: "http://localhost:8080/api/nodes.raw/",
        srn: "gh/stoplightio/test"
      });
    });

    it("should allow to customize bundling roots for OAS2", async () => {
      let parser = new $RefParser();

      const schema = await parser.bundle(path.rel("specs/custom-bundling-roots-legacy-stoplight/reference/openapi-2.json"), {
        bundle: defaults.oas2,
      });

      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(require("./reference/openapi-2-bundled.js"));
    });

    it("should allow to customize bundling roots for OAS3", async () => {
      let parser = new $RefParser();

      const schema = await parser.bundle(path.rel("specs/custom-bundling-roots-legacy-stoplight/reference/openapi-3.json"), {
        bundle: defaults.oas3,
      });

      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(require("./reference/openapi-3.bundled.js"));
    });
  });

  it("given no collision, should not append mid to the key", async () => {
    let defaults = createStoplightDefaults({
      cwd,
      endpointUrl: "http://localhost:8080/api/nodes.raw/",
      srn: "gh/stoplightio/test"
    });

    setupHttpMocks({
      "http://localhost:8080/api/nodes.raw?srn=gh/stoplightio/test/Book.v1.yaml&mid=2": {
        properties: {
          id: {
            type: "string"
          }
        }
      }
    });

    const model = {
      properties: {
        id: {
          type: "string"
        },
        book: {
          $ref: "http://localhost:8080/api/nodes.raw/?srn=gh/stoplightio/test/Book.v1.yaml&mid=2"
        }
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
          properties: {
            id: {
              type: "string"
            }
          }
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

  it("given collision, should append mid to the key", async () => {
    let defaults = createStoplightDefaults({
      cwd,
      endpointUrl: "http://localhost:8080/api/nodes.raw/",
      srn: "gh/stoplightio/test"
    });

    setupHttpMocks({
      "http://localhost:8080/api/nodes.raw?srn=gh/stoplightio/test/Book.v1.yaml": { title: "Plain Book v1" },
      "http://localhost:8080/api/nodes.raw?srn=gh/stoplightio/test/Book.v1.yaml&mid=2": { title: "Book v1 mid 2" },
      "http://localhost:8080/api/nodes.raw?srn=gh/stoplightio/test/Book.v1.yaml&mid=3": { title: "Book v1 mid 3" },
      "http://localhost:8080/api/nodes.raw?srn=gh/stoplightio/test/Book.v2.yaml&mid=104": { title: "Book v2 mid 104" },
    });

    const model = {
      properties: {
        "0_book_mid_2": {
          $ref: "http://localhost:8080/api/nodes.raw/?srn=gh/stoplightio/test/Book.v1.yaml&mid=2"
        },
        "1_book_mid_3": {
          $ref: "http://localhost:8080/api/nodes.raw/?srn=gh/stoplightio/test/Book.v1.yaml&mid=3"
        },
        "2_book": {
          $ref: "http://localhost:8080/api/nodes.raw/?srn=gh/stoplightio/test/Book.v1.yaml"
        },
        book_v2_mid_104: {
          $ref: "http://localhost:8080/api/nodes.raw/?srn=gh/stoplightio/test/Book.v2.yaml&mid=104"
        },
      },
      definitions: {
        "Book.v2": {
          title: "Book v2"
        }
      },
    };

    let parser = new $RefParser();

    const schema = await parser.bundle(__dirname, model, {
      bundle: defaults.json_schema,
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      definitions: {
        "Book.v2": {
          title: "Book v2"
        },
        "Book.v1": {
          title: "Plain Book v1",
        },
        "Book.v1_m2": {
          title: "Book v1 mid 2",
        },
        "Book.v1_m3": {
          title: "Book v1 mid 3",
        },
        "Book.v2_m104": {
          title: "Book v2 mid 104",
        }
      },
      properties: {
        "0_book_mid_2": {
          $ref: "#/definitions/Book.v1_m2"
        },
        "1_book_mid_3": {
          $ref: "#/definitions/Book.v1_m3"
        },
        "2_book": {
          $ref: "#/definitions/Book.v1"
        },
        book_v2_mid_104: {
          $ref: "#/definitions/Book.v2_m104"
        }
      }
    });
  });

  it("should recognize platform references", async () => {
    let defaults = createStoplightDefaults({
      cwd,
      endpointUrl: "https://example.com/api/nodes.raw/",
      srn: "org/proj/data-model-dictionary"
    });

    setupHttpMocks({
      "https://example.com/api/nodes.raw?srn=org/proj/data-model-dictionary/reference/book.yaml": {
        properties: {
          id: {
            type: "string"
          }
        }
      },
      "https://example.com/api/nodes.raw/org/proj/data-model-dictionary/reference/book.yaml": {
        properties: {
          id: {
            type: "string"
          }
        }
      },
    });

    const model = {
      properties: {
        id: {
          type: "string"
        },
        book: {
          oneOf: [
            {
              $ref: "https://example.com/api/nodes.raw/?srn=org/proj/data-model-dictionary/reference/book.yaml"
            },
            {
              $ref: "https://example.com/api/nodes.raw/org/proj/data-model-dictionary/reference/book.yaml"
            },
          ],
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
        Book: {
          properties: {
            id: {
              type: "string"
            }
          }
        }
      },
      properties: {
        book: {
          oneOf: [
            {
              $ref: "#/definitions/Book"
            },
            {
              $ref: "#/definitions/Book"
            },
          ],
        },
        id: {
          type: "string"
        }
      }
    });
  });
});
