export default {
  self: {
    definitions: {
      pet: {
        type: "object",
        properties: {
          age: {
            type: "number",
          },
          name: {
            type: "string",
          },
          species: {
            enum: ["cat", "dog", "bird", "fish"],
            type: "string",
          },
        },
        title: "pet",
      },
      thing: {
        $ref: "#/definitions/thing",
      },
      child: {
        type: "object",
        properties: {
          pet: {
            $ref: "#/definitions/pet",
          },
          name: {
            type: "string",
          },
        },
        title: "child",
      },
    },
  },

  ancestor: {
    definitions: {
      person: {
        title: "person",
        properties: {
          spouse: {
            $ref: "#/definitions/person",
          },
          pet: {
            $ref: "#/definitions/pet",
          },
          name: {
            type: "string",
          },
          age: {
            type: "number",
          },
        },
      },
      pet: {
        type: "object",
        properties: {
          age: {
            type: "number",
          },
          name: {
            type: "string",
          },
          species: {
            enum: ["cat", "dog", "bird", "fish"],
            type: "string",
          },
        },
        title: "pet",
      },
    },
  },

  indirect: {
    definitions: {
      parent: {
        title: "parent",
        properties: {
          name: {
            type: "string",
          },
          children: {
            items: {
              $ref: "#/definitions/child",
            },
            type: "array",
          },
        },
      },
      child: {
        title: "child",
        properties: {
          parents: {
            items: {
              $ref: "#/definitions/parent",
            },
            type: "array",
          },
          pet: {
            $ref: "#/definitions/pet",
          },
          name: {
            type: "string",
          },
        },
      },
      pet: {
        type: "object",
        properties: {
          age: {
            type: "number",
          },
          name: {
            type: "string",
          },
          species: {
            enum: ["cat", "dog", "bird", "fish"],
            type: "string",
          },
        },
        title: "pet",
      },
    },
  },

  indirectAncestor: {
    definitions: {
      parent: {
        title: "parent",
        properties: {
          name: {
            type: "string",
          },
          child: {
            $ref: "#/definitions/child",
          },
        },
      },
      child: {
        title: "child",
        properties: {
          name: {
            type: "string",
          },
          pet: {
            $ref: "#/definitions/pet",
          },
          children: {
            items: {
              $ref: "#/definitions/child",
            },
            type: "array",
            description: "children",
          },
        },
      },
      pet: {
        title: "pet",
        type: "object",
        properties: {
          age: {
            type: "number",
          },
          name: {
            type: "string",
          },
          species: {
            enum: ["cat", "dog", "bird", "fish"],
            type: "string",
          },
        },
      },
    },
  },
};
