helper.dereferenced.circular =
{
  "self": {
    "definitions": {
      "pet": {
        "type": "object",
        "properties": {
          "age": {
            "type": "number"
          },
          "name": {
            "type": "string"
          },
          "species": {
            "enum": [
              "cat",
              "dog",
              "bird",
              "fish"
            ],
            "type": "string"
          }
        },
        "title": "pet"
      },
      "thing": {
        "$ref": "#/definitions/thing"
      },
      "child": {
        "type": "object",
        "properties": {
          "pet": {
            "type": "object",
            "properties": {
              "age": {
                "type": "number"
              },
              "name": {
                "type": "string"
              },
              "species": {
                "enum": [
                  "cat",
                  "dog",
                  "bird",
                  "fish"
                ],
                "type": "string"
              }
            },
            "title": "pet"
          },
          "name": {
            "type": "string"
          }
        },
        "title": "child"
      }
    }
  },

  ancestor: {
    fullyDereferenced: {
      "definitions": {
        "person": {
          "title": "person",
          "properties": {
            "spouse": null,
            "pet": null,
            "name": {
              "type": "string"
            }
          }
        },
        "pet": {
          "type": "object",
          "properties": {
            "age": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "species": {
              "enum": [
                "cat",
                "dog",
                "bird",
                "fish"
              ],
              "type": "string"
            }
          },
          "title": "pet"
        }
      }
    },

    ignoreCircular$Refs: {
      "definitions": {
        "person": {
          "title": "person",
          "properties": {
            "spouse": {
              "$ref": "#/definitions/person"
            },
            "pet": null,
            "name": {
              "type": "string"
            }
          }
        },
        "pet": {
          "type": "object",
          "properties": {
            "age": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "species": {
              "enum": [
                "cat",
                "dog",
                "bird",
                "fish"
              ],
              "type": "string"
            }
          },
          "title": "pet"
        }
      }
    }
  },

  indirect: {
    fullyDereferenced: {
      "definitions": {
        "parent": {
          "title": "parent",
          "properties": {
            "name": {
              "type": "string"
            },
            "children": {
              "items": null,
              "type": "array"
            }
          }
        },
        "child": {
          "title": "child",
          "properties": {
            "parents": {
              "items": null,
              "type": "array"
            },
            "pet": null,
            "name": {
              "type": "string"
            }
          }
        },
        "pet": {
          "type": "object",
          "properties": {
            "age": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "species": {
              "enum": [
                "cat",
                "dog",
                "bird",
                "fish"
              ],
              "type": "string"
            }
          },
          "title": "pet"
        }
      }
    },

    ignoreCircular$Refs: {
      "definitions": {
        "parent": {
          "title": "parent",
          "properties": {
            "name": {
              "type": "string"
            },
            "children": {
              "items": {
                "$ref": "#/definitions/child"
              },
              "type": "array"
            }
          }
        },
        "child": {
          "title": "child",
          "properties": {
            "parents": {
              "items": {
                $ref: "#/definitions/parent"
              },
              "type": "array"
            },
            "pet": null,
            "name": {
              "type": "string"
            }
          }
        },
        "pet": {
          "type": "object",
          "properties": {
            "age": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "species": {
              "enum": [
                "cat",
                "dog",
                "bird",
                "fish"
              ],
              "type": "string"
            }
          },
          "title": "pet"
        }
      }
    }
  },

  indirectAncestor: {
    fullyDereferenced: {
      "definitions": {
        "parent": {
          "title": "parent",
          "properties": {
            "name": {
              "type": "string"
            },
            "child": null
          },
        },
        "child": {
          "title": "child",
          "properties": {
            "name": {
              "type": "string"
            },
            "pet": null,
            "children": {
              "items": null,
              "type": "array",
              "description": "children"
            }
          },
        },
        "pet": {
          "type": "object",
          "properties": {
            "age": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "species": {
              "enum": [
                "cat",
                "dog",
                "bird",
                "fish"
              ],
              "type": "string"
            }
          },
          "title": "pet"
        }
      }
    },

    ignoreCircular$Refs: {
      "definitions": {
        "parent": {
          "title": "parent",
          "properties": {
            "name": {
              "type": "string"
            },
            "child": {
              $ref: "#/definitions/child"
            }
          },
        },
        "child": {
          "title": "child",
          "properties": {
            "name": {
              "type": "string"
            },
            "pet": null,
            "children": {
              "items": {
                $ref: "#/definitions/child"
              },
              "type": "array",
              "description": "children"
            }
          },
        },
        "pet": {
          "type": "object",
          "properties": {
            "age": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "species": {
              "enum": [
                "cat",
                "dog",
                "bird",
                "fish"
              ],
              "type": "string"
            }
          },
          "title": "pet"
        }
      }
    }
  }
};

helper.dereferenced.circular.ancestor.fullyDereferenced.definitions.person.properties.spouse =
  helper.dereferenced.circular.ancestor.fullyDereferenced.definitions.person;

helper.dereferenced.circular.ancestor.fullyDereferenced.definitions.person.properties.pet =
  helper.dereferenced.circular.ancestor.fullyDereferenced.definitions.pet;

helper.dereferenced.circular.ancestor.ignoreCircular$Refs.definitions.person.properties.pet =
  helper.dereferenced.circular.ancestor.ignoreCircular$Refs.definitions.pet;

helper.dereferenced.circular.indirect.fullyDereferenced.definitions.parent.properties.children.items =
  helper.dereferenced.circular.indirect.fullyDereferenced.definitions.child;

helper.dereferenced.circular.indirect.fullyDereferenced.definitions.child.properties.parents.items =
  helper.dereferenced.circular.indirect.fullyDereferenced.definitions.parent;

helper.dereferenced.circular.indirect.fullyDereferenced.definitions.child.properties.pet =
  helper.dereferenced.circular.indirect.fullyDereferenced.definitions.pet;

helper.dereferenced.circular.indirect.ignoreCircular$Refs.definitions.child.properties.pet =
  helper.dereferenced.circular.indirect.ignoreCircular$Refs.definitions.pet;

helper.dereferenced.circular.indirectAncestor.fullyDereferenced.definitions.parent.properties.child =
  helper.dereferenced.circular.indirectAncestor.fullyDereferenced.definitions.child;

helper.dereferenced.circular.indirectAncestor.fullyDereferenced.definitions.child.properties.children.items =
  helper.dereferenced.circular.indirectAncestor.fullyDereferenced.definitions.child;

helper.dereferenced.circular.indirectAncestor.fullyDereferenced.definitions.child.properties.pet =
  helper.dereferenced.circular.indirectAncestor.fullyDereferenced.definitions.pet;

helper.dereferenced.circular.indirectAncestor.ignoreCircular$Refs.definitions.child.properties.pet =
  helper.dereferenced.circular.indirectAncestor.ignoreCircular$Refs.definitions.pet;
