/* eslint-disable camelcase */
"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const path = require("../../utils/path");
const setupHttpMocks = require("../../utils/setup-http-mocks");
const { getDefaultsForOldJsonSchema, getDefaultsForOAS2, getDefaultsForOAS3 } = require("../../../lib/bundle/defaults");

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
              $ref: "#/definitions/Id"
            }
          ]
        }
      },
    });
  });

  it("scoped references only", async () => {
    let parser = new $RefParser();

    const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/n"), {
      properties: {
        test: {
          type: {
            $ref: "#/definitions/Number"
          }
        }
      },
      definitions: {
        Number: {
          type: {
            $ref: "./id.json#/type"
          }
        },
        Name: {
          type: "string",
          example: {
            $ref: "./id.json#/name"
          }
        }
      }
    }, {
      bundle: getDefaultsForOAS2(),
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      properties: {
        test: {
          type: {
            $ref: "#/definitions/Number"
          }
        }
      },
      definitions: {
        Number: {
          type: "number",
        },
        Name: {
          example: "id",
          type: "string"
        }
      }
    });
  });

  it("duplicate scoped references only", async () => {
    let parser = new $RefParser();

    const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/n"), {
      properties: {
        test: {
          type: {
            $ref: "#/definitions/Number"
          }
        }
      },
      definitions: {
        Number: {
          type: {
            $ref: "./id.json#/type"
          },
          type2: {
            $ref: "./id.json#/type"
          }
        },
        Name: {
          type: "string",
          example: {
            $ref: "./id.json#/name"
          }
        }
      }
    }, {
      bundle: getDefaultsForOAS2(),
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      properties: {
        test: {
          type: {
            $ref: "#/definitions/Number"
          }
        }
      },
      definitions: {
        Number: {
          type: "number",
          type2: {
            $ref: "#/definitions/Number/type"
          }
        },
        Name: {
          example: "id",
          type: "string"
        }
      }
    });
  });

  it("scoped and full references", async () => {
    let parser = new $RefParser();

    const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/n"), {
      properties: {
        test: {
          type: {
            $ref: "#/definitions/Number"
          }
        }
      },
      definitions: {
        Number: {
          type: {
            $ref: "./id.json#/type"
          }
        },
        Id: {
          $ref: "./id.json"
        }
      }
    }, {
      bundle: getDefaultsForOAS2(),
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      properties: {
        test: {
          type: {
            $ref: "#/definitions/Number"
          }
        }
      },
      definitions: {
        Number: {
          type: {
            $ref: "#/definitions/Id/type"
          }
        },
        Id: {
          type: "number",
          name: "id",
          in: "path",
          required: true
        }
      }
    });
  });

  it("scoped comes before full first", async () => {
    let parser = new $RefParser();

    const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/n"), {
      properties: {
        foo: {
          $ref: "./shared.json#/definitions/foo"
        },
        all: {
          $ref: "./shared.json#"
        },
        bar: {
          $ref: "./shared.json#/definitions/bar"
        }
      }
    }, {
      bundle: getDefaultsForOldJsonSchema(),
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      definitions: {
        Shared: {
          definitions: {
            baz: {
              title: "Baz"
            }
          }
        },
        Shared_Bar: {
          title: "Bar"
        },
        Shared_Foo: {
          title: "Foo"
        }
      },
      properties: {
        foo: {
          $ref: "#/definitions/Shared_Foo"
        },
        all: {
          $ref: "#/definitions/Shared"
        },
        bar: {
          $ref: "#/definitions/Shared_Bar"
        }

      }
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

  it("given arbitrary URL with no clear filepath within, should not attempt to generate pretty key", async () => {
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
      bundle: getDefaultsForOldJsonSchema(),
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

  it("given arbitrary URL with filepath within, should attempt to generate pretty key", async () => {
    setupHttpMocks({
      "http://baz.com/api/nodes/test.json": {
        definitions: {
          foo: {
            title: "foo"
          },
          bar: {
            title: "bar",
          }
        }
      }
    });

    const model = {
      baz: {
        $ref: "http://baz.com/api/nodes/test.json#"
      },
      bar: {
        $ref: "http://baz.com/api/nodes/test.json#/definitions/bar"
      },
    };

    let parser = new $RefParser();

    const schema = await parser.bundle(__dirname, model, {
      bundle: getDefaultsForOldJsonSchema(),
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep. equal({
      baz: {
        $ref: "#/definitions/Test"
      },
      bar: {
        $ref: "#/definitions/Test_Bar"
      },
      definitions: {
        Test: {
          definitions: {
            foo: {
              title: "foo"
            },
          },
        },
        Test_Bar: {
          title: "bar",
        }
      }
    });
  });

  it("should not create redundant roots", async () => {
    let parser = new $RefParser();
    const model = {
      properties: {
        user: {
          properties: {
            id: {
              $ref: "#/definitions/Id"
            }
          },
        }
      },
      definitions: {
        Id: {
          $ref: path.rel("specs/custom-bundling-roots/id.json")
        }
      }
    };

    const schema = await parser.bundle(model, {
      bundle: getDefaultsForOldJsonSchema(),
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      properties: {
        user: {
          properties: {
            id: {
              $ref: "#/definitions/Id"
            }
          },
        }
      },
      definitions: {
        Id: {
          type: "number",
          name: "id",
          in: "path",
          required: true
        }
      }
    });
  });

  describe("OAS3 defaults", () => {
    it("should not touch any other shared component different than schema", async () => {
      setupHttpMocks({
        "http://localhost:8080/test/Book.json": { name: "Book" },
        "http://localhost:8080/test/Address.json": { title: "Address" },
        "http://localhost:8080/test/Pets.json": { title: "Pets" },
      });

      let parser = new $RefParser();
      const model = {
        openapi: "3.0.0",
        paths: {
          "/pets": {
            get: {
              parameters: [
                {
                  $ref: "http://localhost:8080/test/Book.json"
                },
                {
                  $ref: "http://localhost:8080/test/Book.json"
                },
              ],
              responses: {
                200: {
                  content: {
                    "application/json": {
                      schema: {
                        $ref: "http://localhost:8080/test/Address.json",
                      }
                    },
                    "application/yaml": {
                      schema: {
                        $ref: "http://localhost:8080/test/Address.json",
                      }
                    }
                  }
                },
                400: {
                  $ref: "http://localhost:8080/test/Pets.json",
                },
                500: {
                  $ref: "http://localhost:8080/test/Pets.json",
                },
              }
            }
          },
        },
      };

      const schema = await parser.bundle(model, {
        bundle: getDefaultsForOAS3(),
      });

      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal({
        openapi: "3.0.0",
        paths: {
          "/pets": {
            get: {
              parameters: [
                {
                  $ref: "#/components/parameters/Book"
                },
                {
                  $ref: "#/components/parameters/Book"
                }
              ],
              responses: {
                200: {
                  content: {
                    "application/json": {
                      schema: {
                        $ref: "#/components/schemas/Address"
                      }
                    },
                    "application/yaml": {
                      schema: {
                        $ref: "#/components/schemas/Address"
                      }
                    }
                  }
                },
                400: {
                  $ref: "#/components/responses/Pets"
                },
                500: {
                  $ref: "#/components/responses/Pets"
                }
              }
            }
          },
        },
        components: {
          responses: {
            Pets: {
              title: "Pets"
            }
          },
          parameters: {
            Book: {
              name: "Book"
            }
          },
          schemas: {
            Address: {
              title: "Address"
            }
          },
        }
      });
    });
  });
});
