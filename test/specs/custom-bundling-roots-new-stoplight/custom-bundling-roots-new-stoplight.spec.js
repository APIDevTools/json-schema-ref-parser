/* eslint-disable camelcase */
"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const setupHttpMocks = require("../../utils/setup-http-mocks");
const createStoplightDefaults = require("../../../lib/bundle/stoplight/defaults");

const cwd = typeof window === "object" ? location.origin + "/base/test/specs/custom-bundling-roots-new-stoplight" : __dirname;

describe("Stoplight-specific defaults", () => {
  let model;

  beforeEach(() => {
    setupHttpMocks({
      "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/Book.v1.json": {
        title: "Book"
      },
      "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/Book.v1.json?deref=bundle&mid=1": {
        title: "Book mid 1"
      },
      "http://marc.stoplight-local.com:8080/api/v1/projects/marc/my-project/nodes/models/Street.v1.json": {
        title: "Street"
      },
      "http://marc.stoplight-local.com:8080/api/v1/projects/marc/my-project/nodes/models/Street.v1.json?mid=1": {
        title: "Street mid 1"
      },
    });

    model = {
      properties: {
        id: {
          type: "string"
        },
        book: {
          $ref: "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/Book.v1.json"
        },
        "masked-book": {
          $ref: "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/Book.v1.json?deref=bundle&mid=1"
        },
        street: {
          $ref: "http://marc.stoplight-local.com:8080/api/v1/projects/marc/my-project/nodes/models/Street.v1.json"
        },
        "masked-street": {
          $ref: "http://marc.stoplight-local.com:8080/api/v1/projects/marc/my-project/nodes/models/Street.v1.json?mid=1"
        },
      }
    };
  });

  it("given explicit endpointUrl, should recognize platform references pointing at that entity", async () => {
    let defaults = createStoplightDefaults({
      cwd,
      endpointUrl: "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes",
    });

    let parser = new $RefParser();

    const schema = await parser.bundle(__dirname, model, {
      bundle: defaults.json_schema,
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      definitions: {
        "Book.v1": {
          title: "Book"
        },
        "Book.v1_m1": {
          title: "Book mid 1"
        }
      },
      properties: {
        book: {
          $ref: "#/definitions/Book.v1"
        },
        "masked-book": {
          $ref: "#/definitions/Book.v1_m1"
        },
        id: {
          type: "string"
        },
        street: {
          title: "Street"
        },
        "masked-street": {
          title: "Street mid 1"
        }
      }
    });
  });

  it("given no explicit endpointUrl, should recognize platform references pointing at any Stoplight-compatible entity", async () => {
    let defaults = createStoplightDefaults({
      cwd,
    });

    let parser = new $RefParser();

    const schema = await parser.bundle(__dirname, model, {
      bundle: defaults.json_schema,
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      definitions: {
        "Book.v1": {
          title: "Book"
        },
        "Book.v1_m1": {
          title: "Book mid 1"
        },
        "Street.v1": {
          title: "Street"
        },
        "Street.v1_m1": {
          title: "Street mid 1"
        }
      },
      properties: {
        book: {
          $ref: "#/definitions/Book.v1"
        },
        "masked-book": {
          $ref: "#/definitions/Book.v1_m1"
        },
        id: {
          type: "string"
        },
        street: {
          $ref: "#/definitions/Street.v1"
        },
        "masked-street": {
          $ref: "#/definitions/Street.v1_m1"
        }
      }
    });
  });

  it("should handle external URLs", async () => {
    setupHttpMocks({
      "https://api.stoplight.io/v1/schema/user.json": {
        definitions: {
          status: {
            type: "string",
          }
        },
        type: "object",
        properties: {
          orders: {
            type: "object",
            properties: {
              new: { $ref: "#/definitions/status" },
              cancelled: { $ref: "#/definitions/status" },
              error: { $ref: "#/definitions/status" }
            },
          }
        },
      },
    });

    let parser = new $RefParser();
    let defaults = createStoplightDefaults({
      cwd: __dirname,
      endpointUrl: "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes",
    });

    const document = {
      swagger: "2.0",
      paths: {
        "/": {
          get: {
            responses: {
              200: {
                $ref: "#/responses/Address"
              }
            }
          },
          post: {
            responses: {
              200: {
                $ref: "#/responses/Address"
              }
            },
            parameters: [
              {
                in: "body",
                schema: {
                  $ref: "https://api.stoplight.io/v1/schema/user.json"
                }
              }
            ]
          }
        }
      },
      responses: {
        Address: {
          title: "Address",
        }
      }
    };

    const schema = await parser.bundle(document, {
      bundle: defaults.oas2,
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      swagger: "2.0",
      definitions: {
        User_Status: {
          type: "string"
        }
      },
      paths: {
        "/": {
          get: {
            responses: {
              200: {
                $ref: "#/responses/Address"
              }
            }
          },
          post: {
            parameters: [
              {
                in: "body",
                schema: {
                  type: "object",
                  definitions: {},
                  properties: {
                    orders: {
                      type: "object",
                      properties: {
                        cancelled: {
                          $ref: "#/definitions/User_Status"
                        },
                        error: {
                          $ref: "#/definitions/User_Status"
                        },
                        new: {
                          $ref: "#/definitions/User_Status"
                        }
                      },
                    }
                  }
                }
              }
            ],
            responses: {
              200: {
                $ref: "#/responses/Address"
              }
            }
          }
        }
      },
      responses: {
        Address: {
          title: "Address"
        }
      }
    });
  });
});
