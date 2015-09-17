helper.dereferenced.circular =
{
  "definitions": {
    "thing": {
      "$ref": "#/definitions/thing"
    },
    "person": {
      "properties": {
        "spouse": {
          "type": null
        },
        "name": {
          "type": "string"
        }
      }
    },
    "parent": {
      "properties": {
        "name": {
          "type": "string"
        },
        "children": {
          "items": null,
          "type": "array"
        }
      }
    },
    "child": {
      "properties": {
        "parents": {
          "items": null,
          "type": "array"
        },
        "name": {
          "type": "string"
        }
      }
    }
  }
};

helper.dereferenced.circular.definitions.person.properties.spouse.type = helper.dereferenced.circular.definitions.person;
helper.dereferenced.circular.definitions.parent.properties.children.items = helper.dereferenced.circular.definitions.child;
helper.dereferenced.circular.definitions.child.properties.parents.items = helper.dereferenced.circular.definitions.parent;
