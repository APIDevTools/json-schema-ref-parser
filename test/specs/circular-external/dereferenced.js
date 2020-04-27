"use strict";

const dereferencedSchema = module.exports =
{
  definitions: {
    pet: {
      title: "pet",
      type: "object",
      properties: {
        age: {
          type: "number"
        },
        name: {
          type: "string"
        },
        species: {
          enum: [
            "cat",
            "dog",
            "bird",
            "fish"
          ],
          type: "string"
        }
      },
    },
    thing: {
      $ref: "circular-external.yaml#/definitions/thing"
    },
    person: {
      title: "person",
      type: "object",
      properties: {
        spouse: null,
        name: {
          type: "string"
        }
      }
    },
    parent: {
      title: "parent",
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        children: {
          items: null,
          type: "array"
        }
      }
    },
    child: {
      title: "child",
      type: "object",
      properties: {
        parents: {
          items: null,
          type: "array"
        },
        name: {
          type: "string"
        }
      }
    }
  }
};

dereferencedSchema.definitions.person.properties.spouse = dereferencedSchema.definitions.person;
dereferencedSchema.definitions.parent.properties.children.items = dereferencedSchema.definitions.child;
dereferencedSchema.definitions.child.properties.parents.items = dereferencedSchema.definitions.parent;
