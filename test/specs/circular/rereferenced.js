"use strict";

module.exports =
{
  self: {
    definitions: {
      pet: {
        type: "object",
        title: "pet",
        properties: {
          age: {
            type: "number"
          },
          name: {
            type: "string"
          },
          species: {
            type: "string",
            enum: [
              "cat",
              "dog",
              "bird",
              "fish"
            ]
          }
        }
      },
      child: {
        type: "object",
        title: "child",
        properties: {
          pet: {
            $ref: "#/definitions/pet"
          },
          name: {
            type: "string"
          }
        }
      },
      thing: {
        $ref: "#/definitions/thing"
      }
    }
  },

  ancestor: {
    definitions: {
      pet: {
        type: "object",
        title: "pet",
        properties: {
          age: {
            type: "number"
          },
          name: {
            type: "string"
          },
          species: {
            type: "string",
            enum: [
              "cat",
              "dog",
              "bird",
              "fish"
            ]
          }
        }
      },
      person: {
        title: "person",
        properties: {
          pet: {
            $ref: "#/definitions/pet"
          },
          age: {
            type: "number"
          },
          name: {
            type: "string"
          },
          spouse: {
            $ref: "#/definitions/person"
          }
        }
      }
    }
  },

  indirect: {
    definitions: {
      pet: {
        type: "object",
        title: "pet",
        properties: {
          age: {
            type: "number"
          },
          name: {
            type: "string"
          },
          species: {
            type: "string",
            enum: [
              "cat",
              "dog",
              "bird",
              "fish"
            ]
          }
        }
      },
      child: {
        title: "child",
        properties: {
          pet: {
            $ref: "#/definitions/pet"
          },
          name: {
            type: "string"
          },
          parents: {
            type: "array",
            items: {
              $ref: "#/definitions/parent"
            }
          }
        }
      },
      parent: {
        title: "parent",
        properties: {
          name: {
            type: "string"
          },
          children: {
            type: "array",
            items: {
              $ref: "#/definitions/child"
            }
          }
        }
      },
      "definitions-child-properties-parents-items": {
        $ref: "#/definitions/parent"
      }
    }
  },

  indirectAncestor: {
    definitions: {
      pet: {
        type: "object",
        title: "pet",
        properties: {
          age: {
            type: "number"
          },
          name: {
            type: "string"
          },
          species: {
            type: "string",
            enum: [
              "cat",
              "dog",
              "bird",
              "fish"
            ]
          }
        }
      },
      child: {
        title: "child",
        properties: {
          pet: {
            $ref: "#/definitions/pet"
          },
          name: {
            type: "string"
          },
          children: {
            type: "array",
            items: {
              $ref: "#/definitions/child"
            },
            description: "children"
          }
        }
      },
      parent: {
        title: "parent",
        properties: {
          name: {
            type: "string"
          },
          child: {
            $ref: "#/definitions/child"
          }
        }
      }
    }
  }

};
