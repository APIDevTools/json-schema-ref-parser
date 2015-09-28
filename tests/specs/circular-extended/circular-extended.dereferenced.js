helper.dereferenced.circularExtended =
{
  "self": {
    "definitions": {
      "thing": {
        "title": "thing",
        "$ref": "#/definitions/thing",
        "description": "This JSON Reference has additional properties (other than $ref). Normally, this creates a new type that extends the referenced type, but since this reference points to ITSELF, it doesn't do that.\n",
      }
    }
  },

  ancestor: {
    fullyDereferenced: {
      "definitions": {
        "person": {
          "title": "person",
          "properties": {
            "spouse": {
              "title": "person",
              "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"person\".\n",
              "properties": null
            },
            "pet": {
              "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"pet\".\n",
              "title": "pet",
              "type": "object",
              "properties": null
            },
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
        },
      }
    },

    ignoreCircular$Refs: {
      "definitions": {
        "person": {
          "title": "person",
          "properties": {
            "spouse": {
              "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"person\".\n",
              "$ref": "#/definitions/person"
            },
            "pet": {
              "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"pet\".\n",
              "title": "pet",
              "type": "object",
              "properties": null
            },
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
        },
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
              "items": {
                "title": "child",
                "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"child\".\n",
                properties: null
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
                "title": "parent",
                "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"parent\".\n",
                properties: null
              },
              "type": "array"
            },
            "pet": {
              "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"pet\".\n",
              "title": "pet",
              "type": "object",
              "properties": null
            },
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
        },
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
                "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"child\".\n",
                $ref: "#/definitions/child"
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
                "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"parent\".\n",
                $ref: "#/definitions/parent"
              },
              "type": "array"
            },
            "pet": {
              "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"pet\".\n",
              "title": "pet",
              "type": "object",
              "properties": null
            },
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
        },
      }
    }
  },

  indirectAncestor: {
    fullyDereferenced: {
      "definitions": {
        "pet": {
          "title": "pet",
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
        },
        "parent": {
          "title": "parent",
          "properties": {
            "name": {
              "type": "string"
            },
            "child": {
              "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"child\".\n",
              "title": "child",
              properties: null
            }
          },
        },
        "child": {
          "title": "child",
          "properties": {
            "pet": {
              "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"pet\".\n",
              "title": "pet",
              "type": "object",
              properties: null
            },
            "name": {
              "type": "string"
            },
            "children": {
              "items": {
                "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"child\".\n",
                "title": "child",
                properties: null
              },
              "type": "array",
              "description": "children"
            }
          },
        }
      }
    },

    ignoreCircular$Refs: {
      "definitions": {
        "pet": {
          "title": "pet",
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
        },
        "parent": {
          "title": "parent",
          "properties": {
            "name": {
              "type": "string"
            },
            "child": {
              "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"child\".\n",
              $ref: "#/definitions/child"
            }
          },
        },
        "child": {
          "title": "child",
          "properties": {
            "pet": {
              "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"pet\".\n",
              "title": "pet",
              "type": "object",
              properties: null
            },
            "name": {
              "type": "string"
            },
            "children": {
              "items": {
                "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"child\".\n",
                $ref: "#/definitions/child"
              },
              "type": "array",
              "description": "children"
            }
          },
        }
      }
    }
  }
};

helper.dereferenced.circularExtended.ancestor.fullyDereferenced.definitions.person.properties.spouse.properties =
  helper.dereferenced.circularExtended.ancestor.fullyDereferenced.definitions.person.properties;

helper.dereferenced.circularExtended.ancestor.fullyDereferenced.definitions.person.properties.pet.properties =
  helper.dereferenced.circularExtended.ancestor.fullyDereferenced.definitions.pet.properties;

helper.dereferenced.circularExtended.ancestor.ignoreCircular$Refs.definitions.person.properties.pet.properties =
  helper.dereferenced.circularExtended.ancestor.ignoreCircular$Refs.definitions.pet.properties;

helper.dereferenced.circularExtended.indirect.fullyDereferenced.definitions.parent.properties.children.items.properties =
  helper.dereferenced.circularExtended.indirect.fullyDereferenced.definitions.child.properties;

helper.dereferenced.circularExtended.indirect.fullyDereferenced.definitions.child.properties.parents.items.properties =
  helper.dereferenced.circularExtended.indirect.fullyDereferenced.definitions.parent.properties;

helper.dereferenced.circularExtended.indirect.fullyDereferenced.definitions.child.properties.pet.properties =
  helper.dereferenced.circularExtended.indirect.fullyDereferenced.definitions.pet.properties;

helper.dereferenced.circularExtended.indirect.ignoreCircular$Refs.definitions.child.properties.pet.properties =
  helper.dereferenced.circularExtended.indirect.ignoreCircular$Refs.definitions.pet.properties;

helper.dereferenced.circularExtended.indirectAncestor.fullyDereferenced.definitions.parent.properties.child.properties =
  helper.dereferenced.circularExtended.indirectAncestor.fullyDereferenced.definitions.child.properties;

helper.dereferenced.circularExtended.indirectAncestor.fullyDereferenced.definitions.child.properties.children.items.properties =
  helper.dereferenced.circularExtended.indirectAncestor.fullyDereferenced.definitions.child.properties;

helper.dereferenced.circularExtended.indirectAncestor.fullyDereferenced.definitions.child.properties.pet.properties =
  helper.dereferenced.circularExtended.indirectAncestor.fullyDereferenced.definitions.pet.properties;

helper.dereferenced.circularExtended.indirectAncestor.ignoreCircular$Refs.definitions.child.properties.pet.properties =
  helper.dereferenced.circularExtended.indirectAncestor.ignoreCircular$Refs.definitions.pet.properties;
