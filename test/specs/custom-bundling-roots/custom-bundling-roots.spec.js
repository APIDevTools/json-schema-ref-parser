/* eslint-disable camelcase */
"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const path = require("../../utils/path");
const setupHttpMocks = require("../../utils/setup-http-mocks");
const { getDefaultsForOldJsonSchema, getDefaultsForOAS2 } = require("../../../lib/bundle/defaults");

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
});
