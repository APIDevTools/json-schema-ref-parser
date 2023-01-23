const bundledSchema = {
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
    definitions: {
      person: {
        title: "person",
        properties: {
          spouse: {
            $ref: "#/definitions/person",
            description:
              'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "person".\n',
          },
          pet: {
            $ref: "#/definitions/pet",
            description:
              'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "pet".\n',
          },
          name: {
            type: "string",
          },
        },
      },
      pet: null,
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
              description:
                'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "child".\n',
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
              description:
                'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "parent".\n',
            },
            type: "array",
          },
          pet: {
            $ref: "#/definitions/pet",
            description:
              'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "pet".\n',
          },
          name: {
            type: "string",
          },
        },
      },
      pet: null,
    },
  },

  indirectAncestor: {
    definitions: {
      pet: null,
      parent: {
        title: "parent",
        properties: {
          name: {
            type: "string",
          },
          child: {
            $ref: "#/definitions/child",
            description:
              'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "child".\n',
          },
        },
      },
      child: {
        title: "child",
        properties: {
          pet: {
            $ref: "#/definitions/pet",
            description:
              'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "pet".\n',
          },
          name: {
            type: "string",
          },
          children: {
            items: {
              $ref: "#/definitions/child",
              description:
                'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "child".\n',
            },
            type: "array",
            description: "children",
          },
        },
      },
    },
  },
};

// @ts-expect-error TS(2322): Type '{ title: string; type: string; properties: {... Remove this comment to see the full error message
bundledSchema.ancestor.definitions.pet =
  // @ts-expect-error TS(2322): Type '{ title: string; type: string; properties: {... Remove this comment to see the full error message
  bundledSchema.indirect.definitions.pet =
  // @ts-expect-error TS(2322): Type '{ title: string; type: string; properties: {... Remove this comment to see the full error message
  bundledSchema.indirectAncestor.definitions.pet =
    bundledSchema.pet;

export default bundledSchema;
