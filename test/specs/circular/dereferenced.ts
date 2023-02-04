const dereferencedSchema = {
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
          name: {
            type: "string",
          },
        },
        title: "child",
      },
    },
  },

  ancestor: {
    fullyDereferenced: {
      definitions: {
        person: {
          title: "person",
          properties: {
            spouse: null,
            pet: null,
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

    ignoreCircular$Refs: {
      definitions: {
        person: {
          title: "person",
          properties: {
            spouse: {
              $ref: "#/definitions/person",
            },
            pet: null,
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
  },

  indirect: {
    fullyDereferenced: {
      definitions: {
        parent: {
          title: "parent",
          properties: {
            name: {
              type: "string",
            },
            children: {
              items: null,
              type: "array",
            },
          },
        },
        child: {
          title: "child",
          properties: {
            parents: {
              items: null,
              type: "array",
            },
            pet: null,
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

    ignoreCircular$Refs: {
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
            pet: null,
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
  },

  indirectAncestor: {
    fullyDereferenced: {
      definitions: {
        parent: {
          title: "parent",
          properties: {
            name: {
              type: "string",
            },
            child: null,
          },
        },
        child: {
          title: "child",
          properties: {
            name: {
              type: "string",
            },
            pet: null,
            children: {
              items: null,
              type: "array",
              description: "children",
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

    ignoreCircular$Refs: {
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
            pet: null,
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
  },
};

// @ts-expect-error TS(2322): Type '{ title: string; properties: { spouse: null;... Remove this comment to see the full error message
dereferencedSchema.ancestor.fullyDereferenced.definitions.person.properties.spouse =
  dereferencedSchema.ancestor.fullyDereferenced.definitions.person;

// @ts-expect-error TS(2322): Type '{ type: string; properties: { age: { type: s... Remove this comment to see the full error message
dereferencedSchema.ancestor.fullyDereferenced.definitions.person.properties.pet =
  dereferencedSchema.ancestor.fullyDereferenced.definitions.pet;

// @ts-expect-error TS(2322): Type '{ type: string; properties: { age: { type: s... Remove this comment to see the full error message
dereferencedSchema.ancestor.ignoreCircular$Refs.definitions.person.properties.pet =
  dereferencedSchema.ancestor.ignoreCircular$Refs.definitions.pet;

// @ts-expect-error TS(2322): Type '{ title: string; properties: { parents: { it... Remove this comment to see the full error message
dereferencedSchema.indirect.fullyDereferenced.definitions.parent.properties.children.items =
  dereferencedSchema.indirect.fullyDereferenced.definitions.child;

// @ts-expect-error TS(2322): Type '{ title: string; properties: { name: { type:... Remove this comment to see the full error message
dereferencedSchema.indirect.fullyDereferenced.definitions.child.properties.parents.items =
  dereferencedSchema.indirect.fullyDereferenced.definitions.parent;

// @ts-expect-error TS(2322): Type '{ type: string; properties: { age: { type: s... Remove this comment to see the full error message
dereferencedSchema.indirect.fullyDereferenced.definitions.child.properties.pet =
  dereferencedSchema.indirect.fullyDereferenced.definitions.pet;

// @ts-expect-error TS(2322): Type '{ type: string; properties: { age: { type: s... Remove this comment to see the full error message
dereferencedSchema.indirect.ignoreCircular$Refs.definitions.child.properties.pet =
  dereferencedSchema.indirect.ignoreCircular$Refs.definitions.pet;

// @ts-expect-error TS(2322): Type '{ title: string; properties: { name: { type:... Remove this comment to see the full error message
dereferencedSchema.indirectAncestor.fullyDereferenced.definitions.parent.properties.child =
  dereferencedSchema.indirectAncestor.fullyDereferenced.definitions.child;

// @ts-expect-error TS(2322): Type '{ title: string; properties: { name: { type:... Remove this comment to see the full error message
dereferencedSchema.indirectAncestor.fullyDereferenced.definitions.child.properties.children.items =
  dereferencedSchema.indirectAncestor.fullyDereferenced.definitions.child;

// @ts-expect-error TS(2322): Type '{ type: string; properties: { age: { type: s... Remove this comment to see the full error message
dereferencedSchema.indirectAncestor.fullyDereferenced.definitions.child.properties.pet =
  dereferencedSchema.indirectAncestor.fullyDereferenced.definitions.pet;

// @ts-expect-error TS(2322): Type '{ type: string; properties: { age: { type: s... Remove this comment to see the full error message
dereferencedSchema.indirectAncestor.ignoreCircular$Refs.definitions.child.properties.pet =
  dereferencedSchema.indirectAncestor.ignoreCircular$Refs.definitions.pet;

export default dereferencedSchema;
