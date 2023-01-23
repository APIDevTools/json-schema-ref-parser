export default {
  self: {
    definitions: {
      thing: {
        $ref: "definitions/thing.yaml",
      },
    },
  },

  thing: {
    title: "thing",
    $ref: "thing.yaml",
    description:
      "This JSON Reference has additional properties (other than $ref). Normally, this creates a new type that extends the referenced type, but since this reference points to ITSELF, it doesn't do that.\n",
  },

  ancestor: {
    definitions: {
      person: {
        $ref: "definitions/person-with-spouse.yaml",
      },
      pet: {
        $ref: "definitions/pet.yaml",
      },
    },
  },

  personWithSpouse: {
    title: "person",
    properties: {
      spouse: {
        description:
          'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "person".\n',
        $ref: "person-with-spouse.yaml",
      },
      pet: {
        description:
          'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "pet".\n',
        $ref: "pet.yaml",
      },
      name: {
        type: "string",
      },
    },
  },

  animals: {
    definitions: {
      fish: {
        title: "fish",
        $ref: "#/definitions/animal",
      },
      cat: {
        title: "cat",
        $ref: "#/definitions/animal",
      },
      bird: {
        title: "bird",
        $ref: "#/definitions/animal",
      },
      animal: {
        type: "object",
        properties: {
          age: {
            type: "number",
          },
          name: {
            type: "string",
          },
        },
        title: "animal",
      },
      dog: {
        title: "dog",
        $ref: "#/definitions/animal",
      },
    },
  },

  pet: {
    title: "pet",
    type: {
      $ref: "animals.yaml#/definitions/cat/type",
    },
    properties: {
      age: {
        $ref: "animals.yaml#/definitions/bird/properties/age",
      },
      name: {
        $ref: "animals.yaml#/definitions/dog/properties/name",
      },
      species: {
        type: "string",
        enum: ["cat", "dog", "bird", "fish"],
      },
    },
  },

  indirect: {
    definitions: {
      parent: {
        $ref: "definitions/parent-with-children.yaml",
      },
      child: {
        $ref: "definitions/child-with-parents.yaml",
      },
      pet: {
        $ref: "definitions/pet.yaml",
      },
    },
  },

  parentWithChildren: {
    title: "parent",
    properties: {
      name: {
        type: "string",
      },
      children: {
        items: {
          description:
            'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "child".\n',
          $ref: "child-with-parents.yaml",
        },
        type: "array",
      },
    },
  },

  childWithParents: {
    title: "child",
    properties: {
      parents: {
        items: {
          description:
            'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "parent".\n',
          $ref: "parent-with-children.yaml",
        },
        type: "array",
      },
      pet: {
        description:
          'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "pet".\n',
        $ref: "pet.yaml",
      },
      name: {
        type: "string",
      },
    },
  },

  indirectAncestor: {
    definitions: {
      pet: {
        $ref: "definitions/pet.yaml",
      },
      parent: {
        $ref: "definitions/parent-with-child.yaml",
      },
      child: {
        $ref: "definitions/child-with-children.yaml",
      },
    },
  },

  parentWithChild: {
    title: "parent",
    properties: {
      name: {
        type: "string",
      },
      child: {
        description:
          'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "child".\n',
        $ref: "child-with-children.yaml",
      },
    },
  },

  childWithChildren: {
    title: "child",
    properties: {
      pet: {
        description:
          'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "pet".\n',
        $ref: "pet.yaml",
      },
      name: {
        type: "string",
      },
      children: {
        items: {
          description:
            'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "child".\n',
          $ref: "child-with-children.yaml",
        },
        type: "array",
        description: "children",
      },
    },
  },
};
