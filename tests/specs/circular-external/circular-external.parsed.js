helper.parsed.circularExternal =
{
  schema: {
    "definitions": {
      "thing": {
        "$ref": "circular-external.yaml#/definitions/thing"
      },
      "person": {
        "$ref": "definitions/person.yaml"
      },
      "parent": {
        "$ref": "definitions/parent.yaml"
      },
      "child": {
        "$ref": "definitions/child.yaml"
      }
    }
  },

  child: {
    "type": "object",
    "properties": {
      "parents": {
        "items": {
          "$ref": "parent.yaml"
        },
        "type": "array"
      },
      "name": {
        "type": "string"
      }
    },
    "title": "child"
  },

  parent: {
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      },
      "children": {
        "items": {
          "$ref": "child.yaml"
        },
        "type": "array"
      }
    },
    "title": "parent"
  },

  person: {
    "type": "object",
    "properties": {
      "spouse": {
        "type": {
          "$ref": "person.yaml"
        }
      },
      "name": {
        "type": "string"
      }
    },
    "title": "person"
  }
};
