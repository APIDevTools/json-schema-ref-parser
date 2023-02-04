const dereferencedSchema = {
  self: {
    definitions: {
      thing: {
        title: "thing",
        $ref: "#/definitions/thing",
        description:
          "This JSON Reference has additional properties (other than $ref). Normally, this creates a new type that extends the referenced type, but since this reference points to ITSELF, it doesn't do that.\n",
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
        type: "string",
        enum: ["cat", "dog", "bird", "fish"],
      },
    },
  },

  ancestor: {
    fullyDereferenced: {
      definitions: {
        person: {
          title: "person",
          properties: {
            spouse: {
              title: "person",
              description:
                'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "person".\n',
              properties: null,
            },
            pet: {
              description:
                'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "pet".\n',
              title: "pet",
              type: "object",
              properties: null,
            },
            name: {
              type: "string",
            },
          },
        },
        pet: null,
      },
    },

    ignoreCircular$Refs: {
      definitions: {
        person: {
          $ref: "definitions/person-with-spouse.yaml",
        },
        pet: null,
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
              items: {
                title: "child",
                description:
                  'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "child".\n',
                properties: null,
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
                title: "parent",
                description:
                  'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "parent".\n',
                properties: null,
              },
              type: "array",
            },
            pet: {
              description:
                'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "pet".\n',
              title: "pet",
              type: "object",
              properties: null,
            },
            name: {
              type: "string",
            },
          },
        },
        pet: null,
      },
    },

    ignoreCircular$Refs: {
      definitions: {
        parent: {
          $ref: "definitions/parent-with-children.yaml",
        },
        child: {
          $ref: "definitions/child-with-parents.yaml",
        },
        pet: null,
      },
    },
  },

  indirectAncestor: {
    fullyDereferenced: {
      definitions: {
        pet: null,
        parent: {
          title: "parent",
          properties: {
            name: {
              type: "string",
            },
            child: {
              description:
                'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "child".\n',
              title: "child",
              properties: null,
            },
          },
        },
        child: {
          title: "child",
          properties: {
            pet: {
              description:
                'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "pet".\n',
              title: "pet",
              type: "object",
              properties: null,
            },
            name: {
              type: "string",
            },
            children: {
              items: {
                description:
                  'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "child".\n',
                title: "child",
                properties: null,
              },
              type: "array",
              description: "children",
            },
          },
        },
      },
    },

    ignoreCircular$Refs: {
      definitions: {
        pet: null,
        parent: {
          $ref: "definitions/parent-with-child.yaml",
        },
        child: {
          $ref: "definitions/child-with-children.yaml",
        },
      },
    },
  },
};
// @ts-expect-error TS(2322): Type '{ title: string; type: string; properties: {... Remove this comment to see the full error message
dereferencedSchema.ancestor.fullyDereferenced.definitions.pet =
  // @ts-expect-error TS(2322): Type '{ title: string; type: string; properties: {... Remove this comment to see the full error message
  dereferencedSchema.ancestor.ignoreCircular$Refs.definitions.pet =
  // @ts-expect-error TS(2322): Type '{ title: string; type: string; properties: {... Remove this comment to see the full error message
  dereferencedSchema.indirect.fullyDereferenced.definitions.pet =
  // @ts-expect-error TS(2322): Type '{ title: string; type: string; properties: {... Remove this comment to see the full error message
  dereferencedSchema.indirect.ignoreCircular$Refs.definitions.pet =
  // @ts-expect-error TS(2322): Type '{ title: string; type: string; properties: {... Remove this comment to see the full error message
  dereferencedSchema.indirectAncestor.fullyDereferenced.definitions.pet =
  // @ts-expect-error TS(2322): Type '{ title: string; type: string; properties: {... Remove this comment to see the full error message
  dereferencedSchema.indirectAncestor.ignoreCircular$Refs.definitions.pet =
    dereferencedSchema.pet;

dereferencedSchema.ancestor.fullyDereferenced.definitions.person.properties.pet.properties =
  dereferencedSchema.indirect.fullyDereferenced.definitions.child.properties.pet.properties =
  dereferencedSchema.indirectAncestor.fullyDereferenced.definitions.child.properties.pet.properties =
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    dereferencedSchema.ancestor.fullyDereferenced.definitions.pet.properties;

// @ts-expect-error TS(2322): Type '{ spouse: { title: string; description: stri... Remove this comment to see the full error message
dereferencedSchema.ancestor.fullyDereferenced.definitions.person.properties.spouse.properties =
  dereferencedSchema.ancestor.fullyDereferenced.definitions.person.properties;

// @ts-expect-error TS(2322): Type '{ parents: { items: { title: string; descrip... Remove this comment to see the full error message
dereferencedSchema.indirect.fullyDereferenced.definitions.parent.properties.children.items.properties =
  dereferencedSchema.indirect.fullyDereferenced.definitions.child.properties;

// @ts-expect-error TS(2322): Type '{ name: { type: string; }; children: { items... Remove this comment to see the full error message
dereferencedSchema.indirect.fullyDereferenced.definitions.child.properties.parents.items.properties =
  dereferencedSchema.indirect.fullyDereferenced.definitions.parent.properties;

// @ts-expect-error TS(2322): Type '{ pet: { description: string; title: string;... Remove this comment to see the full error message
dereferencedSchema.indirectAncestor.fullyDereferenced.definitions.parent.properties.child.properties =
  dereferencedSchema.indirectAncestor.fullyDereferenced.definitions.child.properties;

// @ts-expect-error TS(2322): Type '{ pet: { description: string; title: string;... Remove this comment to see the full error message
dereferencedSchema.indirectAncestor.fullyDereferenced.definitions.child.properties.children.items.properties =
  dereferencedSchema.indirectAncestor.fullyDereferenced.definitions.child.properties;

export default dereferencedSchema;
