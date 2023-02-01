export default {
  schema: {
    definitions: {
      pet: {
        $ref: "definitions/pet.yaml",
      },
      thing: {
        $ref: "circular-external.yaml#/definitions/thing",
      },
      person: {
        $ref: "definitions/person.yaml",
      },
      parent: {
        $ref: "definitions/parent.yaml",
      },
      child: {
        $ref: "definitions/child.yaml",
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

  child: {
    type: "object",
    properties: {
      parents: {
        items: {
          $ref: "parent.yaml",
        },
        type: "array",
      },
      name: {
        type: "string",
      },
    },
    title: "child",
  },

  parent: {
    type: "object",
    properties: {
      name: {
        type: "string",
      },
      children: {
        items: {
          $ref: "child.yaml",
        },
        type: "array",
      },
    },
    title: "parent",
  },

  person: {
    type: "object",
    properties: {
      spouse: {
        $ref: "person.yaml",
      },
      name: {
        type: "string",
      },
    },
    title: "person",
  },
};
