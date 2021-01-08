/* eslint-disable camelcase */
"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const path = require("../../utils/path");
const setupHttpMocks = require("../../utils/setup-http-mocks");
const { getDefaultsForOldJsonSchema, getDefaultsForOAS2 } = require("../../../lib/bundle/defaults");
const createStoplightDefaults = require("../../../lib/bundle/stoplight-defaults");

const cwd = typeof window === "object" ? location.origin + "/base/test/specs/custom-bundling-roots" : __dirname;

describe("Custom bundling roots", () => {
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

  it("should handle $refs whose parents were remapped", async () => {
    setupHttpMocks({
      "http://localhost:8080/api/nodes.raw?srn=gh/stoplightio/test/Book.v1.yaml": {
        properties: {
          author: {
            $ref: "#/definitions/Book_Author"
          },
          publisher: {
            properties: {
              city: {
                $ref: "#/definitions/City"
              }
            }
          }
        },
        definitions: {
          City: {
            properties: {
              street: {
                type: "string"
              }
            }
          },
          Book_Author: {
            properties: {
              name: {
                type: "string"
              },
              contact: {
                properties: {
                  name: {
                    $ref: "#/definitions/Book_Author/properties/name"
                  },
                  address: {
                    street: {
                      $ref: "#/definitions/City/properties/street"
                    },
                  }
                }
              }
            }
          }
        },
      }
    });

    const model = {
      properties: {
        id: {
          type: "string"
        },
        book: {
          $ref: "http://localhost:8080/api/nodes.raw/?srn=gh/stoplightio/test/Book.v1.yaml"
        }
      }
    };

    let parser = new $RefParser();

    const schema = await parser.bundle(model, {
      bundle: getDefaultsForOldJsonSchema(),
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      definitions: {
        "Book.v1": {
          definitions: {},
          properties: {
            author: {
              $ref: "#/definitions/Book.v1_Book_Author"
            },
            publisher: {
              properties: {
                city: {
                  $ref: "#/definitions/Book.v1_City"
                }
              }
            }
          }
        },
        "Book.v1_Book_Author": {
          properties: {
            contact: {
              properties: {
                address: {
                  street: {
                    $ref: "#/definitions/Book.v1_City/properties/street"
                  }
                },
                name: {
                  $ref: "#/definitions/Book.v1_Book_Author/properties/name"
                }
              }
            },
            name: {
              type: "string"
            }
          }
        },
        "Book.v1_City": {
          properties: {
            street: {
              type: "string"
            }
          }
        },
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

  it("given arbitrary URL, should not attempt to generate pretty key", async () => {
    let defaults = createStoplightDefaults({
      cwd,
      endpointUrl: "http://localhost:8080/api/nodes.raw/",
      srn: "gh/stoplightio/test"
    });

    setupHttpMocks({
      "http://baz.com": {
        foo: {
          title: "foo"
        },
        bar: {
          title: "bar",
        }
      }
    });

    const model = {
      baz: {
        $ref: "http://baz.com"
      },
      foo: {
        $ref: "http://baz.com#/bar"
      },
      bar: {
        $ref: "http://baz.com#/bar"
      },
    };

    let parser = new $RefParser();

    const schema = await parser.bundle(__dirname, model, {
      bundle: defaults.json_schema,
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      bar: {
        $ref: "#/baz/bar"
      },
      baz: {
        bar: {
          title: "bar"
        },
        foo: {
          title: "foo"
        }
      },
      foo: {
        $ref: "#/baz/bar"
      }
    });
  });

  describe("Stoplight-specific defaults", () => {
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

        const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/reference/openapi-2.json"), {
          bundle: defaults.oas2,
        });

        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(require("./reference/openapi-2-bundled.js"));
      });

      it("should allow to customize bundling roots for OAS3", async () => {
        let parser = new $RefParser();

        const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/reference/openapi-3.json"), {
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

    it("should recognize v1 & v2 references", async () => {
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
});
