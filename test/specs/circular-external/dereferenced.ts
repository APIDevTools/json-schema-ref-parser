const dereferencedSchema = {
  definitions: {
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
    thing: {
      $ref: "circular-external.yaml#/definitions/thing",
    },
    person: {
      title: "person",
      type: "object",
      properties: {
        spouse: null,
        name: {
          type: "string",
        },
      },
    },
    parent: {
      title: "parent",
      type: "object",
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
      type: "object",
      properties: {
        parents: {
          items: null,
          type: "array",
        },
        name: {
          type: "string",
        },
      },
    },
  },
};

// @ts-expect-error TS(2322): Type '{ title: string; type: string; properties: {... Remove this comment to see the full error message
dereferencedSchema.definitions.person.properties.spouse = dereferencedSchema.definitions.person;
// @ts-expect-error TS(2322): Type '{ title: string; type: string; properties: {... Remove this comment to see the full error message
dereferencedSchema.definitions.parent.properties.children.items = dereferencedSchema.definitions.child;
// @ts-expect-error TS(2322): Type '{ title: string; type: string; properties: {... Remove this comment to see the full error message
dereferencedSchema.definitions.child.properties.parents.items = dereferencedSchema.definitions.parent;

export default dereferencedSchema;
