helper.parsed.circularExtended =
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
            "$ref": "#/definitions/pet"
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

  indirect: {
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
              "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"parent\".\n",
              "$ref": "#/definitions/parent"
            },
            "type": "array"
          },
          "pet": {
            "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"pet\".\n",
            "$ref": "#/definitions/pet"
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

  indirectAncestor: {
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
      "parent": {
        "properties": {
          "name": {
            "type": "string"
          },
          "child": {
            "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"child\".\n",
            "$ref": "#/definitions/child"
          }
        },
        "title": "parent"
      },
      "child": {
        "properties": {
          "pet": {
            "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"pet\".\n",
            "$ref": "#/definitions/pet"
          },
          "name": {
            "type": "string"
          },
          "children": {
            "items": {
              "description": "This JSON Reference has additional properties (other than $ref). This creates a new type that extends \"child\".\n",
              "$ref": "#/definitions/child"
            },
            "type": "array",
            "description": "children"
          }
        },
        "title": "child"
      }
    }
  }
};
